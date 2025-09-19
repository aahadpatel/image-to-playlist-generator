# Image to Playlist Generator

Transform any festival lineup image into a Spotify playlist instantly! This web app uses OCR technology to extract artist names from images and creates a custom playlist with their top tracks.

> I'm going to Coachella again next year and was like man I do not want to go through the Coachella lineup and manually create a playlist so I was like let me just write this program. This is a v1 so may be buggy, but whatever it worked. Enjoy :) If there's a bug just send me a text.

## 🎵 Features

- **Image Upload & OCR**: Upload any festival lineup image and automatically extract artist names
- **Smart Artist Matching**: Handles artist name conflicts with profile images, follower counts, and genres
- **Customizable Playlists**: Choose how many songs per artist (up to 5)
- **Manual Search**: Can't find an artist? Add them manually with our search feature
- **Real-time Processing**: Watch as your playlist comes together, with the ability to stop at any time
- **Modern UI**: Clean, responsive interface built with Material-UI

## 🚀 Live Demo

Check out the live app: [https://image-to-playlist-generator.vercel.app](https://image-to-playlist-generator.vercel.app)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Material-UI
- **Authentication**: Spotify OAuth 2.0
- **APIs**: Spotify Web API
- **OCR**: Tesseract.js
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js >= 18.0.0
- Spotify Developer Account
- Spotify Premium Account (for playlist creation)

## 🔧 Local Development

1. Clone the repository:

   ```bash
   git clone https://github.com/aahadpatel/image-to-playlist-generator.git
   cd image-to-playlist-generator
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory:

   ```env
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   REDIRECT_URI=http://127.0.0.1:3000/auth/callback
   NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser

## 🎯 How to Use

1. **Login with Spotify**: Click "Connect with Spotify" to authenticate
2. **Upload Image**: Upload your festival lineup image
3. **Review Artists**: Confirm any ambiguous artist matches
4. **Customize**: Adjust the number of songs per artist
5. **Create Playlist**: Name your playlist and click create!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Spotify Web API for making this possible
- Tesseract.js for OCR capabilities
- Material-UI for the beautiful components
- Next.js team for the amazing framework

## 📬 Contact

Aahad Patel

Project Link: [https://github.com/aahadpatel/image-to-playlist-generator](https://github.com/aahadpatel/image-to-playlist-generator)
