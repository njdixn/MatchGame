// ============================================
// GAME STATE MANAGEMENT
// ============================================

// Variable defaut settings for game only
const gameState = {
    cards: [],
    flipped: [],
    matched: [],
    moves: 0,
    matchedPairs: 0,
    gameActive: false,
    startTime: null,
    elapsedTime: 0,
    timerInterval: null,
    uploadedImages: []
};

// Default config for game
const config = {
    difficulty: 'medium',
    theme: 'zelda',

    // Difficulty sizes
    gridSizes: {
        easy: { cols: 4, rows: 4 },
        medium: { cols: 6, rows: 4 },
        hard: { cols: 6, rows: 6 }
    },

    // Theme choices (minimum of 18 items per theme to not have duplicates in them choices)
    themes: {
        emoji: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🦒', '🦓', '🦘', '🐘', '🦏', '🦛'],
        color: ['#963634', '#E26B0A', '#FFFF0D', '#76933C', '#31869B', '#60497A', '#DA9694', '#FABF8F', '#FFFFA2', '#C4D79B', '#92CDDC', '#B1A0C7', '#F2DCDB','#FDE9D9', '#FFFFDF', '#EBF1DE', '#DAEEF3', '#E4DFEC'],
        symbol: ['★', '●', '■', '▲', '♥', '♦', '♠', '♣', '◆', '◇', '○', '△', '◈', '▼', '▶', '◀', '⬟', '✦'],

        // all of these images are property of Nintendo (NJD)
        zelda: ['./images/bomb.png', './images/boomerang.png', './images/boots.png', './images/bowarrow.png', './images/ganondorf.png', './images/goddessharp.png', './images/heart.png', './images/hylianshield.png', './images/ironboots.png', './images/lensoftruth.png', './images/link.png', './images/mastersword.png', './images/ocarina.png', './images/rupee.png', './images/slingshot.png', './images/smallkey.png', './images/triforce.png', './images/zelda.png'],

        // I asked for this before the Zelda game thinking the AI would give me a place to add in the images in the code, not upload them. decided to keep because it is cool.
        image: []
    }
};

