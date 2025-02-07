// server.js
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

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Initialize the new player
  players[socket.id] = {
    id: socket.id,
    x: 0,
    y: 0,
    health: 100,
    lives: 10,
    isDead: false,
    gun: "rifle",
    color: "#39ff14",
    size: 40
  };

  // Send the current players to the new client
  socket.emit('currentPlayers', players);
  // Notify other clients of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Update player movement
  socket.on('playerMove', (data) => {
    if (!players[socket.id].isDead) {
      players[socket.id] = { ...players[socket.id], ...data };
      socket.broadcast.emit('playerMove', { id: socket.id, data });
    }
  });

  // Broadcast shooting event
  socket.on('playerShoot', (data) => {
    socket.broadcast.emit('playerShoot', { id: socket.id, data });
  });

  // Process a hit event
  socket.on("playerHit", (data) => {
    if (data.targetId) {
      const targetId = data.targetId;
      if (players[targetId]) {
        players[targetId].health = (players[targetId].health || 100) - data.damage;
        io.to(targetId).emit("updateHealth", players[targetId].health);
        socket.broadcast.emit("playerHealthUpdate", { id: targetId, health: players[targetId].health });
        if (players[targetId].health <= 0) {
          io.to(targetId).emit("gameOver", { message: "You were killed!" });
          io.emit("playerDied", targetId);
          delete players[targetId];
        }
      }
    } else if (data.id) {
      const id = data.id;
      if (players[id]) {
        players[id].health = (players[id].health || 100) - data.damage;
        io.to(id).emit("updateHealth", players[id].health);
        socket.broadcast.emit("playerHealthUpdate", { id, health: players[id].health });
        if (players[id].health <= 0) {
          io.to(id).emit("gameOver", { message: "You were killed!" });
          io.emit("playerDied", id);
          delete players[id];
        }
      }
    }
  });

  // Handle player death
  socket.on('playerDied', () => {
    players[socket.id].isDead = true;
    players[socket.id].lives -= 1;
    socket.emit('playerRespawn', players[socket.id]);

    setTimeout(() => {
      if (players[socket.id] && players[socket.id].lives > 0) {
        players[socket.id].isDead = false;
        players[socket.id].health = 100;
        socket.emit('respawn', players[socket.id]);
      } else {
        socket.emit('gameOver', { message: 'Game Over! You are out of lives.' });
      }
    }, 5000);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    socket.broadcast.emit('playerDisconnect', socket.id);
  });
});

const port = process.env.PORT || 10000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
