# Copilot Instructions for LAMS (Lab Management System)

## Project Overview
- **Purpose:** Web-based lab assignment management for educational institutes, with Google Drive integration and responsive A4 print features.
- **Tech Stack:** Vanilla JavaScript, HTML5, CSS3. No frameworks. Uses Google OAuth 2.0 and Google Drive API for authentication and storage.
- **Hosting:** GitHub Pages. All code runs client-side; no backend server.

## Key Files & Structure
- `app.js`: Main application logic, UI, and event handling (~1900 lines).
- `auth.js`: Handles Google OAuth authentication and user session management (~700 lines).
- `config.js`: Stores institute-specific settings and Google API credentials. **Production-ready configuration in place.**
- `style.css`: Custom styles for responsive and print-optimized layouts (~2900 lines).
- `index.html`: Main entry point. Other HTML files are for setup, debugging, and feature demos.

## Configuration & Deployment
- **✅ Configuration Complete:** All credentials and settings properly configured for Trident Academy of Technology.
- **✅ Production Ready:** Deploy via GitHub Pages by pushing to `main` branch.
- **Live URL:** https://padmalochan475.github.io/LAMS/
- All sensitive data is properly configured in `config.js`.

## Known Issues & Solutions
- **Popup Blockers:** Google Drive sync requires popups. Users should allow popups for the domain.
- **Cross-Origin Policy:** Modern browsers may block some auth flows; manual sync buttons provide fallback.
- **Background Sync:** Automatic syncing is throttled to avoid spam and popup issues.

## Developer Workflows
- **No build step required** - Static files deployment.
- **Testing:** Manual testing via browser. Use specialized HTML files:
  - `debug.html` - Configuration and API testing
  - `drive-test.html` - Google Drive integration testing
  - `auth-test.html` - Authentication flow testing
  - `credential-extractor.html` - API credential verification
- **Debugging:** Browser DevTools + network inspection for Google API calls.
- **Print Testing:** Browser print preview (A4 landscape recommended).

## Patterns & Conventions
- **Centralized configuration** in `config.js` - all settings in one place.
- **Event-driven architecture** - DataManager handles state, events trigger UI updates.
- **Responsive design** - Mobile-first CSS with print optimization.
- **Data persistence** - Dual storage: localStorage (session) + Google Drive (cloud sync).
- **Error handling** - Try/catch blocks with user-friendly notifications.

## Integration Points
- **Google OAuth 2.0:** Authentication via `auth.js` using credentials from `config.js`.
- **Google Drive API:** Cloud storage, sync, backup/restore via authenticated calls.
- **Chart.js:** Analytics and reporting visualizations (loaded via CDN).
- **No external build tools** - Pure vanilla JS with ES6+ features.

## Code Quality Standards
- **Clean initialization** - Removed extra whitespace and formatting issues.
- **Proper error handling** - All API calls wrapped in try/catch blocks.
- **No placeholder values** - All configuration uses actual production values.
- **Input validation** - Forms validate data before processing.

## Examples
- Edit institute info: Modify `INSTITUTE_NAME` in `config.js` and redeploy.
- Test auth: Open `auth-test.html` to verify Google OAuth flow.
- Debug sync: Use `drive-test.html` to test Google Drive integration.
- Customize print: Edit CSS print rules and test with browser print preview.

## Security & Privacy
- **OAuth-only authentication** - No passwords stored locally.
- **Secure cloud storage** - Data encrypted in Google Drive.
- **Session management** - localStorage for UI state, Google Drive for persistence.
- **Domain restrictions** - API keys configured for specific domains.

---
**Configuration Status: ✅ PRODUCTION READY**  
**All placeholder values resolved and security issues fixed.**
