/**
 * API Configuration
 *
 * Automatically determines the correct API URL based on environment:
 * - Local Development: http://localhost:3001
 * - Production (Vercel/deployed): Uses relative path /api (same domain)
 * - Can be overridden with VITE_API_URL environment variable
 */

export const getApiUrl = (): string => {
  // Check if environment variable is explicitly set
  const envApiUrl = import.meta.env.VITE_API_URL;

  // If explicitly set to something other than localhost, use it
  if (envApiUrl && !envApiUrl.includes('localhost')) {
    return envApiUrl;
  }

  // Detect if we're in production (deployed)
  const isProduction = import.meta.env.PROD;
  const hostname = window.location.hostname;

  // In production (or not on localhost), use relative API path
  // This works with Vercel's rewrite rules
  if (isProduction || (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'))) {
    // Use same origin with /api path
    return window.location.origin;
  }

  // Development: use localhost
  return envApiUrl || 'http://localhost:3001';
};

// Export a constant for convenience
export const API_URL = getApiUrl();

// Helper for debugging - always log in production to help troubleshoot
console.log('🔧 API Configuration:', {
  API_URL: getApiUrl(),
  environment: import.meta.env.MODE,
  isProduction: import.meta.env.PROD,
  hostname: window.location.hostname,
  origin: window.location.origin,
});
