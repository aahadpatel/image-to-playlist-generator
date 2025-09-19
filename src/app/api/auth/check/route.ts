import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("spotify_access_token");

  if (!accessToken) {
    return NextResponse.json({ token: null });
  }

  return NextResponse.json({ token: `Bearer ${accessToken.value}` });
}
