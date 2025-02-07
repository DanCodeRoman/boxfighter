const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["https://dancoderoman.github.io", "https://dancoderoman.github.io/boxfighter"],
    methods: ["GET", "POST"]
  }
});

// Enable CORS middleware for Express routes
app.use(cors({
  origin: ["https://dancoderoman.github.io", "https://dancoderoman.github.io/boxfighter"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.get('/', (req, res) => {
  res.send("Server is running!");
});

// Object to track connected players
let players = {};
let otherPlayers = {};

// Listen for socket connections
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  players[socket.id] = {
    id: socket.id,
    x: 0,
    y: 0,
    lives: 10,
    isDead: false,
    gun: "rifle",
    color: "#39ff14"
  };

  socket.emit('currentPlayers', players);
  socket.broadcast.emit('newPlayer', players[socket.id]);

  socket.on('playerMove', (data) => {
    if (!players[socket.id].isDead) {
      players[socket.id] = { ...players[socket.id], ...data };
      socket.broadcast.emit('playerMove', { id: socket.id, data });
    }
  });

  socket.on('playerShoot', (data) => {
    socket.broadcast.emit('playerShoot', { id: socket.id, data });
  });

  socket.on('playerDied', () => {
    players[socket.id].isDead = true;
    players[socket.id].lives -= 1;
    socket.emit('playerRespawn', players[socket.id]);

    setTimeout(() => {
      if (players[socket.id].lives > 0) {
        players[socket.id].isDead = false;
        socket.emit('respawn', players[socket.id]);
      } else {
        socket.emit('gameOver', { message: 'Game Over! You are out of lives.' });
      }
    }, 5000);
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    delete otherPlayers[socket.id]; 
    socket.broadcast.emit('playerDisconnect', socket.id);
  });
});

// Start the server
const port = process.env.PORT || 10000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
