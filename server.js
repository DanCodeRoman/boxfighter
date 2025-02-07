const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');  // Import socket.io

const app = express();
const server = http.createServer(app);  // Create the HTTP server
const io = socketIo(server, {
  cors: {
    origin: "https://dancoderoman.github.io",  // Allow only your GitHub Pages domain
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  }
});  // Initialize Socket.IO with the HTTP server and CORS configuration

// Enable CORS for Express routes
app.use(cors({
  origin: "https://dancoderoman.github.io",  // Allow only your GitHub Pages domain
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

// Object to track connected players (for example purposes)
let players = {};  // This is the existing object for managing connected players
let otherPlayers = {};

// Listen for socket connections
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Add the new player with a default state
  players[socket.id] = {
    id: socket.id,
    x: 0,
    y: 0,
    lives: 10, // 10 lives for each player in 1v1 mode
    isDead: false, // Track if the player is dead
    gun: "rifle", // Default gun
    color: "#39ff14" // Default color
  };

  // Send current players to the newly connected client
  socket.emit('currentPlayers', players);

  // Inform all other players about the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Listen for playerMove events and broadcast them
  socket.on('playerMove', (data) => {
    if (!players[socket.id].isDead) {
      players[socket.id] = { ...players[socket.id], ...data };
      socket.broadcast.emit('playerMove', { id: socket.id, data });
    }
  });

  // Listen for playerShoot events and broadcast them
  socket.on('playerShoot', (data) => {
    socket.broadcast.emit('playerShoot', { id: socket.id, data });
  });

  // Handle player death and respawn
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
    }, 5000); // 5 seconds respawn delay
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    delete otherPlayers[socket.id]; 
    socket.broadcast.emit('playerDisconnect', socket.id);
  });
});

// Start the server
const port = process.env.PORT || 10000;
server.listen(port, () => {  // Use server.listen instead of http.listen
  console.log(`Server listening on port ${port}`);
});
