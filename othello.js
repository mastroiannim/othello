const UTILS = {
    otherPlayer: function (player) {
        if (player === BOARD.PLAYER_BLACK) return BOARD.PLAYER_WHITE;
        else if (player === BOARD.PLAYER_WHITE) return BOARD.PLAYER_BLACK;
        else throw new Error('Player not allowed!');
    },
    displayBoard: function (board) {
        console.log("________________________");
        console.log("  0  1  2  3  4  5  6  7");
        for (let i = 0; i < 8; i++) {
            console.log(
                i + " " + board[i][0] + ", "
                + board[i][1] + ", "
                + board[i][2] + ", "
                + board[i][3] + ", "
                + board[i][4] + ", "
                + board[i][5] + ", "
                + board[i][6] + ", "
                + board[i][7]
            );
        }
        console.log("________________________");
    },
    //esegue la mossa specificata per il giocatore specificato
    updateBoard: function (board, player, col, row, tilesToFlip) {
        //console.log(tilesToFlip);
        //console.log(player);
        board[row][col] = player;
        for (let i = 0; i < tilesToFlip.length; i++) {
            board[tilesToFlip[i][1]][tilesToFlip[i][0]] = player;
        }
        //console.log(board);
        return board;
    },
    // verifica se la mossa è valida esaminando tutte le otto direzioni  
    // a partire dalla posizione specificata, identifica una serie di tessere 
    // dell'avversario che possono essere capovolte.
    isValidMove: function (board, player, col, row) {
        let tilesToFlip = [];
        try {
            col = Number.parseInt(col);
            row = Number.parseInt(row);
            if(isNaN (col) || isNaN (row) || col < 0 || col >= BOARD.SIZE || row < 0 || row >= BOARD.SIZE){
                return { isValid: false, tilesToFlip: tilesToFlip };
            }
        } catch (error) {
            return { isValid: false, tilesToFlip: tilesToFlip };
        }
        //console.log("-");UTILS.displayBoard(board);console.log("-");
        if (board[row][col] !== BOARD.BLANK) {
            return { isValid: false, tilesToFlip: tilesToFlip };
        }

        for (let dRow of [-1, 0, 1]) {
            for (let dCol of [-1, 0, 1]) {
                if (dRow === 0 && dCol === 0) {
                    continue;
                }

                let currRow = row + dRow;
                let currCol = col + dCol;
                let tempTilesToFlip = [];

				let add =false;
                while (currRow >= 0 && currRow < 8 && currCol >= 0 && currCol < 8) {
                    if (board[currRow][currCol] === player) {
						add = true;
                        break;
                    } else if (board[currRow][currCol] === BOARD.BLANK) {
                        tempTilesToFlip = [];
                        break;
                    } else {
                        tempTilesToFlip.push([currCol, currRow]);
                    }
                    currRow += dRow;
                    currCol += dCol;
                }
				if(!add) {
					tempTilesToFlip = [];
				}
                tilesToFlip = tilesToFlip.concat(tempTilesToFlip);
                //console.log("t:" + tempTilesToFlip);
                //console.log("a:" + tilesToFlip);
            }
        }
        return { isValid: tilesToFlip.length > 0, tilesToFlip: tilesToFlip };
    },
    gameOver: function (board, currentPlayer) {
        let blackCount = 0;
        let whiteCount = 0;

        for (let row = 0; row < BOARD.SIZE; row++) {
            for (let col = 0; col < BOARD.SIZE; col++) {
                if (board[row][col] === BOARD.PLAYER_BLACK) {
                    blackCount++;
                } else if (board[row][col] === BOARD.PLAYER_WHITE) {
                    whiteCount++;
                }
            }
        }
        console.log("blackCount: " + blackCount);
        console.log("whiteCount: " + whiteCount);
        
        if (blackCount + whiteCount < BOARD.SIZE * BOARD.SIZE) {
            let player = UTILS.otherPlayer(currentPlayer);
            for (let row = 0; row < BOARD.SIZE; row++) {
                for (let col = 0; col < BOARD.SIZE; col++) {
                    if (UTILS.isValidMove(board, player, row, col).isValid) {
                        console.log("move exists!");
                        return {
                            done: false,
                            fullBoard: false,
                            moveExists: true,
                            msg: "Move exists!"
                        }
                    }
                }
            }
            console.log("move NOT exists!");
            return {
                done: false,
                fullBoard: false,
                moveExists: false,
                msg: "Move NOT exists!"
            }
        } else {
            if (blackCount === whiteCount) {
                console.log("Tie!");
                return {
                    done: true,
                    fullBoard: true,
                    moveExists: false,
                    msg: "Tie"
                }
            } else if (blackCount > whiteCount) {
                console.log("Black wins!");
                return {
                    done: true,
                    fullBoard: true,
                    moveExists: false,
                    msg: "Black wins"
                }
            } else {
                console.log("White wins!");
                return {
                    done: true,
                    fullBoard: true,
                    moveExists: false,
                    msg: "White wins"
                }
            }
        }
    }
}

const BOARD = {
    PLAYER_BLACK: 'B',
    PLAYER_WHITE: 'W',
    BLANK: ' ',
    SIZE: 8
}

const NETWORK = {
    SERVER_PORT: 8080,
    SERVER_HOST: 'localhost'
}



module.exports = { NETWORK, UTILS, BOARD };
