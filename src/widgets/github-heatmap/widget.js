import { WidgetStorage } from '../../core/WidgetStorage.js';

let storage;
let githubUsername = '';
let githubToken = '';
let contributionsData = [];

// Initialize
window.addEventListener('message', async (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        storage = new WidgetStorage(message.widgetId);
        await initialize();
    }
});

async function initialize() {
    githubUsername = await storage.get('githubUsername') || '';
    githubToken = await storage.get('githubToken') || '';
    
    if (githubUsername && githubToken) {
        await fetchContributions();
        renderHeatmap();
        updateUsernameDisplay();
    } else {
        displayConfigurationMessage();
    }
}

function updateUsernameDisplay() {
    const usernameElement = document.getElementById('github-username');
    usernameElement.textContent = `@${githubUsername}'s contributions`;
}

function displayConfigurationMessage() {
    const container = document.getElementById('contributions-heatmap');
    container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #b0b0b6;">
            Please configure your GitHub username and personal access token in the settings.
        </div>
    `;
}

async function fetchContributions() {
    try {
        const query = `
            query {
                user(login: "${githubUsername}") {
                    contributionsCollection {
                        contributionCalendar {
                            totalContributions
                            weeks {
                                firstDay
                                contributionDays {
                                    date
                                    contributionCount
                                    color
                                }
                            }
                        }
                    }
                }
            }
        `;

        const response = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        
        if (data.errors) {
            throw new Error(data.errors[0].message);
        }

        // Store the weeks data directly 
        contributionsData = data.data.user.contributionsCollection.contributionCalendar.weeks;
        
        // Force data reload including today
        const today = new Date().toISOString().split('T')[0];
        console.log("Today's date:", today);
    } catch (error) {
        console.error('Error fetching GitHub contributions:', error);
        document.getElementById('contributions-heatmap').innerHTML = `
            <div style="color: #f85149; padding: 10px; border: 1px solid rgba(248, 81, 73, 0.4); background-color: rgba(248, 81, 73, 0.1); border-radius: 6px;">
                Error fetching contributions: ${error.message}
            </div>
        `;
    }
}

function getContributionLevel(count) {
    if (count === 0) return 0;
    if (count <= 3) return 1;
    if (count <= 6) return 2;
    if (count <= 9) return 3;
    return 4;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function renderHeatmap() {
    const container = document.getElementById('contributions-heatmap');
    container.innerHTML = '';
    
    if (!contributionsData || contributionsData.length === 0) {
        container.innerHTML = '<div style="color: #b0b0b6; padding: 20px;">No contribution data available.</div>';
        return;
    }
    
    // Process each week directly in chronological order
    contributionsData.forEach(week => {
        // Sort days by date to ensure they're in chronological order
        const sortedDays = [...week.contributionDays].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
        
        const weekRow = document.createElement('div');
        weekRow.className = 'week-row';
        
        // Fill in each day in the week (ensuring we have 7 days)
        const days = [];
        const startDate = new Date(week.firstDay);
        
        // Create 7 days starting from the week's first day
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const currentDateStr = currentDate.toISOString().split('T')[0];
            
            // Find if we have data for this day
            const dayData = sortedDays.find(day => day.date === currentDateStr);
            
            const cell = document.createElement('div');
            
            if (dayData) {
                // If we have data for this day
                const level = getContributionLevel(dayData.contributionCount);
                cell.className = `contribution-cell contribution-level-${level}`;
                
                const tooltip = document.createElement('div');
                tooltip.className = 'contribution-tooltip';
                tooltip.textContent = `${dayData.contributionCount} contributions on ${formatDate(dayData.date)}`;
                
                cell.appendChild(tooltip);
            } else {
                // Empty cell for days without data
                cell.className = 'contribution-cell empty-cell';
                
                // Create tooltip for empty days too
                const tooltip = document.createElement('div');
                tooltip.className = 'contribution-tooltip';
                tooltip.textContent = `0 contributions on ${formatDate(currentDateStr)}`;
                cell.appendChild(tooltip);
            }
            
            days.push(cell);
        }
        
        // Add all days to the row
        days.forEach(day => weekRow.appendChild(day));
        container.appendChild(weekRow);
    });
} 