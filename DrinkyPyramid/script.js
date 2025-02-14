// Obtener los elementos y configurar variables globales
const pyramid = document.getElementById('pyramid');
const playersDiv = document.getElementById('players');
const log = document.getElementById('log');
const nextTurnBtn = document.getElementById('nextTurn');
const startGameBtn = document.getElementById('startGame');
const restartGameBtn = document.getElementById('restartGame');

let numPlayers = 2;
let playerHands = [];
let pyramidCards = [];
let currentRow = 0, currentCol = 0;
let deck = [];
let playerCounters = [];
const rules = ['TOMAR AL SECO', 'tomar 7', 'regalar 6', 'tomar 5', 'regalar 4', 'tomar 3', 'regalar 2', 'tomar 1'];
const suits = ['HEARTS', 'SPADES', 'CLUBS', 'DIAMONDS'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'JACK', 'QUEEN', 'KING', 'ACE'];

const cardNamesMap = {
    'JACK': 'Jota',
    'QUEEN': 'Quina',
    'KING': 'Kaiser',
    'ACE': 'As'
};

const suitsMap = {
    'HEARTS': 'Corazón',
    'CLUBS': 'Trébol',
    'SPADES': 'Espada',
    'DIAMONDS': 'Diamante'
};

const createDeck = () => {
    const deck = [];
    suits.forEach(suit => {
        values.forEach(value => {
            const code = value === 'ACE' ? `A${suit[0]}` : `${value[0]}${suit[0]}`;
            deck.push({ value, suit, code });
        });
    });
    return deck;
};

const shuffleDeck = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
};

const hasDuplicateValues = (hand) => {
    const values = hand.map(c => c.value);
    return new Set(values).size !== values.length;
};

const dealUniqueHand = (deck, handSize = 3) => {
    let attempts = 0;
    while (attempts < 100 && deck.length >= handSize) {
        const candidateHand = [];
        for (let i = 0; i < handSize; i++) {
            candidateHand.push(deck.pop());
        }
        // Si hay duplicados, regresamos la mano al mazo y volvemos a intentar
        if (hasDuplicateValues(candidateHand)) {
            deck.unshift(...candidateHand); // Devuelve las cartas al frente del mazo
            attempts++;
        } else {
            return candidateHand;
        }
    }
    throw new Error('No se pudo obtener una mano única sin duplicados de valores.');
};

const initializeGame = () => {
    const totalDecks = Math.max(1, numPlayers * 2);
    deck = [];
    for (let i = 0; i < totalDecks; i++) {
        deck = deck.concat(createDeck());
    }
    shuffleDeck(deck);

    playerHands = Array.from({ length: numPlayers }, () => dealUniqueHand(deck, 3));

    pyramidCards = [];
    const cardImages = [
        'Cartas/Dorso/tomanew.png',  // Toma (Azul)
        'Cartas/Dorso/regalanew.png' // Regala (Rojo)
    ];
    const alSecoImage = 'Cartas/Dorso/alseco.png'; // Imagen específica para el Piso 1

    for (let level = 1; level <= 8; level++) {
        const row = [];
        let cardImage;

        if (level === 1) {
            // Piso 1: Usa la imagen específica "alseco.png"
            cardImage = alSecoImage;
        } else {
            // Alterna entre "Toma" y "Regala" para los demás pisos
            cardImage = (level % 2 === 0) ? cardImages[0] : cardImages[1];
        }

        for (let i = 0; i < level; i++) {
            const card = deck.pop(); // Saca una carta real del mazo
            row.push({
                value: card.value,   // Asigna el valor real
                suit: card.suit,     // Asigna el palo real
                image: cardImage     // Asigna la imagen del dorso
            });
        }
        pyramidCards.push(row);
    }
    playerCounters = Array(numPlayers).fill(0);
};




