const isDevelopment = process.env.NODE_ENV === "development";

// In production (Vercel), the API routes are available at /api
export const API_BASE_URL = isDevelopment ? "http://127.0.0.1:5002" : "/api";

// For the Spotify callback, we need the full URL in production
export const REDIRECT_URI = isDevelopment
  ? "http://127.0.0.1:3001/callback"
  : `${window.location.origin}/callback`;
