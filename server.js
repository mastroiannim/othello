//server.js npm init -y

const { NETWORK, UTILS, BOARD } = require('./othello.js');
const net = require('net');

//rete
const PORT = NETWORK.SERVER_PORT;
const HOST = NETWORK.SERVER_HOST;

// Variabili per il gioco
const BLACK = BOARD.PLAYER_BLACK;
const WHITE = BOARD.PLAYER_WHITE;
const BLANK = BOARD.BLANK;
const BOARD_SIZE = BOARD.SIZE

// Crea un array bidimensionale per rappresentare il tabellone del gioco,
// e inizializza tutti i valori a BLANK (stringa vuota).
var board = [];
for (var i = 0; i < BOARD_SIZE; i++) {
    board[i] = [];
    for (var j = 0; j < BOARD_SIZE; j++) {
        board[i][j] = BLANK;
    }
}

// Imposta le quattro pedine iniziali al centro del tabellone usando i
// valori WHITE e BLACK definiti nell'enumerazione.
board[3][3] = WHITE;
board[4][4] = WHITE;
board[3][4] = BLACK;
board[4][3] = BLACK;

UTILS.displayBoard(board);

let nPlayers = 0;
let clients = [];
let currentPlayer = BLACK;
let nTiles = 4;

// Crea il server
const server = net.createServer(function (socket) {
    console.log('Client connesso: ', socket.remoteAddress, ':', socket.remotePort);
    if (nPlayers == 0) {
        currentPlayer = BLACK;
    }
    else if (nPlayers == 1) {
        currentPlayer = WHITE;
    }
    else {
        console.log("troppi client");
        socket.destroy();
        return;
    }
    clients[nPlayers] = socket;
    nPlayers++;
    console.log("nPlayers: " + nPlayers);

    // Riceve un messaggio dal client
    socket.on('data', function (data) {
        data = JSON.parse(data);
        //console.log(data);
        if (data.type == "join") {
            socket.write(
                JSON.stringify({
                    type: 'your_turn',
                    currentPlayer: currentPlayer,
                    board: board
                })
            );
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
                if (UTILS.gameOver(board, currentPlayer).done) {
                    clients.forEach(socket => {
                        socket.write(
                            JSON.stringify({
                                type: 'game_over',
                                winner: currentPlayer
                            })
                        );
                        socket.destroy();
                        return;
                    });
                }

                nTiles++;
                if (nTiles == BOARD.SIZE * BOARD.SIZE) {
                    console.log(nTiles);
                    return;
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
server.listen(PORT, function () {
    console.log('Server in ascolto sulla porta', PORT);
});
