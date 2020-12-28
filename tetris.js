const pieces = ["Z", "L", "O", "S", "I", "J", "T"]
const colors = ["#000000", "#FF0100", "#FEAA00", "#FFFE02", "#00EA01", "#00DDFF", "#0000FF", "#AA00FE", "#555555"]
const piece_matrix = {
    "Z": [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ],
    "L": [
        [0, 0, 2],
        [2, 2, 2],
        [0, 0, 0]
    ],
    "O": [
        [3, 3],
        [3, 3]
    ],
    "S": [
        [0, 4, 4],
        [4, 4, 0],
        [0, 0, 0]
    ],
    "I": [
        [0, 0, 0, 0],
        [5, 5, 5, 5],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    "J": [
        [6, 0, 0],
        [6, 6, 6],
        [0, 0, 0]
    ],
    "T": [
        [9, 7, 9],
        [7, 7, 7],
        [0, 0, 0]
    ],
    null: [
        [0]
    ]
};

const wallkicks = {
    "0-1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], //special
    "1-0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    "1-2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    "2-1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "2-3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]], //special
    "3-2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "3-0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "0-3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]
};

const i_wallkicks = {
    "0-1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    "1-0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    "1-2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    "2-1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    "2-3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    "3-2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    "3-0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    "0-3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
};

var piece_displacement = {
    "I": [-.5, -.5],
    "O": [.5, 0]
}

var combo_table
if (document.currentScript.hasAttribute("data-combo")) {
    combo_table = JSON.parse(document.currentScript.getAttribute('data-combo'))
} else {
    combo_table = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
}

var grav
if (document.currentScript.hasAttribute("data-gravity")) {
    grav = parseInt(document.currentScript.getAttribute('data-gravity'))
} else {
    grav = 60
}

var controls
if (document.currentScript.hasAttribute("data-controls")) {
    controls = JSON.parse(document.currentScript.getAttribute('data-controls'))
} else {
    controls = { "move_left": [37, "ArrowLeft"], "move_right": [39, "ArrowRight"], "rotate_left": [83, "s"], "rotate_right": [38, "ArrowUp"], "softdrop": [40, "ArrowDown"], "harddrop": [32, " "], "hold": [67, "c"], "restart": [115, "F4"], "DAS": "200", "ARR": "10", "grav_ARR": "10" }
}

const matrixHeight = 20;
const matrixWidth = 10;

const empty_line = new Array(matrixWidth).fill(0);

const boardCanvas = document.getElementById("board");
const boardContext = boardCanvas.getContext("2d");
const boardHeight = boardCanvas.height;
const boardWidth = boardCanvas.width;

const queueCanvas = document.getElementById("queue");
const queueContext = queueCanvas.getContext("2d");
const queueHeight = queueCanvas.height;
const queueWidth = queueCanvas.width;

const heldCanvas = document.getElementById("held");
const heldContext = heldCanvas.getContext("2d");
const heldHeight = heldCanvas.height;
const heldWidth = heldCanvas.width;

const ratioHeight = boardHeight / matrixHeight
const ratioWidth = boardWidth / matrixWidth

const ratioQueueHeight = queueHeight / 72
const ratioQueueWidth = queueWidth / 12

const ratioHeldHeight = heldHeight / 12
const ratioHeldWidth = heldWidth / 12

var linesSentText = document.getElementById("lines_sent");

const skin = new Image();
const useSkin = document.currentScript.hasAttribute("data-skin");
if (useSkin) {
    const skinUrl = document.currentScript.getAttribute('data-skin')
    skin.src = skinUrl;
    var skinSize
    skin.onerror = function () { useSkin = false };
    skin.onload = function () {
        skinSize = this.height
    }
}

const bg = new Image();
var bgWidth
const useBg = document.currentScript.hasAttribute("data-bg");
if (useBg) {
    const bgUrl = document.currentScript.getAttribute('data-bg')
    bg.src = bgUrl;
    bg.onerror = function () { useBg = false };
    bg.onload = function () {
        bgWidth = this.width * (boardHeight / this.height)
    }
}

var keyDict = {};

$('body').on('keydown', function (key) {
    for (var testKey in controls) {
        if (controls.hasOwnProperty(testKey)) {
            if (key.which == controls[testKey][0]) {
                key.preventDefault();
                // console.log(key.key);
            }
        }
    }
    if (keyDict[key.which] === undefined) {
        var currentTime = new Date().getTime()
        keyDict[key.which] = [currentTime, 0]
    }
})

$('body').on('keyup', function (key) {
    delete keyDict[key.which]
});

