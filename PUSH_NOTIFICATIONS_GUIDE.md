# Push Notifications - Background Testing Guide

## Vấn đề: App không nhận notification khi đóng

### Nguyên nhân chính:

1. **Expo Dev Client vs Production**: 
   - Expo Dev Client có thể không xử lý background notifications tốt
   - Cần build production APK/IPA để test đầy đủ

2. **Permissions không đầy đủ**:
   - Android: Cần notification permissions và battery optimization disabled
   - iOS: Cần background app refresh enabled

3. **Platform-specific settings**:
   - Android: Background app restrictions
   - iOS: Background App Refresh settings

### Kiểm tra và sửa lỗi:

#### 1. **Test với Local Notifications trước** ✅
```javascript
// Đã implement trong PushNotificationTestScreen
await sendTestNotification();
```

#### 2. **Kiểm tra Permissions**
- Vào Settings → Apps → YourApp → Notifications
- Đảm bảo tất cả notification categories được enabled
- Android: Disable battery optimization cho app

#### 3. **Test Background Delivery**
```javascript
// Test steps:
1. Mở app và tap "Send Local Test Notification"
2. Ngay lập tức minimize/close app
3. Đợi 2 giây
4. Bạn sẽ nhận được notification ngay cả khi app đã đóng
```

#### 4. **Production Build Testing**
```bash
# Build for testing
eas build --platform android --profile preview
# hoặc
expo build:android
```

#### 5. **Server-side Push Testing**
```javascript
// Test với Postman:
POST https://exp.host/--/api/v2/push/send
{
  "to": "ExponentPushToken[YOUR_TOKEN]",
  "title": "Test Background",
  "body": "This should work in background",
  "sound": "default",
  "priority": "high",
  "channelId": "default"
}
```

### Cấu hình đã thêm:

#### 1. **Enhanced Notification Handler**
```javascript
Notifications.setNotificationHandler({
  handleNotification: async (notification) => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
```

#### 2. **High Priority Android Channel**
```javascript
await Notifications.setNotificationChannelAsync('high-priority', {
  name: 'High Priority',
  importance: Notifications.AndroidImportance.HIGH,
  sound: 'default',
  enableLights: true,
  enableVibrate: true,
  showBadge: true,
});
```

#### 3. **Comprehensive Permission Request**
```javascript
await Notifications.requestPermissionsAsync({
  ios: {
    allowAlert: true,
    allowBadge: true,
    allowSound: true,
    allowCriticalAlerts: true,
    allowProvisional: true,
  },
  android: {
    allowAlert: true,
    allowBadge: true,
    allowSound: true,
  },
});
```

#### 4. **Background State Handling**
```javascript
// App.js - Handles app state changes and last notification
AppState.addEventListener('change', handleAppStateChange);
Notifications.getLastNotificationResponseAsync();
```

### Debug Tools:

1. **Device Info**: Check if running on real device
2. **Permission Status**: Detailed permission breakdown
3. **Local Test**: Send test notification to verify delivery
4. **Console Logs**: Track notification flow

### Troubleshooting Steps:

1. **Verify Device**: Must be physical device, not simulator
2. **Check Permissions**: Use built-in permission checker
3. **Test Local First**: Use local notifications to isolate issues
4. **Check Server Token**: Ensure token is properly saved to server
5. **Production Build**: Test with production build for full functionality

### Expected Behavior:

- ✅ **Foreground**: Notification shown in app
- ✅ **Background**: Notification appears in system tray
- ✅ **Killed**: Notification appears and can launch app
- ✅ **Tapped**: App opens with notification data

### Notes:

- Background notifications work differently in development vs production
- Some Android devices aggressively kill background processes
- iOS has stricter background limitations
- Always test on multiple devices and OS versions