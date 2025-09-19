import { NextRequest, NextResponse } from "next/server";

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

    // Get user profile to get user ID
    const userResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: token,
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch user profile");
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
          description: "Created with Spotify Artist to Song Generator",
          public: false,
        }),
      }
    );

    if (!createPlaylistResponse.ok) {
      throw new Error("Failed to create playlist");
    }

    const playlistData = await createPlaylistResponse.json();

    // Add tracks to playlist
    const addTracksResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistData.id}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: tracks,
        }),
      }
    );

    if (!addTracksResponse.ok) {
      throw new Error("Failed to add tracks to playlist");
    }

    return NextResponse.json(playlistData);
  } catch (error) {
    console.error("Error creating playlist:", error);
    return NextResponse.json(
      { error: "Failed to create playlist" },
      { status: 500 }
    );
  }
}
