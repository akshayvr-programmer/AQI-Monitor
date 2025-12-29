/**
 * AQI Service - Air Quality Index calculations and utilities
 * Based on US EPA AQI standards
 */

/**
 * AQI Categories with color codes and descriptions
 */
export const AQI_CATEGORIES = [
  {
    level: 'Good',
    range: [0, 50],
    color: '#00e400',
    textColor: '#000',
    description: 'Air quality is satisfactory, and air pollution poses little or no risk.'
  },
  {
    level: 'Moderate',
    range: [51, 100],
    color: '#ffff00',
    textColor: '#000',
    description: 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.'
  },
  {
    level: 'Unhealthy for Sensitive Groups',
    range: [101, 150],
    color: '#ff7e00',
    textColor: '#000',
    description: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.'
  },
  {
    level: 'Unhealthy',
    range: [151, 200],
    color: '#ff0000',
    textColor: '#fff',
    description: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.'
  },
  {
    level: 'Very Unhealthy',
    range: [201, 300],
    color: '#8f3f97',
    textColor: '#fff',
    description: 'Health alert: The risk of health effects is increased for everyone.'
  },
  {
    level: 'Hazardous',
    range: [301, 500],
    color: '#7e0023',
    textColor: '#fff',
    description: 'Health warning of emergency conditions: everyone is more likely to be affected.'
  }
];

/**
 * Get AQI category information based on AQI value
 * @param {number} aqi - The AQI value
 * @returns {object} Category information including level, color, and description
 */
export const getAQICategory = (aqi) => {
  if (!aqi || aqi < 0) {
    return {
      level: 'Unknown',
      color: '#999',
      textColor: '#fff',
      description: 'No data available'
    };
  }

  for (const category of AQI_CATEGORIES) {
    if (aqi >= category.range[0] && aqi <= category.range[1]) {
      return category;
    }
  }

  // If AQI is above 500 (beyond hazardous)
  return {
    level: 'Beyond Hazardous',
    color: '#7e0023',
    textColor: '#fff',
    description: 'Extremely hazardous conditions. Everyone should avoid all outdoor exertion.'
  };
};

/**
 * Calculate AQI from pollutant concentration
 * Based on US EPA AQI breakpoints
 * @param {string} pollutant - Pollutant type (pm25, pm10, o3, no2, so2, co)
 * @param {number} concentration - Concentration in µg/m³ or ppm
 * @returns {number} Calculated AQI value
 */
export const calculateAQI = (pollutant, concentration) => {
  // AQI breakpoints for different pollutants
  const breakpoints = {
    pm25: [
      { cLow: 0.0, cHigh: 12.0, aqiLow: 0, aqiHigh: 50 },
      { cLow: 12.1, cHigh: 35.4, aqiLow: 51, aqiHigh: 100 },
      { cLow: 35.5, cHigh: 55.4, aqiLow: 101, aqiHigh: 150 },
      { cLow: 55.5, cHigh: 150.4, aqiLow: 151, aqiHigh: 200 },
      { cLow: 150.5, cHigh: 250.4, aqiLow: 201, aqiHigh: 300 },
      { cLow: 250.5, cHigh: 500.4, aqiLow: 301, aqiHigh: 500 }
    ],
    pm10: [
      { cLow: 0, cHigh: 54, aqiLow: 0, aqiHigh: 50 },
      { cLow: 55, cHigh: 154, aqiLow: 51, aqiHigh: 100 },
      { cLow: 155, cHigh: 254, aqiLow: 101, aqiHigh: 150 },
      { cLow: 255, cHigh: 354, aqiLow: 151, aqiHigh: 200 },
      { cLow: 355, cHigh: 424, aqiLow: 201, aqiHigh: 300 },
      { cLow: 425, cHigh: 604, aqiLow: 301, aqiHigh: 500 }
    ],
    o3: [
      { cLow: 0, cHigh: 54, aqiLow: 0, aqiHigh: 50 },
      { cLow: 55, cHigh: 70, aqiLow: 51, aqiHigh: 100 },
      { cLow: 71, cHigh: 85, aqiLow: 101, aqiHigh: 150 },
      { cLow: 86, cHigh: 105, aqiLow: 151, aqiHigh: 200 },
      { cLow: 106, cHigh: 200, aqiLow: 201, aqiHigh: 300 }
    ],
    no2: [
      { cLow: 0, cHigh: 53, aqiLow: 0, aqiHigh: 50 },
      { cLow: 54, cHigh: 100, aqiLow: 51, aqiHigh: 100 },
      { cLow: 101, cHigh: 360, aqiLow: 101, aqiHigh: 150 },
      { cLow: 361, cHigh: 649, aqiLow: 151, aqiHigh: 200 },
      { cLow: 650, cHigh: 1249, aqiLow: 201, aqiHigh: 300 },
      { cLow: 1250, cHigh: 2049, aqiLow: 301, aqiHigh: 500 }
    ],
    so2: [
      { cLow: 0, cHigh: 35, aqiLow: 0, aqiHigh: 50 },
      { cLow: 36, cHigh: 75, aqiLow: 51, aqiHigh: 100 },
      { cLow: 76, cHigh: 185, aqiLow: 101, aqiHigh: 150 },
      { cLow: 186, cHigh: 304, aqiLow: 151, aqiHigh: 200 },
      { cLow: 305, cHigh: 604, aqiLow: 201, aqiHigh: 300 },
      { cLow: 605, cHigh: 1004, aqiLow: 301, aqiHigh: 500 }
    ],
    co: [
      { cLow: 0.0, cHigh: 4.4, aqiLow: 0, aqiHigh: 50 },
      { cLow: 4.5, cHigh: 9.4, aqiLow: 51, aqiHigh: 100 },
      { cLow: 9.5, cHigh: 12.4, aqiLow: 101, aqiHigh: 150 },
      { cLow: 12.5, cHigh: 15.4, aqiLow: 151, aqiHigh: 200 },
      { cLow: 15.5, cHigh: 30.4, aqiLow: 201, aqiHigh: 300 },
      { cLow: 30.5, cHigh: 50.4, aqiLow: 301, aqiHigh: 500 }
    ]
  };

  const pollutantBreakpoints = breakpoints[pollutant.toLowerCase()];
  if (!pollutantBreakpoints) {
    return null;
  }

  // Find the appropriate breakpoint range
  let breakpoint = null;
  for (const bp of pollutantBreakpoints) {
    if (concentration >= bp.cLow && concentration <= bp.cHigh) {
      breakpoint = bp;
      break;
    }
  }

  // If concentration is beyond the highest breakpoint
  if (!breakpoint && concentration > pollutantBreakpoints[pollutantBreakpoints.length - 1].cHigh) {
    breakpoint = pollutantBreakpoints[pollutantBreakpoints.length - 1];
  }

  if (!breakpoint) {
    return null;
  }

  // Calculate AQI using the formula
  const { cLow, cHigh, aqiLow, aqiHigh } = breakpoint;
  const aqi = ((aqiHigh - aqiLow) / (cHigh - cLow)) * (concentration - cLow) + aqiLow;
  
  return Math.round(aqi);
};

