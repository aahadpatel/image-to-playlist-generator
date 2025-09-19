import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.REDIRECT_URI ||
  "https://image-to-playlist-generator.vercel.app/auth/callback";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://image-to-playlist-generator.vercel.app";

// Validate environment variables
if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  throw new Error(
    "Missing required environment variables for Spotify authentication"
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const headersList = headers();

  // Validate the request origin
  const origin = headersList.get("origin");
  if (origin && !origin.startsWith(APP_URL)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/error?message=Missing_code", APP_URL)
    );
  }

  try {
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          code,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error("Failed to get access token");
    }

    const data = await tokenResponse.json();

    // Validate token response
    if (!data.access_token || !data.refresh_token) {
      throw new Error("Invalid token response");
    }

    // Set cookies with token data
    const redirectUrl = new URL("/", APP_URL);
    const redirectResponse = NextResponse.redirect(redirectUrl);

    // Set secure cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    // Set access token cookie with expiration
    redirectResponse.cookies.set("spotify_access_token", data.access_token, {
      ...cookieOptions,
      maxAge: data.expires_in,
    });

    // Set refresh token cookie
    redirectResponse.cookies.set(
      "spotify_refresh_token",
      data.refresh_token,
      cookieOptions
    );

    return redirectResponse;
  } catch (error) {
    console.error("Error in callback:", error);
    return NextResponse.redirect(
      new URL("/error?message=Auth_failed", APP_URL)
    );
  }
}
