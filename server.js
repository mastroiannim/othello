//server.js npm init -y

const { NETWORK, UTILS, BOARD, MSG } = require('./othello.js');
const net = require('net');


// stato del server
let clients = new Array();
var board = [];
let nPlayers = 0;
let currentPlayer = BOARD.PLAYER_BLACK;
let ackCount = 0;
const CLEAR = false;

function sendTo(socket, obj){

    try{
        console.log("OUT -> " + obj.type + " to " + obj.currentPlayer + ", " + JSON.stringify(socket._peername));
    }catch(e){
        console.log(e.message);
        return;
    }
    if(ackCount == 0){        
        ackCount++; 
        socket.write(JSON.stringify(obj));
    }else{
        console.log("OUT of SYN: " + ackCount + "/" + Object.keys(clients).length);
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
    nPlayers = 0;
    clients = new Array();
    currentPlayer = BOARD.PLAYER_BLACK;
    ackCount = 0;
    UTILS.displayBoard(board);
}

function joinServer(socket){
    nPlayers++;
    if(nPlayers == 1){
        //primo è il black
        clients[BOARD.PLAYER_BLACK] = socket;
    }else if(nPlayers == 2){
        ackCount = 0;
        clients[BOARD.PLAYER_WHITE] = socket;
        sendTo(clients[BOARD.PLAYER_BLACK], {
            type: MSG.TYPE.TURN,
            currentPlayer: BOARD.PLAYER_BLACK,
            board: board
        });
    }else{
        console.log("troppi client");
        sendTo(socket, { 
            type: MSG.TYPE.JOIN, 
            error : "server is full" 
        });
        nPlayers--;
        socket.destroy();
    }
    console.log(socket._peername);
    console.log(Object.keys(clients));
    console.log("nPlayers: " + nPlayers + "/" + Object.keys(clients).length);
    
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
    if (data.player == currentPlayer) {
        if(move.isValid){
            // Aggiorna la board
            board = UTILS.updateBoard(board, data.player, data.x, data.y, move.tilesToFlip);
            let gameStatus = UTILS.gameOver(board, UTILS.otherPlayer(currentPlayer));
            if(!gameStatus.done && gameStatus.moveExists){
                if(gameStatus.player == currentPlayer){
                    console.log(gameStatus.msg);
                    console.log("play again: " + currentPlayer);
                    sendTo(clients[currentPlayer], {
                        type: MSG.TYPE.TURN,
                        currentPlayer: currentPlayer,
                        board: board
                    });
                    return;
                }
            }
            // Invia un messaggio di conferma al client
            sendTo(socket, {
                type: MSG.TYPE.VALID_MOVE,
                currentPlayer: currentPlayer,
                x: data.x,
                y: data.y,
                board: board
            });
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
    }else{
        //cambia turno
        console.log("evalMove: not you turn " + currentPlayer);
    }
}

function changeTurn(){
    if(CLEAR){
        process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
        console.clear();
    }
    // Cambia il giocatore corrente
    currentPlayer = UTILS.otherPlayer(currentPlayer);
    UTILS.displayBoard(board);
    // Verifica se il gioco è finito
    let gameStatus = UTILS.gameOver(board, currentPlayer);
    console.log(gameStatus.msg);
    if (gameStatus.done) {
        Object.keys(clients).forEach(player => {
            ackCount = 0;
            sendTo(clients[player], {
                type: 'game_over',
                currentPlayer: player,
                winner: gameStatus.winner
            });
        });
    }else{   
        sendTo(clients[currentPlayer], {
            type: MSG.TYPE.TURN,
            currentPlayer: currentPlayer,
            board: board
        }); 
    }
}


// Crea il server
const server = net.createServer(function (socket) {
    console.log('Client connesso: ', socket.remoteAddress, ':', socket.remotePort);
    // Riceve un messaggio dal client
    socket.on('data', function (fromClient) {
        const sanitized = UTILS.sanitizeData(fromClient);
        //console.log(fromClient) ; //https://www.rapidtables.org/it/convert/number/ascii-hex-bin-dec-converter.html
        console.log("IN <- " + sanitized.toString('utf8'));
        let data = validateData(sanitized);
        switch (data.type) {
            case MSG.TYPE.JOIN:
                joinServer(socket);
                break;
            case MSG.TYPE.MOVE:
                evalMove(socket, data);
                break;
            case MSG.TYPE.ASK_TURN:
                changeTurn();
                break;
            default:
                sendInvalidType(socket, data);
                break;
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
    //currentPlayer = BOARD.PLAYER_WHITE;
    //board = [[" "," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," "],["B","W","W","W","W","W","W","W"],["B","B","W","B","B","W","B","B"],["B","B","B","W","B","B","B","B"],["B","W","W","B","W","B","B","B"],["B","W","B","W","B","B","B","B"],["B","B","B","B","B","B","B","B"]];
    //board = [[" "," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," "],[" "," "," "," ","W"," "," "," "],[" "," "," ","W","W","W"," "," "],[" "," "," ","W","W","W","B","W"],["W","W","W","W","W","B","B","B"],["B","W","W","W","B","B","B","B"],["B","B","B","B","B","B","B","B"]];
    console.log('Server in ascolto sulla porta', NETWORK.SERVER_PORT);
});