var interval;
var intervalToggle = true;
interval = setInterval(loop, 15);
$(document).ready(function () {
    $(window).focus(function () {
        clearInterval(interval);
        if (intervalToggle) {
            interval = setInterval(loop, 15);
        }
        keyDict = {};
    }).blur(function () {
        clearInterval(interval);
    });
});

var next_drop = grav

function loop() {
    var keys = Object.keys(keyDict);
    leftRight = 0;
    var prio;
    for (var i = 0; i < keys.length; i++) {
        if (keys[i] == controls["move_left"][0] || keys[i] == controls["move_right"][0]) {
            leftRight++;
            prio = keys[i]
        }
        if (leftRight == 2) {
            if (keyDict[keys[1]][0] > keyDict[keys[0]][0]) {
                prio = keys[1]
            } else {
                prio = keys[0]
            }
        }
    }
    for (var i = 0; i < keys.length; i++) {
        if (keyDict[keys[i]] === undefined) {
            continue
        }
        if (keys[i] == controls["move_left"][0] || keys[i] == controls["move_right"][0]) {
            if (keys[i] == prio) {
                if ((((new Date().getTime() - keyDict[keys[i]][0]) >= controls.DAS) && (new Date().getTime() - keyDict[keys[i]][1]) >= controls.ARR) || keyDict[keys[i]][1] == 0) {
                    if (controls.ARR == 0 && !keyDict[keys[i]][1] == 0) {
                        for (var mov = 0; mov < matrixWidth; mov++) {
                            move(keys[i])
                        }
                    } else {
                        move(keys[i])
                    }
                    keyDict[keys[i]][1] = new Date().getTime()
                }
            }
        } else if (keys[i] != controls["softdrop"][0]) { // && keys[i] != controls["harddrop"][0]
            if (keyDict[keys[i]][1] == 0) {
                move(keys[i])
                keyDict[keys[i]][1] = new Date().getTime()
            }
        } else if (keys[i] == controls["softdrop"][0]) {
            if ((new Date().getTime() - keyDict[keys[i]][1]) >= controls.grav_ARR) {
                move(keys[i])
                keyDict[keys[i]][1] = new Date().getTime()
                next_drop = grav
            }
        }
    }
    next_drop--;
    if (next_drop <= 0) {
        next_drop = grav;
        gravity()
        graficks()
    }
}

function gravity() {
    if (collide([pieceMatrix, x, y + 1, piece])) {
        place([pieceMatrix, x, y, piece])
    } else {
        y++;
    }
    lastMoveRotate = false;
}

function rotate(matrix) {
    const n = matrix.length;
    const x = Math.floor(n / 2);
    const y = n - 1;
    for (let i = 0; i < x; i++) {
        for (let j = i; j < y - i; j++) {
            k = matrix[i][j];
            matrix[i][j] = matrix[y - j][i];
            matrix[y - j][i] = matrix[y - i][y - j];
            matrix[y - i][y - j] = matrix[j][y - i]
            matrix[j][y - i] = k
        }
    }
}

