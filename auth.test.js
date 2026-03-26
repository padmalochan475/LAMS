const AuthManager = require('./auth.js');

describe('AuthManager.generateDeviceId', () => {
    let authManager;
    let originalNavigator;
    let originalMathRandom;
    let originalDateNow;
    let originalWindow;

    beforeEach(() => {
        // Mock global objects for Node environment
        originalNavigator = global.navigator;
        originalMathRandom = Math.random;
        originalDateNow = Date.now;
        originalWindow = global.window;

        global.window = {
            location: { hostname: 'localhost' }
        };

        global.navigator = {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };

        // Mock Math.random to return a predictable value
        // 0.123456789.toString(36) is "0.4fzzzxjylrx..."
        // substring(2) gives "4fzzzxjylrx..."
        Math.random = jest.fn(() => 0.123456789);

        // Mock Date.now to return a fixed timestamp 1625097600000
        // 1625097600000.toString(36) is "kqk55hc0"
        Date.now = jest.fn(() => 1625097600000);

        // Mock CONFIG which is used in constructor
        global.CONFIG = {
            GOOGLE_CLIENT_ID: 'test-client-id',
            GOOGLE_API_KEY: 'test-api-key'
        };

        // Mock localStorage
        global.localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn()
        };

        // Mock document
        global.document = {
            addEventListener: jest.fn(),
            getElementById: jest.fn(() => ({ style: {} })),
            querySelectorAll: jest.fn(() => [])
        };

        // Create a new instance for each test
        authManager = new AuthManager();
    });

    afterEach(() => {
        // Restore global objects
        global.navigator = originalNavigator;
        Math.random = originalMathRandom;
        Date.now = originalDateNow;
        global.window = originalWindow;
        delete global.CONFIG;
        delete global.localStorage;
        delete global.document;
    });

    test('should generate a device ID with the correct prefix', () => {
        const deviceId = authManager.generateDeviceId();
        expect(deviceId.startsWith('device_')).toBe(true);
    });

    test('should contain exactly 4 parts separated by underscores', () => {
        const deviceId = authManager.generateDeviceId();
        const parts = deviceId.split('_');
        // Wait, I saw 4 parts in the code: device, timestamp, randomStr, browserInfo
        // "device_timestamp_randomStr_browserInfo"
        expect(parts.length).toBe(4);
        expect(parts[0]).toBe('device');
    });

    test('should include the base36 timestamp', () => {
        const deviceId = authManager.generateDeviceId();
        const timestampBase36 = (1625097600000).toString(36);
        expect(deviceId.includes(timestampBase36)).toBe(true);
    });

    test('should include a random string component', () => {
        const deviceId = authManager.generateDeviceId();
        const randomStr = (0.123456789).toString(36).substring(2);
        expect(deviceId.includes(randomStr)).toBe(true);
    });

    test('should include sanitized browser info from user agent', () => {
        const deviceId = authManager.generateDeviceId();
        // User agent: '... Chrome/91.0.4472.124 Safari/537.36'
        // navigator.userAgent.split(' ').slice(-2) -> ['Chrome/91.0.4472.124', 'Safari/537.36']
        // .join('_') -> 'Chrome/91.0.4472.124_Safari/537.36'
        // .replace(/[^a-zA-Z0-9]/g, '') -> 'Chrome9104472124Safari53736'
        // So it's NOT Chrome9104472124_Safari53736, because the replace removes the underscore!
        expect(deviceId).toMatch(/Chrome9104472124Safari53736$/);
    });

    test('should be deterministic with mocked values', () => {
        const deviceId = authManager.generateDeviceId();
        const timestampBase36 = (1625097600000).toString(36);
        const randomStr = (0.123456789).toString(36).substring(2);
        const expected = `device_${timestampBase36}_${randomStr}_Chrome9104472124Safari53736`;
        expect(deviceId).toBe(expected);
    });
});
