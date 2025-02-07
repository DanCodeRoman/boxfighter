<!DOCTYPE html>
<html lang="en">
<head>
  <script src="https://cdn.socket.io/4.5.1/socket.io.min.js"></script>
  <link rel="icon" type="image/png" href="favicon.ico">
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Box Fighter</title>
  <link href="https://fonts.googleapis.com/css?family=Poppins:400,600&display=swap" rel="stylesheet">
  <style>
    body, html {
      margin: 0;
      overflow: hidden;
      font-family: 'Poppins', sans-serif;
      height: 100%;
      background-color: #1e1e1e;
    }
    /* Main Menu Styling */
    #startMenu {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      color: white;
      z-index: 100;
      user-select: none;
    }
    #studiosText {
      font-size: 24px;
      background: linear-gradient(45deg, #ff6b6b, #ffcd3c, #6b94ff, #6bffb8);
      -webkit-background-clip: text;
      color: transparent;
      animation: gradient-text 4s linear infinite;
      margin-bottom: 20px;
    }
    #menuCoinCounter {
      position: absolute;
      top: 50px;
      right: 5px;
      border: 2px solid gold;
      padding: 6px 6px;
      border-radius: 10px;
      font-size: 17px;
      background: rgba(0, 0, 0, 0.5);
      color: gold;
      z-index: 110;
    }
    /* Gun Shop Button (Main Menu) */
    #menuGunShopButton {
      font-size: 20px;
      padding: 10px 20px;
      background-color: #344;
      border: 2px solid white;
      color: white;
      cursor: pointer;
      border-radius: 50px;
      transition: transform 0.5s ease, background-color 0.5s ease;
      margin-top: 15px;
    }
    #gameModeButton {
      font-size: 20px;
      padding: 10px 20px;
      background-color: #344;
      border: 2px solid white;
      color: white;
      cursor: pointer;
      border-radius: 50px;
      transition: transform 0.5s ease, background-color 0.5s ease;
      margin-top: 15px;
    }
    /* Animated Title (Box Fighter) */
    h1 {
      font-size: 80px;
      text-align: center;
      background: linear-gradient(45deg, #ff6b6b, #ffcd3c, #6b94ff, #6bffb8);
      -webkit-background-clip: text;
      color: transparent;
      animation: gradient-text 3s linear infinite, pulsate 2s ease-in-out infinite;
      margin-bottom: 30px;
    }
    @keyframes pulsate {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    @keyframes gradient-text {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    /* Button Styling */
    button {
      font-size: 24px;
      padding: 15px 30px;
      background-color: #344;
      border: none;
      color: white;
      cursor: pointer;
      border-radius: 10px;
      transition: transform 0.5s ease, background-color 0.5s ease;
      margin-top: 20px;
    }
    button:hover {
      background-color: #ff6b6b;
      transform: scale(1.2);
    }
    button:active {
      transform: scale(1.05);
    }
    /* Game Over Screen Styling */
    #gameOverScreen {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      flex-direction: column;
      z-index: 100;
      display: none;
      user-select: none;
    }
    #respawnTimer {
      font-size: 20px;
      color: white;
      margin-top: 10px;
    }
    /* Canvas for the game */
    canvas {
      display: block;
      background: url('https://i.postimg.cc/C1dhpGkh/1348017.png') no-repeat center center fixed;
      background-size: cover;
      touch-action: none;
    }
  </style>
</head>
<body>
  <!-- Background music element -->
  <audio id="bgMusic" src="music.mp3" loop preload="auto"></audio>
  <!-- Mute Music Button -->
  <button id="muteButton" onclick="toggleMusic()">Mute Music</button>
  <!-- Main Menu Screen -->
  <div id="startMenu">
    <div id="menuCoinCounter">Coins: 0</div>
    <h1>Box Fighter</h1>
    <div id="studiosText">DanCodeRoman Studios</div>
    <button onclick="startGame()">Ready Up</button>
    <button id="gameModeButton" onclick="openGameModeBox()">Game Mode</button>
    <button id="menuGunShopButton" onclick="openGunShop()">Gun Shop</button>
  </div>
  
  <!-- Game Over Screen -->
  <div id="gameOverScreen">
    <h1>Game Over</h1>
    <div id="finalScore">Final Score: 0</div>
    <div id="respawnTimer"></div>
    <button onclick="restartGame()">Restart</button>
  </div>
  
  <!-- Gun Shop Modal -->
  <div id="gunShopModal" style="display:none;">
    <h2>Gun Shop</h2>
    <button onclick="selectGun('rifle')">Rifle</button>
    <button onclick="selectGun('shotgun')">Shotgun</button>
    <button onclick="selectGun('flamethrower')">Flamethrower</button>
    <button onclick="selectGun('uzi')">Uzi</button>
    <button onclick="selectGun('shield')">Shield</button>
    <button id="closeGunShop" onclick="closeGunShop()">Close</button>
  </div>
  
  <div id="gameUI" style="display: none;">
    <div id="healthBar">
      <div id="healthBarInner"></div>
    </div>
    <p id="score" style="user-select: none;">Score: 0</p>
  </div>
  
  <canvas id="gameCanvas"></canvas>

  <script>
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Player setup
    const player = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      size: 40,
      color: "#39ff14",
      bullets: [],
      id: null // Will be set by server
    };

    const socket = io("https://boxfighter.onrender.com/");
    const otherPlayers = {};

    socket.on("currentPlayers", (players) => {
      for (const id in players) {
        if (id !== socket.id) {
          otherPlayers[id] = players[id];
        }
      }
    });

    socket.on("newPlayer", (playerData) => {
      otherPlayers[playerData.id] = playerData;
    });

    socket.on("playerMove", (data) => {
      if (otherPlayers[data.id]) {
        otherPlayers[data.id].x = data.data.x;
        otherPlayers[data.id].y = data.data.y;
      }
    });

    socket.on("playerShoot", (data) => {
      if (otherPlayers[data.id]) {
        // Handle shooting behavior here
      }
    });

    socket.on("playerDisconnect", (id) => {
      delete otherPlayers[id];
    });

    function updatePlayer() {
      socket.emit("playerMove", { x: player.x, y: player.y });
    }

    function drawPlayer(playerData) {
      ctx.save();
      ctx.translate(playerData.x, playerData.y);
      ctx.drawImage(playerImage, -playerData.size / 2, -playerData.size / 2, playerData.size, playerData.size);
      ctx.restore();
    }

    function drawOtherPlayers() {
      for (let id in otherPlayers) {
        const otherPlayer = otherPlayers[id];
        drawPlayer(otherPlayer);
      }
    }

    function gameLoop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      updatePlayer();
      drawOtherPlayers();
      requestAnimationFrame(gameLoop);
    }

    // Start game
    function startGame() {
      document.getElementById("startMenu").style.display = "none";
      document.getElementById("gameUI").style.display = "block";
      document.getElementById("gameOverScreen").style.display = "none";
      gameLoop();
    }

    function restartGame() {
      // Reset the game state and restart the game
      player.x = canvas.width / 2;
      player.y = canvas.height / 2;
      startGame();
    }

    function toggleMusic() {
      const bgMusic = document.getElementById("bgMusic");
      const muteButton = document.getElementById("muteButton");
      if (bgMusic.muted) {
        bgMusic.muted = false;
        muteButton.textContent = "Mute Music";
      } else {
        bgMusic.muted = true;
        muteButton.textContent = "Unmute Music";
      }
    }

    function openGameModeBox() {
      document.getElementById("gameModeModal").style.display = "block";
    }

    function closeGameMode() {
      document.getElementById("gameModeModal").style.display = "none";
    }
  </script>
</body>
</html>