const revealNextCard = () => {
    // Verificar si ya subimos más allá de la punta
    if (currentRow < 0) {
        log.innerHTML += '<br><b>¡Todas las cartas han sido reveladas! Fin del juego.</b>';
        nextTurnBtn.disabled = true;
        restartGameBtn.classList.remove('hidden');
        return;
    }

    let card = pyramidCards[currentRow][currentCol];
    let affectedPlayers = playerHands
        .map((hand, idx) => hand.some(c => c.value === card.value) ? idx + 1 : null)
        .filter(v => v);

    // Reemplazo de cartas si no afectan
    while (affectedPlayers.length === 0 && deck.length > 0) {
        const replacementCard = deck.pop();
        log.innerHTML += `<br><i>Carta reemplazada: ${convertCardName(card.value, card.suit)} no afecta a nadie. Nueva carta: ${convertCardName(replacementCard.value, replacementCard.suit)}.</i>`;

        // Actualiza la carta completa con el nuevo valor, palo y mantiene la imagen del dorso
        pyramidCards[currentRow][currentCol] = {
            value: replacementCard.value,
            suit: replacementCard.suit,
            image: card.image // Mantiene el dorso correcto
        };

        card = pyramidCards[currentRow][currentCol];
        affectedPlayers = playerHands
            .map((hand, idx) => hand.some(c => c.value === card.value) ? idx + 1 : null)
            .filter(v => v);
    }

    if (deck.length === 0 && affectedPlayers.length === 0) {
        log.innerHTML += '<br><b>No quedan cartas disponibles para reemplazo y nadie es afectado.</b>';
        nextTurnBtn.disabled = true;
        restartGameBtn.classList.remove('hidden');
        return;
    }

    // Actualiza la carta visualmente
    const cardDiv = pyramid.querySelector(`.row:nth-child(${currentRow + 1}) .card:nth-child(${currentCol + 1})`);
    cardDiv.innerHTML = `<img src="./Cartas/${getSuitFolder(card.suit)}/${card.value[0]}${card.suit[0]}.png">`;

    // Log de la carta revelada
    let logMessage = `<br>Carta revelada: ${convertCardName(card.value, card.suit)}. Piso ${currentRow + 1}, ${rules[currentRow]}.`;
    if (affectedPlayers.length > 0) {
        logMessage += `<br><span class="highlight">Jugador ${affectedPlayers.join(', Jugador ')} debe ${rules[currentRow]}.</span>`;
        affectedPlayers.forEach(player => playerCounters[player - 1]++);
    } else {
        logMessage += '<br>No hay jugadores afectados.';
    }

    log.innerHTML += logMessage;

    currentCol++;
    if (currentCol >= pyramidCards[currentRow].length) {
        currentRow--;
        currentCol = 0;
    }

    updatePlayerInteractions(affectedPlayers);
};


const updatePlayerInteractions = (affectedPlayers) => {
    affectedPlayers.forEach(player => {
        playerCounters[player - 1]++;
        log.innerHTML += `<br>Jugador ${player} incrementa su interacción a ${playerCounters[player - 1]}.`;
    });
};

const convertCardName = (value, suit) => {
    const convertedValue = cardNamesMap[value] || value;
    const convertedSuit = suitsMap[suit] || suit;
    return `${convertedValue} de ${convertedSuit}`;
};

const getSuitFolder = (suit) => {
    switch (suit) {
        case 'HEARTS': return 'Corazones';
        case 'DIAMONDS': return 'Diamantes';
        case 'SPADES': return 'Espadas';
        case 'CLUBS': return 'Treboles';
    }
};

const renderPyramid = () => {
    pyramid.innerHTML = '';
    pyramidCards.forEach((row) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';
        row.forEach((card) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            cardDiv.style.backgroundImage = `url('${card.image}')`;
            rowDiv.appendChild(cardDiv);
        });
        pyramid.appendChild(rowDiv);
    });
};

const renderPlayerHands = () => {
    playersDiv.innerHTML = '';
    playerHands.forEach((hand, idx) => {
        const handDiv = document.createElement('div');
        handDiv.className = 'player-hand';
        handDiv.innerHTML = `<h3>Jugador ${idx + 1}</h3>`;
        hand.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            cardDiv.innerHTML = `<img src="./Cartas/${getSuitFolder(card.suit)}/${card.code}.png">`;
            handDiv.appendChild(cardDiv);
        });
        playersDiv.appendChild(handDiv);
    });
};

const startGame = () => {
    numPlayers = parseInt(document.getElementById('numPlayers').value);
    initializeGame();
    renderPyramid();
    renderPlayerHands();
    log.innerHTML = '<b>Juego iniciado. Usa "Siguiente Turno" para avanzar.</b>';
    nextTurnBtn.disabled = false;
    currentRow = pyramidCards.length - 1;
    currentCol = 0;
};

startGameBtn.addEventListener('click', startGame);
nextTurnBtn.addEventListener('click', revealNextCard);

document.getElementById('playersTitle').addEventListener('click', function() {
    const playersContainer = document.getElementById('players');
    const title = document.getElementById('playersTitle');
    
    if (playersContainer.classList.contains('collapsed')) {
        playersContainer.classList.remove('collapsed');
        title.textContent = 'Manos de los jugadores ▼'; // Cambia el icono
    } else {
        playersContainer.classList.add('collapsed');
        title.textContent = 'Manos de los jugadores ▲'; // Cambia el icono
    }
});
