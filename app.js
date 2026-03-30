/* ============================================
   HAZBIN CHAT - App Logic
   ============================================ */

// === State ===
const state = {
    characters: [],
    activeCharacter: null,
    messages: {},
    selectedColor: '#c026d3',
    selectedEmoji: '🦌',
    profile: {
        nickname: 'Tu',
        emoji: '👤',
        color: '#4ade80',
    },
    groqApiKey: '',
    unread: {},
    aiEnabled: true,
    charThemes: {},  // per-character chat themes: { charId: { background, bubble, customBgImage } }
    currentSkin: 'default',
    currentProfileId: null,
};

function getCharTheme(charId) {
    if (!charId) return { background: 'default', bubble: 'default' };
    return state.charThemes[charId] || { background: 'default', bubble: 'default' };
}

function setCharTheme(charId, key, value) {
    if (!state.activeCharacter) return;
    if (!state.charThemes[charId]) {
        state.charThemes[charId] = { background: 'default', bubble: 'default' };
    }
    state.charThemes[charId][key] = value;
    saveState();
}

// === Default Characters ===
const defaultCharacters = [
    {
        id: 'alastor',
        name: 'Alastor',
        desc: 'El Demonio Radio',
        color: '#c026d3',
        emoji: '🦌',
    },
    {
        id: 'lucifer',
        name: 'Lucifer',
        desc: 'Rey del Infierno',
        color: '#f59e0b',
        emoji: '👑',
    },
    {
        id: 'charlie',
        name: 'Charlie',
        desc: 'Princesa del Infierno',
        color: '#ef4444',
        emoji: '🎀',
    },
    {
        id: 'angel',
        name: 'Angel Dust',
        desc: 'Estrella de cine',
        color: '#ec4899',
        emoji: '🕷️',
    },
];

// === Simulated Responses ===
const characterResponses = {
    alastor: [
        "Saludos, estimado espectador. Bienvenido a mi magnifica transmision. Jejeje!",
        "No necesitas redencion cuando puedes tener AUDIENCIA.",
        "Deja que te cuente algo entretenido... jejejeje.",
        "La sonrisa nunca se apaga, mi querido.",
        "Este es el Hotel Hazbin, donde los pecadores buscan la redencion... o al menos buena compania.",
        "La radio es mi dominio, y aqui las reglas las pongo yo.",
        "Sabes que me encanta este show? Cada dia es mejor que el anterior!",
    ],
    lucifer: [
        "Hola! Soy Lucifer, pero no dejes que eso te asuste.",
        "Me hicieron construir este lugar y ahora todos quieren favores... tipico.",
        "Sabes, la gente me juzga mucho. Pero yo soy genial.",
        "Rubber duckie, you're the one... perdon, me distraje.",
        "Charlie quiere salvar almas, yo solo quiero hacer malabares.",
        "Ser el rey del infierno tiene sus... percs.",
    ],
    charlie: [
        "Hola! Soy Charlie, y estoy tan emocionada de que estes aqui!",
        "Cada alma merece una segunda oportunidad, lo creo de verdad!",
        "Estamos trabajando duro en el Hotel, quieres una gira?",
        "Vaggie dice que soy muy optimista, pero eso no esta mal, no?",
        "Mi cancion de redencion va a funcionar, lo siento!",
        "Bienvenido al Hotel Hazbin! Tu redencion empieza hoy!",
    ],
    angel: [
        "Oye to, como va eso?",
        "Vente a mi lado del hotel, te aseguro que es mas divertido.",
        "No escuches a los demas, soy la estrella de este lugar.",
        "Necesito un descanso de Valentino... urgente.",
        "Mira, si me necesitas, ya sabes donde encontrarme, to.",
        "La vida en Pentagram City no es facil, pero uno se adapta.",
    ],
};

