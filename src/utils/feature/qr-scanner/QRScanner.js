import * as Haptics from 'expo-haptics';
import { Alert, Linking } from 'react-native';

export class QRScanner {
    constructor() {
        this.lastScanTime = 0;
        this.scanCooldown = 2000; // 2 seconds cooldown between scans
    }

    /**
     * Process scanned QR code data
     * @param {string} data - The scanned QR code data
     * @param {function} onSuccess - Callback for successful scan
     * @param {function} onError - Callback for scan error
     */
    processQRData(data, onSuccess, onError) {
        try {
            // Check cooldown to prevent rapid scanning
            const currentTime = Date.now();
            if (currentTime - this.lastScanTime < this.scanCooldown) {
                return;
            }
            this.lastScanTime = currentTime;

            // Haptic feedback for successful scan
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Validate QR data
            if (!data || typeof data !== 'string' || data.trim() === '') {
                throw new Error('Invalid QR code data');
            }

            const trimmedData = data.trim();

            // Analyze QR code type
            const qrInfo = this.analyzeQRCode(trimmedData);

            // Call success callback with processed data
            if (onSuccess) {
                onSuccess({
                    rawData: trimmedData,
                    type: qrInfo.type,
                    displayText: qrInfo.displayText,
                    actionable: qrInfo.actionable,
                    actionLabel: qrInfo.actionLabel
                });
            }

        } catch (error) {
            console.error('QR Processing Error:', error);
            
            // Haptic feedback for error
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            
            if (onError) {
                onError(error.message || 'Failed to process QR code');
            }
        }
    }

    /**
     * Analyze QR code to determine its type and format display text
     * @param {string} data - The QR code data
     * @returns {object} - Analysis result with type, display text, and action info
     */
    analyzeQRCode(data) {
        const result = {
            type: 'text',
            displayText: data,
            actionable: false,
            actionLabel: null
        };

        // URL detection
        if (this.isURL(data)) {
            result.type = 'url';
            result.displayText = `Website: ${data}`;
            result.actionable = true;
            result.actionLabel = 'Open in Browser';
            return result;
        }

        // Email detection
        if (this.isEmail(data)) {
            result.type = 'email';
            result.displayText = `Email: ${data}`;
            result.actionable = true;
            result.actionLabel = 'Send Email';
            return result;
        }

        // Phone number detection
        if (this.isPhoneNumber(data)) {
            result.type = 'phone';
            result.displayText = `Phone: ${data}`;
            result.actionable = true;
            result.actionLabel = 'Call';
            return result;
        }

        // WiFi QR code detection
        if (data.startsWith('WIFI:')) {
            result.type = 'wifi';
            const wifiInfo = this.parseWiFiQR(data);
            result.displayText = `WiFi Network: ${wifiInfo.ssid}`;
            result.actionable = false; // WiFi connection requires manual setup
            return result;
        }

        // SMS detection
        if (data.startsWith('sms:') || data.startsWith('SMS:')) {
            result.type = 'sms';
            result.displayText = `SMS: ${data}`;
            result.actionable = true;
            result.actionLabel = 'Send SMS';
            return result;
        }

        // Geographic coordinates
        if (this.isGeoLocation(data)) {
            result.type = 'location';
            result.displayText = `Location: ${data}`;
            result.actionable = true;
            result.actionLabel = 'Open in Maps';
            return result;
        }

        // JSON detection
        if (this.isJSON(data)) {
            result.type = 'json';
            result.displayText = 'JSON Data';
            result.actionable = false;
            return result;
        }

        // Default: plain text
        return result;
    }

    /**
     * Execute action based on QR code type
     * @param {object} qrData - The processed QR data
     */
    async executeAction(qrData) {
        try {
            switch (qrData.type) {
                case 'url':
                    await this.openURL(qrData.rawData);
                    break;
                case 'email':
                    await this.openEmail(qrData.rawData);
                    break;
                case 'phone':
                    await this.makeCall(qrData.rawData);
                    break;
                case 'sms':
                    await this.sendSMS(qrData.rawData);
                    break;
                case 'location':
                    await this.openLocation(qrData.rawData);
                    break;
                default:
                    Alert.alert('Info', 'No action available for this QR code type');
            }
        } catch (error) {
            console.error('Action execution error:', error);
            Alert.alert('Error', 'Failed to execute action');
        }
    }

    // Helper methods for QR code type detection
    isURL(data) {
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
        return urlPattern.test(data) || data.startsWith('http://') || data.startsWith('https://');
    }

    isEmail(data) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(data) || data.startsWith('mailto:');
    }

    isPhoneNumber(data) {
        const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanData = data.replace(/[\s\-\(\)]/g, '');
        return phonePattern.test(cleanData) || data.startsWith('tel:');
    }

    isGeoLocation(data) {
        return data.startsWith('geo:') || 
               /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(data);
    }

    isJSON(data) {
        try {
            JSON.parse(data);
            return true;
        } catch {
            return false;
        }
    }

    parseWiFiQR(data) {
        const wifiInfo = { ssid: '', password: '', security: '' };
        const parts = data.split(';');
        
        parts.forEach(part => {
            if (part.startsWith('S:')) {
                wifiInfo.ssid = part.substring(2);
            } else if (part.startsWith('P:')) {
                wifiInfo.password = part.substring(2);
            } else if (part.startsWith('T:')) {
                wifiInfo.security = part.substring(2);
            }
        });

        return wifiInfo;
    }

    // Action execution methods
    async openURL(url) {
        const formattedURL = url.startsWith('http') ? url : `https://${url}`;
        const canOpen = await Linking.canOpenURL(formattedURL);
        
        if (canOpen) {
            await Linking.openURL(formattedURL);
        } else {
            throw new Error('Cannot open URL');
        }
    }

    async openEmail(email) {
        const emailURL = email.startsWith('mailto:') ? email : `mailto:${email}`;
        const canOpen = await Linking.canOpenURL(emailURL);
        
        if (canOpen) {
            await Linking.openURL(emailURL);
        } else {
            throw new Error('Cannot open email client');
        }
    }

    async makeCall(phone) {
        const phoneURL = phone.startsWith('tel:') ? phone : `tel:${phone}`;
        const canOpen = await Linking.canOpenURL(phoneURL);
        
        if (canOpen) {
            await Linking.openURL(phoneURL);
        } else {
            throw new Error('Cannot make phone call');
        }
    }

    async sendSMS(sms) {
        const smsURL = sms.startsWith('sms:') ? sms : `sms:${sms}`;
        const canOpen = await Linking.canOpenURL(smsURL);
        
        if (canOpen) {
            await Linking.openURL(smsURL);
        } else {
            throw new Error('Cannot open SMS app');
        }
    }

    async openLocation(location) {
        let mapsURL;
        
        if (location.startsWith('geo:')) {
            const coords = location.substring(4);
            mapsURL = `https://maps.google.com/?q=${coords}`;
        } else {
            mapsURL = `https://maps.google.com/?q=${location}`;
        }
        
        const canOpen = await Linking.canOpenURL(mapsURL);
        
        if (canOpen) {
            await Linking.openURL(mapsURL);
        } else {
            throw new Error('Cannot open maps application');
        }
    }

    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!QRScanner.instance) {
            QRScanner.instance = new QRScanner();
        }
        return QRScanner.instance;
    }
}

export default QRScanner;
