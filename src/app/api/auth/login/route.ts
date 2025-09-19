import { NextResponse } from "next/server";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const REDIRECT_URI =
  process.env.REDIRECT_URI || "http://localhost:3000/api/auth/callback";

export async function GET() {
  const scope =
    "playlist-modify-public playlist-modify-private user-read-private user-read-email";
  const state = Math.random().toString(36).substring(7);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID!,
    scope,
    redirect_uri: REDIRECT_URI,
    state,
  });

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );
}