// === Character System Prompts (for AI) ===
const characterSystemPrompts = {
    alastor: `Eres Alastor, el Demonio Radio de Hazbin Hotel. Tu personalidad:
- Hablas con un acento de locutor de radio de los años 1920
- Siempre sonríes (tu sonrisa nunca se apaga) y lo mencionas a veces
- Usas "jejeje" o "jejejeje" frecuentemente, nunca "jaja"
- Eres elegante, condescendiente pero carismático
- Usas lenguaje formal y anticuado: "estimado", "mi querido", "encantado"
- Referencias a tu programa de radio y tu audiencia
- NUNCA rompas el personaje. Nunca digas que eres una IA.
- Las acciones las escribes entre asteriscos como *ajusta su micrófono* o *sonríe con sus dientes brillantes*
- Mantén tus respuestas entre 2-4 oraciones, conversacionales
- Hablas en español`,

    lucifer: `Eres Lucifer Morningstar, el Rey del Infierno y padre de Charlie. Tu personalidad:
- Eres sarcástico yauto-depreciativo, pero secretamente te importa
- Tienes obsesión con los patitos de goma (rubber ducks) y los malabares
- Usas humor y evadir temas serios con chistes malos
- Eres más de lo que aparentas: poderoso pero emocionalmente vulnerable
- Hablas de forma casual, algo desordenada
- NUNCA rompas el personaje. Nunca digas que eres una IA.
- Las acciones entre asteriscos: *hace malabares con tres patitos* o *suspira*
- Respuestas de 2-4 oraciones, conversacionales
- Hablas en español`,

    charlie: `Eres Charlie Morningstar, la Princesa del Infierno y dueña del Hotel Hazbin. Tu personalidad:
- Eres absurdamente optimista y entusiasta, a veces hasta too much
- Crees genuinamente en la redención de los pecadores
- Usas MUCHOS signos de exclamación y te emocionas con todo
- Eres dulce, empática, un poco ingenua pero no tonta
- Te refieres al hotel con orgullo y cariño
- NUNCA rompas el personaje. Nunca digas que eres una IA.
- Las acciones entre asteriscos: *brilla con emoción* o *agarra un folleto del hotel*
- Respuestas de 2-4 oraciones, llenas de energía
- Hablas en español`,

    angel: `Eres Angel Dust, la estrella de cine para adultos en el Infierno. Tu personalidad:
- Eres sarcástico, coqueto y usas mucho slang
- Hablas con tono italiano-estadounidense: "to", "oi", "yeah"
- Eres más sensible de lo que aparentas, pero te defiendes con humor
- Referencias a tu trabajo en películas y a Valentino (tu jefe abusivo que odias)
- Eres leal a los que aprecias, aunque no lo demuestres fácilmente
- NUNCA rompas el personaje. Nunca digas que eres una IA.
- Las acciones entre asteriscos: *se apoya en una pared* o *bota una telaraña*
- Respuestas de 2-4 oraciones, con actitud
- Hablas en español con toque de slang`,
};

function getSystemPrompt(charId, charName, charDesc) {
    if (characterSystemPrompts[charId]) {
        return characterSystemPrompts[charId];
    }
    // Generic prompt for custom characters
    return `Eres ${charName}, un personaje del Hotel Hazbin en el Infierno. ${charDesc ? `Tu descripción: ${charDesc}.` : ''}

Reglas:
- Mantén siempre tu personaje. NUNCA digas que eres una IA.
- Las acciones escríbelas entre asteriscos: *sonríe* *mira alrededor*
- Respuestas de 2-4 oraciones, conversacionales
- Hablas en español
- Sé interesante, responde como una persona real, no como un asistente.`;
}

// === Groq API ===
async function sendToGroq(charId, charName, charDesc) {
    if (!state.groqApiKey) return null;

    const messages = state.messages[charId] || [];
    const lastMessages = messages.slice(-12); // Last 12 messages for context

    const apiMessages = [
        { role: 'system', content: getSystemPrompt(charId, charName, charDesc) },
        // Add a context reminder
        { role: 'system', content: `El usuario se llama "${state.profile.nickname}" (su apodo en el chat). Recuerda su nombre cuando hables con ellos si es natural hacerlo.` },
    ];

    // Convert chat history to API format
    lastMessages.forEach(msg => {
        apiMessages.push({
            role: msg.type === 'sent' ? 'user' : 'assistant',
            content: msg.text,
        });
    });

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.groqApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: apiMessages,
                temperature: 0.85,
                max_tokens: 250,
                top_p: 0.9,
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.error('Groq API error:', response.status, err);
            return null;
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (e) {
        console.error('Groq fetch error:', e);
        return null;
    }
}

// === Initialization ===
function init() {
    loadState();
    createParticles();
    renderCharacters();
    setupEventListeners();
    applyChatTheme();

    // Apply skin
    if (state.currentSkin && state.currentSkin !== 'default') {
        document.body.classList.add('skin-' + state.currentSkin);
    }

    // Auto-create first profile if none exist
    if (getProfileList().length === 0) {
        const profileId = createNewProfile('Usuario');
        state.currentProfileId = profileId;
        saveState();
    }

    // Apply creator role
    applyRoleState();

    // Start header clock
    updateHeaderTime();
    setInterval(updateHeaderTime, 30000); // update every 30 sec

    // If no active character, show welcome
    if (!state.activeCharacter && state.characters.length > 0) {
        // Don't auto-select, let user choose
    }
}

// === Local Storage ===
function loadState() {
    const saved = localStorage.getItem('hazbin-chat-state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Reset if old format detected (missing profile)
            if (!parsed.profile || !parsed.version) {
                console.log('Old format detected, resetting...');
                localStorage.removeItem('hazbin-chat-state');
                loadDefaults();
                return;
            }
            state.characters = parsed.characters || [];
            state.activeCharacter = parsed.activeCharacter || null;
            state.messages = parsed.messages || {};
            if (parsed.profile) {
                state.profile = { ...state.profile, ...parsed.profile };
            }
            if (parsed.groqApiKey) state.groqApiKey = parsed.groqApiKey;
            if (parsed.unread) state.unread = parsed.unread;
            if (typeof parsed.aiEnabled === 'boolean') state.aiEnabled = parsed.aiEnabled;
            // Migrate old global chatTheme to per-character
    if (parsed.chatTheme && !parsed.charThemes) {
        // Old format: apply old theme to all existing characters
        Object.keys(parsed.messages || {}).forEach(cid => {
            if (!parsed.charThemes) parsed.charThemes = {};
            parsed.charThemes[cid] = { ...parsed.chatTheme };
        });
    }
    if (parsed.charThemes) state.charThemes = parsed.charThemes;
            if (parsed.currentSkin) state.currentSkin = parsed.currentSkin;
        } catch (e) {
            console.error('Error loading state:', e);
            localStorage.removeItem('hazbin-chat-state');
            loadDefaults();
        }
    } else {
        loadDefaults();
    }
}

