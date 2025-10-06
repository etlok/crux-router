#!/usr/bin/env node

/**
 * JWT Token Generator for Testing
 * 
 * This script generates a valid JWT token that can be used for testing
 * the WebSocket authentication. It uses the same secret key as configured
 * in the application.
 */

const jwt = require('jsonwebtoken');

// Configuration from jwt.config.ts
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
  expiresIn: '365d', // Long expiration for testing
  issuer: process.env.JWT_ISSUER || 'crux-web-socket',
  audience: process.env.JWT_AUDIENCE || 'crux-clients',
};

// Create a test payload
const payload = {
  sub: 'test-user-123',
  name: 'Test User',
  role: 'tester',
  permissions: ['read', 'write'],
  // The JWT library will add iat (issued at) automatically
};

// Sign the token
const token = jwt.sign(payload, JWT_CONFIG.secret, {
  expiresIn: JWT_CONFIG.expiresIn,
  issuer: JWT_CONFIG.issuer,
  audience: JWT_CONFIG.audience,
});

// Get decoded payload for display
const decoded = jwt.decode(token);

// Output the result
console.log('\n=== JWT Test Token ===\n');
console.log('Token:');
console.log(token);
console.log('\nDecoded Payload:');
console.log(JSON.stringify(decoded, null, 2));
console.log('\nExpires At:');
console.log(new Date(decoded.exp * 1000).toISOString());
console.log('\nUse this token in the WebSocket authentication test page.');
console.log('\nFor HTML use:');
console.log(`const getSampleToken = () => {\n  return '${token}';\n};`);
console.log('\n======================\n');
