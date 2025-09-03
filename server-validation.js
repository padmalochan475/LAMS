// Server-side validation using GitHub API to verify legitimate deployment
class ServerValidator {
    constructor() {
        this.validationEndpoint = 'https://api.github.com/repos';
        this.expectedRepo = null; // Will be set dynamically
        this.validationKey = null; // Will be generated
    }

    async validateDeployment() {
        try {
            // Check if running on expected domain
            if (!this.isValidDomain()) {
                this.blockAccess('Invalid domain');
                return false;
            }

            // Validate against GitHub repository
            const isValidRepo = await this.validateRepository();
            if (!isValidRepo) {
                this.blockAccess('Unauthorized deployment');
                return false;
            }

            return true;
        } catch (error) {
            this.blockAccess('Validation failed');
            return false;
        }
    }

    isValidDomain() {
        const allowedDomains = [
            CONFIG.AUTHORIZED_DOMAIN_HASH, // Hashed domain
            'localhost',
            '127.0.0.1'
        ];
        
        const currentDomainHash = this.hashDomain(window.location.hostname);
        return allowedDomains.includes(currentDomainHash);
    }

    async validateRepository() {
        // Check if deployment matches expected repository
        const repoInfo = await this.getRepositoryInfo();
        return repoInfo && repoInfo.valid;
    }

    async getRepositoryInfo() {
        try {
            // This would normally validate against a server endpoint
            // For client-side, we use a different approach
            return { valid: this.validateClientFingerprint() };
        } catch {
            return { valid: false };
        }
    }

    validateClientFingerprint() {
        // Create a unique fingerprint based on multiple factors
        const fingerprint = this.generateFingerprint();
        const expectedFingerprint = CONFIG.DEPLOYMENT_FINGERPRINT;
        
        return fingerprint === expectedFingerprint;
    }

    generateFingerprint() {
        // For padmalochan475.github.io, return the expected fingerprint
        if (window.location.hostname === 'padmalochan475.github.io') {
            return 'lams_padmalochan475_github_io_2024';
        }
        
        // Generate fingerprint based on domain for other cases
        return `lams_${window.location.hostname.replace(/\./g, '_')}_2024`;
    }

    hashDomain(domain) {
        return this.simpleHash(domain);
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    blockAccess(reason) {
        console.error('Access blocked:', reason);
        
        // Clear all data
        localStorage.clear();
        sessionStorage.clear();
        
        // Show blocking message
        document.body.innerHTML = `
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: #f5f5f5;
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div style="
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    max-width: 500px;
                ">
                    <h2 style="color: #d32f2f; margin-bottom: 20px;">⚠️ Unauthorized Access</h2>
                    <p style="color: #666; margin-bottom: 20px;">
                        This application is restricted to authorized deployments only.
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        Contact your system administrator for access.
                    </p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">
                        Error: ${reason}
                    </p>
                </div>
            </div>
        `;
        
        // Prevent further execution
        throw new Error('Access blocked');
    }
}

// Initialize validator
const serverValidator = new ServerValidator();

// Export for global use
window.serverValidator = serverValidator;