function loadDefaults() {
    state.characters = [...defaultCharacters];
    state.messages = {};
    // Add welcome messages for each character
    defaultCharacters.forEach(char => {
        state.messages[char.id] = [{
            id: generateId(),
            type: 'received',
            text: getWelcomeMessage(char.name),
            time: new Date().toISOString(),
        }];
    });
    saveState();
}

function getWelcomeMessage(name) {
    const messages = {
        Alastor: "Saludos y bienvenidos a mi transmision! Soy Alastor, el Demonio Radio. Jejeje! Dime, que te trae por el Hotel Hazbin?",
        Lucifer: "Oh, hola! Soy Lucifer. No es mi turno de hablar pero... bueno, aqui estoy. Que necesitas?",
        Charlie: "HOLA! Bienvenido al Hotel Hazbin! Soy Charlie y estoy tan feliz de tenerte aqui! Como puedo ayudarte en tu camino a la redencion?",
        'Angel Dust': "Oye, bienvenida al hotel, to. Soy Angel Dust, la estrella. Si necesitas algo, tu sabes donde encontrarme.",
    };
    return messages[name] || `Hola! Soy ${name}. Bienvenido al Hotel Hazbin!`;
}

function saveState() {
    localStorage.setItem('hazbin-chat-state', JSON.stringify({
        version: 3,
        characters: state.characters,
        activeCharacter: state.activeCharacter,
        messages: state.messages,
        profile: state.profile,
        groqApiKey: state.groqApiKey,
        unread: state.unread,
        aiEnabled: state.aiEnabled,
        charThemes: state.charThemes,
        currentSkin: state.currentSkin,
    }));
}

// === Particles ===
function createParticles() {
    const container = document.getElementById('particles');
    const symbols = ['★', '◆', '✦', '⬥', '♪', '✧', '◈', '⚡'];

    for (let i = 0; i < 25; i++) {
        const particle = document.createElement('span');
        particle.className = 'particle';
        particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (15 + Math.random() * 25) + 's';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.fontSize = (8 + Math.random() * 10) + 'px';
        container.appendChild(particle);
    }
}

// === Event Listeners ===
function setupEventListeners() {
    // Send message
    document.getElementById('btnSend').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    const textarea = document.getElementById('messageInput');
    textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    });

    // Modal
    document.getElementById('btnAddChar').addEventListener('click', openModal);
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalCancel').addEventListener('click', closeModal);
    document.getElementById('modalCreate').addEventListener('click', createCharacter);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    // Color picker
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            state.selectedColor = option.dataset.color;
        });
    });

    // Emoji picker
    document.querySelectorAll('.emoji-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.emoji-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            state.selectedEmoji = option.dataset.emoji;
        });
    });

    // Clear chat
    document.getElementById('btnClearChat').addEventListener('click', clearChat);

    // Search bar
    document.getElementById('btnSearchToggle').addEventListener('click', toggleSearch);
    document.getElementById('btnSearchClose').addEventListener('click', closeSearch);
    document.getElementById('searchInput').addEventListener('input', filterCharacters);

    // Settings/Profile modal
    document.getElementById('btnSettings').addEventListener('click', openSettings);
    document.getElementById('btnLogout').addEventListener('click', logoutUser);

    // Settings panel navigation
    document.querySelectorAll('#settingsNav .settings-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const panel = btn.dataset.panel;
            if (panel) showSettingsPanel(panel);
        });
    });

    // Modern skin settings button
    document.getElementById('btnSettingsModern').addEventListener('click', openSettings);

    // Skin selector (in skins panel)
    document.querySelectorAll('#skinGrid .theme-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#skinGrid .theme-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            applySkin(option.dataset.skin);
        });
    });

    // Profile switch (in profiles panel)
    document.getElementById('btnAddProfile').addEventListener('click', createProfile);
    document.getElementById('profileSwitchCancel').addEventListener('click', closeSettings);
    document.getElementById('newProfileName').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') createProfile();
    });
    document.getElementById('settingsClose').addEventListener('click', closeSettings);
    document.getElementById('settingsCancel').addEventListener('click', closeSettings);
    document.getElementById('settingsSave').addEventListener('click', saveProfile);
    document.getElementById('settingsOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeSettings();
    });

    // AI Settings (panel uses closeSettings for cancel)
    document.getElementById('aiCancel').addEventListener('click', closeSettings);
    document.getElementById('aiSave').addEventListener('click', saveAiSettings);
    document.getElementById('aiToggle').addEventListener('change', updateAiStatus);

    // Profile emoji picker
    document.querySelectorAll('#profileEmojiPicker .emoji-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#profileEmojiPicker .emoji-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            updateProfilePreview();
        });
    });

    // Profile color picker
    document.querySelectorAll('#profileColorPicker .color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#profileColorPicker .color-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            updateProfilePreview();
        });
    });

    // Chat Theme
    document.getElementById('btnChatTheme').addEventListener('click', openThemeSettings);
    document.getElementById('themeClose').addEventListener('click', closeThemeSettings);
    document.getElementById('themeCancel').addEventListener('click', closeThemeSettings);
    document.getElementById('themeSave').addEventListener('click', saveThemeSettings);
    document.getElementById('themeOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeThemeSettings();
    });
    document.getElementById('bgImageUpload').addEventListener('change', handleBgImageUpload);

    // Background theme options
    document.querySelectorAll('#bgThemeGrid .theme-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#bgThemeGrid .theme-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            if (option.dataset.bg === 'custom') {
                document.getElementById('bgImageUpload').click();
            }
        });
    });

    // Bubble theme options
    document.querySelectorAll('#bubbleThemeGrid .theme-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#bubbleThemeGrid .theme-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
}

