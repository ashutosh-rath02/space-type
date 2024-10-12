const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const livesElement = document.getElementById("lives");
const scoreElement = document.getElementById("score");
const inputDisplay = document.getElementById("inputDisplay");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreElement = document.getElementById("finalScore");
const wordsTypedElement = document.getElementById("wordsTyped");
const typingSpeedElement = document.getElementById("typingSpeed");
const accuracyElement = document.getElementById("accuracy");

let aliens = [];
let stars = [];
let lives = 3;
let score = 0;
let currentInput = "";
let gameOver = false;
let lastSpawnTime = 0;
let gameTime = 0;
let gameStarted = false;
let wordsTyped = 0;
let totalKeystrokes = 0;
let correctKeystrokes = 0;
let maxAliens = 5;
const MAX_GAME_TIME = 2 * 60 * 1000;

let words = [];

function updateMaxAliens(elapsedTime) {
  maxAliens = Math.min(15, Math.floor(5 + (elapsedTime / MAX_GAME_TIME) * 10));
}

async function fetchWords(count = 100) {
  try {
    const response = await fetch(
      `https://random-word-api.vercel.app/api?words=${count}`
    );
    words = await response.json();
  } catch (error) {
    console.error("Error fetching words:", error);
    words = [
      "alien",
      "invader",
      "space",
      "galaxy",
      "cosmic",
      "nebula",
      "star",
      "meteor",
      "planet",
      "ufo",
    ];
  }
}

class Alien {
  constructor() {
    this.angle = ((Math.random() * 120 + 30) * Math.PI) / 180;
    this.radius = Math.random() * (canvas.width / 2 - 50) + 50;
    this.x = canvas.width / 2 + Math.cos(this.angle) * this.radius;
    this.y = Math.sin(this.angle) * this.radius;
    this.baseSpeed = 0.2;
    this.speed = this.baseSpeed;
    this.word = words[Math.floor(Math.random() * words.length)];
    this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    this.size = 30;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    this.pulsePhase += 0.1;
    const pulseFactor = 1 + Math.sin(this.pulsePhase) * 0.1;

    // Alien body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -this.size * pulseFactor);
    ctx.lineTo(-this.size * pulseFactor, this.size * pulseFactor);
    ctx.lineTo(this.size * pulseFactor, this.size * pulseFactor);
    ctx.closePath();
    ctx.fill();

    // Alien eyes
    const eyeSize = this.size / 5;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(-this.size / 3, -this.size / 3, eyeSize, 0, Math.PI * 2);
    ctx.arc(this.size / 3, -this.size / 3, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Alien mouth
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.size / 2, 0, Math.PI);
    ctx.stroke();

    // Glow effect
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Word
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Orbitron";
    ctx.textAlign = "center";
    ctx.fillText(this.word, 0, this.size + 25);

    ctx.restore();
  }

  update(elapsedTime) {
    const dx = canvas.width / 2 - this.x;
    const dy = canvas.height - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.speed = this.baseSpeed + Math.min((elapsedTime / 60000) * 0.1, 0.3);

    this.x += (dx / distance) * this.speed;
    this.y += (dy / distance) * this.speed;

    if (distance < 40) {
      lives--;
      livesElement.textContent = lives;
      return true;
    }
    return false;
  }
}

