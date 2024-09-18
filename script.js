let apiKey = localStorage.getItem('groqApiKey') || '';
let isEnglishTranslation = true; // Nouvelle variable pour suivre le mode
let ai = 'Llama 3.1 70b Versatile';

const modelSelector = document.getElementById('modelSelector');
modelSelector.addEventListener('change', () => {
    ai = modelSelector.value;
});


function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    
    // Afficher la clé API existante dans le champ de saisie
    document.getElementById('apiKey').value = apiKey;
}

function saveSettings() {
    apiKey = document.getElementById('apiKey').value;
    if (apiKey) {
        localStorage.setItem('groqApiKey', apiKey);
        showNotification('Clé API sauvegardée', 'success');
        toggleSettings();
    } else {
        showNotification('Veuillez entrer une clé API', 'error');
    }
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.backgroundColor = type === 'success' ? '#4CAF50' : '#F44336';
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function toggleTranslationMode() {
    isEnglishTranslation = !isEnglishTranslation;
    const modeButton = document.getElementById('translationModeButton');
    modeButton.textContent = isEnglishTranslation ? 'Mode : Anglais' : 'Mode : Français';
    showNotification(isEnglishTranslation ? 'Mode traduction anglaise activé' : 'Mode correction française activé', 'success');
}

async function sendMessage() {
    const message = document.getElementById('message').value;

    if (!apiKey) {
        showNotification('Veuillez d\'abord configurer votre clé API dans les réglages', 'error');
        return;
    }

    if (!message) {
        showNotification('Veuillez entrer un message à traduire', 'error');
        return;
    }

    addMessageToChat('Vous', message);

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: isEnglishTranslation
                            ? 'Vous êtes un traducteur. Traduisez le texte suivant en anglais sans l\'interpréter ni ajouter d\'explications. Donnez uniquement et strictement la traduction. ne traduit pas mot pour mot mais plutôt en anglais avec leurs sens.'
                            : 'Vous êtes un correcteur de français. Corrigez le texte suivant en français sans l\'interpréter ni ajouter d\'explications. Donnez uniquement et strictement la correction. rien STRICTEMEMENT le texte ne doit pas contenir d\'explication ni d\'interprétation'
                    },
                    {
                        role: 'user',
                        content: isEnglishTranslation
                            ? 'Traduire ce texte en anglais et donne moi uniquement la traduction sans aucune autre information : ' + message
                            : 'Corrigez ce texte en français et donnez-moi uniquement la correction sans aucune autre information : ' + message
                    }
                ],
                model: ai ,
                temperature: 0.2,
                max_tokens: 1000,
                top_p: 1,
                stream: false,
                stop: null
            })
        });

        const data = await response.json();
        const result = data.choices[0].message.content;
        addMessageToChat('', result, true);
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de traitement. Vérifiez votre clé API et réessayez.', 'error');
    }

    document.getElementById('message').value = '';
}

function addMessageToChat(sender, content, isTranslation = false) {
    const chatDiv = document.getElementById('chat');
    const messageElement = document.createElement('p');
    messageElement.innerHTML = sender ? `<strong>${sender}:</strong> ${content}` : content;
    
    if (isTranslation) {
        messageElement.onclick = function() {
            navigator.clipboard.writeText(content).then(() => {
                showNotification('Traduction copiée !', 'success');
            }, () => {
                showNotification('Erreur lors de la copie', 'error');
            });
        };
    }
    
    chatDiv.appendChild(messageElement);
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

// Ajoutez cette fonction pour vérifier la clé API au chargement de la page
function checkApiKey() {
    if (!apiKey) {
        showNotification('Veuillez configurer votre clé API dans les réglages', 'error');
    }
}

// Appelez cette fonction au chargement de la page
window.onload = checkApiKey;