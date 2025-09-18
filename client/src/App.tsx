import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";
import PlaylistForm from "./components/PlaylistForm";
import { Artist, SelectedArtist } from "./types";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1DB954", // Spotify green
    },
    background: {
      default: "#121212",
      paper: "#181818",
    },
  },
  typography: {
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      marginBottom: "0.5rem",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: "1.1rem",
      lineHeight: 1.5,
      opacity: 0.8,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontSize: "1rem",
          padding: "10px 20px",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

interface SpotifyToken {
  access_token: string;
  expires_at: number;
}

function App() {
  const [token, setToken] = useState<string | null>(() => {
    // Check localStorage on initial load
    const savedToken = localStorage.getItem("spotify_token");
    if (savedToken) {
      const tokenData: SpotifyToken = JSON.parse(savedToken);
      // Check if token is still valid (not expired)
      if (tokenData.expires_at > Date.now()) {
        return `Bearer ${tokenData.access_token}`;
      } else {
        localStorage.removeItem("spotify_token");
      }
    }
    return null;
  });

  const [selectedArtists, setSelectedArtists] = useState<SelectedArtist[]>([]);

  useEffect(() => {
    // Check for authentication callback
    const exchangeToken = async () => {
      // Remove any existing token to ensure clean state
      localStorage.removeItem("spotify_token");

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        try {
          // Exchange code for token
          const response = await fetch("http://127.0.0.1:5002/auth/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to exchange token");
          }

          if (!data.access_token) {
            throw new Error("No access token in response");
          }

          // Calculate token expiration (subtract 5 minutes for safety margin)
          const expiresAt = Date.now() + data.expires_in * 1000 - 5 * 60 * 1000;

          // Save token with expiration
          const tokenData: SpotifyToken = {
            access_token: data.access_token,
            expires_at: expiresAt,
          };

          localStorage.setItem("spotify_token", JSON.stringify(tokenData));
          setToken(`Bearer ${data.access_token}`);
        } catch (error) {
          // Keep error logging for production debugging
          console.error("Token exchange failed:", error);
        } finally {
          // Always remove code from URL to prevent reuse
          window.history.replaceState({}, document.title, "/");
        }
      }
    };

    // Only try to exchange token if we don't already have a valid one
    if (!token) {
      exchangeToken();
    }
  }, [token]);

  const handleLogin = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5002/auth/login");
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      // Keep error logging for production debugging
      console.error("Error:", error);
    }
  };

  const handleArtistSelect = (artist: Artist) => {
    if (!selectedArtists.find((a) => a.id === artist.id)) {
      setSelectedArtists([...selectedArtists, { ...artist, songCount: 1 }]);
    }
  };

  const handleArtistRemove = (artistId: string) => {
    setSelectedArtists(
      selectedArtists.filter((artist) => artist.id !== artistId)
    );
  };

  const handleClearAllArtists = () => {
    setSelectedArtists([]);
  };

  const handleSongCountChange = (artistId: string | "all", count: number) => {
    if (artistId === "all") {
      // Update all artists at once
      setSelectedArtists(
        selectedArtists.map((artist) => ({ ...artist, songCount: count }))
      );
    } else {
      // Update single artist
      setSelectedArtists(
        selectedArtists.map((artist) =>
          artist.id === artistId ? { ...artist, songCount: count } : artist
        )
      );
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md">
        <Box sx={{ my: 6, textAlign: "center" }}>
          <Typography variant="h1" component="h1" gutterBottom>
            Image to Playlist Generator
          </Typography>

          <Typography
            variant="subtitle1"
            sx={{ mb: 4, maxWidth: 800, mx: "auto" }}
          >
            Transform any festival lineup image into a Spotify playlist
            instantly! Simply upload an image of a festival lineup, and we'll
            automatically extract the artist names and create a playlist with
            their top songs. You can also search for artists manually and
            customize how many songs to include from each artist (up to 5
            tracks). Perfect for discovering new music and preparing for your
            next festival experience!
          </Typography>

          {!token ? (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleLogin}
              sx={{
                mt: 2,
                py: 1.5,
                px: 4,
                fontSize: "1.2rem",
                fontWeight: 600,
                "&:hover": {
                  transform: "translateY(-2px)",
                  transition: "transform 0.2s",
                },
              }}
            >
              Get Started with Spotify
            </Button>
          ) : (
            <>
              <PlaylistForm
                token={token}
                selectedArtists={selectedArtists}
                onArtistRemove={handleArtistRemove}
                onSongCountChange={handleSongCountChange}
                onClearAll={handleClearAllArtists}
                onArtistSelect={handleArtistSelect}
                onArtistsFound={(artists) => {
                  // Filter out artists that are already selected
                  const newArtists = artists.filter(
                    (artist) => !selectedArtists.find((a) => a.id === artist.id)
                  );

                  // Add all new artists at once
                  if (newArtists.length > 0) {
                    setSelectedArtists([
                      ...selectedArtists,
                      ...newArtists.map((artist) => ({
                        ...artist,
                        songCount: 1,
                      })),
                    ]);
                  }
                }}
              />
            </>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
