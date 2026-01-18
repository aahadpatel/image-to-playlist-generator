import React, { useState, useEffect } from "react";
import {
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Paper,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { Artist, SelectedArtist } from "../types";

interface ArtistSearchProps {
  token: string;
  onArtistSelect: (artist: Artist) => void;
  selectedArtists: SelectedArtist[];
}

const ArtistSearch: React.FC<ArtistSearchProps> = ({
  token,
  onArtistSelect,
  selectedArtists,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    artist: string | null;
  }>({ open: false, artist: null });

  useEffect(() => {
    const searchArtists = async () => {
      if (!searchTerm.trim()) {
        setArtists([]);
        return;
      }

      setIsSearching(true);
      try {
        if (!token) {
          // Keep error logging for production debugging
          console.error("No access token available");
          setArtists([]);
          return;
        }

        const response = await fetch(
          `http://127.0.0.1:5002/api/search/artists?q=${encodeURIComponent(
            searchTerm
          )}`,
          {
            headers: {
              Authorization: token,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          // Keep error logging for production debugging
          console.error("API Error:", data.error);
          if (response.status === 401) {
            // Token expired or invalid - could trigger a refresh here
            // Keep error logging for production debugging
            console.error("Token expired or invalid");
          }
          setArtists([]);
          return;
        }

        if (data.artists && Array.isArray(data.artists.items)) {
          setArtists(data.artists.items);
        } else {
          // Keep error logging for production debugging
          console.error("Unexpected API response format:", data);
          setArtists([]);
        }
      } catch (error) {
        // Keep error logging for production debugging
        console.error("Error searching artists:", error);
        setArtists([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimeout = setTimeout(searchArtists, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, token]);

  const formatFollowers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M followers`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K followers`;
    }
    return `${count} followers`;
  };

  const isArtistSelected = (artistId: string): boolean => {
    return selectedArtists.some((artist) => artist.id === artistId);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <TextField
        fullWidth
        label="Search for artists"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Type at least 2 characters to search..."
        InputProps={{
          endAdornment: isSearching && (
            <CircularProgress color="inherit" size={20} />
          ),
        }}
        sx={{ mb: 2 }}
      />

      {searchTerm.length > 0 && searchTerm.length < 2 && (
        <Typography variant="body2" color="text.secondary" align="center">
          Type at least 2 characters to search...
        </Typography>
      )}

      {searchTerm.length >= 2 && !isSearching && artists.length === 0 && (
        <Typography variant="body2" color="text.secondary" align="center">
          No artists found for "{searchTerm}"
        </Typography>
      )}

      {artists.length > 0 && (
        <Paper sx={{ maxHeight: 400, overflow: "auto", mb: 4 }}>
          <List>
            {artists.map((artist) => (
              <ListItem
                key={artist.id}
                onClick={() => {
                  if (!isArtistSelected(artist.id)) {
                    onArtistSelect(artist);
                    setSearchTerm("");
                    setArtists([]);
                    setSnackbar({ open: true, artist: artist.name });
                  }
                }}
                sx={{
                  pointerEvents: isArtistSelected(artist.id) ? "none" : "auto",
                  opacity: isArtistSelected(artist.id) ? 0.5 : 1,
                  "&:hover": {
                    backgroundColor: "rgba(29, 185, 84, 0.1)",
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={artist.images[0]?.url}
                    alt={artist.name}
                    sx={{ width: 60, height: 60, mr: 2 }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={artist.name}
                  secondaryTypographyProps={{
                    component: "div",
                  }}
                  secondary={
                    <>
                      {formatFollowers(artist.followers.total)}
                      <Box component="span" sx={{ display: "block", mt: 1 }}>
                        {artist.genres.slice(0, 3).map((genre) => (
                          <Chip
                            key={genre}
                            label={genre}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {isSearching && (
        <Typography variant="body2" color="text.secondary" align="center">
          Searching...
        </Typography>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ open: false, artist: null })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ open: false, artist: null })}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Added {snackbar.artist} to playlist
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ArtistSearch;
