const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const axios = require("axios");

// Load environment variables from root directory using absolute path
const path = require("path");
const envPath = path.resolve(__dirname, "../.env");
console.log("Looking for .env file at:", envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error("Error loading .env:", result.error);
} else {
  console.log("Environment variables loaded successfully");
  console.log("CLIENT_ID exists:", !!process.env.CLIENT_ID);
  console.log("CLIENT_SECRET exists:", !!process.env.CLIENT_SECRET);
  console.log("REDIRECT_URI exists:", !!process.env.REDIRECT_URI);
}

// Validate required environment variables
const requiredEnvVars = ["CLIENT_ID", "CLIENT_SECRET", "REDIRECT_URI"];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);
if (missingEnvVars.length > 0) {
  // Keep error logging for production debugging
  console.error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  process.exit(1);
}

const app = express();
// Use SERVER_PORT to avoid conflicts with system PORT and CRA
const port = Number(process.env.SERVER_PORT) || 5002;

// Middleware
// CORS configuration based on environment
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || "http://127.0.0.1:3001,http://localhost:3001"
).split(",");
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(
          new Error(
            "The CORS policy for this site does not allow access from the specified Origin."
          ),
          false
        );
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(express.json());

// Spotify API endpoints
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

// Token validation middleware
const validateToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "No authorization token provided" });
  }

  // Validate Bearer token format
  if (!/^Bearer [A-Za-z0-9-._~+/]+=*$/.test(token)) {
    return res.status(401).json({ error: "Invalid token format" });
  }

  next();
};

// Authentication endpoints
app.get("/login", (req, res) => {
  const scope = [
    "user-read-private",
    "user-read-email",
    "playlist-modify-public",
    "playlist-modify-private",
  ].join(" ");

  const queryParams = new URLSearchParams({
    client_id: process.env.CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.REDIRECT_URI,
    scope: scope,
  }).toString();

  res.json({ url: `${SPOTIFY_AUTH_URL}?${queryParams}` });
});

app.post("/token", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Authorization code is required" });
  }

  try {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: process.env.REDIRECT_URI,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
    });

    const response = await axios.post(SPOTIFY_TOKEN_URL, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Validate the response contains an access token
    if (!response.data.access_token) {
      // Keep error logging for production debugging
      console.error("No access token in Spotify response:", response.data);
      return res.status(500).json({ error: "Invalid response from Spotify" });
    }

    // Pass through all Spotify response data (including expires_in)
    res.json(response.data);
  } catch (error) {
    // Keep error logging for production debugging
    console.error(
      "Error getting token:",
      error.response?.data || error.message
    );

    // Handle specific Spotify API errors
    if (error.response?.status === 400) {
      return res.status(400).json({
        error: "Invalid authorization code",
        details: error.response.data,
      });
    }

    res.status(500).json({
      error: "Failed to get access token",
      details: error.response?.data || error.message,
    });
  }
});

// Artist search endpoint
app.get("/search/artists", validateToken, async (req, res) => {
  const { q } = req.query;
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "No authorization token provided" });
  }

  try {
    const response = await axios.get(`${SPOTIFY_API_URL}/search`, {
      headers: {
        Authorization: token,
      },
      params: {
        q: q,
        type: "artist",
        limit: 5,
      },
    });

    // Validate the response structure
    if (!response.data.artists || !Array.isArray(response.data.artists.items)) {
      // Keep error logging for production debugging
      console.error("Unexpected Spotify API response:", response.data);
      return res
        .status(500)
        .json({ error: "Invalid response from Spotify API" });
    }

    res.json(response.data);
  } catch (error) {
    // Keep error logging for production debugging
    console.error(
      "Error searching artists:",
      error.response?.data || error.message
    );

    // Handle specific Spotify API errors
    if (error.response?.status === 401) {
      return res.status(401).json({ error: "Invalid or expired access token" });
    }

    res.status(500).json({
      error: "Failed to search artists",
      details: error.response?.data || error.message,
    });
  }
});

// Get artist's top tracks
app.get("/artists/:id/top-tracks", validateToken, async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization;

  try {
    const response = await axios.get(
      `${SPOTIFY_API_URL}/artists/${id}/top-tracks?market=US`,
      {
        headers: {
          Authorization: token,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    // Keep error logging for production debugging
    console.error(
      "Error getting top tracks:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to get top tracks" });
  }
});

// Create playlist
// Input validation middleware
const validatePlaylistInput = (req, res, next) => {
  const { name, tracks } = req.body;

  // Validate playlist name
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

  // Validate tracks array
  if (!Array.isArray(tracks) || tracks.length === 0 || tracks.length > 500) {
    return res.status(400).json({
      error: "Invalid tracks array. Must contain between 1 and 500 tracks.",
    });
  }

  // Validate track URIs format
  const validUriFormat = /^spotify:track:[a-zA-Z0-9]{22}$/;
  const invalidTracks = tracks.filter((uri) => !validUriFormat.test(uri));
  if (invalidTracks.length > 0) {
    return res.status(400).json({ error: "Invalid track URI format" });
  }

  next();
};

app.post(
  "/playlists",
  validateToken,
  validatePlaylistInput,
  async (req, res) => {
    const { name, tracks } = req.body;
    const token = req.headers.authorization;

    try {
      // Get user ID
      const userResponse = await axios.get(`${SPOTIFY_API_URL}/me`, {
        headers: {
          Authorization: token,
        },
      });
      const userId = userResponse.data.id;

      // Create playlist
      const playlistResponse = await axios.post(
        `${SPOTIFY_API_URL}/users/${userId}/playlists`,
        {
          name: name,
          description:
            "Created with Image to Playlist Generator - Turn festival lineups into playlists!",
          public: false,
        },
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );

      // Add tracks to playlist
      await axios.post(
        `${SPOTIFY_API_URL}/playlists/${playlistResponse.data.id}/tracks`,
        {
          uris: tracks,
        },
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );

      res.json(playlistResponse.data);
    } catch (error) {
      // Keep error logging for production debugging
      console.error(
        "Error creating playlist:",
        error.response?.data || error.message
      );
      res.status(500).json({ error: "Failed to create playlist" });
    }
  }
);

// Start the server if not being used as a module
if (require.main === module) {
  const port = process.env.SERVER_PORT || 5002;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Export the Express app as a serverless function
module.exports = app;
