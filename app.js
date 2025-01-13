const WebSocket = require("ws");

// Store active games and players
const games = {};

// Create WebSocket server
const port = process.env.PORT || 8080; // Use Render's PORT environment variable
const wss = new WebSocket.Server({ port }, () => {
  console.log(`WebSocket server running on port ${port}`);
});

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "create") {
      // Create a new game
      const gameId = Math.random().toString(36).substr(2, 6); // Generate random game ID
      games[gameId] = { player1: ws, player2: null };
      ws.send(JSON.stringify({ type: "created", gameId }));
    } else if (data.type === "join") {
      // Join an existing game
      const game = games[data.gameId];
      if (game && !game.player2) {
        game.player2 = ws;
        game.player1.send(JSON.stringify({ type: "start" }));
        game.player2.send(JSON.stringify({ type: "start" }));
      } else {
        ws.send(JSON.stringify({ type: "error", message: "Invalid or full game ID." }));
      }
    } else if (data.type === "move") {
      // Handle a player's move
      const game = games[data.gameId];
      const opponent = ws === game.player1 ? game.player2 : game.player1;
      if (opponent) {
        opponent.send(JSON.stringify({ type: "move", move: data.move }));
      }
    }
  });

  ws.on("close", () => {
    // Clean up when a player disconnects
    for (const [id, game] of Object.entries(games)) {
      if (game.player1 === ws || game.player2 === ws) {
        delete games[id];
      }
    }
  });
});

console.log("WebSocket server is running...");
