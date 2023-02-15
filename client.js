//client automatico

const { NETWORK, UTILS, BOARD, MSG} = require('./othello.js');
const DEPTH = 5;
process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
console.clear();

//In questo esempio, il client si connette al server sulla porta NETWORK.SERVER_PORT
//all'indirizzo NETWORK.SERVER_HOST. Quando riceve un messaggio che indica che è il 
//suo turno, il client utilizza l'algoritmo alpha beta pruning per determinare la mossa
// più vantaggiosa.

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
    sendTo(client, { type: MSG.TYPE.JOIN });
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
            type: MSG.TYPE.ASK_TURN,
            player: currentPlayer
        }));
        return;
    }
    var type = message.type;
    if (type === MSG.TYPE.TURN || type === MSG.TYPE.NOT_VALID_MOVE) {
        // receive the current board state
        board = message.board;
        if(currentPlayer == null){
            //solo la prima volta
            currentPlayer = message.currentPlayer;
            console.log("client: " + currentPlayer);
        }

        if(type == MSG.TYPE.TURN)
            UTILS.displayBoard(board, currentPlayer);
        // determine the best move using alpha beta pruning
        //var bestMove = randomMove(board, currentPlayer);
        var bestMove = alphaBetaPruning(board, DEPTH, -Infinity, Infinity, currentPlayer);


        // send the move to the server
        sendTo(client, {
            type: MSG.TYPE.MOVE,
            x: bestMove.x,
            y: bestMove.y,
            player: currentPlayer
        });
    } else if (type === MSG.TYPE.VALID_MOVE) {
        // receive the current board state
        board = message.board;
        
        UTILS.displayBoard(board, currentPlayer);
        if(message.currentPlayer == currentPlayer){
            sendTo(client, {
                type: MSG.TYPE.ASK_TURN,
                player: currentPlayer
            });
        }
    }else if (type === MSG.TYPE.GAME_OVER ){
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
            type: MSG.TYPE.ASK_TURN,
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
const alphaBetaPruning = (board, depth, alpha, beta, maximizingPlayer, i, j, turningPlayer) => {
    
    if(turningPlayer == undefined)
        turningPlayer = maximizingPlayer;

    //console.log(turningPlayer);

    if (depth === 0 || gameOver(board)) {
        let score = evaluate(board);
        return {
            player: turningPlayer,
            x:j,
            y:i,
            score: score
        };
    }
    let toBeRet ={
        x:j,
        y:i,
        player: turningPlayer
    };
    

    if (turningPlayer == BOARD.PLAYER_BLACK) {
        let maxEval = -Infinity;
        for (i = 0; i < 8; i++) {
            for (j = 0; j < 8; j++) {    
                let move = UTILS.isValidMove(board, BOARD.PLAYER_BLACK, j, i);
                toBeRet.minmax = "MAX";
                toBeRet.score = maxEval;
   
                if (move.isValid) {
                    toBeRet.x = j;
                    toBeRet.y = i;
                    //console.log(move);console.log(toBeRet);console.log("VALIDA!");
                    UTILS.updateBoard(board, turningPlayer, j, i, move.tilesToFlip);
                    const eval = alphaBetaPruning(board, depth - 1, alpha, beta, BOARD.PLAYER_BLACK, i, j, BOARD.PLAYER_WHITE);
                    UTILS.revertBoard(board, turningPlayer, j, i, move.tilesToFlip);
                    //console.log(eval);
                    maxEval = Math.max(maxEval, eval.score);
                    toBeRet.score = maxEval;
                    //massimizzare alpha
                    alpha = Math.max(alpha, eval.score);
                    if (beta <= alpha) {
                        //console.log(alpha + "/" + beta + " (alpha/beta) massimizzato alpha!");
                        break;
                    }
                }else{
                    //console.log(toBeRet);
                    //console.log("NON VALIDA!");
                }
            }
        }
        return toBeRet;
    } else {
        let minEval = Infinity;
        for (i = 0; i < 8; i++) {
            for (j = 0; j < 8; j++) {
                let move = UTILS.isValidMove(board, BOARD.PLAYER_WHITE, j, i);
                toBeRet.minmax = "MIN";
                toBeRet.score = minEval;
                
                if (move.isValid) {
                    toBeRet.x = j;
                    toBeRet.y = i;
                    //console.log(move);console.log(toBeRet);console.log("VALIDA!");
                    UTILS.updateBoard(board, turningPlayer, j, i, move.tilesToFlip);
                    const eval = alphaBetaPruning(board, depth - 1, alpha, beta, BOARD.PLAYER_WHITE, i, j, BOARD.PLAYER_BLACK);
                    UTILS.revertBoard(board, turningPlayer, j, i, move.tilesToFlip);
                    //console.log(eval);
                    minEval = Math.min(minEval, eval.score);
                    toBeRet.score = minEval;
                    //minimizzare beta
                    beta = Math.min(beta, eval.score);
                    if (beta <= alpha) {
                        //console.log(alpha + "/" + beta + " (alpha/beta) minimizzato beta!");
                        break;
                    }
                }else{
                    //console.log(toBeRet);
                    //console.log("NON VALIDA!");
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

function evaluate(board) {
    let score = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (board[i][j] == BOARD.PLAYER_BLACK) {
                if((j==0 && i==0)||(j==7 && i ==0)||(j==0 && i==7)||(j==7 && i==7))
                    score+=100;
                score += (3 * j) + i;
            } else if (board[i][j] == BOARD.PLAYER_WHITE) {
                if((j==0 && i==0)||(j==7 && i ==0)||(j==0 && i==7)||(j==7 && i==7))
                    score-=100;
                score -= (3 * i) + j;
            }
        }
    }
    return score;
}

function testAB(){
    process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
    console.clear();
    board = [];
    for (var i = 0; i < BOARD.SIZE; i++) {
        board[i] = [];
        for (var j = 0; j < BOARD.SIZE; j++) {
            board[i][j] = BOARD.BLANK;
        }
    }
    board[3][3] = BOARD.PLAYER_WHITE;
    board[4][4] = BOARD.PLAYER_WHITE;
    board[3][4] = BOARD.PLAYER_BLACK;
    board[4][3] = BOARD.PLAYER_BLACK;
    currentPlayer = BOARD.PLAYER_BLACK;
    UTILS.displayBoard(board, currentPlayer);
    var bestMove = alphaBetaPruning(board, 2, -Infinity, Infinity, currentPlayer);
    console.log(bestMove);
}
//testAB();