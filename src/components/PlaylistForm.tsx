"use client";

import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Slider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Artist, SelectedArtist, Track } from "@/types";
import ArtistSearch from "./ArtistSearch";
import LineupUpload from "./LineupUpload";

interface PlaylistFormProps {
  token: string;
  selectedArtists: SelectedArtist[];
  onArtistRemove: (artistId: string) => void;
  onSongCountChange: (artistId: string | "all", count: number) => void;
  onClearAll: () => void;
  onArtistSelect: (artist: Artist) => void;
  onArtistsFound: (artists: Artist[]) => void;
}

const PlaylistForm: React.FC<PlaylistFormProps> = ({
  token,
  selectedArtists,
  onArtistRemove,
  onSongCountChange,
  onClearAll,
  onArtistSelect,
  onArtistsFound,
}) => {
  const [playlistName, setPlaylistName] = useState("");
  const [globalSongCount, setGlobalSongCount] = useState(() => {
    if (selectedArtists.length === 0) return 1;
    const firstCount = selectedArtists[0].songCount;
    return selectedArtists.every((artist) => artist.songCount === firstCount)
      ? firstCount
      : 1;
  });
  const [inputValue, setInputValue] = useState(globalSongCount.toString());
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedArtistDialog, setSelectedArtistDialog] =
    useState<SelectedArtist | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const COLLAPSED_COUNT = 5;
  const showExpandButton = selectedArtists.length > COLLAPSED_COUNT;
  const displayedArtists = isExpanded
    ? selectedArtists
    : selectedArtists.slice(0, COLLAPSED_COUNT);

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      setError("Please enter a playlist name");
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const artistTracks = await Promise.all(
        selectedArtists.map(async (artist) => {
          const response = await fetch(`/artists/${artist.id}/top-tracks`, {
            headers: {
              Authorization: token,
            },
          });
          const data = await response.json();
          return {
            artistId: artist.id,
            tracks: data.tracks
              .sort((a: Track, b: Track) => b.popularity - a.popularity)
              .slice(0, artist.songCount)
              .map((track: Track) => track.uri),
          };
        })
      );

      const trackUris = Array.from(
        new Set(artistTracks.flatMap((at) => at.tracks))
      );

      const response = await fetch("/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          name: playlistName,
          tracks: trackUris,
        }),
      });

      await response.json();
      setSuccess(
        `Playlist "${playlistName}" created successfully! Open it in Spotify to start listening.`
      );
      setPlaylistName("");
    } catch (error) {
      console.error("Error creating playlist:", error);
      setError("Failed to create playlist. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const totalSongs = selectedArtists.reduce(
    (sum, artist) => sum + artist.songCount,
    0
  );
  const estimatedDuration = totalSongs * 3.5;

  return (
    <Box sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6">Create Playlist</Typography>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {totalSongs} songs • ~{Math.round(estimatedDuration)} mins
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              label="Playlist Name"
              variant="outlined"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Enter a name for your playlist..."
            />
            <TextField
              type="number"
              label="Songs per Artist"
              variant="outlined"
              value={inputValue}
              inputProps={{
                min: 1,
                max: 5,
                step: 1,
              }}
              sx={{ width: 150 }}
              onChange={(e) => {
                const newValue = e.target.value;
                setInputValue(newValue);

                const numValue = parseInt(newValue);
                if (!isNaN(numValue) && numValue >= 1 && numValue <= 5) {
                  setGlobalSongCount(numValue);
                  onSongCountChange("all", numValue);
                }
              }}
              onBlur={() => {
                const numValue = parseInt(inputValue);
                const validValue = isNaN(numValue)
                  ? 1
                  : Math.min(Math.max(numValue, 1), 5);
                setInputValue(validValue.toString());
                setGlobalSongCount(validValue);
                onSongCountChange("all", validValue);
              }}
            />
          </Box>
          <Box
            sx={{ display: "flex", justifyContent: "center", width: "100%" }}
          >
            <Box sx={{ width: "100%", maxWidth: "600px" }}>
              <LineupUpload
                token={token}
                onArtistsFound={onArtistsFound}
                defaultSongCount={globalSongCount}
              />
            </Box>
          </Box>

          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Or search for artists manually:
            </Typography>
            <ArtistSearch
              token={token}
              onArtistSelect={onArtistSelect}
              selectedArtists={selectedArtists}
            />
          </Box>
        </Box>

        <List
          sx={{ maxHeight: isExpanded ? "none" : "400px", overflow: "auto" }}
        >
          {displayedArtists.map((artist) => (
            <ListItem
              key={artist.id}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => onArtistRemove(artist.id)}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemAvatar>
                <Avatar
                  src={artist.images[0]?.url}
                  alt={artist.name}
                  sx={{ width: 60, height: 60, cursor: "pointer", mr: 3 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedArtistDialog(artist);
                  }}
                />
              </ListItemAvatar>
              <ListItemText
                sx={{ ml: 2, cursor: "pointer" }}
                primary={
                  <Box onClick={() => setSelectedArtistDialog(artist)}>
                    {artist.name}
                  </Box>
                }
                secondaryTypographyProps={{ component: "div" }}
                secondary={
                  <div>
                    <Box
                      sx={{ width: 200, ml: 2 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Box
                        component="div"
                        id={`songs-slider-${artist.id}`}
                        sx={{ display: "block", mb: 1 }}
                      >
                        Songs: {artist.songCount}
                      </Box>
                      <Slider
                        value={artist.songCount}
                        min={1}
                        max={5}
                        step={1}
                        onChange={(_, newValue) => {
                          const value = newValue as number;
                          onSongCountChange(artist.id, value);

                          const willAllMatch = selectedArtists.every((a) =>
                            a.id === artist.id ? true : a.songCount === value
                          );

                          if (willAllMatch) {
                            setGlobalSongCount(value);
                          }
                        }}
                        valueLabelDisplay="auto"
                        aria-labelledby={`songs-slider-${artist.id}`}
                      />
                    </Box>
                  </div>
                }
              />
            </ListItem>
          ))}
        </List>

        {showExpandButton && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ textTransform: "none" }}
            >
              {isExpanded
                ? `Show Less`
                : `Show ${
                    selectedArtists.length - COLLAPSED_COUNT
                  } More Artists`}
            </Button>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleCreatePlaylist}
            disabled={
              isCreating || selectedArtists.length === 0 || !playlistName.trim()
            }
            startIcon={
              isCreating ? <CircularProgress size={20} color="inherit" /> : null
            }
          >
            {isCreating
              ? "Creating..."
              : `Create Playlist (${totalSongs} songs)`}
          </Button>

          {selectedArtists.length > 0 && (
            <Button color="error" onClick={onClearAll} disabled={isCreating}>
              Clear All
            </Button>
          )}
        </Box>
      </Paper>

      <Dialog
        open={!!selectedArtistDialog}
        onClose={() => setSelectedArtistDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedArtistDialog && (
          <>
            <DialogTitle sx={{ pb: 0 }}>Artist Profile</DialogTitle>
            <DialogContent>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  pt: 2,
                }}
              >
                <Avatar
                  src={selectedArtistDialog.images[0]?.url}
                  alt={selectedArtistDialog.name}
                  sx={{ width: 200, height: 200, mb: 2 }}
                />
                <Typography variant="h5" gutterBottom>
                  {selectedArtistDialog.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedArtistDialog.followers.total.toLocaleString()}{" "}
                  followers
                </Typography>
                <Box sx={{ mt: 2, mb: 3, textAlign: "center" }}>
                  {selectedArtistDialog.genres.map((genre) => (
                    <Chip key={genre} label={genre} sx={{ m: 0.5 }} />
                  ))}
                </Box>
                <Typography variant="body1" gutterBottom>
                  Adding {selectedArtistDialog.songCount} top song
                  {selectedArtistDialog.songCount !== 1 ? "s" : ""} to playlist
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedArtistDialog(null)}>
                Close
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  window.open(
                    `https://open.spotify.com/artist/${selectedArtistDialog.id}`,
                    "_blank"
                  );
                }}
              >
                Open in Spotify
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PlaylistForm;