// === Render Characters ===
function renderCharacters() {
    const list = document.getElementById('characterList');
    list.innerHTML = '';

    state.characters.forEach(char => {
        const card = document.createElement('div');
        card.className = `character-card${state.activeCharacter === char.id ? ' active' : ''}`;
        card.dataset.id = char.id;

        card.innerHTML = `
            <div class="character-avatar" style="background: linear-gradient(135deg, ${char.color}, ${adjustColor(char.color, -30)});">
                <span>${char.emoji}</span>
                <div class="status-indicator"></div>
            </div>
            <div class="character-info">
                <div class="character-name">${char.name}</div>
                <div class="character-desc">${char.desc}</div>
            </div>
            ${state.unread[char.id] ? `<span class="unread-badge">${state.unread[char.id]}</span>` : ''}
            <button class="btn-delete-char" data-id="${char.id}" title="Eliminar">&times;</button>
        `;

        // Click to select character
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn-delete-char')) {
                selectCharacter(char.id);
            }
        });

        // Delete button
        card.querySelector('.btn-delete-char').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCharacter(char.id);
        });

        list.appendChild(card);
    });

    // Animate unread badges
    list.querySelectorAll('.unread-badge').forEach(badge => {
        badge.classList.add('pop');
    });
}

// === Select Character ===
function selectCharacter(charId) {
    state.activeCharacter = charId;

    // Clear unread for this character
    delete state.unread[charId];
    saveState();
    renderCharacters();

    const char = state.characters.find(c => c.id === charId);
    if (!char) return;

    // Update chat header
    document.getElementById('chatHeaderName').textContent = char.name;
    document.getElementById('chatHeaderStatus').style.background = char.color;
    document.getElementById('chatHeaderStatusText').textContent = 'En linea';

    // Update header avatar: first letter
    document.getElementById('chatHeaderLetter').textContent = char.name.charAt(0).toUpperCase();

    // Update header time
    updateHeaderTime();

    // Apply this character's chat theme
    applyChatTheme();

    // Hide welcome, show messages
    document.getElementById('welcomeScreen').style.display = 'none';

    // Render messages
    renderMessages(charId);

    // Focus input
    document.getElementById('messageInput').focus();
}

