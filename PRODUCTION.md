# Production Deployment Guide

## Prerequisites

- A domain name for your application
- A hosting service (recommended: Vercel, Netlify, or Heroku)
- Spotify Developer Account with a registered application

## 1. Environment Variables Setup

Create a `.env` file in your server directory with the following variables:

```env
# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here

# Server Configuration
SERVER_PORT=5002
NODE_ENV=production

# Frontend Configuration
REACT_APP_SERVER_URL=https://your-api-domain.com
REACT_APP_CLIENT_URL=https://your-app-domain.com

# Security
ALLOWED_ORIGINS=https://your-app-domain.com
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # Max requests per window

# Redirect URI (must match Spotify Dashboard)
REDIRECT_URI=https://your-app-domain.com/callback
```

## 2. Spotify Developer Dashboard Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your application
3. Update the following settings:
   - Redirect URI: Set to `https://your-app-domain.com/callback`
   - Website: Set to your frontend domain
   - Users and Access: Add any test users during development

## 3. Security Checklist

- [ ] Update CORS settings to only allow your frontend domain
- [ ] Enable rate limiting
- [ ] Set up proper SSL/TLS certificates
- [ ] Implement input validation
- [ ] Set secure cookie options
- [ ] Enable security headers

## 4. Deployment Steps

### Frontend (Client)

1. Build the frontend:

   ```bash
   cd client
   npm run build
   ```

2. Deploy the `build` directory to your hosting service
   - For Vercel/Netlify: Connect your repository and they will handle the build
   - For manual deployment: Upload the `build` directory to your hosting

### Backend (Server)

1. Prepare the server:

   ```bash
   cd server
   npm install --production
   ```

2. Deploy to your chosen hosting service:
   - Heroku: Push to Heroku remote
   - DigitalOcean/AWS: Use PM2 or Docker
   - Vercel: Use serverless functions

## 5. Post-Deployment Checklist

- [ ] Verify all environment variables are set correctly
- [ ] Test the Spotify authentication flow
- [ ] Confirm image upload and processing works
- [ ] Check playlist creation functionality
- [ ] Monitor error rates and performance
- [ ] Set up logging and monitoring
- [ ] Test with multiple users

## 6. Monitoring and Maintenance

1. Set up monitoring:

   - Use logging service (e.g., LogRocket, Sentry)
   - Monitor API rate limits
   - Track error rates
   - Monitor performance metrics

2. Regular maintenance:
   - Keep dependencies updated
   - Monitor Spotify API changes
   - Backup configuration
   - Review security settings

## 7. Scaling Considerations

- Consider implementing caching for Spotify API responses
- Use a CDN for static assets
- Implement request queuing for image processing
- Set up database for user preferences (optional)
- Consider serverless architecture for cost optimization

## 8. Troubleshooting

Common issues and solutions:

1. CORS errors:

   - Verify ALLOWED_ORIGINS matches your frontend domain exactly
   - Check for HTTP vs HTTPS mismatches
   - Ensure all endpoints have proper CORS headers

2. Authentication issues:

   - Verify Spotify Dashboard settings
   - Check REDIRECT_URI matches exactly
   - Confirm all environment variables are set

3. Rate limiting:
   - Monitor Spotify API quotas
   - Adjust rate limiting parameters if needed
   - Implement retry logic for failed requests

## 9. Support and Updates

1. Create documentation for:

   - User guide
   - Known issues
   - Contact information
   - Update procedures

2. Set up error reporting:
   - User feedback form
   - Error logging system
   - Status page (optional)

## 10. Backup and Recovery

1. Regular backups of:

   - Configuration files
   - Environment variables
   - Custom scripts
   - User data (if applicable)

2. Document recovery procedures:
   - How to restore from backup
   - How to handle service outages
   - Emergency contact information
