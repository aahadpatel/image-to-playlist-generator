export interface Artist {
  id: string;
  name: string;
  images: Array<{ url: string }>;
  followers: {
    total: number;
  };
  genres: string[];
  popularity: number;
}

export interface SelectedArtist extends Artist {
  selected: boolean;
  songCount: number;
}

export interface Track {
  uri: string;
  popularity: number;
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}
