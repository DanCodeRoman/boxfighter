// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Create an Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// (Optional) Serve static files if needed:
// app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A player connected:', socket.id);

  // Example: Listen for player movement events
  socket.on('playerMove', (data) => {
    // Broadcast the player's movement to all other clients
    socket.broadcast.emit('playerMove', data);
  });

  // Example: Listen for player shooting events
  socket.on('playerShoot', (data) => {
    // Broadcast the shooting event to the other player
    socket.broadcast.emit('playerShoot', data);
  });

  // Handle disconnects
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    socket.broadcast.emit('playerDisconnected', { id: socket.id });
  });
});

// Start the server on the specified port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
