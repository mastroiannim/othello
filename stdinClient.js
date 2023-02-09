
const { NETWORK, UTILS, BOARD } = require('./othello.js');

var net = require('net');
var client = new net.Socket();
var board;

let blackScore = 0;
let whiteScore = 0;
let currentPlayer = null;

client.connect(NETWORK.SERVER_PORT, NETWORK.SERVER_HOST, function () {
    console.log('Connected to server');
    var stdin = process.openStdin();
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

        var bestMove = inputMove(board, currentPlayer, client);

        
    } else if (type === 'valid_move') {
        
        stdin.removeListener("data", readStdin);

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

const readStdin = function (d){
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that  
    // with toString() and then trim() 
    let dd = d.toString().trim();
    client.write(
        JSON.stringify({
            type: 'move',
            x: Number.parseInt(dd[0]),
            y: Number.parseInt(dd[1]),
            player: currentPlayer
        })
    );
}
var stdin = null;
const inputMove = (board, player, client) => {
    UTILS.displayBoard(board);
    stdin = process.openStdin();
    stdin.addListener("data", readStdin);

};
