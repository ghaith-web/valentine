const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameState = 'START'; // START, PLAYING, WON, PROPOSAL, END
let score = 0;
const WIN_SCORE = 10; // Hearts needed to fill the meter
let player;
let hearts = [];
let particles = []; // For effects
let animationId;
let loveMeter = document.getElementById('love-fill');
let encouragementMessage = document.getElementById('encouragement-message');
let lastMessageScore = -1;

// Toggle: true = skip love meter and go directly to proposal, false = play the game
const SKIP_LOVE_METER = false;

const encouragementMessages = [
    "Lem le9loub haya ! 💕",
    "Fa5our bik enii ! 🌟",
    "Hayya! Mazelit haja okhra testana fik baed hadha! 🏃‍♀️",
    "9rib 9rib ! Keep going! ✨",
    "Haya ya rouhi ! You can do it! 💪",
    "So close to my heart! 💗",
    "Rakez haya! 🎯",
    "Don't stop now! 🔥",
    "Nestana fik haya! 💝",
    "Wselna wselna mommy ! 🌹"
];
const startScreen = document.getElementById('start-screen');
const proposalScreen = document.getElementById('proposal-screen');
const celebrationScreen = document.getElementById('celebration-screen');
const startBtn = document.getElementById('start-btn');
const yesBtn = document.getElementById('yes-btn');
const noBtn = document.getElementById('no-btn');

let noBtnFirstHover = true;
let noBtnClickCount = 0;

const noBtnMessages = [
    "Nzelit ala Laley normal ? 🤨",
    "Chada s7i7 ya3ni ? 😢",
    "Zid khamem ! 💔",
    "A5er forsa bech tbadel rayek! 🥺",
    "Walahiii tawa nched nkawer bik !! jebtha el rouhek ay! 🏃‍♀️"
];

// Resize Handling
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (player) {
         player.y = canvas.height - 100;
    }
}
window.addEventListener('resize', resize);

// Player Object
class Player {
    constructor() {
        this.w = 100; // width
        this.h = 80;  // height
        this.x = canvas.width / 2 - this.w / 2;
        this.y = canvas.height - 100;
        this.speed = 10;
        this.dx = 0;
    }

    draw() {
        // Draw a cute basket or cup (using simple shapes for now, can be improved or replaced with image)
        ctx.fillStyle = '#ff4d6d';
        
        // Simple semi-circle basket
        ctx.beginPath();
        ctx.arc(this.x + this.w/2, this.y, this.w/2, 0, Math.PI, false);
        ctx.fill();
        
        // Handle
        ctx.beginPath();
        ctx.strokeStyle = '#c9184a';
        ctx.lineWidth = 5;
        ctx.arc(this.x + this.w/2, this.y - 10, this.w/2, Math.PI, 0, false);
        ctx.stroke();
    }

    update() {
        this.x += this.dx;
        
        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;
    }
}

// Heart Object
class Heart {
    constructor() {
        this.size = Math.random() * 20 + 20; // 20-40px
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -this.size;
        this.speed = Math.random() * 3 + 2; // 2-5 speed
        this.color = `hsl(${Math.random() * 20 + 340}, 100%, 60%)`; // Pinkish/Red variations
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        let topCurveHeight = this.size * 0.3;
        ctx.moveTo(this.x, this.y + topCurveHeight);
        // top left curve
        ctx.bezierCurveTo(
            this.x, this.y, 
            this.x - this.size / 2, this.y, 
            this.x - this.size / 2, this.y + topCurveHeight
        );
        // bottom left curve
        ctx.bezierCurveTo(
            this.x - this.size / 2, this.y + (this.size + topCurveHeight) / 2, 
            this.x, this.y + (this.size + topCurveHeight) / 2, 
            this.x, this.y + this.size
        );
        // bottom right curve
        ctx.bezierCurveTo(
            this.x, this.y + (this.size + topCurveHeight) / 2, 
            this.x + this.size / 2, this.y + (this.size + topCurveHeight) / 2, 
            this.x + this.size / 2, this.y + topCurveHeight
        );
        // top right curve
        ctx.bezierCurveTo(
            this.x + this.size / 2, this.y, 
            this.x, this.y, 
            this.x, this.y + topCurveHeight
        );
        ctx.fill();
    }

    update() {
        this.y += this.speed;
    }
}

