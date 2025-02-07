const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

/**
 * For debugging purposes, we’re temporarily allowing all origins.
 * When you’re ready for production, replace "*" with your allowed origins,
 * e.g., origin: ["https://dancoderoman.github.io", "https://dancoderoman.github.io/boxfighter"]
 */
const io = socketIo(server, {
  cors: {
    origin: "*", // For production: replace "*" with your allowed origins array.
    methods: ["GET", "POST"]
  }
});

// Enable CORS for Express routes.
app.use(cors({
  origin: "*", // For production: replace "*" with your allowed origins array.
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

// (Optional) A manual middleware for debugging that sets CORS headers on all HTTP responses.
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
//   res.header("Access-Control-Allow-Methods", "GET,POST");
//   next();
// });

app.get('/', (req, res) => {
  res.send("Server is running!");
});

// Object to track connected players
let players = {};

// Listen for socket connections
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Initialize the player's data
  players[socket.id] = {
    id: socket.id,
    x: 0,
    y: 0,
    lives: 10,
    isDead: false,
    gun: "rifle",
    color: "#39ff14"
  };

  // Send the current players to the new connection
  socket.emit('currentPlayers', players);

  // Inform other players about the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Handle player movement events
  socket.on('playerMove', (data) => {
    if (!players[socket.id].isDead) {
      // Update player data with new movement info
      players[socket.id] = { ...players[socket.id], ...data };
      socket.broadcast.emit('playerMove', { id: socket.id, data });
    }
  });

  // Broadcast player shooting events
  socket.on('playerShoot', (data) => {
    socket.broadcast.emit('playerShoot', { id: socket.id, data });
  });

  // Handle the player death event
  socket.on('playerDied', () => {
    players[socket.id].isDead = true;
    players[socket.id].lives -= 1;
    socket.emit('playerRespawn', players[socket.id]);

    // Respawn the player after a delay if they still have lives remaining
    setTimeout(() => {
      if (players[socket.id].lives > 0) {
        players[socket.id].isDead = false;
        socket.emit('respawn', players[socket.id]);
      } else {
        socket.emit('gameOver', { message: 'Game Over! You are out of lives.' });
      }
    }, 5000);
  });

  // Clean up when a player disconnects
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