function collide(pieceData) { //pieceData = [matrix, x, y]
    for (var testY = 0; testY < pieceData[0].length; testY++) {
        for (var testX = 0; testX < pieceData[0][0].length; testX++) {
            if (pieceData[0][testY][testX] != 0 && pieceData[0][testY][testX] != 9) {
                if ((pieceData[2] + testY) >= board.length || (pieceData[1] + testX) >= board[0].length || (pieceData[2] + testY) < 0 || (pieceData[1] + testX) < 0) {
                    return true;
                }
                if (board[pieceData[2] + testY][pieceData[1] + testX] != 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function tryWallkick(prev, current) {
    if (piece == "I") {
        kicktable = i_wallkicks
    } else {
        kicktable = wallkicks
    }
    current_table = kicktable[prev.toString() + "-" + current.toString()]
    for (var i = 0; i < current_table.length; i++) {
        if (!collide([pieceMatrix, x + current_table[i][0], y - current_table[i][1], piece])) {
            if ((current_table[i][0] === -1 || current_table[i][0] === 1 || current_table[i][0] === 0) && current_table[i][1] === -2) {
                lastMoveRotate = "Force";
            } else {
                lastMoveRotate = true;
            }
            x += current_table[i][0];
            y -= current_table[i][1];
            return true
        }
    }
    return false
}

function addBag() {
    bag = [...pieces]
    bag.sort(() => Math.random() - 0.5);
    queue = queue.concat(bag)
}

function place(pieceData) { //pieceData = [pieceMatrix, x, y, piece]
    piece_stored = piece
    let filled = 0;
    let mini = 0;
    for (var testY = 0; testY < pieceData[0].length; testY++) {
        for (var testX = 0; testX < pieceData[0][0].length; testX++) {
            if (pieceData[0][testY][testX] != 0) {
                if (pieceData[0][testY][testX] != 9) {
                    board[pieceData[2] + testY][pieceData[1] + testX] = pieces.indexOf(pieceData[3]) + 1
                } else if (board[pieceData[2] + testY][pieceData[1] + testX] == 0) {
                    mini++;
                }
            }
            if (pieceData[0][testY][testX] == 0 || pieceData[0][testY][testX] == 9) {
                if (pieceData[3] == "T") {
                    if ((testY == 0 || testY == 2) && (testX == 0 || testX == 2)) {
                        if ((pieceData[2] + testY) >= board.length || (pieceData[1] + testX) >= board[0].length) {
                            filled++;
                        } else if (board[pieceData[2] + testY][pieceData[1] + testX] != 0 && board[pieceData[2] + testY][pieceData[1] + testX] != 9) {
                            filled++;
                        }
                    }
                }
            }
        }
    }
    let tspin = false
    let linesCleared = 0
    if (pieceData[3] == "T" && filled >= 3 && lastMoveRotate) {
        tspin = true;
    }
    if (lastMoveRotate == "Force") {
        mini = 0;
        console.log("cleared");
    }
    testY = matrixHeight - 1
    temp_board = JSON.parse(JSON.stringify(board));
    while (testY > 0) {
        for (var i = 0; i < matrixWidth; i++) {
            if (temp_board[testY][i] == 0) {
                break
            }
            if (i == matrixWidth - 1) {
                board.splice(testY, 1);
                linesCleared += 1;
            }
        }
        testY--;
    }
    while (board.length < matrixHeight) {
        board.unshift([...empty_line])
    }
    if (linesCleared == 0) {
        if (tspin == true) {
            if (mini == 0) {
                console.log("t_spin")
            } else {
                console.log("t_spin_mini")
            }
        }
    }
    if (linesCleared != 0) {
        combo++;
        if (combo < combo_table.length) {
            lines_sent += combo_table[combo]
        }
        if (linesCleared == 1) {
            if (tspin == true) {
                if (b2b == true) {
                    lines_sent += 1;
                }
                if (mini == 0) {
                    lines_sent += 2;
                } else {
                }
                b2b = true;
            } else {
                b2b = false;
            }
        } else if (linesCleared == 2) {
            if (tspin == true) {
                if (b2b == true) {
                    lines_sent += 1;
                }
                if (mini == 0) {
                    lines_sent += 4;
                } else {
                    lines_sent += 1;
                }
                b2b = true;
            } else {
                b2b = false;
                lines_sent++;
            }
        } else if (linesCleared == 3) {
            if (tspin == true) {
                if (b2b == true) {
                    lines_sent += 1;
                }
                lines_sent += 6;
                b2b = true;
            } else {
                b2b = false;
                lines_sent += 2;
            }
        } else if (linesCleared == 4) {
            if (b2b == true) {
                lines_sent += 1;
            }
            lines_sent += 4;
            b2b = true;
        }
        pcY = matrixHeight - 1;
        let pc = true
        while (pcY > 0) {
            for (var i = 0; i < matrixWidth; i++) {
                if (board[pcY][i] != 0) {
                    pc = false
                    break
                }
            }
            pcY--;
        }
        if (pc) {
            lines_sent += 10;
        }
    } else {
        combo = 0;
    }

    if (queue.length < 10) {
        addBag()
    }
    piece = queue.shift();
    blockInit()
    canHold = true
    pieceMatrix = JSON.parse(JSON.stringify(piece_matrix[piece]));
    if (keyDict[controls["softdrop"][0]]) {
        keyDict[controls['softdrop'][0]][1] = new Date().getTime() + 1000
    }
    if (collide([pieceMatrix, x, y, piece])) {
        gameOver()
        return
    }
}

function graficks() { //#909090   
    
    if(linesSentText){
        document.getElementById("lines_sent").innerText=lines_sent;
    }

    boardContext.clearRect(0, 0, boardWidth, boardHeight);
    if (useBg) {
        boardContext.drawImage(bg, 0, 0, bgWidth, boardHeight);
    } else {
        boardContext.fillStyle = "#000000";
        boardContext.fillRect(0, 0, boardWidth, boardHeight);
    }

    // Generate Ghost piece
    boardContext.globalAlpha = 0.3;
    ghostY = y
    while (!collide([pieceMatrix, x, ghostY + 1, piece])) {
        ghostY++;
    }
    for (var testY = 0; testY < pieceMatrix.length; testY++) {
        for (var testX = 0; testX < pieceMatrix[0].length; testX++) {
            if (pieceMatrix[testY][testX] != 0 && pieceMatrix[testY][testX] != 9) {
                if (useSkin) {
                    boardContext.drawImage(skin, skinSize * (pieceMatrix[testY][testX] + 1), 0, skinSize, skinSize, (testX + x) * ratioWidth, (testY + ghostY) * ratioHeight, ratioWidth, ratioHeight);
                } else {
                    boardContext.fillStyle = "#202020";
                    boardContext.fillRect((testX + x) * ratioWidth, (testY + ghostY) * ratioHeight, ratioWidth, ratioHeight)
                }
            }
        }
    }
    boardContext.globalAlpha = 1;

    // Generate Current piece
    for (var testY = 0; testY < pieceMatrix.length; testY++) {
        for (var testX = 0; testX < pieceMatrix[0].length; testX++) {
            if (pieceMatrix[testY][testX] != 0 && pieceMatrix[testY][testX] != 9) {
                if (useSkin) {
                    boardContext.drawImage(skin, skinSize * (pieceMatrix[testY][testX] + 1), 0, skinSize, skinSize, (testX + x) * ratioWidth, (testY + y) * ratioHeight, ratioWidth, ratioHeight);
                } else {
                    boardContext.fillStyle = colors[pieceMatrix[testY][testX]];
                    boardContext.fillRect((testX + x) * ratioWidth, (testY + y) * ratioHeight, ratioWidth, ratioHeight)
                }
            }
        }
    }

    // Generate Board
    for (var pixelY = 0; pixelY < board.length; pixelY++) {
        for (var pixelX = 0; pixelX < board.length; pixelX++) {
            if (board[pixelY][pixelX] != 0) {
                if (useSkin) {
                    boardContext.drawImage(skin, skinSize * (board[pixelY][pixelX] + 1), 0, skinSize, skinSize, pixelX * ratioWidth, pixelY * ratioHeight, ratioWidth, ratioHeight);
                } else {
                    boardContext.fillStyle = colors[board[pixelY][pixelX]];
                    boardContext.fillRect(pixelX * ratioWidth, pixelY * ratioHeight, ratioWidth, ratioHeight)
                }
                // boardContext.drawImage(blocks, 30 * (board[pixelY][pixelX] + 1) + 1, 0, 30, 30, pixelX * 30, pixelY * 30, 30, 30);

            }
        }
    }

    // Generates Queue
    queueContext.clearRect(0, 0, queueWidth, queueHeight);
    for (var q = 0; q < 6; q++) {
        for (var queueY = 0; queueY < piece_matrix[queue[q]].length; queueY++) {
            for (var queueX = 0; queueX < piece_matrix[queue[q]][0].length; queueX++) {
                if (piece_matrix[queue[q]][queueY][queueX] != 0 && piece_matrix[queue[q]][queueY][queueX] != 9) {
                    color = piece_matrix[queue[q]][queueY][queueX]
                    tempRatioX = ratioQueueWidth * 4
                    tempRatioY = ratioQueueHeight * 4
                    x_displace = 0
                    y_displace = 0
                    if (queue[q] == "I" || queue[q] == "O") {
                        tempRatioX = ratioQueueWidth * 3
                        tempRatioY = ratioQueueHeight * 3
                        if (queue[q] == "O") {
                            x_displace = 1
                            y_displace = 1
                        }
                    }

                    if (useSkin) {
                        queueContext.drawImage(skin, skinSize * (color + 1), 0, skinSize, skinSize, (queueX + x_displace) * tempRatioX, (queueY + y_displace) * tempRatioY + (ratioQueueHeight * 12) * q, tempRatioX, tempRatioY)
                    } else {
                        queueContext.fillStyle = colors[color];
                        queueContext.fillRect((queueX + x_displace) * tempRatioX, (queueY + y_displace) * tempRatioY + (ratioQueueHeight * 12) * q, tempRatioX, tempRatioY)
                    }
                }
            }
        }
    }

    // Generates Held
    if (held) {
        heldContext.clearRect(0, 0, heldWidth, heldHeight);
        for (var queueY = 0; queueY < piece_matrix[held].length; queueY++) {
            for (var queueX = 0; queueX < piece_matrix[held][0].length; queueX++) {
                if (piece_matrix[held][queueY][queueX] != 0 && piece_matrix[held][queueY][queueX] != 9) {
                    tempRatioX = ratioQueueWidth * 4
                    tempRatioY = ratioQueueHeight * 4
                    x_displace = 0
                    y_displace = 0
                    if (held == "I" || held == "O") {
                        tempRatioX = ratioQueueWidth * 3
                        tempRatioY = ratioQueueHeight * 3
                        if (held == "O") {
                            x_displace = 1
                            y_displace = 1
                        }
                    }
                    color = piece_matrix[held][queueY][queueX]

                    if (useSkin) {
                        heldContext.drawImage(skin, skinSize * (color + 1), 0, skinSize, skinSize, (queueX + x_displace) * tempRatioX, (queueY + y_displace) * tempRatioY, tempRatioX, tempRatioY)
                    } else {
                        heldContext.fillStyle = colors[color];
                        heldContext.fillRect((queueX + x_displace) * tempRatioX, (queueY + y_displace) * tempRatioY, tempRatioX, tempRatioY)
                    }
                }
            }
        }
    }
}

function gameOver() {
    console.log("Game over, restarting.");
    init()
}

function move(key) {
    var keys = Object.keys(controls);
    for (var i = 0; i < keys.length; i++) {
        if (controls[keys[i]][0] == parseInt(key)) {
            move_type = keys[i]
            eval(move_type + "()")
            pieceMatrix = JSON.parse(JSON.stringify(piece_matrix[piece]));
            for (var j = 0; j < rotation; j++) {
                rotate(pieceMatrix)
            }
            graficks()
        }
    }

    function clockwise() {
        if (rotation < 3) {
            rotation++;
        } else {
            rotation = 0;
        }
    }

    function counterclockwise() {
        if (rotation > 0) {
            rotation--;
        } else {
            rotation = 3;
        }
    }

    function hold() {
        if (!canHold) {
            return
        }
        if (held == null || held == 0) {
            held = piece;
            piece = queue.shift();
            if (queue.length < 10) {
                addBag()
            }
        } else {
            [held, piece] = [piece, held];
        }
        canHold = false
        blockInit()
    }

    function softdrop() {
        if (controls.grav_ARR == 0) {
            while (!collide([pieceMatrix, x, y + 1, piece])) {
                y++;
                lastMoveRotate = false;
            }
        } else if (!collide([pieceMatrix, x, y + 1, piece])) {
            y++;
            lastMoveRotate = false;
        }
    }

    function move_right() {
        if (!collide([pieceMatrix, x + 1, y, piece])) {
            x++;
            lastMoveRotate = false;
        }
    }
    function move_left() {
        if (!collide([pieceMatrix, x - 1, y, piece])) {
            x--;
            lastMoveRotate = false;
        }
    }
    function rotate_left() {
        old_rotation = rotation
        counterclockwise()
        pieceMatrix = JSON.parse(JSON.stringify(piece_matrix[piece]));
        for (var j = 0; j < rotation; j++) {
            rotate(pieceMatrix)
        }
        if (!tryWallkick(old_rotation, rotation)) {
            clockwise()
        }
        console.log(rotation);
    }
    function rotate_right() {
        old_rotation = rotation
        clockwise()
        pieceMatrix = JSON.parse(JSON.stringify(piece_matrix[piece]));
        for (var j = 0; j < rotation; j++) {
            rotate(pieceMatrix)
        }
        if (!tryWallkick(old_rotation, rotation)) {
            counterclockwise()
        }
        console.log(rotation);
    }
    function harddrop() {
        let dropY = y;
        while (!collide([pieceMatrix, x, dropY + 1, piece])) {
            dropY++;
            lastMoveRotate = false;
        }
        place([pieceMatrix, x, dropY, piece])
        lastMoveRotate = false;
    }
}

function blockInit() {
    if (piece == "O") {
        x = parseInt((matrixWidth / 2) - 1)
    } else if (piece == "I") {
        x = parseInt((matrixWidth / 2) - 2)
    } else {
        x = parseInt((matrixWidth / 2) - 1.5)
    }
    y = 0
    rotation = 0;
}

function init() {
    canHold = true
    board = []
    while (board.length < matrixHeight) {
        board.unshift([...empty_line])
    }
    combo = 0;
    queue = [];
    addBag()
    piece = queue.shift();
    held = null;
    blockInit()
    lastMoveRotate = false;
    b2b = false;
    pieceMatrix = JSON.parse(JSON.stringify(piece_matrix[piece]));
    lines_sent = 0;
    graficks()
}

var board
var combo
var queue
var piece
var held
var y
var rotation
var lastMoveRotate
var b2b
var lines_sent
var canHold
init()