// Particle Effect
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2;
        this.speedX = (Math.random() - 0.5) * 4;
        this.speedY = (Math.random() - 0.5) * 4;
        this.life = 100;
        this.color = `rgba(255, 255, 255, 0.8)`;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 2;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / 100;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Input Handling
function handleInput(e) {
    if (!player) return;
    
    // Mouse / Touch
    if (e.type === 'mousemove' || e.type === 'touchmove') {
        const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        player.x = clientX - player.w / 2;
    }
}

window.addEventListener('mousemove', handleInput);
window.addEventListener('touchmove', handleInput, { passive: false });

// Game Functions
function spawnHeart() {
    if (Math.random() < 0.02) {
        hearts.push(new Heart());
    }
}

function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    if (gameState === 'PLAYING') {
        player.update();
        player.draw();

        spawnHeart();

        hearts.forEach((heart, index) => {
            heart.update();
            heart.draw();

            // Collision Detection
            // Simple box-ish collision for now
            if (
                heart.y + heart.size > player.y &&
                heart.x > player.x &&
                heart.x < player.x + player.w
            ) {
                // Catch!
                hearts.splice(index, 1);
                score++;
                createParticles(heart.x, heart.y);
                updateScore();
                
                if (score >= WIN_SCORE) {
                    triggerProposal();
                }
            } else if (heart.y > canvas.height) {
                hearts.splice(index, 1); // Missed
            }
        });

        particles.forEach((p, idx) => {
            p.update();
            p.draw();
            if (p.life <= 0) particles.splice(idx, 1);
        });
    }

    animationId = requestAnimationFrame(updateGame);
}

function createParticles(x, y) {
    for(let i=0; i<5; i++) {
        particles.push(new Particle(x, y));
    }
}

function updateScore() {
    const percentage = (score / WIN_SCORE) * 100;
    loveMeter.style.width = `${percentage}%`;
    showEncouragementMessage();
}

function showEncouragementMessage() {
    // Show all messages at different score milestones
    const thresholds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    if (score > 0 && score <= 10 && score !== lastMessageScore) {
        lastMessageScore = score;
        const messageIndex = score - 1;
        encouragementMessage.textContent = encouragementMessages[messageIndex];
        encouragementMessage.classList.add('show');
    }
}

function triggerProposal() {
    gameState = 'PROPOSAL';
    // Small delay to let the particle effect finish or just smooth transition
    setTimeout(() => {
        proposalScreen.classList.remove('hidden');
        proposalScreen.classList.add('active');
        // Stop the loop or keep it running for background? 
        // Let's keep loop for maybe background falling hearts but pause spawning
    }, 500);
}

function startGame() {
    resize();
    
    // Skip love meter if toggle is true
    if (SKIP_LOVE_METER) {
        gameState = 'PROPOSAL';
        startScreen.classList.remove('active');
        startScreen.classList.add('hidden');
        proposalScreen.classList.remove('hidden');
        proposalScreen.classList.add('active');
        return;
    }
    
    player = new Player();
    hearts = [];
    score = 0;
    updateScore();
    gameState = 'PLAYING';
    
    startScreen.classList.remove('active');
    startScreen.classList.add('hidden');
    
    updateGame();
}

// Event Listeners
startBtn.addEventListener('click', startGame);

yesBtn.addEventListener('click', () => {
    proposalScreen.classList.remove('active');
    proposalScreen.classList.add('hidden');
    celebrationScreen.classList.remove('hidden');
    celebrationScreen.classList.add('active');
    triggerConfetti(); // Optional: Implement confetti
});

// "No" button interaction
noBtn.addEventListener('mouseover', moveNoButton);
noBtn.addEventListener('touchstart', moveNoButton);
noBtn.addEventListener('click', () => {
    if (noBtnClickCount < 5) {
        alert(noBtnMessages[noBtnClickCount]);
        noBtnClickCount++;
    }
});

function moveNoButton() {
    // Run away after 5 clicks
    if (noBtnClickCount >= 5) {
        const x = Math.random() * (window.innerWidth - noBtn.offsetWidth);
        const y = Math.random() * (window.innerHeight - noBtn.offsetHeight);
        noBtn.style.position = 'fixed';
        noBtn.style.left = `${x}px`;
        noBtn.style.top = `${y}px`;
    }
}

function triggerConfetti() {
    // Simple confetti effect using particles or similar
    // We can just reuse the heat/particle engine or add a simple CSS class to body
    // For now, let's just let it be.
}

// Initialize
resize();
