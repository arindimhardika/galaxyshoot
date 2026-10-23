/* ===================================================
   GALACTIC MINDFIRE: CYBER SHOT & BRAIN GAME LOGIC
   =================================================== */

// 1. SOUND GENERATOR (Web Audio API Synth)
class SoundFX {
    constructor() {
        this.ctx = null;
    }
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    playLaser() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }
    playExplosion() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }
    playSuccess() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1);
        osc.frequency.setValueAtTime(659.25, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.4);
    }
    playFail() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.3);
    }
}
const sfx = new SoundFX();

// 2. BANK SOAL PENGETAHUAN UMUM
const quizDatabase = [
    { q: "Planet terdekat dari Matahari adalah?", a: ["Venus", "Merkurius", "Mars", "Bumi"], correct: 1 },
    { q: "Siapa penemu gelombang radio / teori medan elektromagnetik?", a: ["Albert Einstein", "Nikola Tesla", "James Clerk Maxwell", "Isaac Newton"], correct: 2 },
    { q: "Elemen kimia dengan simbol 'Au' adalah?", a: ["Perak", "Emas", "Aluminium", "Tembaga"], correct: 1 },
    { q: "Ibu kota dari negara Jepang adalah?", a: ["Kyoto", "Osaka", "Tokyo", "Hiroshima"], correct: 2 },
    { q: "Organ tubuh manusia yang berfungsi memompa darah adalah?", a: ["Hati", "Paru-paru", "Jantung", "Ginjal"], correct: 2 },
    { q: "Bahasa pemrograman primer untuk pengembangan web client-side?", a: ["Python", "Java", "JavaScript", "C++"], correct: 2 },
    { q: "Apa benua terbesar di dunia berdasarkan luas wilayah?", a: ["Afrika", "Amerika Utara", "Asia", "Eropa"], correct: 2 },
    { q: "Senyawa kimia air secara umum dikenal dengan rumus?", a: ["CO2", "H2O", "NaCl", "O2"], correct: 1 },
    { q: "Penemu sistem operasi Linux adalah?", a: ["Linus Torvalds", "Bill Gates", "Steve Jobs", "Mark Zuckerberg"], correct: 0 },
    { q: "Galaksi tempat sistem tata surya kita berada bernama?", a: ["Andromeda", "Bimasakti (Milky Way)", "Triangulum", "Sombrero"], correct: 1 }
];

// 3. GAME ENGINE VARIABLES & SETUP
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameRunning = false;
let isPaused = false;
let score = 0;
let stage = 1;
let enemiesDefeatedInStage = 0;
const enemiesToClearStage = 12;

let player = {
    x: 0,
    y: 0,
    width: 36,
    height: 36,
    speed: 7,
    hp: 100,
    maxHp: 100,
    shootCooldown: 0,
    powerUpType: 'NORMAL', // NORMAL, TRIPLE, DOUBLE_DAMAGE
    powerUpTimer: 0
};

let bullets = [];
let enemies = [];
let particles = [];
let keys = {};
let mouseX = null;

// Quiz Timer Variables
let quizInterval = null;
let quizTimeLeft = 15;
let currentQuizCorrectIndex = null;
let isOverdriveTriggered = false;

// 4. CANVAS RESIZE & EVENT LISTENERS
function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    if (player.x === 0) {
        player.x = canvas.width / 2 - player.width / 2;
        player.y = canvas.height - 60;
    }
}
window.addEventListener('resize', resizeCanvas);

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyE' && !isPaused && gameRunning) {
        triggerOverdriveQuiz();
    }
});
window.addEventListener('keyup', (e) => keys[e.code] = false);

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
});
canvas.addEventListener('mouseleave', () => mouseX = null);

canvas.addEventListener('mousedown', () => keys['Space'] = true);
canvas.addEventListener('mouseup', () => keys['Space'] = false);

// 5. UI DOM ELEMENTS
const hpBar = document.getElementById('hp-bar');
const scoreText = document.getElementById('score-text');
const stageText = document.getElementById('stage-text');
const buffActiveText = document.getElementById('buff-active');
const btnQuizTrigger = document.getElementById('btn-quiz-trigger');

const startOverlay = document.getElementById('start-overlay');
const quizOverlay = document.getElementById('quiz-overlay');
const gameoverOverlay = document.getElementById('gameover-overlay');

document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-restart').addEventListener('click', startGame);
btnQuizTrigger.addEventListener('click', triggerOverdriveQuiz);

