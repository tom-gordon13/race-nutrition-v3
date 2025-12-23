/**
 * API Configuration
 *
 * Automatically determines the correct API URL based on environment:
 * - Local Development: http://localhost:3001
 * - Production (Vercel/deployed): Uses relative path /api (same domain)
 * - Can be overridden with VITE_API_URL environment variable
 */

export const getApiUrl = (): string => {
  // Detect if we're in production (deployed)
  const isProduction = import.meta.env.PROD;
  const hostname = window.location.hostname;

  // In production (or not on localhost), ALWAYS use same origin
  // This prevents misconfigured env vars from breaking production
  if (isProduction || (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'))) {
    return window.location.origin;
  }

  // Development: check for environment variable override, otherwise use localhost
  const envApiUrl = import.meta.env.VITE_API_URL;
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
