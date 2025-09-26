# MobileSuiteCRM - React Native Expo App

A mobile CRM application built with React Native and Expo, featuring timezone management, push notifications, and comprehensive module management for SuiteCRM integration.

## 📱 App Features

- **SuiteCRM Integration**: Full CRUD operations for CRM modules
- **Push Notifications**: Real-time notifications with background handling
- **Timezone Management**: Multi-timezone support with automatic conversion
- **Module Management**: Accounts, Contacts, Tasks, Meetings, Opportunities, etc.
- **User Authentication**: Secure login with token-based authentication
- **Offline Caching**: Intelligent caching for better performance

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Android device or emulator
- iOS device or simulator (for iOS development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ThanhNhiet/MobileSuiteCRM.git
   cd crmmobile/crmmobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

## 📲 Running on Physical Devices

### Method 1: Expo Go (Recommended for Development)

#### For Android:
1. **Install Expo Go** from Google Play Store
2. **Connect to same network** as your development machine
3. **Start the development server**:
   ```bash
   npx expo start
   ```
4. **Scan QR code** with Expo Go app or camera
5. **Alternative network connection methods**:
   - **Tunnel mode** (works across different networks):
     ```bash
     npx expo start --tunnel
     ```
   - **LAN mode** (same WiFi network):
     ```bash
     npx expo start
     ```
   - **Localhost** (USB debugging):
     ```bash
     npx expo start --localhost
     ```

#### For iOS:
1. **Install Expo Go** from App Store
2. **Connect to same network**
3. **Start development server** and scan QR code with camera
4. **Open in Expo Go** when prompted

#### Network Troubleshooting for Expo Go:
- **Different Networks**: Use tunnel mode (`--tunnel`)
- **Corporate WiFi**: Try mobile hotspot or tunnel mode
- **Firewall Issues**: Check ports 8000, 8001, 8002 are open
- **Connection Failed**: Try restarting Metro bundler

### Method 2: APK Dev Build (Production-like Testing)

#### Building Development APK:

1. **Install EAS CLI**:
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure build**:
   ```bash
   eas build:configure
   ```

4. **Build development APK**:
   ```bash
   eas build --platform android --profile development
   ```

5. **Install APK on device**:
   - Download APK from build URL
   - Enable "Install from unknown sources"
   - Install APK manually

#### Network Setup for APK Dev Mode:

1. **Find your development machine IP**:
   ```bash
   # Windows
   ipconfig
   
   # macOS/Linux  
   ifconfig
   ```

2. **Start development server with specific host**:
   ```bash
   npx expo start
   ```
   Or
   ```bash
   npx expo start --host 192.168.1.100  # Replace with your IP
   ```

3. **Connect APK to development server**:
   - Shake device to open developer menu
   - Go to "Settings" → "Debug server host & port"
   - Enter: `192.168.1.100:8081` (your IP + port)
   - Reload app

#### APK Dev Mode Network Troubleshooting:
- **Can't connect**: Ensure both devices on same network
- **IP changes**: Update debug server host when IP changes
- **Port issues**: Try different ports (8081, 8000, 19000)
- **Firewall blocking**: Disable firewall temporarily for testing

## 📁 Project Structure

```
src/
├── assets/           # Images, fonts, static files
├── commons/          # Common utilities and routing
├── components/       # Reusable UI components
├── configs/          # Configuration files
├── pages/            # Screen components
├── services/         # API services and hooks
├── utils/            # Utility functions
└── app.js           # Main application component
```

## 🛠️ Available Scripts

```bash
# Start development server
npx expo start

# Start with specific options
npx expo start --tunnel        # Tunnel mode (works across networks)
npx expo start --lan          # LAN mode (same WiFi)
npx expo start --localhost    # Localhost mode (USB)
npx expo start --offline      # Offline mode

# Build commands
eas build --platform android                    # Production build
eas build --platform android --profile development  # Development build
eas build --platform ios                       # iOS build

# Other useful commands
npx expo install               # Install compatible packages
npx expo doctor               # Check for common issues
npx expo prebuild             # Generate native code
```

## 📱 Testing Features

### Push Notifications:
- Requires physical device (not simulator)
- Test with development build, not Expo Go
- Check notification permissions

### Timezone Features:
- Test with different device timezone settings
- Verify date formatting across timezones

### CRM Integration:
- Configure API endpoint in environment variables
- Test CRUD operations with actual SuiteCRM instance

## 📄 License

### License Compatibility Notice

This mobile application **interacts with SuiteCRM via REST API only** and does not incorporate SuiteCRM source code directly. Therefore:

- ✅ **Mobile App**: MIT License (allows commercial use and modification)
- 🔗 **SuiteCRM Integration**: Via API calls only (no license conflict)
- ⚖️ **Compatibility**: MIT License is compatible with SuiteCRM's AGPLv3 when used as separate applications

**Note**: If you modify or redistribute this mobile app, ensure compliance with both licenses:
- Keep MIT License notice for the mobile app code
- Respect SuiteCRM's AGPLv3 license for any SuiteCRM server modifications

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check [Expo documentation](https://docs.expo.dev/)
- Visit [React Native documentation](https://reactnative.dev/)

---

**Happy coding! 🚀**