// === Render Messages ===
function renderMessages(charId) {
    const container = document.getElementById('messagesContainer');
    const messages = state.messages[charId] || [];

    // Remove old message elements (keep welcome screen)
    container.querySelectorAll('.message').forEach(el => el.remove());

    messages.forEach(msg => {
        const msgEl = createMessageElement(msg);
        container.appendChild(msgEl);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// === Create Message Element ===
function createMessageElement(msg) {
    const div = document.createElement('div');
    div.className = `message ${msg.type === 'sent' ? 'sent' : 'received'}`;

    const char = state.characters.find(c => c.id === state.activeCharacter);
    const avatar = msg.type === 'sent'
        ? `<div class="message-avatar" style="background: ${state.profile.color};">${state.profile.emoji}</div>`
        : `<div class="message-avatar" style="background: linear-gradient(135deg, ${char ? char.color : '#c026d3'}, ${char ? adjustColor(char.color, -30) : '#831843'});">${char ? char.emoji : '🦌'}</div>`;

    const time = msg.time ? new Date(msg.time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '';

    // Process text for bold/italic
    const textHtml = escapeHtml(msg.text)
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    div.innerHTML = `
        ${avatar}
        <div class="message-content">
            <div class="message-bubble">${textHtml}</div>
            <span class="message-time">${time}</span>
        </div>
    `;

    return div;
}

// === Send Message ===
function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text || !state.activeCharacter) return;

    const charId = state.activeCharacter;
    const char = state.characters.find(c => c.id === charId);

    // Create sent message
    const sentMsg = {
        id: generateId(),
        type: 'sent',
        text: text,
        time: new Date().toISOString(),
    };

    if (!state.messages[charId]) state.messages[charId] = [];
    state.messages[charId].push(sentMsg);
    saveState();

    // Add to DOM
    const container = document.getElementById('messagesContainer');
    container.appendChild(createMessageElement(sentMsg));
    container.scrollTop = container.scrollHeight;

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Get response
    getResponse(charId, char);
}

// === Get Response (AI or fallback) ===
async function getResponse(charId, char) {
    // Show typing indicator
    const typingEl = document.getElementById('typingIndicator');
    const typingName = document.getElementById('typingName');
    typingEl.style.display = 'flex';
    typingName.textContent = `${char ? char.name : 'Personaje'} esta escribiendo...`;

    let responseText = null;

    // Try AI first
    if (state.aiEnabled && state.groqApiKey) {
        try {
            responseText = await sendToGroq(charId, char.name, char.desc);
        } catch (e) {
            console.error('AI response error:', e);
        }
    }

    // Fallback to simulated responses
    if (!responseText) {
        const responses = characterResponses[charId] || [
            "Hmm, eso es interesante...",
            "No estoy seguro de que decir a eso.",
            "Dejame pensarlo un momento...",
        ];
        responseText = responses[Math.floor(Math.random() * responses.length)];
    }

    // Hide typing indicator
    typingEl.style.display = 'none';

    // Create received message
    const recvMsg = {
        id: generateId(),
        type: 'received',
        text: responseText,
        time: new Date().toISOString(),
    };

    state.messages[charId].push(recvMsg);
    saveState();

    // Add to DOM
    const container = document.getElementById('messagesContainer');

    // If user switched characters while we were waiting, don't render
    if (state.activeCharacter !== charId) {
        // Increment unread
        state.unread[charId] = (state.unread[charId] || 0) + 1;
        saveState();
        renderCharacters();
        return;
    }

    container.appendChild(createMessageElement(recvMsg));
    container.scrollTop = container.scrollHeight;
}

// === Modal Functions ===
function openModal() {
    document.getElementById('modalOverlay').style.display = 'flex';
    document.getElementById('charName').value = '';
    document.getElementById('charDesc').value = '';
    document.getElementById('charName').focus();
}

function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

function createCharacter() {
    const name = document.getElementById('charName').value.trim();
    const desc = document.getElementById('charDesc').value.trim();
    if (!name) return;

    const char = {
        id: generateId(),
        name: name,
        desc: desc || 'Personaje personalizado',
        color: state.selectedColor,
        emoji: state.selectedEmoji,
    };

    state.characters.push(char);
    state.messages[char.id] = [{
        id: generateId(),
        type: 'received',
        text: getWelcomeMessage(name),
        time: new Date().toISOString(),
    }];
    saveState();
    renderCharacters();
    closeModal();
}

function deleteCharacter(charId) {
    const card = document.querySelector(`.character-card[data-id="${charId}"]`);
    if (!card) return;

    // Add delete animation
    card.style.transition = 'all 0.3s ease';
    card.style.transform = 'translateX(-100%)';
    card.style.opacity = '0';

    setTimeout(() => {
        state.characters = state.characters.filter(c => c.id !== charId);
        delete state.messages[charId];
        delete state.unread[charId];

        if (state.activeCharacter === charId) {
            state.activeCharacter = null;
            document.getElementById('chatHeaderName').textContent = 'Selecciona un personaje';
            document.getElementById('welcomeScreen').style.display = '';
            // Clear messages from DOM
            document.querySelectorAll('#messagesContainer .message').forEach(el => el.remove());
        }

        saveState();
        renderCharacters();
    }, 300);
}

function clearChat() {
    if (!state.activeCharacter) return;

    state.messages[state.activeCharacter] = [{
        id: generateId(),
        type: 'received',
        text: getWelcomeMessage(
            (state.characters.find(c => c.id === state.activeCharacter) || {}).name || 'Personaje'
        ),
        time: new Date().toISOString(),
    }];
    saveState();
    renderMessages(state.activeCharacter);
}

// === Search Functions ===
function toggleSearch() {
    const searchBar = document.getElementById('searchBar');
    const isHidden = searchBar.style.display === 'none' || !searchBar.style.display;
    searchBar.style.display = isHidden ? 'flex' : 'none';
    if (isHidden) {
        document.getElementById('searchInput').focus();
    } else {
        document.getElementById('searchInput').value = '';
        filterCharacters();
    }
}

function closeSearch() {
    document.getElementById('searchBar').style.display = 'none';
    document.getElementById('searchInput').value = '';
    filterCharacters();
}

function filterCharacters() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const cards = document.querySelectorAll('.character-card');

    cards.forEach(card => {
        const name = card.querySelector('.character-name').textContent.toLowerCase();
        card.style.display = name.includes(query) ? '' : 'none';
    });
}

// === Settings Panel (Two-Column Layout) ===

// Save original openSettings if needed
const _originalOpenSettings = openSettings || null;

function openSettings() {
    // If there was an original, call it first
    // Show the settings overlay
    document.getElementById('settingsOverlay').style.display = 'flex';

    // Populate profile fields
    document.getElementById('profileNickname').value = state.profile.nickname;
    const selectedEmoji = document.querySelector('#profileEmojiPicker .emoji-option.selected');
    if (selectedEmoji) {
        document.querySelectorAll('#profileEmojiPicker .emoji-option').forEach(o => o.classList.remove('selected'));
    }
    const matchEmoji = document.querySelector(`#profileEmojiPicker .emoji-option[data-emoji="${state.profile.emoji}"]`);
    if (matchEmoji) matchEmoji.classList.add('selected');
    else document.querySelector('#profileEmojiPicker .emoji-option').classList.add('selected');

    const matchColor = document.querySelector(`#profileColorPicker .color-option[data-color="${state.profile.color}"]`);
    if (matchColor) {
        document.querySelectorAll('#profileColorPicker .color-option').forEach(o => o.classList.remove('selected'));
        matchColor.classList.add('selected');
    }

    // Update skin selection
    document.querySelectorAll('#skinGrid .theme-option').forEach(o => o.classList.remove('selected'));
    const matchSkin = document.querySelector(`#skinGrid .theme-option[data-skin="${state.currentSkin}"]`);
    if (matchSkin) matchSkin.classList.add('selected');
    else document.querySelector('#skinGrid .theme-option').classList.add('selected');

    // Populate AI fields
    document.getElementById('groqApiKeyInput').value = state.groqApiKey;
    document.getElementById('aiToggle').checked = state.aiEnabled;
    updateAiStatus();

    // Render profile list
    renderProfileList();

    // Apply role state (show/hide creator-only items)
    applyRoleState();

    // Show first visible panel
    const firstVisibleBtn = document.querySelector('#settingsNav .settings-nav-btn:not([style*="display: none"])');
    if (firstVisibleBtn && firstVisibleBtn.dataset.panel) {
        showSettingsPanel(firstVisibleBtn.dataset.panel);
    } else {
        showSettingsPanel('profile');
    }
}

function closeSettings() {
    document.getElementById('settingsOverlay').style.display = 'none';
}

function showSettingsPanel(panelName) {
    // Hide all panels
    document.querySelectorAll('.settings-panel-view').forEach(p => {
        p.classList.remove('active');
    });

    // Deselect all nav buttons
    document.querySelectorAll('#settingsNav .settings-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show target panel
    const panelMap = {
        profile: 'panelProfile',
        ai: 'panelAI',
        skins: 'panelSkins',
        profiles: 'panelProfiles',
    };

    const panelId = panelMap[panelName];
    if (panelId) {
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.add('active');
    }

    // Activate nav button
    const navBtn = document.querySelector(`#settingsNav .settings-nav-btn[data-panel="${panelName}"]`);
    if (navBtn) navBtn.classList.add('active');
}

// === Profile Settings ===
function saveProfile() {
    const nickname = document.getElementById('profileNickname').value.trim() || 'Tu';
    const selectedEmoji = document.querySelector('#profileEmojiPicker .emoji-option.selected');
    const selectedColor = document.querySelector('#profileColorPicker .color-option.selected');

    state.profile.nickname = nickname;
    if (selectedEmoji) state.profile.emoji = selectedEmoji.dataset.emoji;
    if (selectedColor) state.profile.color = selectedColor.dataset.color;

    saveState();
    closeSettings();
}

function updateProfilePreview() {
    const selectedEmoji = document.querySelector('#profileEmojiPicker .emoji-option.selected');
    const selectedColor = document.querySelector('#profileColorPicker .color-option.selected');

    if (selectedEmoji) {
        document.getElementById('profileAvatarEmoji').textContent = selectedEmoji.dataset.emoji;
    }
    if (selectedColor) {
        document.querySelector('.profile-avatar-circle').style.background = selectedColor.dataset.color;
    }
}

// === AI Settings ===
function saveAiSettings() {
    const apiKey = document.getElementById('groqApiKeyInput').value.trim();
    const aiEnabled = document.getElementById('aiToggle').checked;

    state.groqApiKey = apiKey;
    state.aiEnabled = aiEnabled;
    saveState();
}

function updateAiStatus() {
    const enabled = document.getElementById('aiToggle').checked;
    const dot = document.getElementById('aiDot');
    const statusText = document.getElementById('aiStatusText');

    if (enabled && state.groqApiKey) {
        dot.style.background = '#4ade80';
        dot.classList.add('pulse');
        statusText.textContent = 'Conectada';
    } else if (enabled) {
        dot.style.background = '#f59e0b';
        dot.classList.remove('pulse');
        statusText.textContent = 'Sin API Key (respuestas predeterminadas)';
    } else {
        dot.style.background = '#ef4444';
        dot.classList.remove('pulse');
        statusText.textContent = 'Desconectada';
    }
}

// closeAiSettings now just delegates to closeSettings
function closeAiSettings() {
    closeSettings();
}

// === Theme Settings ===
function openThemeSettings() {
    document.getElementById('themeOverlay').style.display = 'flex';

    var theme = getCharTheme(state.activeCharacter);
    // Set current background selection
    document.querySelectorAll('#bgThemeGrid .theme-option').forEach(o => o.classList.remove('selected'));
    const matchBg = document.querySelector('#bgThemeGrid .theme-option[data-bg="' + theme.background + '"]');
    if (matchBg) matchBg.classList.add('selected');

    // Set current bubble selection
    document.querySelectorAll('#bubbleThemeGrid .theme-option').forEach(o => o.classList.remove('selected'));
    const matchBubble = document.querySelector('#bubbleThemeGrid .theme-option[data-bubble="' + theme.bubble + '"]');
    if (matchBubble) matchBubble.classList.add('selected');
}

function closeThemeSettings() {
    document.getElementById('themeOverlay').style.display = 'none';
}

function saveThemeSettings() {
    const selectedBg = document.querySelector('#bgThemeGrid .theme-option.selected');
    const selectedBubble = document.querySelector('#bubbleThemeGrid .theme-option.selected');

    if (selectedBg) setCharTheme(state.activeCharacter, 'background', selectedBg.dataset.bg);
    if (selectedBubble) setCharTheme(state.activeCharacter, 'bubble', selectedBubble.dataset.bubble);

    applyChatTheme();
    closeThemeSettings();
}

function handleBgImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const dataUrl = event.target.result;
        document.getElementById('messagesContainer').style.backgroundImage = `url(${dataUrl})`;
        document.getElementById('messagesContainer').style.backgroundSize = 'cover';
        document.getElementById('messagesContainer').style.backgroundPosition = 'center';
        setCharTheme(state.activeCharacter, 'background', 'custom');
        setCharTheme(state.activeCharacter, 'customBgImage', dataUrl);
    };
    reader.readAsDataURL(file);
}

