import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = request.headers.get("Authorization");

  if (!token) {
    return NextResponse.json(
      { error: "Missing authorization token" },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${params.id}/top-tracks?market=US`,
      {
        headers: {
          Authorization: token,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from Spotify API");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching top tracks:", error);
    return NextResponse.json(
      { error: "Failed to fetch top tracks" },
      { status: 500 }
    );
  }
}