/**
 * Calculate composite AQI from multiple pollutants
 * Returns the highest AQI among all pollutants
 * @param {object} pollutants - Object containing pollutant concentrations
 * @returns {number} The highest AQI value
 */
export const calculateCompositeAQI = (pollutants) => {
  const aqiValues = [];

  for (const [pollutant, concentration] of Object.entries(pollutants)) {
    if (concentration !== null && concentration > 0) {
      const aqi = calculateAQI(pollutant, concentration);
      if (aqi !== null) {
        aqiValues.push(aqi);
      }
    }
  }

  return aqiValues.length > 0 ? Math.max(...aqiValues) : 0;
};

/**
 * Get health message based on AQI
 * @param {number} aqi - The AQI value
 * @returns {string} Health message
 */
export const getHealthMessage = (aqi) => {
  if (aqi <= 50) {
    return 'Air quality is good. It\'s a great day to be active outside.';
  } else if (aqi <= 100) {
    return 'Air quality is acceptable. Unusually sensitive people should consider limiting prolonged outdoor exertion.';
  } else if (aqi <= 150) {
    return 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.';
  } else if (aqi <= 200) {
    return 'Everyone may begin to experience health effects. Members of sensitive groups may experience more serious health effects.';
  } else if (aqi <= 300) {
    return 'Health alert: everyone may experience more serious health effects. Avoid prolonged outdoor exertion.';
  } else {
    return 'Health warnings of emergency conditions. Everyone should avoid all outdoor exertion.';
  }
};

/**
 * Format AQI value for display
 * @param {number} aqi - The AQI value
 * @returns {string} Formatted AQI string
 */
export const formatAQI = (aqi) => {
  if (!aqi || aqi < 0) return 'N/A';
  return Math.round(aqi).toString();
};

/**
 * Get dominant pollutant from pollutants object
 * @param {object} pollutants - Object containing pollutant concentrations
 * @returns {string} Name of dominant pollutant
 */
export const getDominantPollutant = (pollutants) => {
  let maxAQI = 0;
  let dominant = 'pm25';

  for (const [pollutant, concentration] of Object.entries(pollutants)) {
    if (concentration !== null && concentration > 0) {
      const aqi = calculateAQI(pollutant, concentration);
      if (aqi && aqi > maxAQI) {
        maxAQI = aqi;
        dominant = pollutant;
      }
    }
  }

  return dominant;
};

/**
 * Get pollutant name in readable format
 * @param {string} pollutant - Pollutant code
 * @returns {string} Readable pollutant name
 */
export const getPollutantName = (pollutant) => {
  const names = {
    pm25: 'PM2.5',
    pm10: 'PM10',
    o3: 'Ozone',
    no2: 'Nitrogen Dioxide',
    so2: 'Sulfur Dioxide',
    co: 'Carbon Monoxide'
  };
  return names[pollutant.toLowerCase()] || pollutant.toUpperCase();
};

/**
 * Validate AQI value
 * @param {number} aqi - The AQI value to validate
 * @returns {boolean} True if valid
 */
export const isValidAQI = (aqi) => {
  return typeof aqi === 'number' && aqi >= 0 && aqi <= 999;
};

export default {
  AQI_CATEGORIES,
  getAQICategory,
  calculateAQI,
  calculateCompositeAQI,
  getHealthMessage,
  formatAQI,
  getDominantPollutant,
  getPollutantName,
  isValidAQI
};