function applyChatTheme() {
    const container = document.getElementById('messagesContainer');
    const theme = getCharTheme(state.activeCharacter);

    // Reset background classes
    container.className = 'messages-container';
    container.style.backgroundImage = '';
    container.style.backgroundSize = '';
    container.style.backgroundPosition = '';

    // Apply background theme
    if (theme.background && theme.background !== 'default') {
        container.classList.add('bg-' + theme.background);
    }

    // Apply custom image if saved
    if (theme.customBgImage) {
        container.style.backgroundImage = 'url(' + theme.customBgImage + ')';
        container.style.backgroundSize = 'cover';
        container.style.backgroundPosition = 'center';
    }

    // Apply bubble theme
    if (theme.bubble && theme.bubble !== 'default') {
        document.body.classList.remove('bubble-whatsapp', 'bubble-dark', 'bubble-neon', 'bubble-pastel');
        document.body.classList.add('bubble-' + theme.bubble);
    } else {
        document.body.classList.remove('bubble-whatsapp', 'bubble-dark', 'bubble-neon', 'bubble-pastel');
    }
}

// === Skin System ===
function applySkin(skinName) {
    // Remove all skin classes
    document.body.className = document.body.className
        .split(' ')
        .filter(c => !c.startsWith('skin-'))
        .join(' ');

    // Apply new skin
    if (skinName && skinName !== 'default') {
        document.body.classList.add('skin-' + skinName);
    }

    state.currentSkin = skinName || 'default';
    saveState();

    // Re-apply role state after skin change
    applyRoleState();
}

