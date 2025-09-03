# Trident Academy of Technology - Lab Management System

A comprehensive web-based lab assignment management system designed for Trident Academy of Technology. Features Google Drive integration, responsive design, and optimized A4 printing.

## 🚀 Features

- **Google Authentication**: Secure login with Google accounts
- **Cloud Storage**: Automatic sync with Google Drive
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **A4 Print Optimization**: Professional schedule printing with dynamic font sizing
- **Real-time Analytics**: Comprehensive charts and statistics
- **Conflict Detection**: Automatic detection of scheduling conflicts
- **Bulk Operations**: Manage multiple assignments efficiently
- **Export/Import**: Backup and restore data as JSON files

## 📋 Setup Instructions

### 1. Google OAuth Setup (Already Configured)

**Current Configuration:**
- **Client ID**: `YOUR_GOOGLE_CLIENT_ID`
- **API Key**: `YOUR_GOOGLE_API_KEY`
- **Admin Email**: `your.admin@email.com`
- **Authorized Domain**: `your-username.github.io`
- **Redirect URI**: `https://your-username.github.io/LAMS/`

**Manual Setup (if needed):**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Drive API and Google+ API
4. Create OAuth 2.0 credentials
5. Add your GitHub Pages domain to authorized origins
6. Update credentials in `config.js`

### 2. GitHub Pages Deployment (Live)

**Example Deployment:**
- **Live URL**: https://your-username.github.io/LAMS/
- **Repository**: https://github.com/your-username/LAMS
- **Admin Access**: your.admin@email.com

**For New Deployment:**
1. Fork this repository
2. Update `config.js` with your Google credentials
3. Customize institute information in `config.js`
4. Enable GitHub Pages in repository settings
5. Select source as "Deploy from a branch" → "main"

### 3. Configuration

Edit `config.js` to customize:

```javascript
const CONFIG = {
    GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID',
    GOOGLE_API_KEY: 'YOUR_GOOGLE_API_KEY',
    INSTITUTE_NAME: 'Your Institute Name',
    ADMIN_EMAIL: 'your.admin@email.com',
    OAUTH_REDIRECT_URI: 'https://your-username.github.io/LAMS/',
    // ... other settings
};
```

## 🖨️ Print Features

- **A4 Landscape Optimization**: Perfect for institute schedules
- **Dynamic Font Sizing**: Automatically adjusts based on content density
- **Professional Layout**: Clean, readable format for students and faculty
- **Multi-lab Support**: Handles up to 10+ labs per time slot efficiently

## 📱 Responsive Design

- **Mobile-First**: Optimized for all screen sizes
- **Touch-Friendly**: Easy navigation on tablets and phones
- **Progressive Enhancement**: Works without JavaScript for basic functionality

## 🔧 Technical Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: Google OAuth 2.0
- **Storage**: Google Drive API + Local Storage
- **Charts**: Chart.js
- **Hosting**: GitHub Pages compatible

## 📊 Analytics Features

- Lab utilization analysis
- Faculty workload distribution
- Department-wise statistics
- Time slot efficiency metrics
- Semester-wise reports

## 🔒 Security Features

- Google OAuth authentication
- Secure data storage in Google Drive
- Client-side data validation
- No sensitive data in localStorage

## 🎯 Use Cases

- **Primary**: Trident Academy of Technology Lab Management
- **Academic Institutions**: Universities, colleges, schools
- **Training Centers**: Technical and vocational institutes
- **Corporate Training**: Company training facilities
- **Research Labs**: Research institution lab management

## 📞 Support

**Admin Contact**: your.admin@email.com
**Live System**: https://your-username.github.io/LAMS/

For issues and feature requests, please create an issue in the GitHub repository.

## 📄 License

MIT License - feel free to use for educational and commercial purposes.

---

**Made for Educational Institutes** 🎓
**Customize for your institution**