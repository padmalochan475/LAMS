# Trident Academy of Technology - Lab Management System (LAMS)

## 🚀 **Quick Start**

**Live System**: https://padmalochan475.github.io/LAMS/  
**Status**: ✅ Production Ready  
**Admin**: padmalochan.maharana@tat.ac.in

## 📋 **Complete Documentation**

For comprehensive documentation, setup instructions, features, and technical details, see:

➡️ **[COMPREHENSIVE-DOCUMENTATION.md](./COMPREHENSIVE-DOCUMENTATION.md)**

## ⚡ **Key Features**
- ✅ Real-time sync across all devices (5-second intervals)
- ✅ Google Drive cloud storage with offline fallback  
- ✅ Cross-device authentication with user approval workflow
- ✅ Responsive design with A4 print optimization
- ✅ Zero-popup background synchronization
- ✅ Automatic conflict detection and resolution

## 🔧 **Tech Stack**
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: Google OAuth 2.0
- **Storage**: Google Drive API (Primary), localStorage (Cache)  
- **Hosting**: GitHub Pages (Static)

## 📁 **Core Files**
```
LAMS/
├── app.js                           # Main application (3278+ lines)
├── auth.js                          # Authentication (1156 lines)
├── config.js                        # Configuration (68 lines)
├── style.css                        # Responsive styling (2900+ lines)
├── index.html                       # Main interface (647 lines)
├── README.md                        # This file
└── COMPREHENSIVE-DOCUMENTATION.md   # Complete documentation
```

## 🎯 **Production Status**

**✅ DEPLOYMENT READY** - All features fully implemented and tested:
- Real-time sync verified across multiple devices globally
- User approval workflow working with cloud synchronization  
- Print optimization tested for A4 landscape format
- Cross-browser compatibility confirmed

Note: GitHub repository backup/sync has been removed from this build. Data is stored in Google Drive only.

---

*For detailed setup, configuration, troubleshooting, and API documentation, refer to [COMPREHENSIVE-DOCUMENTATION.md](./COMPREHENSIVE-DOCUMENTATION.md)*

Edit `config.js` to customize:

```javascript
const CONFIG = {
    GOOGLE_CLIENT_ID: '485361990614-74vhnb9vqjulp17gno3janj8blugshpr.apps.googleusercontent.com',
    GOOGLE_API_KEY: 'AIzaSyBxrTxVOKb9nIJJGy52GjSqhfbYixoqDVE',
    INSTITUTE_NAME: 'Trident Academy of Technology',
    ADMIN_EMAIL: 'padmalochan.maharana@tat.ac.in',
    OAUTH_REDIRECT_URI: 'https://padmalochan475.github.io/LAMS/',
    // ... other settings
};
```

## 🏗️ Cloud-First Architecture

### Real-Time Data Synchronization
- **Primary Storage**: Google Drive API (lams-data.json file)
- **Multi-Device Sync**: Real-time synchronization every 10 seconds across all devices
- **Conflict Resolution**: Version-based conflict detection with timestamps
- **Offline Resilience**: Automatic fallback to local storage when cloud is unavailable
- **Smart Token Management**: Cached authentication tokens prevent popup interruptions

### Data Flow
1. **Initial Load**: Attempts cloud load first, falls back to local storage
2. **Real-Time Updates**: Background sync maintains consistency across devices
3. **Version Control**: Each save includes version number and timestamp for conflict resolution
4. **Seamless Experience**: Users see live updates without manual refresh

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

### Analytics Safe Mode
- Purpose: Prevents chart errors on first run or when there’s no data by skipping heavy Chart.js rendering until data exists.
- Default: Off in production (`CONFIG.FEATURES.ANALYTICS_SAFE_MODE = false`).
- Toggle at runtime: Open the System Health tab and use the "Analytics Safe Mode" checkbox. Changes take effect immediately and re-render analytics.
- Persistence: The preference is saved locally in the browser under the key `analyticsSafeMode` and is applied on next load.

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

**Admin Contact**: padmalochan.maharana@tat.ac.in
**Live System**: https://padmalochan475.github.io/LAMS/

For issues and feature requests, please create an issue in the GitHub repository.

## 📄 License

MIT License - feel free to use for educational and commercial purposes.

---

**Made for Educational Institutes** 🎓
**Customize for your institution**