#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting production build process..."

# Frontend build
echo "📦 Building frontend..."
cd client

# Install dependencies
echo "Installing frontend dependencies..."
npm install --production

# Build React app
echo "Creating optimized production build..."
npm run build

# Backend build
echo "📦 Building backend..."
cd ../server

# Install dependencies
echo "Installing backend dependencies..."
npm install --production

# Create production .env if it doesn't exist
if [ ! -f .env ]; then
    echo "⚠️ No .env file found. Creating from example..."
    cp .env.example .env
    echo "⚙️ Please update the .env file with your production values"
fi

echo "✅ Build complete! Ready for deployment."

# Instructions
echo """
🎉 Build completed successfully!

Next steps:
1. Update server/.env with your production values
2. Deploy the 'client/build' directory to your static hosting
3. Deploy the 'server' directory to your Node.js hosting

For Vercel deployment:
- Frontend: vercel deploy client/build
- Backend: vercel deploy server

For other platforms, follow their respective deployment guides.
"""