// 6. GAME START & RESET LOGIC
function startGame() {
    sfx.init();
    resizeCanvas();
    
    score = 0;
    stage = 1;
    enemiesDefeatedInStage = 0;
    player.hp = 100;
    player.powerUpType = 'NORMAL';
    player.powerUpTimer = 0;
    
    bullets = [];
    enemies = [];
    particles = [];

    updateHUD();
    
    startOverlay.classList.add('hidden');
    gameoverOverlay.classList.add('hidden');
    quizOverlay.classList.add('hidden');
    btnQuizTrigger.classList.remove('hidden');

    gameRunning = true;
    isPaused = false;
    
    requestAnimationFrame(gameLoop);
}

// 7. GAME LOOP & UPDATES
function gameLoop() {
    if (!gameRunning) return;

    if (!isPaused) {
        update();
        render();
    }

    requestAnimationFrame(gameLoop);
}

function update() {
    // Player Movement (Keyboard & Mouse)
    if (keys['KeyA'] || keys['ArrowLeft']) {
        player.x -= player.speed;
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        player.x += player.speed;
    }
    if (mouseX !== null) {
        player.x += (mouseX - (player.x + player.width / 2)) * 0.15;
    }

    // Clamp Player inside bounds
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

    // Player Shooting
    if (player.shootCooldown > 0) player.shootCooldown--;
    if (keys['Space'] && player.shootCooldown <= 0) {
        shootBullet();
        player.shootCooldown = 12; 
    }

    // PowerUp Timer Decay
    if (player.powerUpTimer > 0) {
        player.powerUpTimer--;
        if (player.powerUpTimer <= 0) {
            player.powerUpType = 'NORMAL';
            buffActiveText.innerText = "NORMAL WEAPONS ONLINE";
            buffActiveText.className = "text-emerald-400 tracking-wider";
        }
    }

    // Update Bullets
    bullets.forEach((b, index) => {
        b.y -= b.speed;
        if (b.y < -10) bullets.splice(index, 1);
    });

    // Spawn Enemies based on Stage Difficulty
    const spawnRate = Math.max(20, 70 - stage * 8);
    if (Math.random() * spawnRate < 1) {
        spawnEnemy();
    }

    // Update Enemies
    enemies.forEach((e, eIdx) => {
        e.y += e.speed;
        if (e.type === 'BOSS') {
            e.x += Math.sin(e.y * 0.05) * 2;
        }

        // Enemy Reaches Bottom
        if (e.y > canvas.height) {
            enemies.splice(eIdx, 1);
            damagePlayer(10);
        }

        // Collision Enemy vs Bullet
        bullets.forEach((b, bIdx) => {
            if (
                b.x < e.x + e.width &&
                b.x + b.width > e.x &&
                b.y < e.y + e.height &&
                b.y + b.height > e.y
            ) {
                e.hp -= b.damage;
                createParticles(b.x, b.y, '#f43f5e', 4);
                bullets.splice(bIdx, 1);

                if (e.hp <= 0) {
                    sfx.playExplosion();
                    createParticles(e.x + e.width / 2, e.y + e.height / 2, e.color, 12);
                    score += e.scoreValue;
                    enemiesDefeatedInStage++;
                    enemies.splice(eIdx, 1);
                    updateHUD();

                    // Check Stage Clear
                    if (enemiesDefeatedInStage >= enemiesToClearStage) {
                        enemiesDefeatedInStage = 0;
                        triggerStageQuiz();
                    }
                }
            }
        });

        // Collision Enemy vs Player
        if (
            player.x < e.x + e.width &&
            player.x + player.width > e.x &&
            player.y < e.y + e.height &&
            player.y + player.height > e.y
        ) {
            sfx.playExplosion();
            createParticles(e.x, e.y, '#f87171', 15);
            enemies.splice(eIdx, 1);
            damagePlayer(20);
        }
    });

    // Update Particles
    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        if (p.alpha <= 0) particles.splice(index, 1);
    });
}

// 8. SHOOTING & ENEMY SPAWN MECHANICS
function shootBullet() {
    sfx.playLaser();
    const dmg = player.powerUpType === 'DOUBLE_DAMAGE' ? 25 : 10;
    const color = player.powerUpType === 'DOUBLE_DAMAGE' ? '#e11d48' : '#38bdf8';

    if (player.powerUpType === 'TRIPLE') {
        bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 12, speed: 10, damage: dmg, color: '#f43f5e' });
        bullets.push({ x: player.x, y: player.y + 6, width: 4, height: 12, speed: 9, damage: dmg, color: '#f43f5e' });
        bullets.push({ x: player.x + player.width - 4, y: player.y + 6, width: 4, height: 12, speed: 9, damage: dmg, color: '#f43f5e' });
    } else {
        bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 12, speed: 10, damage: dmg, color: color });
    }
}

