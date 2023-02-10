//server.js npm init -y

const { NETWORK, UTILS, BOARD, MSG } = require('./othello.js');
const net = require('net');


// stato del server
let clients = [];
var board = [];
let nPlayers = 0;
let nTiles = 0;
let currentPlayer = BOARD.PLAYER_BLACK;
let ackCount = 0;
let lastSent;

const timer = ms => new Promise( res => setTimeout(res, ms));

function sendTo(socket, obj){
    /*while(ackCount != 0){
        //todo better
        ackCount = Math.floor(Math.random()*99);
    }*/
    if(ackCount == 0){
        ackCount++; 
        socket.write(JSON.stringify(obj));
        lastSent = obj;
        //console.log("sendTo:[" + obj.type + "]");
    }else{
        process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
        console.clear();
        UTILS.displayBoard(board);
        clients.forEach(socket => {
            socket.write(JSON.stringify({
                type: MSG.TYPE.TURN,
                currentPlayer: currentPlayer,
                board: board
            }));
        });
        //timer(5000).then(_=>sendTo(socket, obj)); 
    }
}


function initNewGame(){
    process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
    console.clear();
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
    nTiles = 4;
    nPlayers = 0;
    clients = [];
    currentPlayer = BOARD.PLAYER_BLACK;
    ackCount = 1;
    lastSent = null;
    UTILS.displayBoard(board);
}

function joinServer(socket){
    let assignedPlayer = BOARD.PLAYER_BLACK;
    if (nPlayers > 1) {
        console.log("troppi client");
        sendTo(socket, { 
            type: MSG.TYPE.JOIN, 
            error : "server is full" 
        });
        socket.destroy();
        return;
    }
    clients[nPlayers] = socket;
    nPlayers++;
    console.log("nPlayers: " + nPlayers);
    if(nPlayers == 2) assignedPlayer = BOARD.PLAYER_WHITE
    sendTo(socket, {
        type: MSG.TYPE.TURN,
        currentPlayer: assignedPlayer,
        board: board
    });
}

function validateMove(fromClient){
    if(fromClient.x == undefined) throw new Error('Missing x in move message');  
    if(fromClient.y == undefined) throw new Error('Missing x in move message'); 
    if(fromClient.player == undefined) throw new Error('Missing player in move message'); 
}

function validateAskTurn(fromClient){
    if(fromClient.player == undefined) throw new Error('Missing player in move message'); 
}

function validateData(data){
    //console.log('validateData data: ', data);
    ackCount--;
    let fromClient = null;
    try{
        fromClient = JSON.parse(data);
        if(fromClient.type == undefined){
            throw new Error('Missing type in message'); 
        }
        switch (fromClient.type) {
            case MSG.TYPE.JOIN:
                break;
            case MSG.TYPE.MOVE:
                validateMove(fromClient);
                break;
            case MSG.TYPE.ASK_TURN:
                validateAskTurn(fromClient);
                break;
            default:
                throw new Error('unexpected type: ' + fromClient.type);
        }
    }catch(error){
        //console.log('validateData error: ', error.message);
        //console.log(data);
        fromClient = { 
            type: MSG.TYPE.INVALID, 
            error : error.message 
        };
    }
    return fromClient;
}

function sendInvalidType(socket, data){
    //send a feedback
    sendTo(socket, data);
}

function evalMove(socket, data){
    let move = UTILS.isValidMove(board, data.player, data.x, data.y);
    if (move.isValid && data.player == currentPlayer) {
        // Aggiorna la board
        board = UTILS.updateBoard(board, data.player, data.x, data.y, move.tilesToFlip);
        // Mostra la board
        UTILS.displayBoard(board);
        // Invia un messaggio di conferma al client
        sendTo(socket, {
            type: MSG.TYPE.VALID_MOVE,
            currentPlayer: currentPlayer,
            x: data.x,
            y: data.y,
            board: board
        });
        // Cambia il giocatore corrente
        currentPlayer = UTILS.otherPlayer(currentPlayer);
    }else{
        //not a valid move
        // Invia un messaggio di mossa non valida al client
        sendTo(socket, {
            type: MSG.TYPE.NOT_VALID_MOVE,
            currentPlayer: currentPlayer,
            x: data.x,
            y: data.y,
            board: board
        });
    }
}

function changeTurn(){
    UTILS.displayBoard(board);
    clients.forEach(socket => {
        sendTo(socket, {
            type: MSG.TYPE.TURN,
            currentPlayer: currentPlayer,
            board: board
        });
    });
}

