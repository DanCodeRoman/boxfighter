// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

let players = {};

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  // Add new player
  players[socket.id] = { x: 0, y: 0 };

  // Inform existing players of the new player
  socket.broadcast.emit('newPlayer', { id: socket.id, state: players[socket.id] });

  // Send the current players list to the new player
  socket.emit('currentPlayers', players);

  // Relay movement data to everyone else
  socket.on('playerMove', (data) => {
    players[socket.id] = data;
    socket.broadcast.emit('playerMove', { id: socket.id, data });
  });

  // Relay shooting events
  socket.on('playerShoot', (data) => {
    socket.broadcast.emit('playerShoot', { id: socket.id, data });
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete players[socket.id];
    socket.broadcast.emit('playerDisconnect', socket.id);
  });
});

http.listen(port, () => {
  console.log('Server listening on port', port);
});
