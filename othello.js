const UTILS = {
    sanitizeData : function (fromClient){
        let from, to;
        for(let i=0; i < fromClient.length; i++){
            //expected JSON
            if(fromClient[i] == 123) {
                from = i;
            }else if(fromClient[i] == 125) {
                to = i+1;
                break;
            }
        }
        const sanitized = Buffer.allocUnsafe(to-from);
        fromClient.copy(sanitized, 0, from, to);
        return sanitized;
    },
    otherPlayer: function (player) {
        if (player === BOARD.PLAYER_BLACK) return BOARD.PLAYER_WHITE;
        else if (player === BOARD.PLAYER_WHITE) return BOARD.PLAYER_BLACK;
        else throw new Error('Player not allowed!');
    },
    displayBoard: function (board, title) {
        if(title != undefined)
            console.log("(" + title + ")");
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
        points = this.getPoints(board);
        console.log(BOARD.PLAYER_BLACK + ":" + points[BOARD.PLAYER_BLACK]);
        console.log(BOARD.PLAYER_WHITE + ":" + points[BOARD.PLAYER_WHITE]);
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
    //annulla la mossa specificata per il giocatore specificato
    revertBoard: function (board, player, col, row, tilesToFlip) {
        //console.log(tilesToFlip);
        //console.log(player);
        player = UTILS.otherPlayer(player);
        board[row][col] = BOARD.BLANK;
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
    getPoints: function (board){
        let points = [];
        points[BOARD.PLAYER_BLACK] = 0;
        points[BOARD.PLAYER_WHITE] = 0;
        for (let row = 0; row < BOARD.SIZE; row++) {
            for (let col = 0; col < BOARD.SIZE; col++) {
                if (board[row][col] === BOARD.PLAYER_BLACK) {
                    points[BOARD.PLAYER_BLACK]++;
                } else if (board[row][col] === BOARD.PLAYER_WHITE) {
                    points[BOARD.PLAYER_WHITE]++;
                }
            }
        }
        return points;
    },
    gameOver: function (board, currentPlayer) {
        
        points = this.getPoints(board);
        let blackCount = points[BOARD.PLAYER_BLACK]
        let whiteCount = points[BOARD.PLAYER_WHITE]
        
        if (blackCount + whiteCount < BOARD.SIZE * BOARD.SIZE) {
            const players = [currentPlayer, UTILS.otherPlayer(currentPlayer)];
            for(let p = 0; p<players.length; p++) {
                for (let row = 0; row < BOARD.SIZE; row++) {
                    for (let col = 0; col < BOARD.SIZE; col++) {
                        if (UTILS.isValidMove(board, players[p], row, col).isValid) {
                            console.log("move exists! ");
                            console.log("player turn: " + players[p]);
                            return {
                                done: false,
                                fullBoard: false,
                                moveExists: true,
                                msg: "Move exists!",
                                player: players[p]
                            };
                        }
                    }
                }
            }            
                
            console.log("move NOT exists!");
            console.log("player turn: " + currentPlayer);
            let win = BOARD.BLANK;
            if(blackCount > whiteCount) win = BOARD.PLAYER_BLACK;
            if (whiteCount > blackCount) win = BOARD.PLAYER_WHITE;
            if (blackCount === whiteCount) 
                console.log("Tie!");
            else if (blackCount > whiteCount) 
                console.log("Black wins!");
            else 
                console.log("White wins!");
            return {
                done: true,
                fullBoard: false,
                moveExists: false,
                msg: "Move NOT exists!",
                winner: win
            }
        } else {
            if (blackCount === whiteCount) {
                console.log("Tie!");
                return {
                    done: true,
                    fullBoard: true,
                    moveExists: false,
                    msg: "Tie",
                    winner: BOARD.BLANK
                }
            } else if (blackCount > whiteCount) {
                console.log("Black wins!");
                return {
                    done: true,
                    fullBoard: true,
                    moveExists: false,
                    msg: "Black wins",
                    winner: BOARD.PLAYER_BLACK
                }
            } else {
                console.log("White wins!");
                return {
                    done: true,
                    fullBoard: true,
                    moveExists: false,
                    msg: "White wins",
                    winner: BOARD.PLAYER_WHITE
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


const MSG = {
    TYPE : {
        INVALID: 'invalid_type',
        JOIN:  'join',
        MOVE: 'move',
        TURN: 'your_turn',
        VALID_MOVE: 'valid_move',
        NOT_VALID_MOVE: 'not_valid_move',
        ASK_TURN: 'wait_my_turn',
        SKIP: 'not_a_move'
    }
}



module.exports = { NETWORK, UTILS, BOARD, MSG };