function testGameOver(){
    // Verifica se il gioco è finito
    let gameStatus = UTILS.gameOver(board, currentPlayer);
    if (gameStatus.done) {
        clients.forEach(socket => {
            socket.write(
                JSON.stringify({
                    type: 'game_over',
                    winner: gameStatus.winner
                })
            );
        });
        return;
    }
    if(!gameStatus.fullBoard && !gameStatus.moveExists && !gameStatus.done){
        //prova l'altro giocatore
        clients.forEach(socket => {
            socket.write(
                JSON.stringify({
                    type: 'your_turn',
                    currentPlayer: currentPlayer,
                    board: board
                })
            );
        });
    }else{
        nTiles++;
        if (nTiles == BOARD.SIZE * BOARD.SIZE) {
            console.log(nTiles);
            return;
        }
    }
}

// Crea il server
const server = net.createServer(function (socket) {
    console.log('Client connesso: ', socket.remoteAddress, ':', socket.remotePort);
    // Riceve un messaggio dal client
    socket.on('data', function (fromClient) {
        let data = validateData(fromClient);
        //console.log("on data: [" + data.type + "]") ;
        switch (data.type) {
            case MSG.TYPE.JOIN:
                joinServer(socket);
                break;
            case MSG.TYPE.MOVE:
                evalMove(socket, data);
            case MSG.TYPE.ASK_TURN:
                changeTurn();
            case MSG.TYPE.SYN:
                sendTo(socket, lastSent);
            default:
                sendInvalidType(socket, data);
                break;
        }
        testGameOver();
        return;
        
        //console.log(data);
        if (data.type == "join") {
            joinServer(socket);
        } else if (data.type == "move") {
            // Verifica se la mossa è valida
            let move = UTILS.isValidMove(board, data.player, data.x, data.y);
            if (move.isValid) {
                // Aggiorna il tabellone
                board = UTILS.updateBoard(board, data.player, data.x, data.y, move.tilesToFlip);
                console.log(data)
                // Invia un messaggio di conferma al client
                socket.write(
                    JSON.stringify({
                        type: 'valid_move',
                        currentPlayer: currentPlayer,
                        x: data.x,
                        y: data.y,
                        board: board
                    })
                );
                // Verifica se il gioco è finito
                let gameStatus = UTILS.gameOver(board, currentPlayer);
                if (gameStatus.done) {
                    clients.forEach(socket => {
                        socket.write(
                            JSON.stringify({
                                type: 'game_over',
                                winner: currentPlayer
                            })
                        );
                        //socket.destroy();
                    });
					socket.destroy();
					return;
                }

                if(!gameStatus.fullBoard && !gameStatus.moveExists && !gameStatus.done){
                    //prova l'altro giocatore
                    clients.forEach(socket => {
                        socket.write(
                            JSON.stringify({
                                type: 'your_turn',
                                currentPlayer: currentPlayer,
                                board: board
                            })
                        );
                    });
                }else{
                    nTiles++;
                    if (nTiles == BOARD.SIZE * BOARD.SIZE) {
                        console.log(nTiles);
                        return;
                    }
                }

                // Cambia il giocatore corrente
                currentPlayer = UTILS.otherPlayer(currentPlayer);

            } else {
                //not valid move
                socket.write(
                    JSON.stringify({
                        type: 'not_valid_move',
                        currentPlayer: currentPlayer,
                        x: data.x,
                        y: data.y,
                        board: board
                    })
                )
            }
        } else if ((data.type == "wait_my_turn")) {
            clients.forEach(socket => {
                socket.write(
                    JSON.stringify({
                        type: 'your_turn',
                        currentPlayer: currentPlayer,
                        board: board
                    })
                );
            });
        } else {
            // Invia un messaggio di errore al client
            socket.write(
                JSON.stringify({
                    type: 'invalid_type'
                })
            );
        }
    });

    // Riceve un errore dal client
    socket.on('error', function (error) {
        console.log('Errore: ', error.message);
        socket.destroy();
    });

    // Chiusura della connessione
    socket.on('close', function () {
        console.log('Connessione chiusa');
    });
});


// Avvia il server
server.listen(NETWORK.SERVER_PORT, function () {
    initNewGame();
    console.log('Server in ascolto sulla porta', NETWORK.SERVER_PORT);
});
