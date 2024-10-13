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
    this.size = 40;
    this.animationOffset = Math.random() * Math.PI * 2;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Body
    const bodyGradient = ctx.createLinearGradient(
      -this.size / 2,
      -this.size / 2,
      this.size / 2,
      this.size / 2
    );
    bodyGradient.addColorStop(0, this.color);
    bodyGradient.addColorStop(1, this.darkenColor(this.color, 30));
    ctx.fillStyle = bodyGradient;

    ctx.beginPath();
    ctx.moveTo(-this.size / 2, -this.size / 2);
    ctx.lineTo(this.size / 2, -this.size / 2);
    ctx.lineTo(this.size / 2, this.size / 2);
    ctx.lineTo(-this.size / 2, this.size / 2);
    ctx.closePath();
    ctx.fill();

    // 3D effect for body edges
    ctx.strokeStyle = this.darkenColor(this.color, 50);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eyes
    const eyeGradient = ctx.createRadialGradient(
      -this.size / 4,
      -this.size / 4,
      0,
      -this.size / 4,
      -this.size / 4,
      this.size / 6
    );
    eyeGradient.addColorStop(0, "white");
    eyeGradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");

    ctx.fillStyle = eyeGradient;
    this.drawEye(-this.size / 4, -this.size / 5, this.size / 6);
    this.drawEye(this.size / 4, -this.size / 5, this.size / 6);

    // Antenna
    const antennaY = Math.sin(Date.now() / 200 + this.animationOffset) * 2;
    ctx.fillStyle = this.lightenColor(this.color, 20);
    this.drawAntenna(
      -this.size / 4,
      -this.size / 2 + antennaY,
      this.size / 8,
      this.size / 4
    );
    this.drawAntenna(
      this.size / 4,
      -this.size / 2 + antennaY,
      this.size / 8,
      this.size / 4
    );

    // Arms
    ctx.fillStyle = this.darkenColor(this.color, 20);
    this.drawArm(-this.size / 2, 0, this.size / 4, this.size / 2);
    this.drawArm(
      this.size / 2 - this.size / 4,
      0,
      this.size / 4,
      this.size / 2
    );

    // Word
    ctx.fillStyle = "white";
    ctx.font = "bold 14px Orbitron";
    ctx.textAlign = "center";
    ctx.fillText(this.word, 0, this.size + 15);

    ctx.restore();
  }

  drawEye(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlight
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x - size / 4, y - size / 4, size / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawAntenna(x, y, width, height) {
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, this.lightenColor(this.color, 30));
    gradient.addColorStop(1, this.darkenColor(this.color, 10));
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width / 2, y + height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this.darkenColor(this.color, 30);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawArm(x, y, width, height) {
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, this.lightenColor(this.color, 10));
    gradient.addColorStop(1, this.darkenColor(this.color, 30));
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this.darkenColor(this.color, 50);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  lightenColor(color, percent) {
    return this.shadeColor(color, percent);
  }

  darkenColor(color, percent) {
    return this.shadeColor(color, -percent);
  }

  shadeColor(color, percent) {
    const num = parseInt(color.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return `#${(
      (1 << 24) |
      ((R < 255 ? (R < 1 ? 0 : R) : 255) << 16) |
      ((G < 255 ? (G < 1 ? 0 : G) : 255) << 8) |
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)}`;
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
  ctx.translate(canvas.width / 2, canvas.height - 60);

  // Player ship body
  const shipGradient = ctx.createLinearGradient(0, -30, 0, 30);
  shipGradient.addColorStop(0, "#4CAF50");
  shipGradient.addColorStop(1, "#1B5E20");

  ctx.fillStyle = shipGradient;
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(-25, 30);
  ctx.lineTo(25, 30);
  ctx.closePath();
  ctx.fill();

  // Cockpit
  const cockpitGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
  cockpitGradient.addColorStop(0, "#81D4FA");
  cockpitGradient.addColorStop(1, "#01579B");

  ctx.fillStyle = cockpitGradient;
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();

  // Glow effect
  ctx.shadowColor = "#4CAF50";
  ctx.shadowBlur = 20;
  ctx.strokeStyle = "#81C784";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Engines
  ctx.fillStyle = "#FF9800";
  ctx.beginPath();
  ctx.moveTo(-15, 30);
  ctx.lineTo(-10, 40);
  ctx.lineTo(-5, 30);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(5, 30);
  ctx.lineTo(10, 40);
  ctx.lineTo(15, 30);
  ctx.fill();

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
    console.log("Lives reached zero");
    endGame();
  }
}

const backgroundMusic = document.getElementById("backgroundMusic");
backgroundMusic.volume = 0.2;
const muteButton = document.getElementById("muteButton");
let isMuted = false;

function toggleMute() {
  isMuted = !isMuted;
  backgroundMusic.muted = isMuted;
  muteButton.textContent = isMuted ? "🔇" : "🔊";
}

muteButton.addEventListener("click", toggleMute);

backgroundMusic.play();

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

function shareOnTwitter() {
  const wpm = Math.round(wordsTyped / ((performance.now() - gameTime) / 60000));
  const accuracy = Math.round((correctKeystrokes / totalKeystrokes) * 100) || 0;

  const tweetText = encodeURIComponent(
    `🚀 Just saved Earth in Alien Typing Game! 👾\n` +
      `Score: ${score} | Words: ${wordsTyped}\n` +
      `Speed: ${wpm} WPM | Accuracy: ${accuracy}%\n` +
      `Can you defend the planet? #spacetype`
  );
  const gameUrl = encodeURIComponent("https://spacetype.ashutoshrath.me");

  const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${gameUrl}`;
  window.open(twitterUrl, "_blank");
}

function calculateWPM(totalCharacters, errorCharacters, timeInMinutes) {
  const grossWPM = totalCharacters / 5 / timeInMinutes;
  const netWPM = (totalCharacters / 5 - errorCharacters) / timeInMinutes;
  return Math.max(0, Math.round(netWPM));
}

function endGame() {
  gameOver = true;
  const timeInMinutes = (performance.now() - gameTime) / 60000;
  const wpm = Math.round(wordsTyped / timeInMinutes);
  const accuracy = Math.round((correctKeystrokes / totalKeystrokes) * 100) || 0;

  finalScoreElement.textContent = score;
  wordsTypedElement.textContent = wordsTyped;
  typingSpeedElement.textContent = wpm;
  accuracyElement.textContent = accuracy;

  canvas.style.filter = "blur(5px)";
  gameOverScreen.style.display = "flex";
  restartButton.style.display = "block";

  // Add share button
  const shareButton = document.createElement("button");
  shareButton.textContent = "Share on Twitter";
  shareButton.classList.add("button");
  shareButton.style.marginTop = "10px";
  shareButton.addEventListener("click", shareOnTwitter);
  gameOverScreen.appendChild(shareButton);

  // Log to console for debugging
  console.log("Game Over triggered");
}

let introComplete = false;

function startIntro() {
  const introScreen = document.getElementById("introScreen");
  const startButton = document.getElementById("startButton");

  introScreen.style.display = "flex";
  startButton.style.display = "block";
  introComplete = true;
}

async function startGame() {
  if (!introComplete) return;

  const introScreen = document.getElementById("introScreen");
  const startButton = document.getElementById("startButton");

  introScreen.style.display = "none";
  startButton.style.opacity = "0";
  startButton.style.pointerEvents = "none";

  await fetchWords();
  gameStarted = true;
  gameTime = performance.now();
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

function createBackgroundElements() {
  const container = document.getElementById("backgroundElements");
  const elements = ["🚀", "👽", "🌎", "🌟", "🛸"];

  for (let i = 0; i < 50; i++) {
    const element = document.createElement("div");
    element.className = "bg-element";
    element.textContent = elements[Math.floor(Math.random() * elements.length)];
    element.style.left = `${Math.random() * 100}%`;
    element.style.top = `${Math.random() * 100}%`;
    element.style.fontSize = `${Math.random() * 20 + 10}px`;
    element.style.animationDuration = `${Math.random() * 10 + 10}s`;
    container.appendChild(element);
  }
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);
window.addEventListener("load", createBackgroundElements);
window.addEventListener("load", startIntro);

fetchWords().then(() => {
  initStars();
  drawBackground();
  drawPlayer();
});
