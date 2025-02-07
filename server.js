// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);

// Enable CORS for Express routes (for any API endpoints, if needed)
app.use(cors({
  origin: "https://dancoderoman.github.io", // Allow only your GitHub Pages domain
  methods: ["GET", "POST"]
}));

// Configure Socket.IO with CORS settings
const io = require('socket.io')(http, {
  cors: {
    origin: "https://dancoderoman.github.io", // Allow only your GitHub Pages domain
    methods: ["GET", "POST"]
  }
});

// Object to track connected players (for example purposes)
let players = {};  // This is the existing object for managing connected players
let otherPlayers = {};  // Initialize the `otherPlayers` object here

// Listen for socket connections
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Add the new player with a default state
  players[socket.id] = {
    id: socket.id,
    x: 0,
    y: 0
    // You can add additional properties as needed
  };

  // Send current players to the newly connected client
  socket.emit('currentPlayers', players);

  // Add new player to the `otherPlayers` object for tracking
  otherPlayers[socket.id] = players[socket.id];

  // Inform all other players about the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Listen for playerMove events and broadcast them
  socket.on('playerMove', (data) => {
    players[socket.id] = { ...players[socket.id], ...data };
    socket.broadcast.emit('playerMove', { id: socket.id, data });
  });

  // Listen for playerShoot events and broadcast them
  socket.on('playerShoot', (data) => {
    socket.broadcast.emit('playerShoot', { id: socket.id, data });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    delete otherPlayers[socket.id];  // Remove the player from `otherPlayers` as well
    socket.broadcast.emit('playerDisconnect', socket.id);
  });
});

// Start the server
const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
