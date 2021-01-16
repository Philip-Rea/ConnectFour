// Philip Rea, 30002832, B02
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var games = [];
var players = [];
var queue = [];

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/mainpage.html');
});

io.on('connection', function (socket) {
    //If no cookie
    players.push(new Player(socket.id, randomUsername(), Math.floor(Math.random() * 100000000) + 1));
    socket.emit('new User', players[players.length - 1].userName, players[players.length - 1].gameCode);
    //else update ID?

    socket.on('change Username', function (username) {
        for (var i = 0; i < players.length; i++) {
            if (username == players[i].userName) {
                socket.emit("none Unique userName");
                return;
            } 
        }
        for (var i = 0; i < players.length; i++) {
            if (socket.id == players[i].ID) {
                players[i].userName = username;
                socket.emit("change Username", username);
            }
        }
    });

    socket.on('join random', function (name) {
        if (queue.length > 0) {
            if (name != queue[0].userName) {
                var opponent = queue.pop();
                games.push(new Game(opponent.userName, name, opponent.gameCode));
                io.emit("start game", name, opponent.userName, games[games.length - 1].gameState, games[games.length - 1].gameCode);
            }
        }else {
            for (var i = 0; i < players.length; i++) {
                if (players[i].userName == name) queue.push(players[i]);
            }
        }
    });

    socket.on('move made', function (r, c, player, game) {
        io.emit('move made', game, r, c, player);
        for (var i = 0; i < games.length; i++) {
            if (game == games[i].gameCode) {
                games[i].placePiece(r, c, player);
            }
        }
    });

    socket.on('join game with code', function (username, code) {
        for (var i = 0; i < players.length; i++) {
            if (username != players[i].userName && code == players[i].gameCode) {
                games.push(new Game(players[i].userName, username, players[i].gameCode));
                io.emit("start game", username, players[i].userName, games[games.length - 1].gameState, games[games.length - 1].gameCode);
                break;
                
            }
        }
    })

    socket.on('disconnect', function () {
        console.log("user disconnected")
    });
});

http.listen(3000, function () {
    console.log('Listening on *:3000');
});

class Player {
    constructor(id, username, gamecode) {
        this.ID = id;
        this.userName = username;
        this.gameCode = gamecode;

    }
}

class Game {
    constructor(player1, player2, gamecode) {
        this.player1 = player1;
        this.player2 = player2;
        this.gameCode = gamecode;
        this.gameState = 1;
        this.gameGrid = [];
        this.createGrid();
    }

    createGrid(gameGrid) {
        for (var r = 0; r < 6; r++) {
            this.gameGrid[r] = [];
            for (var c = 0; c < 7; c++) {
                this.gameGrid[r][c] = 0;
            }
        }
    }

