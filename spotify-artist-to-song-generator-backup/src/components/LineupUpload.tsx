import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  List,
  ListItem,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";
import IconButton from "@mui/material/IconButton";
import { createWorker } from "tesseract.js";
import { Artist } from "../types";

interface LoggerMessage {
  jobId: string;
  status: string;
  progress: number;
}

interface LineupUploadProps {
  onArtistsFound: (artists: Artist[]) => void;
  token: string;
  defaultSongCount?: number; // Add prop for default song count
}

const LineupUpload: React.FC<LineupUploadProps> = ({
  onArtistsFound,
  token,
  defaultSongCount = 1, // Default to 1 if not provided
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const [progress, setProgress] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Cleanup object URL when image is removed or component unmounts
  useEffect(() => {
    return () => {
      if (uploadedImage) {
        URL.revokeObjectURL(uploadedImage);
      }
    };
  }, [uploadedImage]);
  const [imageDialog, setImageDialog] = useState(false);
  const [foundArtists, setFoundArtists] = useState<Artist[]>([]);
  const rejectedArtistIdsRef = useRef<Set<string>>(new Set());
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    searchName: string;
    matches: Artist[];
    onConfirm: (artist: Artist | null) => void;
    currentFoundArtists: Artist[];
  }>({
    open: false,
    searchName: "",
    matches: [],
    onConfirm: () => {},
    currentFoundArtists: [],
  });

  // Format large numbers with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // If there's an existing image or processing, clean up everything
    if (uploadedImage || isProcessing) {
      // Clean up existing image
      if (uploadedImage) {
        URL.revokeObjectURL(uploadedImage);
      }
      // Close any open dialogs
      if (imageDialog) {
        setImageDialog(false);
      }
      if (confirmationDialog.open) {
        setConfirmationDialog((prev) => ({ ...prev, open: false }));
      }
      // Reset processing state
      setIsProcessing(false);
      processingRef.current = false;
      setProgress("");
    }

    // Create URL for the new image
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);

    setIsProcessing(true);
    processingRef.current = true;
    setProgress("Initializing OCR...");

    // Reset states for new processing
    setFoundArtists([]);
    if (confirmationDialog.open) {
      setConfirmationDialog((prev) => ({ ...prev, open: false }));
    }

    try {
      const worker = await createWorker({
        logger: (m: LoggerMessage) => {
          if (m.status !== "recognizing text") {
            setProgress(m.status);
          } else {
            setProgress("Reading text from image...");
          }
        },
      });

      await worker.loadLanguage("eng");
      await worker.initialize("eng");

      const {
        data: { text },
      } = await worker.recognize(file);
      await worker.terminate();

      // Check if processing was stopped during OCR
      if (!processingRef.current) {
        setProgress("Processing stopped.");
        return;
      }

      // Clean and normalize the text to extract artist names
      const cleanText = text
        .replace(
          /\b(?:SATURDAY|SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY)\b.*$/gim,
          ""
        )
        .replace(/(?:presents?|debut|premiere|world|bunker)\b.*$/gim, "")
        .replace(/\b(?:APRIL|MAY|JUNE|JULY|AUGUST)\b.*$/gim, "")
        .replace(
          /\b(?:INBLQ|KATSEYE|SOMBR|GENESI|BIEBANG|lallfw|Mainrlazer|vﬂllllgThllg)\b/g,
          ""
        ) // Remove known non-artist text
        .replace(/\b\d{2,}|[A-Z]\d+\b/g, "") // Remove numbers and codes
        .replace(/[«"]/g, "x") // Replace quotes with x for splitting
        .replace(/[!"#$%&'()*+,./:;<=>?@[\]^_`{|}~]/g, "-"); // Convert special chars to delimiter

      // Split into potential artist names and clean them
      const names = cleanText
        .split(/[-\n\r&x]+/) // Split on common delimiters including x
        .map((name: string) => {
          // Clean up the name
          return name
            .trim()
            .replace(/\s+/g, " ") // Normalize spaces
            .replace(/^[x\s]+|[x\s]+$/g, "") // Remove x's at start/end
            .replace(/\s*(?:x|\+)\s*/g, " "); // Convert x or + between words to space
        })
        .filter((name: string) => {
          // Basic name validation
          if (name.length < 2 || name.length > 50) return false; // Increased max length for collaborations
          if (!/[A-Za-z]/.test(name)) return false; // Must contain letters
          if (/^[x\s]+$/.test(name)) return false; // Exclude x's used as separators
          if (
            /^(?:of|the|and|or|feat|ft|presents?|debut|premiere|world|bunker)$/i.test(
              name
            )
          )
            return false;
          if (
            /\b(?:stage|tent|arena|hall|room|zone|area|lineup|festival)\b/i.test(
              name
            )
          )
            return false;
          if (/^[A-Z\s]+$/.test(name) && name.length > 10) return false;

          // Additional filters for the specific lineup
          if (/^(?:friends|ultra)$/i.test(name)) return false; // Common words that aren't artists
          if (/^[A-Z0-9]{5,}$/i.test(name)) return false; // Random uppercase strings

          return true;
        })
        // Special handling for collaborations
        .map((name: string) => {
          // Handle special cases like "Armin van Buuren x Adam Beyer"
          if (name.includes(" x ")) {
            const parts = name.split(" x ").map((p) => p.trim());
            // Only keep collaborations where both parts look like valid names
            if (parts.every((p) => p.length > 1 && /[A-Za-z]/.test(p))) {
              return parts;
            }
          }
          return [name];
        })
        .flat()
        // Remove duplicates (case-insensitive)
        .filter(
          (name: string, index: number, self: string[]) =>
            index ===
            self.findIndex(
              (n: string) => n.toLowerCase() === name.toLowerCase()
            )
        );

      setProgress("Found artists, starting search on Spotify...");

      // Reset state for new processing
      let processedCount = 0;
      const notFoundArtists: string[] = [];
      const newFoundArtists: Artist[] = [];

      interface ScoredMatch {
        artist: Artist;
        score: number;
      }

      // Log current rejected artists set

      // Process artists sequentially
      for (const name of names) {
        // Check if processing was stopped
        if (!processingRef.current) {
          setProgress("Processing stopped. Added artists found so far.");
          if (newFoundArtists.length > 0) {
            onArtistsFound(
              newFoundArtists.map((artist) => ({
                ...artist,
                songCount: defaultSongCount,
              }))
            );
          }
          return; // Exit the entire function
        }
        try {
          // Try multiple search queries for better matching
          const searchQueries = [
            name, // Exact name
            name.replace(/[^\w\s]/g, " "), // Remove special chars
            name.split(/\s+/)[0], // First word only
          ];

          let bestMatch: Artist | null = null;
          let bestScore = 0;

          // Clean up the search name
          const searchName = name
            .toLowerCase()
            .replace(/[^\w\s]/g, "") // Remove special characters
            .replace(/\s+/g, " ") // Normalize spaces
            .trim();

          for (const query of searchQueries) {
            const response = await fetch(
              `http://127.0.0.1:5002/api/search/artists?q=${encodeURIComponent(
                query
              )}`,
              {
                headers: {
                  Authorization: token,
                },
              }
            );

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const items = data.artists?.items || [];

            // First filter out any already rejected artists
            const nonRejectedItems = items.filter((item: Artist) => {
              return !rejectedArtistIdsRef.current.has(item.id);
            });

            // Get potential matches with scores from non-rejected items only
            const potentialMatches = nonRejectedItems
              .map((artist: Artist): ScoredMatch => {
                const artistName = artist.name
                  .toLowerCase()
                  .replace(/[^\w\s]/g, "")
                  .trim();
                let score = 0;

                // Exact match gets highest score
                if (artistName === searchName) score += 100;
                // Partial matches get points based on overlap
                else if (artistName.includes(searchName)) score += 50;
                else if (searchName.includes(artistName)) score += 40;
                // Bonus for matching individual words
                const searchWords = searchName.split(/\s+/);
                const artistWords = artistName.split(/\s+/);
                const matchingWords = searchWords.filter((word: string) =>
                  artistWords.some(
                    (aWord: string) =>
                      aWord.includes(word) || word.includes(aWord)
                  )
                ).length;
                score += (matchingWords / searchWords.length) * 30;

                // Bonus points for popularity and followers
                score += (artist?.popularity || 0) / 10;
                score += Math.log(artist.followers.total + 1) / 2;

                // Penalty for length difference
                const lengthDiff = Math.abs(
                  artistName.length - searchName.length
                );
                score -= lengthDiff;

                return { artist, score };
              })
              .filter(
                (match: ScoredMatch) =>
                  // Filter out low scores and rejected artists
                  match.score > 30 &&
                  !rejectedArtistIdsRef.current.has(match.artist.id)
              )
              .sort((a: ScoredMatch, b: ScoredMatch) => b.score - a.score)
              .slice(0, 3); // Get top 3 matches

            // If no non-rejected matches remain, skip this query
            if (nonRejectedItems.length === 0) {
              continue;
            }

            // Double check against current rejected list
            const currentlyRejected = nonRejectedItems.filter((item: Artist) =>
              rejectedArtistIdsRef.current.has(item.id)
            );
            if (currentlyRejected.length > 0) {
              const filteredItems = nonRejectedItems.filter(
                (item: Artist) => !rejectedArtistIdsRef.current.has(item.id)
              );
              if (filteredItems.length === 0) {
                continue;
              }
              // Update potential matches with filtered items
              potentialMatches.length = 0;
              potentialMatches.push(
                ...filteredItems.map(
                  (artist: Artist): ScoredMatch => ({
                    artist,
                    score: 0, // Reset score since we're just checking for rejection
                  })
                )
              );
            }

            if (potentialMatches.length > 0) {
              if (potentialMatches[0].score >= 80) {
                // Very confident match
                bestMatch = potentialMatches[0].artist;
                bestScore = potentialMatches[0].score;
                break;
              } else if (!bestMatch || potentialMatches[0].score > bestScore) {
                // Ask user to confirm the match
                const confirmedArtist = await new Promise<Artist | null>(
                  (resolve) => {
                    // Check if processing was stopped before showing dialog
                    if (!processingRef.current) {
                      resolve(null);
                      return;
                    }

                    // Filter out any previously rejected artists before showing dialog
                    const nonRejectedMatches = potentialMatches.filter(
                      (match: ScoredMatch) =>
                        !rejectedArtistIdsRef.current.has(match.artist.id)
                    );

                    // If no non-rejected matches remain, skip this artist
                    if (nonRejectedMatches.length === 0) {
                      notFoundArtists.push(name);
                      resolve(null);
                      return;
                    }

                    const dialogMatches = nonRejectedMatches.map(
                      (m: ScoredMatch) => m.artist
                    );
                    setConfirmationDialog({
                      open: true,
                      searchName: name,
                      matches: dialogMatches,
                      currentFoundArtists: newFoundArtists,
                      onConfirm: (artist) => {
                        setConfirmationDialog((prev) => ({
                          ...prev,
                          open: false,
                        }));
                        // Check if processing was stopped during confirmation
                        if (!processingRef.current) {
                          resolve(null);
                        } else {
                          if (artist === null) {
                            // User rejected all artists, add them to rejected list
                            // Add all artists from the dialog to rejected list
                            dialogMatches.forEach((artist: Artist) => {
                              rejectedArtistIdsRef.current.add(artist.id);
                            });
                            // Add to notFoundArtists to track in summary
                            notFoundArtists.push(name);
                            // Close dialog and continue to next artist
                            resolve(null);
                          } else {
                            resolve(artist);
                          }
                        }
                      },
                    });
                  }
                );

                if (confirmedArtist) {
                  bestMatch = confirmedArtist;
                  bestScore = 100; // User confirmed, so give it max score
                  break;
                }
              }
            }
          }

          if (bestMatch && bestMatch.id) {
            // Ensure bestMatch is a valid Artist
            newFoundArtists.push(bestMatch as Artist); // Add to our local array
          } else {
            notFoundArtists.push(name);
          }

          processedCount++;
          setProgress(
            `Processing artists... ${processedCount}/${names.length}`
          );

          // Add a small delay between artists to avoid rate limits
          if (processedCount < names.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (error) {
          // Keep error logging for production debugging
          console.error(`Error searching for artist "${name}":`, error);
          notFoundArtists.push(name);
        }
      }

      // Show results summary
      const foundCount = newFoundArtists.length;
      const notFoundCount = notFoundArtists.length;

      if (notFoundCount > 0) {
        setProgress(
          `Added ${foundCount} artists. Could not find ${notFoundCount} artists.`
        );
      } else {
        setProgress(`Successfully added ${foundCount} artists!`);
      }

      // Update the UI with found artists
      if (foundCount > 0) {
        onArtistsFound(
          newFoundArtists.map((artist) => ({
            ...artist,
            songCount: defaultSongCount, // Initialize each artist with the default song count
          }))
        );
      }
    } catch (error) {
      // Keep error logging for production debugging
      console.error("Error processing image:", error);
      setProgress("Error processing image");
      setIsProcessing(false);
    } finally {
      // Only clear the progress message if we completed successfully
      if (processingRef.current) {
        // Keep the final status message visible for a moment
        setTimeout(() => {
          processingRef.current = false;
          setIsProcessing(false);
          setProgress("");
        }, 2000);
      }
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          Upload Image
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upload an image of a festival lineup and we'll extract the artists
          automatically
        </Typography>

        <input
          accept="image/*"
          style={{ display: "none" }}
          id="lineup-upload"
          type="file"
          onChange={handleImageUpload}
          disabled={isProcessing}
        />
        <label htmlFor="lineup-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUploadIcon />}
            disabled={isProcessing}
            fullWidth
            sx={{ mb: 2 }}
          >
            Upload Image
          </Button>
        </label>

        {uploadedImage && (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setImageDialog(true)}
                sx={{ textTransform: "none" }}
                startIcon={<ImageIcon />}
                size="small"
              >
                View Image
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  if (uploadedImage) {
                    URL.revokeObjectURL(uploadedImage);
                  }
                  setUploadedImage(null);
                  // Reset the file input
                  const fileInput = document.getElementById(
                    "lineup-upload"
                  ) as HTMLInputElement;
                  if (fileInput) fileInput.value = "";
                  // Close image dialog if it's open
                  if (imageDialog) {
                    setImageDialog(false);
                  }
                }}
                sx={{ textTransform: "none" }}
                startIcon={<CloseIcon />}
                size="small"
              >
                Remove Image
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Image uploaded successfully!
            </Typography>
          </Box>
        )}

        {isProcessing && (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <CircularProgress size={20} />
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => {
                  processingRef.current = false;
                  setIsProcessing(false);
                  // Close any open confirmation dialog
                  if (confirmationDialog.open) {
                    setConfirmationDialog((prev) => ({
                      ...prev,
                      open: false,
                    }));
                  }
                  setProgress(
                    "Processing stopped. Added artists found so far."
                  );
                  onArtistsFound(foundArtists); // Send any artists found so far
                }}
                startIcon={<CloseIcon />}
              >
                Stop Processing
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {progress}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Artist Confirmation Dialog */}
      <Dialog
        open={confirmationDialog.open}
        onClose={() => confirmationDialog.onConfirm(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Artist: {confirmationDialog.searchName}
        </DialogTitle>
        <DialogContent>
          <List>
            {confirmationDialog.matches.map((artist) => (
              <ListItem
                key={artist.id}
                component="div"
                onClick={() => confirmationDialog.onConfirm(artist)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  mb: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 3,
                    bgcolor: "action.hover",
                    borderColor: "primary.main",
                  },
                  "&:active": {
                    transform: "translateY(0)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    p: 1,
                  }}
                >
                  <Avatar
                    src={artist.images[0]?.url}
                    alt={artist.name}
                    sx={{ width: 60, height: 60, mr: 2 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">{artist.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatNumber(artist.followers.total)} followers
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {artist.genres.slice(0, 3).map((genre) => (
                        <Chip
                          key={genre}
                          label={genre}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: 2,
            pb: 2,
          }}
        >
          <Button
            onClick={() => {
              setConfirmationDialog((prev) => ({ ...prev, open: false }));
              processingRef.current = false;
              setIsProcessing(false);
              setProgress("Processing stopped. Added artists found so far.");
              // Get the artists found so far from the dialog state
              if (confirmationDialog.currentFoundArtists.length > 0) {
                onArtistsFound(
                  confirmationDialog.currentFoundArtists.map(
                    (artist: Artist) => ({
                      ...artist,
                      songCount: defaultSongCount,
                    })
                  )
                );
              }
            }}
            color="warning"
            variant="contained"
            startIcon={<CloseIcon />}
          >
            Stop Processing
          </Button>
          <Button
            onClick={() => confirmationDialog.onConfirm(null)}
            color="error"
            variant="contained"
            sx={{
              bgcolor: "error.main",
              "&:hover": {
                bgcolor: "error.dark",
              },
            }}
          >
            None of these - Skip & Don't Ask Again
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog
        open={imageDialog}
        onClose={() => setImageDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: "80vh",
            maxHeight: "90vh",
            bgcolor: "#000",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#000",
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Uploaded Festival Lineup</Typography>
          <IconButton
            aria-label="close"
            onClick={() => setImageDialog(false)}
            sx={{ color: "#fff" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            bgcolor: "#000",
            p: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {uploadedImage && (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={uploadedImage}
                alt="Uploaded lineup"
                style={{
                  maxWidth: "100%",
                  maxHeight: "calc(80vh - 64px)", // Account for dialog title
                  objectFit: "contain",
                  boxShadow: "0 0 20px rgba(0,0,0,0.3)",
                }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default LineupUpload;
