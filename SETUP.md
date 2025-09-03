# Google OAuth Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project" or select existing project
3. Enter project name: "Institute Lab Management"

## Step 2: Enable APIs

1. Go to "APIs & Services" > "Library"
2. Search and enable:
   - **Google Drive API**
   - **Google Identity Services**

## Step 3: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Set name: "Lab Management System"
5. Add Authorized JavaScript origins:
   - `http://localhost:8000` (for testing)
   - `https://yourusername.github.io` (for production)
6. Add Authorized redirect URIs:
   - `http://localhost:8000`
   - `https://yourusername.github.io/repository-name`

## Step 4: Get API Key

1. Click "Create Credentials" > "API key"
2. Copy the API key
3. (Optional) Restrict the key to Google Drive API

## Step 5: Configure Application

1. Open `config.js`
2. Replace:
   ```javascript
   GOOGLE_CLIENT_ID: 'your-actual-client-id.apps.googleusercontent.com',
   GOOGLE_API_KEY: 'your-actual-api-key'
   ```

## Step 6: Test Locally

1. Run local server: `python -m http.server 8000`
2. Open `http://localhost:8000`
3. Test Google sign-in

## Step 7: Set Admin User

1. Open `config.js`
2. Set your admin email:
   ```javascript
   ADMIN_EMAIL: 'your-admin@yourinstitute.edu'
   ```

## Step 8: Deploy to GitHub Pages

1. Push to GitHub
2. Enable GitHub Pages in repository settings
3. Update config.js with production domain

## How User Access Works

### Admin Access
- Only the email in `ADMIN_EMAIL` has admin privileges
- Admin can approve/reject all user requests
- Admin can remove approved users anytime

### User Access Process
1. User signs in with Google
2. If not admin, request goes to pending approval
3. Admin sees notification badge with pending count
4. Admin can approve or reject from User Management panel
5. Approved users get full access
6. Admin can remove users anytime

### User Management Features
- **Pending Requests**: See all users waiting for approval
- **Approved Users**: Manage currently approved users
- **Real-time Notifications**: Badge shows pending count
- **User Details**: See name, email, profile picture, request time

## Troubleshooting

### Error 400: invalid_request
- Check client ID format (must end with .apps.googleusercontent.com)
- Verify authorized origins match exactly
- Ensure APIs are enabled

### Error 403: access_denied
- Check API key restrictions
- Verify Drive API is enabled
- Check OAuth consent screen configuration

### Sign-in button not appearing
- Verify client ID is correct
- Check browser console for errors
- Ensure all scripts are loaded