    placePiece(r, c, player) {
        this.gameGrid[r][c] = player;
        var r = Number(r);
        var c = Number(c);

        /*
        console.log(this.gameGrid[0][0] + "," + this.gameGrid[0][1] + "," + this.gameGrid[0][2] + "," + this.gameGrid[0][3] + "," + this.gameGrid[0][4] + "," + this.gameGrid[0][5] + "," + this.gameGrid[0][6]);
        console.log(this.gameGrid[1][0] + "," + this.gameGrid[1][1] + "," + this.gameGrid[1][2] + "," + this.gameGrid[1][3] + "," + this.gameGrid[1][4] + "," + this.gameGrid[1][5] + "," + this.gameGrid[1][6]);
        console.log(this.gameGrid[2][0] + "," + this.gameGrid[2][1] + "," + this.gameGrid[2][2] + "," + this.gameGrid[2][3] + "," + this.gameGrid[2][4] + "," + this.gameGrid[2][5] + "," + this.gameGrid[2][6]);
        console.log(this.gameGrid[3][0] + "," + this.gameGrid[3][1] + "," + this.gameGrid[3][2] + "," + this.gameGrid[3][3] + "," + this.gameGrid[3][4] + "," + this.gameGrid[3][5] + "," + this.gameGrid[3][6]);
        console.log(this.gameGrid[4][0] + "," + this.gameGrid[4][1] + "," + this.gameGrid[4][2] + "," + this.gameGrid[4][3] + "," + this.gameGrid[4][4] + "," + this.gameGrid[4][5] + "," + this.gameGrid[4][6]);
        console.log(this.gameGrid[5][0] + "," + this.gameGrid[5][1] + "," + this.gameGrid[5][2] + "," + this.gameGrid[5][3] + "," + this.gameGrid[5][4] + "," + this.gameGrid[5][5] + "," + this.gameGrid[5][6]);
        */

        //check to see if game is won
        var hor = 1;
        var vert = 1;
        var diag1 = 1;
        var diag2 = 1;
        
        //check horizontal
        if (c - 1 >= 0 && this.gameGrid[r][c - 1] == player) {
            hor++;
            if (c - 2 >= 0 && this.gameGrid[r][c - 2] == player) {
                hor++;
                if (c - 3 >= 0 && this.gameGrid[r][c - 3] == player) {
                    hor++;
                } else if (c + 1 <= 6 && this.gameGrid[r][c + 1] == player) {
                    hor++;
                }
            } else if (c + 1 <= 6 && this.gameGrid[r][c + 1] == player) {
                hor++;
                if (c + 2 <= 6 && this.gameGrid[r][c + 2] == player) {
                    hor++;
                }
            }
        } else if (c + 1 <= 6 && this.gameGrid[r][c + 1] == player) {
            hor++;
            if (c + 2 <= 6 && this.gameGrid[r][c + 2] == player) {
                hor++;
                if (c + 3 <= 6 && this.gameGrid[r][c + 3] == player) {
                    hor++;
                }
            }
        }

        //check vertical
        if (r + 1 < 6 && this.gameGrid[r + 1][c] == player) {
            vert++;
            if (r + 2 < 6 && this.gameGrid[r + 2][c] == player) {
                vert++;
                if (r + 3 < 6 && this.gameGrid[r + 3][c] == player) {
                    vert++;
                }
            }
        }

        //check diag1 (positive slope)
        if (r - 1 >= 0 && c + 1 <= 6 && this.gameGrid[r - 1][c + 1] == player) {
            diag1++;
            if (r - 2 >= 0 && c + 2 <= 6 && this.gameGrid[r - 2][c + 2] == player) {
                diag1++;
                if (r - 3 >= 0 && c + 3 <= 6 && this.gameGrid[r - 3][c + 3] == player) {
                    diag1++;
                } else if (r + 1 <= 5 && c - 1 >= 0 && this.gameGrid[r + 1][c - 1] == player) {
                    diag1++;
                }
            } else if (r + 2 <= 5 && c - 2 >= 0 && this.gameGrid[r + 2][c - 2] == player) {
                diag1++;
                if (r + 3 <= 5 && c - 3 >= 0 && this.gameGrid[r + 3][c - 3] == player) {
                    diag1++;
                }
            }
        } else if (r + 1 <= 5 && c - 1 >= 0 && this.gameGrid[r + 1][c - 1] == player) {
            diag1++;
            if (r + 2 <= 5 && c - 2 >= 0 && this.gameGrid[r + 2][c - 2] == player) {
                diag1++;
                if (r + 3 <= 5 && c - 3 >= 0 && this.gameGrid[r + 3][c - 3] == player) {
                    diag1++;
                }
            }
        }

        //check diag2 (negative slope)
        if (r + 1 <= 5 && c + 1 <= 6 && this.gameGrid[r + 1][c + 1] == player) {
            diag2++;
            if (r + 2 <= 5 && c + 2 <= 6 && this.gameGrid[r + 2][c + 2] == player) {
                diag2++;
                if (r + 3 <= 5 && c + 3 <= 6 && this.gameGrid[r + 3][c + 3] == player) {
                    diag2++;
                } else if (r - 1 >= 0 && c - 1 >= 0 && this.gameGrid[r - 1][c - 1] == player) {
                    diag2++;
                }
            } else if (r - 2 >= 0 && c - 2 >= 0 && this.gameGrid[r - 2][c - 2] == player) {
                diag2++;
                if (r - 3 >= 0 && c - 3 >= 0 && this.gameGrid[r - 3][c - 3] == player) {
                    diag2++;
                }
            }
        } else if (r - 1 >= 0 && c - 1 >= 0 && this.gameGrid[r - 1][c - 1] == player) {
            diag2++;
            if (r - 2 >= 0 && c - 2 >= 0 && this.gameGrid[r - 2][c - 2] == player) {
                diag2++;
                if (r - 3 >= 0 && c - 3 >= 0 && this.gameGrid[r - 3][c - 3] == player) {
                    diag2++;
                }
            }
        }

        //check if game is won or draw
        if (hor >= 4 || vert >= 4 || diag1 >= 4 || diag2 >= 4) {
            io.emit('game won', this.gameCode, player);
            for (var i = 0; i < games.length; i++) {
                if (this.game == games[i].gameCode) {
                    games.splice(i, 1);
                }
            }
        } else {
            var draw = true;
            for (var r = 0; r < 6; r++) {
                for (var c = 0; c < 7; c++) {
                    if (this.gameGrid[r][c] == 0) {
                        draw = false;
                        break;
                    }
                }
            }
            if (draw) {
                io.emit('game draw', this.gameCode);
                for (var i = 0; i < games.length; i++) {
                    if (this.gameCode == games[i].gameCode) {
                        games.splice(i, 1);
                    }
                }
            }
        }
    }
}

function randomUsername() {
    let parts = [];
    parts.push(["Large", "Silly", "Medium", "Miniscule", "Massive", "Vibrant"]);
    parts.push(["Red", "Blue", "Beautiful", "Good", "Round", "Rainbow"]);
    parts.push(["Bear", "Dog", "Potato", "Orangutan", "Unicorn", "Goose"]);

    username = "";
    for (var part of parts) {
        username += part[Math.floor(Math.random() * part.length)];
    }
    
    for (var i = 0; i < players.length; i++) {
        if (username == players[i].userName) {
            username += Math.floor(Math.random() * 10);
            i = 0;
        }
    }
    return username;
}


