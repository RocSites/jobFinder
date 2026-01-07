/**
 * Parse compensation string like "$150k-$175k" or "150000-175000"
 * into structured format
 */
export const parseCompensation = (compString) => {
  if (!compString) return { min: null, max: null, currency: 'USD', raw: '' };
  
  const raw = compString.toString().trim();
  
  // Remove currency symbols and k/K
  const cleaned = raw.replace(/[$,]/g, '').replace(/k/gi, '000');
  
  // Try to match range pattern (e.g., "150000-175000")
  const rangeMatch = cleaned.match(/(\d+)\s*-\s*(\d+)/);
  
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1]),
      max: parseInt(rangeMatch[2]),
      currency: 'USD',
      raw
    };
  }
  
  // Single number
  const singleMatch = cleaned.match(/(\d+)/);
  if (singleMatch) {
    const amount = parseInt(singleMatch[1]);
    return {
      min: amount,
      max: amount,
      currency: 'USD',
      raw
    };
  }
  
  return { min: null, max: null, currency: 'USD', raw };
};

/**
 * Parse date string to Date object
 */
export const parseDate = (dateString) => {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Clean and normalize text fields
 */
export const cleanText = (text) => {
  if (!text) return '';
  return text.toString().trim();
};

/**
 * Clean and normalize email
 */
export const cleanEmail = (email) => {
  if (!email) return '';
  return email.toString().toLowerCase().trim();
};
