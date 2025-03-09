import { WidgetStorage } from '../../core/WidgetStorage.js';

let storage;
let githubUsername = '';
let githubToken = '';
let contributionsData = [];
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

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
    } else {
        displayConfigurationMessage();
    }
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
        // Check if cached data exists and is still valid
        const cachedTimestamp = await storage.get('contributionsTimestamp') || 0;
        const currentTime = Date.now();
        
        // If cache is valid, use cached data
        if (currentTime - cachedTimestamp < CACHE_DURATION) {
            const cachedData = await storage.get('contributionsData');
            if (cachedData) {
                console.log("Using cached GitHub contributions data");
                contributionsData = JSON.parse(cachedData);
                return;
            }
        }
        
        // Cache is invalid or doesn't exist, fetch fresh data
        console.log("Fetching fresh GitHub contributions data");
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
        
        // Cache the data and timestamp
        await storage.set('contributionsData', JSON.stringify(contributionsData));
        await storage.set('contributionsTimestamp', currentTime);
        
        console.log("Contributions data:", contributionsData);

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
    const date = new Date(dateString + 'T00:00:00Z'); // Force UTC
    return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'UTC'
    });
}

function renderHeatmap() {
    const container = document.getElementById('contributions-heatmap');
    container.innerHTML = '';
    
    if (!contributionsData || contributionsData.length === 0) {
        container.innerHTML = '<div style="color: #b0b0b6; padding: 20px;">No contribution data available.</div>';
        return;
    }

    // Create a map to track unique months
    const months = new Map();
    
    // Process weeks in reverse order
    for (let i = contributionsData.length - 1; i >= 0; i--) {
        const week = contributionsData[i];
        const monthString = new Date(week.firstDay + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
        console.log(week.firstDay);
        const month = week.firstDay.split('-').slice(0, 2).join('-');
        console.log(month);
        
        // Create month if it doesn't exist
        if (!months.has(month)) {
            const monthContainer = document.createElement('div');
            monthContainer.className = 'month-container';

            const monthText = document.createElement('div');
            monthText.className = 'month-text';
            monthText.textContent = monthString;
            monthContainer.appendChild(monthText);
            
            const weeksContainer = document.createElement('div');
            weeksContainer.className = 'weeks-container';
            monthContainer.appendChild(weeksContainer);
            
            months.set(month, {
                monthContainer,
                weeksContainer
            });
            container.appendChild(monthContainer);
        }

        const weekRow = document.createElement('div');
        weekRow.className = 'week-row';
        months.get(month).weeksContainer.appendChild(weekRow);

        // Process days in reverse order
        const days = [...week.contributionDays].reverse();
        for (const day of days) {
            const level = getContributionLevel(day.contributionCount);
    
            const cell = document.createElement('div');
            cell.className = `contribution-cell contribution-level-${level}`;
    
            const tooltip = document.createElement('div');
            tooltip.className = 'contribution-tooltip';
            tooltip.textContent = `${day.contributionCount} contributions on ${formatDate(day.date)}`;
    
            cell.appendChild(tooltip);
            weekRow.appendChild(cell);
        }
    }
}