function spawnEnemy() {
    const rand = Math.random();
    let type = 'SCOUT';
    let width = 28, height = 28, hp = 10 + stage * 2, speed = 2 + Math.random() * 1.5 + (stage * 0.3), color = '#a855f7', scoreVal = 100;

    if (rand > 0.7) {
        type = 'TANK';
        width = 44; height = 44;
        hp = 30 + stage * 10;
        speed = 1 + (stage * 0.1);
        color = '#e11d48';
        scoreVal = 250;
    } else if (stage >= 3 && rand > 0.55) {
        type = 'BOSS';
        width = 56; height = 56;
        hp = 80 + stage * 25;
        speed = 0.8;
        color = '#f59e0b';
        scoreVal = 600;
    }

    const x = Math.random() * (canvas.width - width);
    enemies.push({ x, y: -height, width, height, hp, maxHp: hp, speed, color, type, scoreValue: scoreVal });
}

function damagePlayer(amount) {
    player.hp -= amount;
    triggerScreenShake();
    if (player.hp <= 0) {
        player.hp = 0;
        gameOver();
    }
    updateHUD();
}

function triggerScreenShake() {
    const container = document.getElementById('game-container');
    container.classList.add('screen-shake');
    setTimeout(() => container.classList.remove('screen-shake'), 300);
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            radius: Math.random() * 3 + 1,
            color,
            alpha: 1
        });
    }
}

// 9. RENDERING (CANVAS GRAPHICS)
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render Starfield Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 20; i++) {
        const starX = (Math.sin(i * 99 + Date.now() * 0.0001) * 0.5 + 0.5) * canvas.width;
        const starY = ((i * 37 + Date.now() * 0.05) % canvas.height);
        ctx.fillRect(starX, starY, 2, 2);
    }

    // Render Player Ship (Cyber Triangle Shape)
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#06b6d4';
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height - 8);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    // Player Cockpit Glow
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(player.x + player.width / 2 - 3, player.y + 12, 6, 8);
    ctx.restore();

    // Render Bullets
    bullets.forEach(b => {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.restore();
    });

    // Render Enemies
    enemies.forEach(e => {
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = e.color;
        ctx.fillStyle = e.color;

        if (e.type === 'SCOUT') {
            // Diamond Shape
            ctx.beginPath();
            ctx.moveTo(e.x + e.width / 2, e.y);
            ctx.lineTo(e.x + e.width, e.y + e.height / 2);
            ctx.lineTo(e.x + e.width / 2, e.y + e.height);
            ctx.lineTo(e.x, e.y + e.height / 2);
            ctx.closePath();
            ctx.fill();
        } else if (e.type === 'TANK') {
            // Heavy Box
            ctx.fillRect(e.x, e.y, e.width, e.height);
            ctx.strokeStyle = '#fca5a5';
            ctx.lineWidth = 2;
            ctx.strokeRect(e.x + 4, e.y + 4, e.width - 8, e.height - 8);
        } else {
            // BOSS Octagon
            ctx.beginPath();
            ctx.arc(e.x + e.width / 2, e.y + e.height / 2, e.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Enemy HP Mini-Bar
        if (e.hp < e.maxHp) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(e.x, e.y - 8, e.width, 4);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(e.x, e.y - 8, (e.hp / e.maxHp) * e.width, 4);
        }
        ctx.restore();
    });

    // Render Particles
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function updateHUD() {
    hpBar.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
    scoreText.innerText = String(score).padStart(6, '0');
    stageText.innerText = stage;
}

// 10. QUIZ SYSTEM & TIMER INTERACTION
function triggerStageQuiz() {
    isOverdriveTriggered = false;
    document.getElementById('quiz-title-text').innerText = `STAGE ${stage} CLEAR - POWER UP CHALLENGE`;
    openQuizModal();
}

function triggerOverdriveQuiz() {
    if (isPaused) return;
    isOverdriveTriggered = true;
    document.getElementById('quiz-title-text').innerText = "OVERDRIVE CORE ACTIVATION";
    openQuizModal();
}

function openQuizModal() {
    isPaused = true;
    quizOverlay.classList.remove('hidden');

    const randomQ = quizDatabase[Math.floor(Math.random() * quizDatabase.length)];
    document.getElementById('quiz-question').innerText = randomQ.q;
    currentQuizCorrectIndex = randomQ.correct;

    const answersContainer = document.getElementById('quiz-answers');
    answersContainer.innerHTML = '';
    document.getElementById('quiz-feedback').classList.add('hidden');

    randomQ.a.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = "w-full p-3 bg-slate-800 hover:bg-fuchsia-600/30 border border-slate-700 hover:border-fuchsia-500 rounded-lg text-left text-sm font-semibold transition-all flex items-center justify-between group";
        btn.innerHTML = `
            <span>${String.fromCharCode(65 + idx)}. ${opt}</span>
            <span class="opacity-0 group-hover:opacity-100 text-fuchsia-400 font-orbitron">SELECT ►</span>
        `;
        btn.onclick = () => handleAnswer(idx);
        answersContainer.appendChild(btn);
    });

    // Reset 15 Second Timer
    quizTimeLeft = 15;
    const timerText = document.getElementById('quiz-timer');
    const timerCircle = document.getElementById('timer-circle');
    timerText.innerText = quizTimeLeft;
    timerCircle.style.strokeDashoffset = 0;

    clearInterval(quizInterval);
    quizInterval = setInterval(() => {
        quizTimeLeft--;
        timerText.innerText = quizTimeLeft;
        
        // Circular stroke animation update
        const offset = 125.6 * (1 - quizTimeLeft / 15);
        timerCircle.style.strokeDashoffset = offset;

        if (quizTimeLeft <= 0) {
            clearInterval(quizInterval);
            handleAnswer(-1); // Timeout
        }
    }, 1000);
}

