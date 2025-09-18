const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

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

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";

app.get("/api/login", (req, res) => {
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

module.exports = app;
