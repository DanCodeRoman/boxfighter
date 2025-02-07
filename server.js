const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);

app.use(cors({
  origin: "https://dancoderoman.github.io",
  methods: ["GET", "POST"]
}));

const io = require('socket.io')(http, {
  cors: {
    origin: "https://dancoderoman.github.io",
    methods: ["GET", "POST"]
  }
});

let players = {};

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  players[socket.id] = {
    id: socket.id,
    x: 0,
    y: 0,
    lives: 10, // 10 lives for each player in 1v1 mode
    isDead: false // Track if the player is dead
  };

  // Send current players to the newly connected client
  socket.emit('currentPlayers', players);

  // Inform all other players about the new player
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

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    socket.broadcast.emit('playerDisconnect', socket.id);
  });

  // Respawn player logic
  socket.on('playerDied', () => {
    players[socket.id].isDead = true;
    setTimeout(() => {
      players[socket.id].isDead = false;
      players[socket.id].lives = 10;
      socket.emit('respawn', players[socket.id]);
    }, 5000); // Respawn in 5 seconds
  });
});

const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
