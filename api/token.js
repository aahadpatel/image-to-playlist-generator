const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  "https://image-to-playlist-generator.vercel.app"
).split(",");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error("Not allowed by CORS"), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

app.post("/api/token", async (req, res) => {
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

    if (!response.data.access_token) {
      console.error("No access token in Spotify response:", response.data);
      return res.status(500).json({ error: "Invalid response from Spotify" });
    }

    res.json(response.data);
  } catch (error) {
    console.error(
      "Error getting token:",
      error.response?.data || error.message
    );

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

module.exports = app;