function handleAnswer(selectedIndex) {
    clearInterval(quizInterval);
    const feedback = document.getElementById('quiz-feedback');
    feedback.classList.remove('hidden');

    const isCorrect = (selectedIndex === currentQuizCorrectIndex);

    if (isCorrect) {
        sfx.playSuccess();
        feedback.className = "text-center font-orbitron font-bold text-sm p-3 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-300";
        
        if (isOverdriveTriggered) {
            applyRandomBuff();
            feedback.innerText = "OVERDRIVE ACTIVATED: BUFF GRANTED!";
        } else {
            stage++;
            player.hp = Math.min(player.maxHp, player.hp + 30); // Bonus HP
            applyRandomBuff();
            feedback.innerText = `CORRECT! ADVANCING TO STAGE ${stage}. HP RESTORED & BUFF ACTIVATED!`;
        }
    } else {
        sfx.playFail();
        feedback.className = "text-center font-orbitron font-bold text-sm p-3 rounded bg-red-950/80 border border-red-500 text-red-300";
        
        if (selectedIndex === -1) {
            feedback.innerText = "TIME EXPIRED! CRITICAL FAILURE (-15 HP)";
        } else {
            feedback.innerText = "INCORRECT ANSWER! POWER OVERLOAD (-15 HP)";
        }
        
        player.hp = Math.max(0, player.hp - 15);
        if (!isOverdriveTriggered) {
            stage++; // Progress stage anyway, but penalized
        }
    }

    updateHUD();

    setTimeout(() => {
        quizOverlay.classList.add('hidden');
        isPaused = false;
        if (player.hp <= 0) gameOver();
    }, 1800);
}

function applyRandomBuff() {
    const buffs = ['TRIPLE', 'DOUBLE_DAMAGE'];
    const selected = buffs[Math.floor(Math.random() * buffs.length)];
    player.powerUpType = selected;
    player.powerUpTimer = 600; // 10 Seconds duration (60 fps * 10)

    if (selected === 'TRIPLE') {
        buffActiveText.innerText = "BUFF ACTIVE: TRIPLE LASER CANNON (10s)";
        buffActiveText.className = "text-fuchsia-400 font-bold animate-pulse tracking-wider";
    } else if (selected === 'DOUBLE_DAMAGE') {
        buffActiveText.innerText = "BUFF ACTIVE: 2X PLASMA DAMAGE (10s)";
        buffActiveText.className = "text-yellow-400 font-bold animate-pulse tracking-wider";
    }
}

// 11. GAME OVER HANDLER
function gameOver() {
    gameRunning = false;
    document.getElementById('final-score').innerText = score;
    document.getElementById('final-stage').innerText = stage;
    gameoverOverlay.classList.remove('hidden');
    btnQuizTrigger.classList.add('hidden');
}