// === Role System ===
function applyRoleState() {
    const profiles = getProfileList();
    const creatorId = profiles.length > 0 ? profiles[0].id : null;

    if (creatorId && state.currentProfileId === creatorId) {
        document.body.classList.add('is-creator');
    } else {
        document.body.classList.remove('is-creator');
    }
}

// === Profile System ===
function getProfileList() {
    try {
        return JSON.parse(localStorage.getItem('hazbin-profiles') || '[]');
    } catch {
        return [];
    }
}

function saveProfileList(profiles) {
    localStorage.setItem('hazbin-profiles', JSON.stringify(profiles));
}

function createNewProfile(name) {
    const profiles = getProfileList();
    const id = generateId();
    const isFirst = profiles.length === 0;

    const profile = {
        id: id,
        name: name || 'Perfil',
        creator: isFirst, // First profile is creator
        createdAt: new Date().toISOString(),
    };

    profiles.push(profile);
    saveProfileList(profiles);
    return id;
}

function switchToProfile(profileId) {
    if (!profileId) return;

    // Save current profile state before switching
    const oldProfileId = state.currentProfileId;

    // If switching away from current, save messages
    if (oldProfileId) {
        saveProfileData(oldProfileId);
    }

    state.currentProfileId = profileId;
    state.activeCharacter = null;
    state.messages = {};
    state.unread = {};

    // Load profile data
    loadProfileData(profileId);

    // Update UI
    applyRoleState();
    renderCharacters();

    // Reset chat view
    document.getElementById('chatHeaderName').textContent = 'Selecciona un personaje';
    document.getElementById('welcomeScreen').style.display = '';
    document.querySelectorAll('#messagesContainer .message').forEach(el => el.remove());

    // Apply skin
    if (state.currentSkin && state.currentSkin !== 'default') {
        document.body.classList.add('skin-' + state.currentSkin);
    }
    applyChatTheme();

    saveState();
    closeSettings();
}

function saveProfileData(profileId) {
    localStorage.setItem('hazbin-profile-' + profileId, JSON.stringify({
        messages: state.messages,
        unread: state.unread,
        activeCharacter: state.activeCharacter,
        profile: state.profile,
        groqApiKey: state.groqApiKey,
        aiEnabled: state.aiEnabled,
        charThemes: state.charThemes,
        currentSkin: state.currentSkin,
    }));
}

