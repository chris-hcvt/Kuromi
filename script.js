const kuromiElement = document.getElementById('kuromi');
const gameContainer = document.getElementById('game-container');
const obstacleContainer = document.getElementById('obstacle-container');
const scoreBoard = document.getElementById('score-board');
const gameOverScreen = document.getElementById('game-over');
const startScreen = document.getElementById('start-screen');
const restartBtn = document.getElementById('restart-btn');
const finalScoreSpan = document.getElementById('final-score');

// Game constants
const GRAVITY = 0.4;
const JUMP_STRENGTH = -7;
const OBSTACLE_SPEED = 2.5;
const SPAWN_RATE = 1500; // ms
const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const KUROMI_SIZE = 40; // Collision box approx

// State
let kuromiY = 300;
let velocity = 0;
let score = 0;
let isGameOver = false;
let isGameRunning = false;
let animationFrameId;
let spawnInterval;
let obstacles = [];

// Input
// Input
function jump(e) {
    if (e.type === 'keydown') {
        if (e.code !== 'Space') return;
    }

    // Ignore clicks on buttons (like restart)
    if (e.target.closest('button')) return;

    // For pointer events, prevent default to stop scrolling/highlighting logic conflicts
    if (e.type === 'pointerdown') {
        e.preventDefault();
    }

    if (!isGameRunning && !isGameOver) {
        startGame();
    } else if (isGameRunning) {
        velocity = JUMP_STRENGTH;
    }
}

document.addEventListener('keydown', jump);
document.addEventListener('pointerdown', jump);
restartBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetGame();
});

function startGame() {
    isGameRunning = true;
    startScreen.classList.add('hidden');
    loop();
    spawnInterval = setInterval(spawnObstacle, SPAWN_RATE);
}

function resetGame() {
    isGameOver = false;
    isGameRunning = false;

    // Reset positions
    kuromiY = 300;
    velocity = 0;
    score = 0;
    scoreBoard.innerText = '0';
    kuromiElement.style.top = kuromiY + 'px';
    kuromiElement.style.transform = `rotate(0deg)`;

    // Clear obstacles
    obstacleContainer.innerHTML = '';
    obstacles = [];

    // UI
    gameOverScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (spawnInterval) clearInterval(spawnInterval);
}

function spawnObstacle() {
    if (!isGameRunning) return;

    const gapHeight = 160;
    const minPipeHeight = 50;
    const maxPipeHeight = GAME_HEIGHT - gapHeight - minPipeHeight - 50; // -50 margin
    const topHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;

    const topPipe = document.createElement('div');
    topPipe.classList.add('obstacle', 'top');
    topPipe.style.height = topHeight + 'px';
    topPipe.style.left = GAME_WIDTH + 'px';

    const bottomPipe = document.createElement('div');
    bottomPipe.classList.add('obstacle', 'bottom');
    bottomPipe.style.height = (GAME_HEIGHT - gapHeight - topHeight) + 'px';
    bottomPipe.style.left = GAME_WIDTH + 'px';

    obstacleContainer.appendChild(topPipe);
    obstacleContainer.appendChild(bottomPipe);

    obstacles.push({
        topElement: topPipe,
        bottomElement: bottomPipe,
        x: GAME_WIDTH,
        passed: false
    });
}

function loop() {
    if (!isGameRunning) return;

    // Physics
    velocity += GRAVITY;
    kuromiY += velocity;

    // Clamp to floor/ceiling
    if (kuromiY > GAME_HEIGHT - KUROMI_SIZE) {
        endGame();
        return;
    }
    if (kuromiY < 0) {
        kuromiY = 0;
        velocity = 0;
    }

    // Apply specific Visuals
    kuromiElement.style.top = kuromiY + 'px';

    // Rotate checks
    let rotation = Math.min(Math.max(velocity * 3, -25), 90);
    kuromiElement.style.transform = `rotate(${rotation}deg)`;

    // Obstacles
    const playerRect = kuromiElement.getBoundingClientRect();

    // To safe-guard against large arrays
    if (obstacles.length > 5) {
        // remove first if offscreen
        if (obstacles[0].x < -60) {
            obstacles[0].topElement.remove();
            obstacles[0].bottomElement.remove();
            obstacles.shift();
        }
    }

    obstacles.forEach(obs => {
        obs.x -= OBSTACLE_SPEED;
        obs.topElement.style.left = obs.x + 'px';
        obs.bottomElement.style.left = obs.x + 'px';

        // Collision Logic
        // We use getBoundingClientRect for precise DOM logic
        const topRect = obs.topElement.getBoundingClientRect();
        const botRect = obs.bottomElement.getBoundingClientRect();

        // Shrink player hit box slightly for fairness
        const hitMargin = 10;
        const playerHit = {
            top: playerRect.top + hitMargin,
            bottom: playerRect.bottom - hitMargin,
            left: playerRect.left + hitMargin,
            right: playerRect.right - hitMargin
        };

        if (
            (playerHit.right > topRect.left && playerHit.left < topRect.right && playerHit.top < topRect.bottom) ||
            (playerHit.right > botRect.left && playerHit.left < botRect.right && playerHit.bottom > botRect.top)
        ) {
            endGame();
        }

        // Score
        if (obs.x + 50 < playerHit.left && !obs.passed) {
            score++;
            scoreBoard.innerText = score;
            obs.passed = true;
        }
    });

    animationFrameId = requestAnimationFrame(loop);
}

function endGame() {
    isGameRunning = false;
    isGameOver = true;
    finalScoreSpan.innerText = score;
    gameOverScreen.classList.remove('hidden');
    clearInterval(spawnInterval);
}

// Init
resetGame();
