//client automatico

const { NETWORK, UTILS, BOARD } = require('./othello.js');

process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
console.clear();

//In questo esempio, il client si connette al server sulla porta 3000 dell'indirizzo
//IP 127.0.0.1. Quando riceve un messaggio che indica che è il suo turno, il client
//utilizza l'algoritmo alpha beta pruning per determinare la mossa più vantaggiosa.

var net = require('net');
var client = new net.Socket();
var board;
let ackCount = 0;

let blackScore = 0;
let whiteScore = 0;
let currentPlayer = null;

function sendTo(socket, obj){
    while(ackCount != 0){
        //todo better
        ackCount = Math.floor(Math.random()*99);
    }
    if(ackCount == 0){
        ackCount++; 
        socket.write(JSON.stringify(obj));
        //console.log("sendTo:[" + obj.type + "]");
    }
}

client.connect(NETWORK.SERVER_PORT, NETWORK.SERVER_HOST, function () {
    console.log('Connected to server');
    // send initial message
    sendTo(client, { type: "join" });
});

client.on('data', function (data) {
    ackCount--;
    
    var message;
    try{
        message = JSON.parse(data);
        console.log("on data:["  + message.type + "]");
    }catch(error){
        console.log('Errore: ', error.message);
        console.log(data);
        client.write(JSON.stringify({
            type: 'wait_my_turn',
            player: currentPlayer
        }));
        return;
    }
    var type = message.type;
    if (type === 'your_turn' || type === 'not_valid_move') {
        // receive the current board state
        board = message.board;
        if(currentPlayer == null){
            //solo la prima volta
            currentPlayer = message.currentPlayer;
            console.log("client: " + currentPlayer);
        }
        // determine the best move using alpha beta pruning
        //var bestMove = randomMove(board, currentPlayer);

        var bestMove = alphaBetaPruning(board, 1, -Infinity, Infinity, currentPlayer);
        console.log(bestMove);
        process.exit();

        // send the move to the server
        sendTo(client, {
            type: 'move',
            x: bestMove.x,
            y: bestMove.y,
            player: currentPlayer
        });
    } else if (type === 'valid_move') {
        // receive the current board state
        board = message.board;
        
        UTILS.displayBoard(board);
        if(message.currentPlayer == currentPlayer){
            sendTo(client, {
                type: 'wait_my_turn',
                player: currentPlayer
            });
        }
    }else if (type === 'game_over'){
        //console.log(message);
        if(message.winner == currentPlayer){
            console.log('you win');
			client.destroy();
        }else if(message.winner == BOARD.BLANK){   
            console.log('Tie game');
			client.destroy();
		}else{
            console.log('you lose');
			client.destroy();
        }
    }else{
        sendTo(client, {
            type: 'wait_my_turn',
            player: currentPlayer
        });
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

//In questo esempio, il metodo alphaBetaPruning viene utilizzato per valutare la mossa corrente.
//Se il giocatore corrente è il giocatore che massimizza, la funzione restituirà la valutazione massima.
//Altrimenti, se il giocatore corrente è il giocatore che minimizza, la funzione restituirà la
//valutazione minima. L'utilizzo della tecnica di alpha-beta pruning permette di evitare la valutazione
//di alberi di gioco non utili, migliorando l'efficienza del giocatore automatico.
const alphaBetaPruning = (board, depth, alpha, beta, maximizingPlayer, i, j) => {
    console.log(maximizingPlayer);
    
    if (depth === 0 || gameOver(board)) {
        console.log("depth = 0 || gameOVER");
        return evaluate(board);
    }
    let toBeRet ={
        player: currentPlayer,
        x:i,
        y:j
    };

    if (maximizingPlayer == currentPlayer) {
        let maxEval = -Infinity;
        for (i = 0; i < 8; i++) {
            for (j = 0; j < 8; j++) {    
                let move = UTILS.isValidMove(board, maximizingPlayer, i, j);
                toBeRet.minmax = "MAX";
                toBeRet.x = i;
                toBeRet.y = j;
                toBeRet.score = maxEval;
   
                if (move.isValid) {
                    const newBoard = UTILS.updateBoard(board, maximizingPlayer, i, j, move.tilesToFlip);
                    const eval = alphaBetaPruning(newBoard, depth - 1, alpha, beta, maximizingPlayer, i, j);
                    console.log(eval);
                    maxEval = Math.max(maxEval, eval.score);
                    //massimizzare alpha
                    alpha = Math.max(alpha, eval.score);
                    if (beta <= alpha) {
                        console.log(alpha + "/" + beta + " (alpha/beta) massimizzato alpha!");
                        break;
                    }
                    console.log(toBeRet);
                    console.log("VALIDA!");
                }else{
                    console.log(toBeRet);
                    console.log("NON VALIDA!");
                }
            }
        }
        return toBeRet;
    } else {
        let minEval = Infinity;
        for (i = 0; i < 8; i++) {
            for (j = 0; j < 8; j++) {
                let move = UTILS.isValidMove(board, maximizingPlayer, i, j);
                toBeRet.minmax = "MIN";
                toBeRet.x = i;
                toBeRet.y = j;
                toBeRet.score = minEval;
                
                if (move.isValid) {
                    const newBoard = UTILS.updateBoard(board, maximizingPlayer, i, j, move.tilesToFlip);
                    const eval = alphaBetaPruning(newBoard, depth - 1, alpha, beta, maximizingPlayer, i, j);
                    minEval = Math.min(minEval, eval.eval);
                    //minimizzare beta
                    beta = Math.min(beta, eval.eval);
                    if (beta <= alpha) {
                        console.log(alpha + "/" + beta + " (alpha/beta) minimizzato beta!");
                        break;
                    }
                    console.log(toBeRet);
                    console.log("VALIDA!");
                }else{
                    console.log(toBeRet);
                    console.log("NON VALIDA!");
                }
            }
        }
        return toBeRet;
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
    let x, y;
    let score = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (board[i][j] == BOARD.PLAYER_BLACK) {
                score -= (3 * i) + j;
                x=i;
                y=j;
            } else if (board[i][j] == BOARD.PLAYER_WHITE) {
                score += (3 * i) + j;
                x=i;
                y=j;
            }
        }
    }
    let toBeRet = {
        x:x,
        y:y,
        score : score
    };
    console.log(toBeRet);
    return toBeRet;
}

