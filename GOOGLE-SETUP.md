# Google OAuth Setup Guide

## Step-by-Step Instructions

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "LAMS-GitHub-Pages"
3. Enable APIs:
   - Google Drive API
   - Google+ API (for user info)

### 2. OAuth Consent Screen
```
App name: Institute Lab Management System
User support email: padmalochan475@gmail.com
Developer contact: padmalochan475@gmail.com
Authorized domains: padmalochan475.github.io
Scopes: 
- Google Drive API (../auth/drive.file)
- Google+ API (../auth/userinfo.profile)
```

### 3. Create OAuth Client
```
Application type: Web application
Name: LAMS-OAuth-Client
Authorized origins: https://padmalochan475.github.io
Authorized redirect URIs: https://padmalochan475.github.io/LAMS/
```

### 4. Create API Key
```
API Key restrictions:
- Application restrictions: HTTP referrers
- Website restrictions: https://padmalochan475.github.io/*
- API restrictions: Google Drive API
```

### 5. Update config.js
Replace these values in your config.js:
```javascript
GOOGLE_CLIENT_ID: 'your-client-id.apps.googleusercontent.com',
GOOGLE_API_KEY: 'your-api-key-here',
```

### 6. Test Setup
1. Visit: https://padmalochan475.github.io/LAMS/setup.html
2. Enter your credentials
3. Generate updated config
4. Deploy and test

## Security Notes
- Client ID is public (safe to expose)
- API Key is domain-restricted (secure)
- Each user accesses only their own Drive
- Admin approval required for all users

## Troubleshooting
- **"Origin not allowed"**: Add https://padmalochan475.github.io to authorized origins
- **"API key invalid"**: Check domain restrictions
- **"Access denied"**: Enable required APIs