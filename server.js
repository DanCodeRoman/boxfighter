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

  // Set up the player with a default health value and (optionally) a default size.
  players[socket.id] = {
    id: socket.id,
    x: 0,
    y: 0,
    health: 100,  // New: default health
    lives: 10,
    isDead: false,
    gun: "rifle",
    color: "#39ff14",
    // (Optional) You can also add a default size here if desired:
    size: 40
  };

  // Send all players (including yourself) to the new client.
  socket.emit('currentPlayers', players);
  // Broadcast to everyone else that a new player joined.
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // When a player moves, update the record and broadcast the change.
  socket.on('playerMove', (data) => {
    if (!players[socket.id].isDead) {
      players[socket.id] = { ...players[socket.id], ...data };
      socket.broadcast.emit('playerMove', { id: socket.id, data });
    }
  });

  // When a player shoots, broadcast the bullet data.
  socket.on('playerShoot', (data) => {
    // data should be an object with bullet info: { x, y, dx, dy, size, lifetime }
    socket.broadcast.emit('playerShoot', { id: socket.id, data });
  });

  // New: When a player reports a hit (either they got hit or hit someone)
  socket.on("playerHit", (data) => {
    // data can be sent as either:
    //   { targetId, damage }  --> local bullet hit a remote player
    //   { id, damage }        --> remote bullet hit your local player
    if(data.targetId) {
      const targetId = data.targetId;
      if(players[targetId]) {
        players[targetId].health = (players[targetId].health || 100) - data.damage;
        // Send the updated health to the hit player
        io.to(targetId).emit("updateHealth", players[targetId].health);
        // Inform everyone else (if you want them to update the remote health display)
        socket.broadcast.emit("playerHealthUpdate", { id: targetId, health: players[targetId].health });
        if(players[targetId].health <= 0) {
          io.to(targetId).emit("gameOver", { message: "You were killed!" });
          io.emit("playerDied", targetId);
          delete players[targetId];
        }
      }
    } else if(data.id) {
      const id = data.id;
      if(players[id]) {
        players[id].health = (players[id].health || 100) - data.damage;
        io.to(id).emit("updateHealth", players[id].health);
        socket.broadcast.emit("playerHealthUpdate", { id: id, health: players[id].health });
        if(players[id].health <= 0) {
          io.to(id).emit("gameOver", { message: "You were killed!" });
          io.emit("playerDied", id);
          delete players[id];
        }
      }
    }
  });

  // When a player “dies” (for example, in other game modes)
  socket.on('playerDied', () => {
    players[socket.id].isDead = true;
    players[socket.id].lives -= 1;
    socket.emit('playerRespawn', players[socket.id]);

    setTimeout(() => {
      if (players[socket.id] && players[socket.id].lives > 0) {
        players[socket.id].isDead = false;
        players[socket.id].health = 100; // Reset health on respawn.
        socket.emit('respawn', players[socket.id]);
      } else {
        socket.emit('gameOver', { message: 'Game Over! You are out of lives.' });
      }
    }, 5000);
  });

  // On disconnect, remove the player.
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
