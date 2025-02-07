// server.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// Enable CORS middleware for Express routes with credentials enabled
app.use(cors({
  origin: [
    "https://dancoderoman.github.io",
    "https://dancoderoman.github.io/boxfighter"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

// (Optional) Ensure every response includes the proper CORS headers.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://dancoderoman.github.io");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (req, res) => {
  res.send("Server is running!");
});

// Initialize Socket.IO with CORS settings (including credentials)
const io = socketIo(server, {
  cors: {
    origin: [
      "https://dancoderoman.github.io",
      "https://dancoderoman.github.io/boxfighter"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Object to track connected players
let players = {};

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Initialize the new player with default properties and an empty bullets array
  players[socket.id] = {
    id: socket.id,
    x: 0,
    y: 0,
    health: 100,
    lives: 10,
    isDead: false,
    gun: "rifle",
    color: "#39ff14",
    size: 40,
    bullets: [] // Initialize bullet array for this player
  };

  // Send the current players to the new client
  socket.emit('currentPlayers', players);
  // Notify other clients of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Update player movement
  socket.on('playerMove', (data) => {
    if (!players[socket.id].isDead) {
      // Update the player's data with new movement info
      players[socket.id] = { ...players[socket.id], ...data };
      socket.broadcast.emit('playerMove', { id: socket.id, data });
    }
  });

  // Broadcast shooting event (and track bullet data)
  socket.on('playerShoot', (data) => {
    // 'data' should include bullet properties (e.g., x, y, dx, dy, etc.)
    if (!players[socket.id].bullets) {
      players[socket.id].bullets = [];
    }
    // Optionally store bullet data on the server (clients can manage this themselves too)
    players[socket.id].bullets.push(data);
    console.log(`Player ${socket.id} fired a bullet:`, data);
    // Emit the bullet event to all clients (including the shooter)
    io.emit('playerShoot', { id: socket.id, data });
  });

  // Process a hit event (damage calculation)
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
    if (players[socket.id]) {
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
    }
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
