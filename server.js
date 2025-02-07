const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://dancoderoman.github.io",  // Only allow your GitHub Pages domain
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true  // Allow credentials (cookies, etc.)
  }
});

// Enable CORS for all routes (make sure OPTIONS requests are handled)
app.use(cors({
  origin: "https://dancoderoman.github.io",  // Only allow your GitHub Pages domain
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true  // Allow credentials (cookies, etc.)
}));

// Handle preflight requests for CORS
app.options('*', cors());  // Handles preflight requests (OPTIONS)

// Example route (optional, just to confirm the server is working)
app.get('/', (req, res) => {
  res.send('Server is working!');
});

// Listen for socket connections
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Example player setup
  let players = {};
  players[socket.id] = { id: socket.id, x: 0, y: 0, color: "#39ff14" };

  // Emit current players to new connections
  socket.emit('currentPlayers', players);

  // Emit new player to other players
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Player movement (update position)
  socket.on('playerMove', (data) => {
    if (players[socket.id]) {
      players[socket.id] = { ...players[socket.id], ...data };
      socket.broadcast.emit('playerMove', { id: socket.id, data });
    }
  });

  // Player shooting event
  socket.on('playerShoot', (data) => {
    socket.broadcast.emit('playerShoot', { id: socket.id, data });
  });

  // Disconnection logic
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    socket.broadcast.emit('playerDisconnect', socket.id);
  });
});

// Start the server
const port = process.env.PORT || 10000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
