/**
 * Security Utilities
 * Input validation, sanitization, and security checks
 */

/**
 * Validates email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

/**
 * Validates password strength
 * Requirements: min 12 chars, uppercase, lowercase, number, symbol
 */
export const validatePasswordStrength = (password) => {
  if (!password || password.length < 12) {
    return { valid: false, error: 'Password must be at least 12 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain uppercase letters' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain lowercase letters' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain numbers' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain special characters (!@#$%^&*etc)' };
  }
  return { valid: true };
};

/**
 * Sanitizes user input to prevent XSS
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .substring(0, 1000); // Limit length
};

/**
 * Validates name (alphanumeric, spaces, hyphens, apostrophes)
 */
export const validateName = (name) => {
  if (!name || name.length < 2 || name.length > 255) return false;
  return /^[a-zA-Z\s\-']+$/.test(name);
};

/**
 * Validates employee ID format
 */
export const validateEmployeeId = (employeeId) => {
  if (!employeeId || employeeId.length < 1 || employeeId.length > 100) return false;
  return /^[a-zA-Z0-9\-_]+$/.test(employeeId);
};

/**
 * Validates country code
 */
export const validateCountryCode = (code, validCountries = ['PA', 'VE']) => {
  return validCountries.includes(code?.toUpperCase());
};

/**
 * Validates OTP code (6 digits)
 */
export const validateOTP = (otp) => {
  return /^\d{6}$/.test(otp);
};

/**
 * Validates registration token format
 */
export const validateRegistrationToken = (token) => {
  return /^[a-zA-Z0-9]{32}$/.test(token);
};

/**
 * Validates file content for bulk import (CSV)
 */
export const validateBulkImportData = (data) => {
  const errors = [];
  const lines = data.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    errors.push('No data provided');
    return { valid: false, errors };
  }

  if (lines.length > 1000) {
    errors.push('Maximum 1000 records allowed per import');
    return { valid: false, errors };
  }

  lines.forEach((line, index) => {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 4) {
      errors.push(`Line ${index + 1}: Invalid format (expected 4 fields)`);
      return;
    }

    const [email, name, country, employeeId] = parts;

    if (!validateEmail(email)) {
      errors.push(`Line ${index + 1}: Invalid email "${email}"`);
    }
    if (name && !validateName(name)) {
      errors.push(`Line ${index + 1}: Invalid name "${name}"`);
    }
    if (!validateCountryCode(country)) {
      errors.push(`Line ${index + 1}: Invalid country "${country}"`);
    }
    if (!validateEmployeeId(employeeId)) {
      errors.push(`Line ${index + 1}: Invalid employee ID "${employeeId}"`);
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Rate limiting utility (client-side)
 * Prevents rapid-fire requests
 */
export class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }

    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  reset(key) {
    this.attempts.delete(key);
  }
}

/**
 * Checks if sensitive data is being logged
 * (for debugging - remove in production)
 */
export const isProductionEnvironment = () => {
  return import.meta.env.MODE === 'production' || import.meta.env.PROD;
};

/**
 * Safe console logging that excludes production
 */
export const safeLog = (message, data = null) => {
  if (!isProductionEnvironment()) {
    console.log(message, data);
  }
};

/**
 * Hash a string (simple hash, not cryptographic)
 * For display purposes only, not security-critical
 */
export const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
};

export default {
  validateEmail,
  validatePasswordStrength,
  sanitizeInput,
  validateName,
  validateEmployeeId,
  validateCountryCode,
  validateOTP,
  validateRegistrationToken,
  validateBulkImportData,
  RateLimiter,
  isProductionEnvironment,
  safeLog,
  simpleHash
};
