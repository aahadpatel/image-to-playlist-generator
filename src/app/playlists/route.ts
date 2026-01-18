import { NextRequest, NextResponse } from "next/server";

const SPOTIFY_BATCH_SIZE = 100; // Spotify's limit for adding tracks in one request

async function addTracksInBatches(
  playlistId: string,
  tracks: string[],
  token: string
) {
  const batches = [];
  for (let i = 0; i < tracks.length; i += SPOTIFY_BATCH_SIZE) {
    const batch = tracks.slice(i, i + SPOTIFY_BATCH_SIZE);
    batches.push(batch);
  }

  const results = [];
  for (const batch of batches) {
    const addTracksResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: batch,
        }),
      }
    );

    if (!addTracksResponse.ok) {
      const error = await addTracksResponse.json();
      console.error("Failed to add tracks batch:", error);
      throw new Error(
        `Failed to add tracks batch: ${error.error?.message || "Unknown error"}`
      );
    }

    const result = await addTracksResponse.json();
    results.push(result);
  }

  return results;
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization");

  if (!token) {
    return NextResponse.json(
      { error: "Missing authorization token" },
      { status: 401 }
    );
  }

  try {
    const { name, tracks } = await request.json();

    if (!name || !tracks || !Array.isArray(tracks)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    console.log(`Creating playlist "${name}" with ${tracks.length} tracks`);

    // Get user profile to get user ID
    const userResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: token,
      },
    });

    if (!userResponse.ok) {
      const error = await userResponse.json();
      console.error("Failed to fetch user profile:", error);
      throw new Error(
        `Failed to fetch user profile: ${
          error.error?.message || "Unknown error"
        }`
      );
    }

    const userData = await userResponse.json();

    // Create playlist
    const createPlaylistResponse = await fetch(
      `https://api.spotify.com/v1/users/${userData.id}/playlists`,
      {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: `Created with Festival Playlist Generator - Contains tracks from ${tracks.length} artists`,
          public: false,
        }),
      }
    );

    if (!createPlaylistResponse.ok) {
      const error = await createPlaylistResponse.json();
      console.error("Failed to create playlist:", error);
      throw new Error(
        `Failed to create playlist: ${error.error?.message || "Unknown error"}`
      );
    }

    const playlistData = await createPlaylistResponse.json();
    console.log(`Created playlist: ${playlistData.id}`);

    // Add tracks to playlist in batches
    try {
      const results = await addTracksInBatches(playlistData.id, tracks, token);
      console.log(
        `Successfully added ${tracks.length} tracks to playlist ${playlistData.id}`
      );

      return NextResponse.json({
        ...playlistData,
        tracksAdded: tracks.length,
        batchResults: results,
      });
    } catch (error) {
      console.error("Error adding tracks to playlist:", error);
      // Don't delete the playlist - it might have some tracks added successfully
      throw error;
    }
  } catch (error: any) {
    console.error("Error in playlist creation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create playlist" },
      { status: 500 }
    );
  }
}
