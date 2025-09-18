const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // Limit each IP
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",");
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // 24 hours
};

// Input validation middleware
const validateSpotifyId = (id) => {
  return /^[0-9A-Za-z]{22}$/.test(id);
};

const validatePlaylistInput = (req, res, next) => {
  const { name, tracks } = req.body;

  if (
    !name ||
    typeof name !== "string" ||
    name.length < 1 ||
    name.length > 100
  ) {
    return res.status(400).json({
      error: "Invalid playlist name. Must be between 1 and 100 characters.",
    });
  }

  if (!Array.isArray(tracks) || tracks.length === 0 || tracks.length > 500) {
    return res.status(400).json({
      error: "Invalid tracks array. Must contain between 1 and 500 tracks.",
    });
  }

  const validUriFormat = /^spotify:track:[0-9A-Za-z]{22}$/;
  const invalidTracks = tracks.filter((uri) => !validUriFormat.test(uri));
  if (invalidTracks.length > 0) {
    return res.status(400).json({ error: "Invalid track URI format" });
  }

  next();
};

const validateArtistId = (req, res, next) => {
  const { id } = req.params;
  if (!validateSpotifyId(id)) {
    return res.status(400).json({ error: "Invalid artist ID format" });
  }
  next();
};

// Token validation middleware
const validateToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: "No authorization token provided" });
  }
  if (!/^Bearer [A-Za-z0-9-._~+/]+=*$/.test(token)) {
    return res.status(401).json({ error: "Invalid token format" });
  }
  next();
};

// Security headers middleware using helmet
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.spotify.com"],
      imgSrc: ["'self'", "https://*.scdn.co", "data:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for image upload
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Required for Spotify resources
});

module.exports = {
  limiter,
  corsOptions,
  validatePlaylistInput,
  validateArtistId,
  validateToken,
  securityHeaders,
};
