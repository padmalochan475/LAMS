# GitHub Sync Implementation for LAMS

## 🎯 Overview

The LAMS (Lab Assignment Management System) now includes full GitHub repository synchronization, allowing data to be automatically synced to your GitHub repository whenever changes are made in the application.

## 🚀 Key Features

### ✅ Real-Time GitHub Sync
- **Automatic Sync**: Every assignment creation, modification, or deletion is automatically synced to GitHub
- **Multi-Source Loading**: Data can be loaded from GitHub, Google Drive, or local storage
- **Version Control**: Full version tracking with timestamps and user information
- **Conflict Resolution**: Smart merging of data from multiple sources

### 🔧 Admin Configuration
- **Easy Setup**: Admin can configure GitHub integration with a Personal Access Token
- **Security**: Token is stored securely and only accessible by admin users
- **Status Monitoring**: Real-time status display in admin panel
- **Repository Information**: Direct links to repository and data file

### 📊 Data Management
- **Structured Storage**: Data is stored in `data/lams-data.json` in your repository
- **Metadata Tracking**: Each sync includes device ID, timestamp, and user information
- **Backup & Recovery**: GitHub serves as a reliable backup for all assignment data

## 🛠️ Setup Instructions

### Step 1: Generate GitHub Personal Access Token

1. Go to [GitHub Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name: "LAMS Data Sync"
4. Select the following scopes:
   - ✅ **repo** (Full control of private repositories)
5. Click "Generate token"
6. **Important**: Copy the token immediately (it won't be shown again)

### Step 2: Configure in LAMS

1. Sign in to LAMS as an admin user
2. Go to the **Dashboard** tab
3. In the **Admin Panel**, click "Configure GitHub"
4. Paste your Personal Access Token
5. Click configure

### Step 3: Verify Setup

1. Check that "GitHub Sync" status shows "Configured" 
2. Click "Sync to GitHub" to perform initial sync
3. Visit your repository at: https://github.com/padmalochan475/LAMS
4. Check the `data/lams-data.json` file

## 📁 Repository Structure

```
LAMS/
├── data/
│   └── lams-data.json          # Automatically synced data
├── github-sync.js              # GitHub integration module
├── github-sync-test.html       # Test interface
├── app.js                      # Enhanced with GitHub sync
├── config.js                   # GitHub configuration
└── index.html                  # Updated UI with GitHub controls
```

## 🔄 How It Works

### Automatic Sync Flow

1. **User Action**: Admin/user creates, modifies, or deletes assignment
2. **Immediate UI Update**: Interface updates instantly
3. **Google Drive Sync**: Data synced to Google Drive for real-time collaboration
4. **GitHub Sync**: Data automatically synced to GitHub repository
5. **Status Update**: User receives confirmation of successful sync

### Data Loading Priority

1. **GitHub** (if configured) - Most recent repository data
2. **Google Drive** - Real-time collaborative data
3. **Local Storage** - Offline fallback

### Sync Data Structure

```json
{
  "assignments": [...],
  "subjects": [...],
  "labRooms": [...],
  "timeSlots": [...],
  "academicYear": "2024-25",
  "version": 5,
  "lastModified": "2025-09-14T10:30:00.000Z",
  "lastGitHubSync": {
    "timestamp": "2025-09-14T10:30:00.000Z",
    "user": "admin@tat.ac.in",
    "version": 5
  },
  "lastSyncDevice": {
    "deviceId": "device_abc123",
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2025-09-14T10:30:00.000Z",
    "userEmail": "admin@tat.ac.in",
    "syncVersion": "2.0"
  }
}
```

## 🧪 Testing

### Using the Test Interface

1. Open `github-sync-test.html` in your browser
2. Configure your GitHub token
3. Create test data
4. Test sync operations
5. Verify data appears in your repository

### Manual Testing

1. Create an assignment in LAMS
2. Check the browser console for sync messages
3. Visit your GitHub repository
4. Verify `data/lams-data.json` has been updated
5. Check the commit history for automatic commits

## 🔒 Security Considerations

### Token Security
- Personal Access Token stored locally (not in repository)
- Only admin users can configure GitHub integration
- Token has minimal required permissions (repo access only)

### Data Privacy
- All data synced to your private repository
- No third-party services involved beyond GitHub
- Full control over data access and permissions

## 🚨 Troubleshooting

### Common Issues

**"GitHub not configured"**
- Solution: Admin needs to set up Personal Access Token

**"GitHub sync failed"**
- Check internet connection
- Verify token has repo permissions
- Check repository exists and is accessible

**"No data found in GitHub"**
- First sync hasn't been performed yet
- Check if `data/lams-data.json` exists in repository

### Debug Tools

1. **Browser Console**: Check for detailed error messages
2. **Test Interface**: Use `github-sync-test.html` for isolated testing
3. **Admin Panel**: Monitor sync status in real-time

## 📈 Benefits

### For Administrators
- **Backup**: Automatic backup of all assignment data
- **Version Control**: Complete history of all changes
- **Transparency**: Public repository shows data changes
- **Recovery**: Easy restoration from any point in time

### For Users
- **Reliability**: Data automatically backed up to GitHub
- **Synchronization**: Changes visible across all devices
- **Performance**: Fast loading from multiple sources
- **Offline Support**: Local fallback when cloud unavailable

## 🔮 Future Enhancements

- **Branch Support**: Sync to different branches for testing
- **Selective Sync**: Choose which data types to sync
- **Webhook Integration**: Real-time notifications on data changes
- **Automatic Backups**: Scheduled backups to separate repository

## 📞 Support

For issues or questions:
1. Check the browser console for error messages
2. Use the test interface to isolate problems
3. Verify GitHub token permissions
4. Check repository access and permissions

---

**Status**: ✅ Production Ready  
**Version**: 2.0  
**Last Updated**: September 14, 2025