class Star {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2;
    this.speed = Math.random() * 0.5 + 0.1;
    this.brightness = Math.random();
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness})`;
    ctx.fill();
  }

  update() {
    this.y += this.speed;
    this.brightness = Math.sin((Date.now() / 1000) * this.speed) * 0.5 + 0.5;
    if (this.y > canvas.height) {
      this.y = 0;
      this.x = Math.random() * canvas.width;
    }
  }
}

function initStars() {
  for (let i = 0; i < 100; i++) {
    stars.push(new Star());
  }
}

function spawnAlien(currentTime) {
  const elapsedTime = currentTime - gameTime;
  updateMaxAliens(elapsedTime);
  const spawnInterval = Math.max(2000 - elapsedTime / 100, 500);
  if (
    currentTime - lastSpawnTime > spawnInterval &&
    aliens.length < maxAliens
  ) {
    const newAlien = new Alien();

    const overlap = aliens.some((alien) => {
      const dx = newAlien.x - alien.x;
      const dy = newAlien.y - alien.y;
      return Math.sqrt(dx * dx + dy * dy) < 100;
    });

    if (!overlap) {
      aliens.push(newAlien);
      lastSpawnTime = currentTime;
    }
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#000033");
  gradient.addColorStop(1, "#000011");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  stars.forEach((star) => {
    star.draw();
    star.update();
  });
}

function drawPlayer() {
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height - 40);

  ctx.fillStyle = "#0f0";
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(-25, 30);
  ctx.lineTo(25, 30);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#00f";
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = "#0f0";
  ctx.shadowBlur = 20;
  ctx.strokeStyle = "#0f0";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

function updateUI() {
  ctx.fillStyle = "#fff";
  ctx.font = "18px Orbitron";
}

function gameLoop(currentTime) {
  if (gameOver || !gameStarted) return;

  const elapsedTime = currentTime - gameTime;
  drawBackground();
  drawPlayer();
  spawnAlien(currentTime);

  for (let i = aliens.length - 1; i >= 0; i--) {
    aliens[i].draw();
    if (aliens[i].update(elapsedTime)) {
      aliens.splice(i, 1);
    }
  }

  updateUI();

  if (lives > 0) {
    requestAnimationFrame(gameLoop);
  } else {
    endGame();
  }
}

function checkInput() {
  let matchFound = false;
  for (let i = 0; i < aliens.length; i++) {
    if (aliens[i].word === currentInput) {
      matchFound = true;
      inputDisplay.style.color = "#0f0";
      score += currentInput.length * 10;
      scoreElement.textContent = score;
      wordsTyped++;
      correctKeystrokes += currentInput.length;
      aliens.splice(i, 1);
      currentInput = "";
      break;
    } else if (aliens[i].word.startsWith(currentInput)) {
      matchFound = true;
      inputDisplay.style.color = "#0f0";
      break;
    }
  }

  if (!matchFound) {
    inputDisplay.style.color = "#f00";
  }

  inputDisplay.textContent = currentInput;
  inputDisplay.textContent = currentInput;
}

function endGame() {
  gameOver = true;
  const gameDuration = (performance.now() - gameTime) / 60000;
  const wpm = Math.round(wordsTyped / gameDuration);
  const accuracy = Math.round((correctKeystrokes / totalKeystrokes) * 100) || 0;

  finalScoreElement.textContent = score;
  wordsTypedElement.textContent = wordsTyped;
  typingSpeedElement.textContent = wpm;
  accuracyElement.textContent = accuracy;

  canvas.style.filter = "blur(5px)";
  gameOverScreen.style.display = "flex";
  restartButton.style.display = "block";
}

async function startGame() {
  await fetchWords();
  gameStarted = true;
  gameTime = performance.now();
  startButton.style.display = "none";
  requestAnimationFrame(gameLoop);
}

function restartGame() {
  aliens = [];
  lives = 3;
  score = 0;
  currentInput = "";
  gameOver = false;
  lastSpawnTime = 0;
  gameTime = performance.now();
  wordsTyped = 0;
  totalKeystrokes = 0;
  correctKeystrokes = 0;
  maxAliens = 5;
  livesElement.textContent = lives;
  scoreElement.textContent = score;
  inputDisplay.textContent = "";
  restartButton.style.display = "none";
  gameOverScreen.style.display = "none";
  canvas.style.filter = "none";
  gameStarted = true;
  fetchWords().then(() => {
    requestAnimationFrame(gameLoop);
  });
}

document.addEventListener("keydown", (e) => {
  if (gameOver || !gameStarted) return;
  if (e.key === "Backspace") {
    currentInput = currentInput.slice(0, -1);
  } else if (e.key.length === 1) {
    currentInput += e.key.toLowerCase();
    totalKeystrokes++;
  }
  checkInput();
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);

fetchWords().then(() => {
  initStars();
  drawBackground();
  drawPlayer();
});
