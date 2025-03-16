// Constants
export const Hemisphere = {
    NORTHERN: 'northern',
    SOUTHERN: 'southern'
};

// The synodic month (lunar cycle) is approximately 29.53059 days
const LUNAR_CYCLE = 29.53059;

// Base date for calculation (known new moon)
const KNOWN_NEW_MOON = new Date('2000-01-06T12:24:00.000Z');

/**
 * Calculate the current lunar age (days since new moon)
 * @param {Date} date - The date to calculate for
 * @returns {number} - Age of the moon in days (0-29.53)
 */
export function getLunarAge(date) {
    // Convert both dates to milliseconds since epoch
    const currentMs = date.getTime();
    const knownNewMoonMs = KNOWN_NEW_MOON.getTime();
    
    // Calculate days since the known new moon
    const daysSinceKnown = (currentMs - knownNewMoonMs) / (1000 * 60 * 60 * 24);
    
    // Get the age in the current cycle
    return daysSinceKnown % LUNAR_CYCLE;
}

/**
 * Get the current lunar phase name
 * @param {Date} date - The date to check
 * @returns {string} - Name of the lunar phase
 */
export function lunarPhase(date) {
    const age = getLunarAge(date);
    
    // Define the phase boundaries and names
    if (age < 1.84566) return "New Moon";
    if (age < 5.53699) return "Waxing Crescent";
    if (age < 9.22831) return "First Quarter";
    if (age < 12.91963) return "Waxing Gibbous";
    if (age < 16.61096) return "Full Moon";
    if (age < 20.30228) return "Waning Gibbous";
    if (age < 23.99361) return "Last Quarter";
    if (age < 27.68493) return "Waning Crescent";
    return "New Moon";
}

/**
 * Get the lunar phase emoji
 * @param {Date} date - The date to check
 * @param {Object} options - Options for display
 * @param {string} options.hemisphere - 'northern' or 'southern'
 * @returns {string} - Emoji representing the lunar phase
 */
export function lunarPhaseEmoji(date, options = { hemisphere: Hemisphere.NORTHERN }) {
    const age = getLunarAge(date);
    const hemisphere = options.hemisphere;
    
    // Emoji mapping based on lunar age
    // Different hemispheres see the moon "flipped" horizontally
    if (hemisphere === Hemisphere.SOUTHERN) {
        if (age < 1.84566) return "🌑"; // New Moon
        if (age < 5.53699) return "🌒"; // Waxing Crescent
        if (age < 9.22831) return "🌓"; // First Quarter
        if (age < 12.91963) return "🌔"; // Waxing Gibbous
        if (age < 16.61096) return "🌕"; // Full Moon
        if (age < 20.30228) return "🌖"; // Waning Gibbous
        if (age < 23.99361) return "🌗"; // Last Quarter
        if (age < 27.68493) return "🌘"; // Waning Crescent
        return "🌑"; // New Moon
    } else {
        if (age < 1.84566) return "🌑"; // New Moon
        if (age < 5.53699) return "🌒"; // Waxing Crescent
        if (age < 9.22831) return "🌓"; // First Quarter
        if (age < 12.91963) return "🌔"; // Waxing Gibbous
        if (age < 16.61096) return "🌕"; // Full Moon
        if (age < 20.30228) return "🌖"; // Waning Gibbous
        if (age < 23.99361) return "🌗"; // Last Quarter
        if (age < 27.68493) return "🌘"; // Waning Crescent
        return "🌑"; // New Moon
    }
}

/**
 * Calculate the date of the next full moon
 * @param {Date} date - The current date
 * @returns {Date} - Date of the next full moon
 */
export function nextFullMoonDate(date) {
    const age = getLunarAge(date);
    const fullMoonAge = 14.77; // Middle of full moon phase
    
    let daysUntilFullMoon;
    
    if (age < fullMoonAge) {
        // Full moon is later in this cycle
        daysUntilFullMoon = fullMoonAge - age;
    } else {
        // Full moon is in the next cycle
        daysUntilFullMoon = LUNAR_CYCLE - age + fullMoonAge;
    }
    
    // Create a new date for the next full moon
    const nextFullMoon = new Date(date.getTime());
    nextFullMoon.setTime(date.getTime() + daysUntilFullMoon * 24 * 60 * 60 * 1000);
    
    return nextFullMoon;
} 