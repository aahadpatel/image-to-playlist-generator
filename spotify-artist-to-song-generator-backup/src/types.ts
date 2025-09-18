export interface Artist {
  id: string;
  name: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  followers: {
    total: number;
  };
  genres: string[];
  popularity?: number;
}

export interface SelectedArtist extends Artist {
  songCount: number;
}

export interface Track {
  id: string;
  name: string;
  uri: string;
  popularity: number;
  artists: Array<{
    name: string;
    id: string;
  }>;
}
