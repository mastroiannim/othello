//client automatico

const { NETWORK, UTILS, BOARD } = require('./othello.js');


//In questo esempio, il client si connette al server sulla porta 3000 dell'indirizzo
//IP 127.0.0.1. Quando riceve un messaggio che indica che è il suo turno, il client
//utilizza l'algoritmo alpha beta pruning per determinare la mossa più vantaggiosa.

var net = require('net');
var client = new net.Socket();
var board;

let blackScore = 0;
let whiteScore = 0;
let currentPlayer = null;

client.connect(NETWORK.SERVER_PORT, NETWORK.SERVER_HOST, function () {
    console.log('Connected to server');
    // send initial message
    client.write(JSON.stringify({ type: "join" }));
});

client.on('data', function (data) {
    //console.log('Received: ' + data);
    var message;
    try{
        message = JSON.parse(data);
    }catch(error){
        console.log('Errore: ', error.message);
        client.write(
            JSON.stringify({
                type: 'wait_my_turn',
                player: currentPlayer
            })
        );
        return;
    }
    var type = message.type;
    if (type === 'your_turn' || type === 'not_valid_move') {
        // receive the current board state
        board = message.board;
        if(type === 'your_turn') {
            //UTILS.displayBoard(board);
            if(currentPlayer == null){
                //solo la prima volta
                currentPlayer = message.currentPlayer;
                console.log("client: " + currentPlayer);
            }
            else if(currentPlayer != message.currentPlayer){
                //non your turn
                console.log("client: non your turn!");
                return;
            }
        }

        // determine the best move using alpha beta pruning
        var bestMove = randomMove(board, currentPlayer);
        //var bestMove = inputMove(board, currentPlayer, client);

        //var bestMove = alphaBetaPruning(board, 5, -Infinity, Infinity, currentPlayer);

        // send the move to the server
        client.write(
            JSON.stringify({
                type: 'move',
                x: bestMove.x,
                y: bestMove.y,
                player: currentPlayer
            })
        );
    } else if (type === 'valid_move') {
        // receive the current board state
        board = message.board;
        UTILS.displayBoard(board);
        if(message.currentPlayer == currentPlayer){
            client.write(
                JSON.stringify({
                    type: 'wait_my_turn',
                    player: currentPlayer
                })
            );
        }
    }else if (type === 'game_over'){
        if(message.winner == currentPlayer){
            console.log('you win');
			client.destroy();
        }else{   
            console.log('you lose');
			client.destroy();
		}
    }
});

client.on('close', function () {
    console.log('Connection closed');
});

client.on("error", (error) => {
	console.log(`Socket Error: ${error.message}`);
});

const randomMove = (board, player) => {
    return {
        x: Math.floor(Math.random()*8),
        y: Math.floor(Math.random()*8)
    }
};

const inputMove = (board, player, client) => {
    var stdin = process.openStdin();
    stdin.addListener("data", function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that  
    // with toString() and then trim() 
    let dd = d.toString().trim();
    client.write(
        JSON.stringify({
            type: 'move',
            x: Number.parseInt(dd[0]),
            y: Number.parseInt(dd[1]),
            player: player
        })
    );
  });

};

//In questo esempio, il metodo alphaBetaPruning viene utilizzato per valutare la mossa corrente.
//Se il giocatore corrente è il giocatore che massimizza, la funzione restituirà la valutazione massima.
//Altrimenti, se il giocatore corrente è il giocatore che minimizza, la funzione restituirà la
//valutazione minima. L'utilizzo della tecnica di alpha-beta pruning permette di evitare la valutazione
//di alberi di gioco non utili, migliorando l'efficienza del giocatore automatico.
const alphaBetaPruning = (board, depth, alpha, beta, maximizingPlayer) => {
    if (depth === 0 || gameOver(board)) {
        return evaluate(board);
    }

    if (maximizingPlayer == currentPlayer) {
        let maxEval = -Infinity;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                let move = UTILS.isValidMove(board, maximizingPlayer, i, j);
                if (move.isValid) {
                    const newBoard = updateBoard(board, i, j, maximizingPlayer);
                    const eval = alphaBetaPruning(newBoard, depth - 1, alpha, beta, UTILS.otherPlayer(currentPlayer));
                    maxEval = Math.max(maxEval, eval);
                    alpha = Math.max(alpha, eval);
                    if (beta <= alpha) {
                        break;
                    }
                }
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (UTILS.isValidMove(board, maximizingPlayer, i, j)) {
                    const newBoard = updateBoard(board, i, j, maximizingPlayer);
                    const eval = alphaBetaPruning(newBoard, depth - 1, alpha, beta, true);
                    minEval = Math.min(minEval, eval);
                    beta = Math.min(beta, eval);
                    if (beta <= alpha) {
                        break;
                    }
                }
            }
        }
        return minEval;
    }
};

function gameOver() {
    let emptySpots = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (board[i][j] == 0) {
                emptySpots++;
            }
        }
    }
    return emptySpots == 0 || blackScore + whiteScore == 64;
}

function evaluate() {
    let score = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (board[i][j] == BLACK) {
                score -= (3 * i) + j;
            } else if (board[i][j] == WHITE) {
                score += (3 * i) + j;
            }
        }
    }
    return score;
}