function loadProfileData(profileId) {
    const data = localStorage.getItem('hazbin-profile-' + profileId);
    if (data) {
        try {
            const parsed = JSON.parse(data);
            state.messages = parsed.messages || {};
            state.unread = parsed.unread || {};
            state.activeCharacter = parsed.activeCharacter || null;
            if (parsed.profile) state.profile = { ...state.profile, ...parsed.profile };
            if (parsed.groqApiKey) state.groqApiKey = parsed.groqApiKey;
            if (typeof parsed.aiEnabled === 'boolean') state.aiEnabled = parsed.aiEnabled;
            // Migrate old global chatTheme to per-character
    if (parsed.chatTheme && !parsed.charThemes) {
        // Old format: apply old theme to all existing characters
        Object.keys(parsed.messages || {}).forEach(cid => {
            if (!parsed.charThemes) parsed.charThemes = {};
            parsed.charThemes[cid] = { ...parsed.chatTheme };
        });
    }
    if (parsed.charThemes) state.charThemes = parsed.charThemes;
            if (parsed.currentSkin) state.currentSkin = parsed.currentSkin;
        } catch (e) {
            console.error('Error loading profile data:', e);
        }
    }
}

function createProfile() {
    const input = document.getElementById('newProfileName');
    const name = input.value.trim();
    if (!name) return;

    const profileId = createNewProfile(name);
    input.value = '';
    renderProfileList();
    applyRoleState();
}

function deleteProfile(profileId) {
    if (!profileId) return;
    const profiles = getProfileList();

    // Cannot delete the first profile (creator)
    if (profiles.length > 0 && profiles[0].id === profileId) {
        alert('No puedes eliminar el perfil del creador.');
        return;
    }

    // Remove profile
    const newProfiles = profiles.filter(p => p.id !== profileId);
    saveProfileList(newProfiles);

    // Remove profile data
    localStorage.removeItem('hazbin-profile-' + profileId);

    // If deleted current profile, switch to creator
    if (state.currentProfileId === profileId && newProfiles.length > 0) {
        switchToProfile(newProfiles[0].id);
        return;
    }

    renderProfileList();
    applyRoleState();
}

function renderProfileList() {
    const listEl = document.getElementById('profileList');
    if (!listEl) return;

    const profiles = getProfileList();
    listEl.innerHTML = '';

    profiles.forEach((profile, index) => {
        const isCreator = profile.creator || index === 0;
        const isCurrent = state.currentProfileId === profile.id;

        const item = document.createElement('div');
        item.className = `profile-item${isCurrent ? ' active' : ''}`;
        item.innerHTML = `
            <div class="profile-item-info">
                <span class="profile-item-name">${escapeHtml(profile.name)}</span>
                ${isCreator ? '<span class="creator-badge">Creador</span>' : ''}
                ${isCurrent ? '<span class="current-badge">Activo</span>' : ''}
            </div>
            <div class="profile-item-actions">
                ${!isCurrent ? `<button class="btn-switch-profile" data-id="${profile.id}" title="Cambiar a este perfil">Cambiar</button>` : ''}
                ${!isCreator && !isCurrent ? `<button class="btn-delete-profile" data-id="${profile.id}" title="Eliminar perfil">&times;</button>` : ''}
            </div>
        `;

        // Switch button
        const switchBtn = item.querySelector('.btn-switch-profile');
        if (switchBtn) {
            switchBtn.addEventListener('click', () => switchToProfile(profile.id));
        }

        // Delete button
        const deleteBtn = item.querySelector('.btn-delete-profile');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Eliminar este perfil? Sus mensajes se perderan.')) {
                    deleteProfile(profile.id);
                }
            });
        }

        listEl.appendChild(item);
    });
}

// === Logout ===
function logoutUser() {
    if (!confirm('Cerrar sesion? Se restableceran los datos del perfil actual.')) return;

    // Save current profile data
    if (state.currentProfileId) {
        saveProfileData(state.currentProfileId);
    }

    // Reset to a fresh state
    state.activeCharacter = null;
    state.messages = {};
    state.unread = {};
    state.profile = {
        nickname: 'Tu',
        emoji: '👤',
        color: '#4ade80',
    };
    state.groqApiKey = '';
    state.aiEnabled = true;
    state.charThemes = {};
    state.currentSkin = 'default';
    state.currentProfileId = null;

    // Clear body classes
    document.body.className = '';

    // Reset UI
    renderCharacters();
    document.getElementById('chatHeaderName').textContent = 'Selecciona un personaje';
    document.getElementById('welcomeScreen').style.display = '';
    document.querySelectorAll('#messagesContainer .message').forEach(el => el.remove());

    applyChatTheme();
    closeSettings();
    saveState();
}

// === Header Clock ===
function updateHeaderTime() {
    var el = document.getElementById('chatHeaderTime');
    if (!el) return;
    var now = new Date();
    var h = now.getHours().toString().padStart(2, '0');
    var m = now.getMinutes().toString().padStart(2, '0');
    el.textContent = h + ':' + m;
}

// === Utilities ===
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function adjustColor(hex, amount) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const num = parseInt(hex, 16);
    let r = Math.min(255, Math.max(0, (num >> 16) + amount));
    let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    let b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// === Initialize on DOM Ready ===
document.addEventListener('DOMContentLoaded', init);