// ============================================
// FUNCTIONAL PROGRAMMING: Higher-Order Function
// ============================================
// A function as a parameter and returns a new function
const createDebouncedFunction = (fn, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

// ============================================
// DOM MANIPULATION
// ============================================
// This directly manipulates the DOM using JavaScript
const renderGameBoard = () => {
    const boardElement = document.getElementById('gameBoard');
    const { cols, rows } = config.gridSizes[config.difficulty];
    
    // Clear existing board
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    
    // Create card elements
    gameState.cards.forEach((card, index) => {
        const cardElement = document.createElement('button');
        cardElement.className = 'card';
        cardElement.setAttribute('data-index', index);
        
        // Handle different themes
        if (config.theme === 'color') {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'card-content card-content-color';
            colorDiv.style.backgroundColor = card.display;
            cardElement.appendChild(colorDiv);
        } else if (config.theme === 'image') {
            const img = document.createElement('img');
            img.className = 'card-content-image';
            img.src = card.display;
            
            const cardContent = document.createElement('div');
            cardContent.className = 'card-content';
            cardContent.appendChild(img);
            cardElement.appendChild(cardContent);
        } else if (config.theme === 'zelda') {
            // Responsive sizing based on difficulty
            let imageWidth = 100;
            let imageHeight = 120;
            
            if (config.difficulty === 'medium') {
                imageWidth = 90;   
                imageHeight = 105;
            } else if (config.difficulty === 'hard') {
                imageWidth = 60;   
                imageHeight = 70;
            }
            
            const zeldalog = document.createElement('img');
            zeldalog.className = 'card-content-zelda-image';
            zeldalog.src = card.display;
            zeldalog.style.width = imageWidth + 'px';
            zeldalog.style.height = imageHeight + 'px';
            
            const cardContent = document.createElement('div');
            cardContent.className = 'card-content';
            cardContent.appendChild(zeldalog);
            cardElement.appendChild(cardContent);
        } else {
            const content = document.createElement('div');
            content.className = 'card-content';
            content.textContent = card.display;
            cardElement.appendChild(content);
        }
        
        // EVENT LISTENER: Adding event listener to card click
        cardElement.addEventListener('click', () => handleCardClick(index, cardElement));
        
        if (gameState.matched.includes(index)) {
            cardElement.classList.add('matched');
        }
        if (gameState.flipped.includes(index)) {
            cardElement.classList.add('flipped');
        }
        
        boardElement.appendChild(cardElement);
    });
};

// ============================================
// GAME LOGIC
// ============================================
// Shuffle cards
const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Initialize game with new card deck
const initializeGame = () => {
    const { cols, rows } = config.gridSizes[config.difficulty];
    const totalCards = cols * rows;
    const pairCount = totalCards / 2;
    
    // Set difficulty attribute on body for responsive Zelda sizing
    document.body.setAttribute('data-difficulty', config.difficulty);
    
    // Apply/remove Zelda theme based on config
    if (config.theme === 'zelda') {
        document.body.classList.add('zelda-theme');
    } else {
        document.body.classList.remove('zelda-theme');
    }
    
    const themeCards = config.themes[config.theme];

    // Use map to create card pairs
    const cardPairs = Array.from({ length: pairCount }, (_, i) => ({
        id: i,
        display: themeCards[i % themeCards.length]
    })).flatMap(card => [card, card]);

    gameState.cards = shuffleArray(cardPairs);
    gameState.flipped = [];
    gameState.matched = [];
    gameState.moves = 0;
    gameState.matchedPairs = 0;
    gameState.gameActive = true;
    
    // Update matched count in stats - only update the span, not the parent
    const matchedElement = document.getElementById('matched');
    if (matchedElement) {
        matchedElement.textContent = '0';
        const parentDiv = matchedElement.parentElement;
        if (parentDiv) {
            // Create the text content properly: span + /pairCount
            parentDiv.innerHTML = `<span id="matched">0</span>/${pairCount}`;
        }
    }
    document.getElementById('moves').textContent = '0';
    
    renderGameBoard();
};

const handleCardClick = (index, cardElement) => {
    if (!gameState.gameActive) return;
    if (gameState.flipped.includes(index)) return;
    if (gameState.matched.includes(index)) return;
    if (gameState.flipped.length >= 2) return;

    // Start timer on first card click
    if (gameState.startTime === null) {
        startTimer();
    }

    // Flip the card
    gameState.flipped.push(index);
    cardElement.classList.add('flipped');
    playSound('flip');

    if (gameState.flipped.length === 2) {
        gameState.moves++;
        document.getElementById('moves').textContent = gameState.moves;
        checkMatch();
    }
};

// Check if two flipped cards match
const checkMatch = () => {
    gameState.gameActive = false;
    const [firstIndex, secondIndex] = gameState.flipped;
    const firstCard = gameState.cards[firstIndex];
    const secondCard = gameState.cards[secondIndex];

    const isMatch = firstCard.id === secondCard.id;

    setTimeout(() => {
        if (isMatch) {
            gameState.matched.push(firstIndex, secondIndex);
            gameState.matchedPairs++;
            const matchedElement = document.getElementById('matched');
            if (matchedElement) {
                matchedElement.textContent = gameState.matchedPairs;
            }
            playSound('match');
            
            // Update matched cards in DOM
            document.querySelectorAll('.card').forEach(card => {
                const idx = parseInt(card.getAttribute('data-index'));
                if (gameState.matched.includes(idx)) {
                    card.classList.add('matched');
                }
            });

            gameState.flipped = [];
            gameState.gameActive = true;

            if (gameState.matchedPairs === gameState.cards.length / 2) {
                endGame();
            }
        } else {
            playSound('mismatch');
            // Flip cards back
            document.querySelectorAll('.card').forEach(card => {
                const idx = parseInt(card.getAttribute('data-index'));
                if (gameState.flipped.includes(idx)) {
                    card.classList.remove('flipped');
                }
            });
            gameState.flipped = [];
            gameState.gameActive = true;
        }
    }, 1000);
};

// ============================================
// TIMER - Independent System
// ============================================
let timerState = {
    isRunning: false,
    startTime: null,
    interval: null
};

const initTimer = () => {
    timerState.isRunning = false;
    timerState.startTime = null;
    if (timerState.interval) {
        clearInterval(timerState.interval);
    }
    document.getElementById('timer').textContent = '0:00';
};

const startTimer = () => {
    if (timerState.isRunning) return;
    
    timerState.isRunning = true;
    timerState.startTime = Date.now();
    
    if (timerState.interval) {
        clearInterval(timerState.interval);
    }
    
    timerState.interval = setInterval(() => {
        if (!timerState.isRunning || !timerState.startTime) return;
        
        const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        gameState.elapsedTime = elapsed;
    }, 100);
};

const stopTimer = () => {
    timerState.isRunning = false;
    if (timerState.interval) {
        clearInterval(timerState.interval);
        timerState.interval = null;
    }
};

// ============================================
// GAME END
// ============================================
const endGame = () => {
    gameState.gameActive = false;
    stopTimer();
    
    // Calculate score (lower is better)
    const score = Math.max(0, 1000 - (gameState.moves * 10 + gameState.elapsedTime * 2));
    
    document.getElementById('finalMoves').textContent = gameState.moves;
    const minutes = Math.floor(gameState.elapsedTime / 60);
    const seconds = gameState.elapsedTime % 60;
    document.getElementById('finalTime').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('finalScore').textContent = Math.round(score);
    
    document.getElementById('gameOverModal').classList.add('show');
    playSound('gameOver');
};

// ============================================
// SOUND EFFECTS
// ============================================
const playSound = (type) => {
    // Create audio context if not already created
    if (!window.audioContext) {
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const ctx = window.audioContext;
    const now = ctx.currentTime;
    
    switch(type) {
        case 'flip':
            playTone(ctx, 400, 0.1, now, 'sine');
            break;
        case 'match':
            playTone(ctx, 800, 0.15, now, 'sine');
            playTone(ctx, 1000, 0.15, now + 0.1, 'sine');
            break;
        case 'mismatch':
            playTone(ctx, 300, 0.1, now, 'sine');
            playTone(ctx, 200, 0.1, now + 0.1, 'sine');
            break;
        case 'gameOver':
            playTone(ctx, 600, 0.15, now, 'sine');
            playTone(ctx, 800, 0.15, now + 0.1, 'sine');
            playTone(ctx, 1000, 0.2, now + 0.2, 'sine');
            break;
    }
};

const playTone = (context, frequency, duration, startTime, waveform = 'sine') => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = waveform;
    
    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
};

// ============================================
// EVENT HANDLERS & INITIALIZATION
// ============================================

// EVENT LISTENER: Start button (kept for reset functionality, but hidden from UI)
document.getElementById('startBtn').addEventListener('click', () => {
    gameState.elapsedTime = 0;
    gameState.startTime = null;
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    initializeGame();
    document.getElementById('timer').textContent = '0:00';
});

// EVENT LISTENER: Reset button
document.getElementById('resetBtn').addEventListener('click', () => {
    stopTimer();
    initTimer();
    gameState.elapsedTime = 0;
    document.getElementById('startBtn').textContent = 'Start Game';
    document.getElementById('startBtn').disabled = false;
    document.getElementById('gameOverModal').classList.remove('show');
    initializeGame();
});

// EVENT LISTENER: Difficulty selector
document.getElementById('difficulty').addEventListener('change', (e) => {
    config.difficulty = e.target.value;
    if (gameState.gameActive) {
        stopTimer();
        gameState.gameActive = false;
    }
    initTimer();
    gameState.elapsedTime = 0;
    document.getElementById('startBtn').textContent = 'Start Game';
    document.getElementById('startBtn').disabled = false;
    initializeGame();
});

// EVENT LISTENER: Theme selector
document.querySelectorAll('input[name="theme"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        config.theme = e.target.value;
        
        // Show/hide image upload control based on selected theme
        const imageUploadControl = document.getElementById('imageUploadControl');
        if (e.target.value === 'image') {
            imageUploadControl.classList.add('show');
        } else {
            imageUploadControl.classList.remove('show');
        }
        
        // Apply/remove Zelda theme based on selected theme
        if (e.target.value === 'zelda') {
            document.body.classList.add('zelda-theme');
        } else {
            document.body.classList.remove('zelda-theme');
        }
        
        if (gameState.gameActive) {
            stopTimer();
            gameState.gameActive = false;
        }
        initTimer();
        if (gameState.cards.length > 0) {
            initializeGame();
        }
    });
});

// EVENT LISTENER: Image upload
document.getElementById('imageUpload').addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    
    // Convert images to data URLs
    gameState.uploadedImages = [];
    let loadedCount = 0;
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            gameState.uploadedImages.push(event.target.result);
            loadedCount++;
            
            // Update image count display
            document.getElementById('imageCount').textContent = `(${gameState.uploadedImages.length} images)`;
            
            // If all images are loaded and we have at least 2 images, update the config
            if (loadedCount === files.length && gameState.uploadedImages.length >= 2) {
                config.themes.image = gameState.uploadedImages;
                
                // If image theme is selected, reinitialize the game
                if (config.theme === 'image') {
                    if (gameState.gameActive) {
                        stopTimer();
                        gameState.gameActive = false;
                    }
                    initTimer();
                    initializeGame();
                }
            }
        };
        reader.readAsDataURL(file);
    });
});

// Initialize the game board on page load
window.addEventListener('load', () => {
    initializeGame();

});
