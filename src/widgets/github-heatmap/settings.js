import { WidgetStorage } from '../../core/WidgetStorage.js';

let storage;
let githubUsername = '';
let githubToken = '';

// Initialize
window.addEventListener('message', async (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        storage = new WidgetStorage(message.widgetId);
        await initialize();
    }
});

async function initialize() {
    // Load existing settings
    githubUsername = await storage.get('githubUsername') || '';
    githubToken = await storage.get('githubToken') || '';
    
    // Set up form with existing values
    document.getElementById('github-username').value = githubUsername;
    document.getElementById('github-token').value = githubToken;
    
    // Set up event listeners
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    document.getElementById('toggle-token-visibility').addEventListener('click', toggleTokenVisibility);
}

function toggleTokenVisibility() {
    const tokenInput = document.getElementById('github-token');
    const toggleButton = document.getElementById('toggle-token-visibility');
    
    if (tokenInput.type === 'password') {
        tokenInput.type = 'text';
        toggleButton.textContent = 'Hide';
    } else {
        tokenInput.type = 'password';
        toggleButton.textContent = 'Show';
    }
}

async function saveSettings() {
    const usernameInput = document.getElementById('github-username');
    const tokenInput = document.getElementById('github-token');
    const statusMessage = document.getElementById('status-message');
    
    const newUsername = usernameInput.value.trim();
    const newToken = tokenInput.value.trim();
    
    if (!newUsername) {
        showErrorMessage('GitHub username is required');
        return;
    }
    
    if (!newToken) {
        showErrorMessage('GitHub personal access token is required');
        return;
    }
    
    // Validate the token by making a test request
    try {
        const valid = await validateGitHubToken(newUsername, newToken);
        if (!valid) {
            showErrorMessage('Invalid GitHub token or username. Please check your credentials.');
            return;
        }
    } catch (error) {
        showErrorMessage(`Error validating token: ${error.message}`);
        return;
    }
    
    // Save settings
    await storage.set('githubUsername', newUsername);
    await storage.set('githubToken', newToken);
    
    githubUsername = newUsername;
    githubToken = newToken;
    
    showSuccessMessage('Settings saved successfully!');
}

async function validateGitHubToken(username, token) {
    try {
        const query = `
            query {
                user(login: "${username}") {
                    login
                }
            }
        `;
        
        const response = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });
        
        const data = await response.json();
        
        if (data.errors) {
            console.error('GitHub API Error:', data.errors);
            return false;
        }
        
        return data.data?.user?.login === username;
    } catch (error) {
        console.error('Error validating token:', error);
        return false;
    }
}

function showSuccessMessage(message) {
    const statusMessage = document.getElementById('status-message');
    statusMessage.innerHTML = `
        <div style="background-color: rgba(63, 185, 80, 0.1); border: 1px solid rgba(63, 185, 80, 0.4); padding: 8px 12px; border-radius: 6px;">
            ${message}
        </div>
    `;
    statusMessage.className = 'success-message';
}

function showErrorMessage(message) {
    const statusMessage = document.getElementById('status-message');
    statusMessage.innerHTML = `
        <div style="background-color: rgba(248, 81, 73, 0.1); border: 1px solid rgba(248, 81, 73, 0.4); padding: 8px 12px; border-radius: 6px;">
            ${message}
        </div>
    `;
    statusMessage.className = 'error-message';
} 