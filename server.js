// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);

// Enable CORS for Express routes (for any API endpoints, if needed)
app.use(cors());

// Configure Socket.IO with CORS settings
// For testing purposes, we're allowing all origins
const io = require('socket.io')(http, {
  cors: {
    origin: "*", // Change "*" to "https://dancoderoman.github.io" once testing is complete
    methods: ["GET", "POST"]
  }
});

// Object to track connected players (for example purposes)
let players = {};
// Global object to store other players' state
let otherPlayers = {};


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

  // Inform all other players about the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Listen for newPlayer events from this client
  socket.on('newPlayer', (data) => {
    console.log("newPlayer event received with data:", data);
    // You can update your players object or perform other logic here
  });

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
    socket.broadcast.emit('playerDisconnect', socket.id);
  });
});

// Start the server
const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
