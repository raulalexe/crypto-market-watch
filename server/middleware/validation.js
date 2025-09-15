// Input validation middleware
const validator = require('validator');

// Email validation
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required and must be a string' };
  }
  
  if (!validator.isEmail(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  if (email.length > 255) {
    return { valid: false, error: 'Email is too long (max 255 characters)' };
  }
  
  return { valid: true };
};

// Password validation
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required and must be a string' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password is too long (max 128 characters)' };
  }
  
  // Check for at least one uppercase letter, one lowercase letter, and one number
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return { 
      valid: false, 
      error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
    };
  }
  
  return { valid: true };
};

// Name validation
const validateName = (name, fieldName = 'Name') => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${fieldName} is required and must be a string` };
  }
  
  if (name.trim().length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters long` };
  }
  
  if (name.length > 100) {
    return { valid: false, error: `${fieldName} is too long (max 100 characters)` };
  }
  
  // Check for only alphanumeric characters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z0-9\s\-']+$/.test(name)) {
    return { valid: false, error: `${fieldName} contains invalid characters` };
  }
  
  return { valid: true };
};

// Sanitize string input
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return validator.escape(str.trim());
};

// Validate and sanitize request body
const validateRequestBody = (validationRules) => {
  return (req, res, next) => {
    const errors = [];
    const sanitizedData = {};
    
    // Check if body exists
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Request body is required' });
    }
    
    // Validate each field
    for (const [fieldName, rules] of Object.entries(validationRules)) {
      const value = req.body[fieldName];
      
      // Check if required field is present
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${fieldName} is required`);
        continue;
      }
      
      // Skip validation if field is not required and not present
      if (!rules.required && (value === undefined || value === null || value === '')) {
        continue;
      }
      
      // Validate based on type
      switch (rules.type) {
        case 'email':
          const emailValidation = validateEmail(value);
          if (!emailValidation.valid) {
            errors.push(emailValidation.error);
          } else {
            sanitizedData[fieldName] = sanitizeString(value);
          }
          break;
          
        case 'password':
          const passwordValidation = validatePassword(value);
          if (!passwordValidation.valid) {
            errors.push(passwordValidation.error);
          } else {
            sanitizedData[fieldName] = value; // Don't sanitize passwords
          }
          break;
          
        case 'name':
          const nameValidation = validateName(value, fieldName);
          if (!nameValidation.valid) {
            errors.push(nameValidation.error);
          } else {
            sanitizedData[fieldName] = sanitizeString(value);
          }
          break;
          
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`${fieldName} must be a string`);
          } else {
            const maxLength = rules.maxLength || 1000;
            if (value.length > maxLength) {
              errors.push(`${fieldName} is too long (max ${maxLength} characters)`);
            } else {
              sanitizedData[fieldName] = sanitizeString(value);
            }
          }
          break;
          
        case 'number':
          if (typeof value !== 'number' && !validator.isNumeric(String(value))) {
            errors.push(`${fieldName} must be a number`);
          } else {
            const numValue = Number(value);
            if (rules.min !== undefined && numValue < rules.min) {
              errors.push(`${fieldName} must be at least ${rules.min}`);
            }
            if (rules.max !== undefined && numValue > rules.max) {
              errors.push(`${fieldName} must be at most ${rules.max}`);
            }
            sanitizedData[fieldName] = numValue;
          }
          break;
          
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`${fieldName} must be a boolean`);
          } else {
            sanitizedData[fieldName] = value;
          }
          break;
          
        default:
          sanitizedData[fieldName] = value;
      }
    }
    
    // Check for extra fields if not allowed
    if (validationRules.allowExtra === false) {
      const allowedFields = Object.keys(validationRules).filter(key => key !== 'allowExtra');
      const extraFields = Object.keys(req.body).filter(field => !allowedFields.includes(field));
      if (extraFields.length > 0) {
        errors.push(`Unexpected fields: ${extraFields.join(', ')}`);
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors 
      });
    }
    
    // Replace request body with sanitized data
    req.body = sanitizedData;
    next();
  };
};

// Common validation rules
const VALIDATION_RULES = {
  userRegistration: {
    email: { type: 'email', required: true },
    password: { type: 'password', required: true },
    allowExtra: false
  },
  
  userLogin: {
    email: { type: 'email', required: true },
    password: { type: 'string', required: true },
    allowExtra: false
  },
  
  passwordChange: {
    currentPassword: { type: 'string', required: true },
    newPassword: { type: 'password', required: true },
    allowExtra: false
  },
  
  contactForm: {
    name: { type: 'name', required: true },
    email: { type: 'email', required: true },
    subject: { type: 'string', required: true, maxLength: 255 },
    message: { type: 'string', required: true, maxLength: 2000 },
    allowExtra: false
  },
  
  alertThreshold: {
    threshold_id: { type: 'string', required: true, maxLength: 50 },
    name: { type: 'string', required: true, maxLength: 100 },
    description: { type: 'string', maxLength: 500 },
    metric: { type: 'string', required: true, maxLength: 50 },
    condition: { type: 'string', required: true, maxLength: 20 },
    value: { type: 'number', required: true },
    unit: { type: 'string', maxLength: 20 },
    enabled: { type: 'boolean', required: true },
    allowExtra: false
  }
};

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  sanitizeString,
  validateRequestBody,
  VALIDATION_RULES
};