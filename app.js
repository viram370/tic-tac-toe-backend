// Start HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(html);
});

// WebSocket server
const wss = new WebSocket.Server({ https://tic-tac-toe-backend-mnlv.onrender.com});
const games = {};

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.type === "create") {
      const gameId = Math.random().toString(36).substr(2, 6);
      games[gameId] = { player1: ws, player2: null };
      ws.send(JSON.stringify({ type: "created", gameId }));
    } else if (data.type === "join") {
      const game = games[data.gameId];
      if (game && !game.player2) {
        game.player2 = ws;
        game.player1.send(JSON.stringify({ type: "start" }));
        game.player2.send(JSON.stringify({ type: "start" }));
      }
    } else if (data.type === "move") {
      const game = games[data.gameId];
      const opponent = ws === game.player1 ? game.player2 : game.player1;
      if (opponent) {
        opponent.send(JSON.stringify({ type: "move", move: data.move }));
      }
    }
  });

  ws.on("close", () => {
    for (const [id, game] of Object.entries(games)) {
      if (game.player1 === ws || game.player2 === ws) {
        delete games[id];
      }
    }
  });
});

server.listen(8080, () => {
  console.log("Server is running at http://localhost:8080");
});

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multiplayer Tic-Tac-Toe</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 20px;
    }
    .board {
      display: grid;
      grid-template-columns: repeat(3, 100px);
      gap: 5px;
      margin: 20px auto;
    }
    .cell {
      width: 100px;
      height: 100px;
      background: #ddd;
      font-size: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .cell.taken {
      pointer-events: none;
    }
    #status {
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <h1>Multiplayer Tic-Tac-Toe</h1>
  <button id="create">Create Game</button>
  <input type="text" id="gameId" placeholder="Enter Game Code" />
  <button id="join">Join Game</button>
  <p id="status"></p>
  <div id="board" class="board"></div>

  <script>
    const socket = new WebSocket("wss://tic-tac-toe-backend-mnlv.onrender.com");
    const board = document.getElementById("board");
    const status = document.getElementById("status");
    let gameId = null;
    let isPlayerTurn = false;

    document.getElementById("create").onclick = () => {
      socket.send(JSON.stringify({ type: "create" }));
    };

    document.getElementById("join").onclick = () => {
      const id = document.getElementById("gameId").value;
      if (id) {
        gameId = id;
        socket.send(JSON.stringify({ type: "join", gameId }));
      }
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "created") {
        gameId = data.gameId;
        status.innerText = "Game created! Share this code: " + gameId;
      } else if (data.type === "start") {
        status.innerText = "Game started! " + (isPlayerTurn ? "Your turn" : "Opponent's turn.");
        createBoard();
      } else if (data.type === "move") {
        const cell = document.querySelector(`.cell[data-index="${data.move}"]`);
        if (cell) {
          cell.innerText = "X";
          cell.classList.add("taken");
          status.innerText = "Your turn!";
          isPlayerTurn = true;
        }
      }
    };

    function createBoard() {
      board.innerHTML = "";
      for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.index = i;
        cell.onclick = () => {
          if (isPlayerTurn) {
            cell.innerText = "O";
            cell.classList.add("taken");
            socket.send(JSON.stringify({ type: "move", gameId, move: i }));
            status.innerText = "Waiting for opponent...";
            isPlayerTurn = false;
          }
        };
        board.appendChild(cell);
      }
    }
  </script>
</body>
</html>
