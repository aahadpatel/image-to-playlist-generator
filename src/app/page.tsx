"use client";

import { useState, useEffect } from "react";
import { Box, Container, Typography, Button, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import PlaylistForm from "@/components/PlaylistForm";
import { Artist, SelectedArtist } from "@/types";
import { MusicNote } from "@mui/icons-material";

const GradientBackground = styled(Box)({
  minHeight: "100vh",
  background: "linear-gradient(135deg, #1DB954 0%, #191414 100%)",
  padding: { xs: "1rem", md: "2rem" },
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
  borderRadius: theme.spacing(2),
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
}));

const StyledButton = styled(Button)(({ theme }) => ({
  padding: "1rem 2rem",
  [theme.breakpoints.down("sm")]: {
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
  },
  fontSize: "1.2rem",
  borderRadius: "2rem",
  textTransform: "none",
  transition: "all 0.3s ease",
  background: "linear-gradient(45deg, #1DB954 30%, #1ed760 90%)",
  boxShadow: "0 3px 15px rgba(29, 185, 84, 0.3)",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 5px 20px rgba(29, 185, 84, 0.4)",
  },
}));

export default function Home() {
  const [token, setToken] = useState<string>("");
  const [selectedArtists, setSelectedArtists] = useState<SelectedArtist[]>([]);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const response = await fetch("/auth/check", {
          credentials: "include", // Important for cookies
        });
        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            setToken(data.token);
          }
        }
      } catch (error) {
        console.error("Error checking token:", error);
      }
    };

    checkToken();
  }, []);

  const handleLogin = () => {
    window.location.href = "/auth/login";
  };

  const handleArtistSelect = (artist: Artist) => {
    setSelectedArtists((prev) => [
      ...prev,
      { ...artist, selected: true, songCount: 1 },
    ]);
  };

  const handleArtistRemove = (artistId: string) => {
    setSelectedArtists((prev) =>
      prev.filter((artist) => artist.id !== artistId)
    );
  };

  const handleSongCountChange = (artistId: string | "all", count: number) => {
    setSelectedArtists((prev) =>
      prev.map((artist) =>
        artistId === "all" || artist.id === artistId
          ? { ...artist, songCount: count }
          : artist
      )
    );
  };

  const handleClearAll = () => {
    setSelectedArtists([]);
  };

  const handleArtistsFound = (artists: Artist[]) => {
    const newArtists = artists.map((artist) => ({
      ...artist,
      selected: true,
      songCount: 1,
    }));
    setSelectedArtists((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const uniqueNewArtists = newArtists.filter(
        (artist) => !existingIds.has(artist.id)
      );
      return [...prev, ...uniqueNewArtists];
    });
  };

  return (
    <GradientBackground>
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        <StyledPaper elevation={3}>
          <Box sx={{ textAlign: "center", mb: { xs: 3, md: 6 } }}>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                fontSize: { xs: "2rem", sm: "2.5rem", md: "3.5rem" },
                background: "linear-gradient(45deg, #1DB954 30%, #191414 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: { xs: 2, md: 3 },
              }}
            >
              Festival Playlist Generator
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                maxWidth: "800px",
                mx: "auto",
                lineHeight: 1.8,
                fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                mb: { xs: 3, md: 4 },
                px: { xs: 2, sm: 3 },
              }}
            >
              I&apos;m going to Coachella again next year and was like man I do
              not want to go through the Coachella lineup and manually create a
              playlist so I was like let me just write this program. This is a
              v1 so may be buggy, but whatever it worked. Enjoy :) If
              there&apos;s a bug just send me a text.
            </Typography>

            {!token ? (
              <Box sx={{ mt: { xs: 3, md: 6 } }}>
                <StyledButton
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleLogin}
                  startIcon={<MusicNote />}
                >
                  Connect with Spotify
                </StyledButton>
              </Box>
            ) : (
              <PlaylistForm
                token={token}
                selectedArtists={selectedArtists}
                onArtistRemove={handleArtistRemove}
                onSongCountChange={handleSongCountChange}
                onClearAll={handleClearAll}
                onArtistSelect={handleArtistSelect}
                onArtistsFound={handleArtistsFound}
              />
            )}
          </Box>
        </StyledPaper>
      </Container>
    </GradientBackground>
  );
}
