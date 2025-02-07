// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);

// Enable CORS for Express routes
app.use(cors({
  origin: 'https://dancoderoman.github.io'  // Allow only your GitHub Pages domain
}));

// Configure Socket.IO with CORS settings
const io = require('socket.io')(http, {
  cors: {
    origin: 'https://dancoderoman.github.io',
    methods: ['GET', 'POST']
  }
});

// A simple object to keep track of connected players
let players = {};

// Listen for new socket connections
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Add the new player to our players object with some default state
  players[socket.id] = {
    id: socket.id,
    x: 0,
    y: 0,
    // Add any other properties you need (e.g., score, gun, etc.)
  };

  // Send the current players to the new player
  socket.emit('currentPlayers', players);

  // Notify all other players about the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Listen for movement events from this player
  socket.on('playerMove', (data) => {
    // Update the player’s data
    players[socket.id] = { ...players[socket.id], ...data };

    // Broadcast the movement to all other players
    socket.broadcast.emit('playerMove', { id: socket.id, data });
  });

  // Listen for shooting events from this player
  socket.on('playerShoot', (data) => {
    // Broadcast the shooting event to all other players
    socket.broadcast.emit('playerShoot', { id: socket.id, data });
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    // Remove the player from our players object
    delete players[socket.id];

    // Inform all remaining players that this player has disconnected
    socket.broadcast.emit('playerDisconnect', socket.id);
  });
});

// Optionally serve static files if needed (e.g., if you want to serve your client from here)
// app.use(express.static('public'));

const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
