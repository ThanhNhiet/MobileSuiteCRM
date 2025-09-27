import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { saveDeviceTokenApi } from '../services/api/external/ExternalApi';

// Configure notification handler for both foreground and background
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // console.log('Notification handler called:', notification);
    return {
      shouldShowAlert: true,      // Show alert even when app is active
      shouldPlaySound: true,      // Play notification sound
      shouldSetBadge: true,       // Update badge count
      shouldShowBanner: true,     // Show banner notification
      shouldShowList: true,       // Add to notification list
    };
  },
});

// Error handler for registration issues
function handleRegistrationError(errorMessage) {
  console.warn('Push notification registration error:', errorMessage);
  throw new Error(errorMessage);
}

// Register for push notifications and get Expo token
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    // Create notification channel for Android with CRITICAL priority for killed app handling
    await Notifications.setNotificationChannelAsync('default', {
      name: 'CRM Notifications',
      importance: Notifications.AndroidImportance.MAX, // Highest priority
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      bypassDnd: true,        // Bypass Do Not Disturb
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    // Create HIGH PRIORITY channel matching server config
    await Notifications.setNotificationChannelAsync('high-priority', {
      name: 'High Priority CRM',
      importance: Notifications.AndroidImportance.MAX, // Changed to MAX
      vibrationPattern: [0, 500, 250, 500], // More noticeable pattern
      lightColor: '#FF0000',
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      bypassDnd: true,        // Critical for killed app notifications
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    // Create CRITICAL channel for emergency notifications
    await Notifications.setNotificationChannelAsync('critical', {
      name: 'Critical CRM Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 1000, 500, 1000],
      lightColor: '#FF0000',
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: true,
          allowCriticalAlerts: true,
          provideAppNotificationSettings: true,
          allowProvisional: true,
          allowAnnouncements: true,
        },
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: true,
          // Request critical permissions for killed app notifications
          allowCriticalAlerts: true,
          allowProvisional: true,
        },
      });
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      handleRegistrationError('Permission not granted to get push token for push notification!');
      return null;
    }
    
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError('Project ID not found');
      return null;
    }
    
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      return pushTokenString;
    } catch (e) {
      handleRegistrationError(`Failed to get push token: ${e}`);
      return null;
    }
  } else {
    handleRegistrationError('Must use physical device for push notifications');
    return null;
  }
}

// Register device token with server after login
export async function registerDeviceTokenWithServer() {
  try {
    // Get Expo push token
    const expoToken = await registerForPushNotificationsAsync();
    if (!expoToken) {
      console.warn('Failed to get Expo push token');
      return false;
    }
    // Get platform information
    const platform = Platform.OS; // 'ios' or 'android'
    // Send token to server
    await saveDeviceTokenApi(expoToken, platform);
    return true;
  } catch (error) {
    console.error('Error registering device token with server:', error);
    return false;
  }
}

// Setup notification listeners
export function setupNotificationListeners(navigationRef = null) {
  // Listener for notifications received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    // console.log('Notification received in foreground:', notification);
    // You can show custom UI or handle the notification here
  });

  // Listener for when user taps on notification (works for background/killed app too)
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);
    
    let moduleValue = null;
    let targetIdValue = null;
    
    // Ưu tiên data payload (hoạt động tốt khi killed app)
    if (response.notification?.request?.content?.data) {
      const data = response.notification.request.content.data;
      moduleValue = data.module;
      targetIdValue = data.targetId;
      console.log('Using data payload:', { moduleValue, targetIdValue });
    } 
    // Fallback: parse từ body nếu không có data
    else if (response.notification?.request?.content?.body) {
      const body = response.notification.request.content.body;
      const lines = body.split('\n');
      lines.forEach(line => {
        if (line.startsWith('Module:')) {
          moduleValue = line.replace('Module:', '').trim();
        }
        if (line.startsWith('Target ID:')) {
          targetIdValue = line.replace('Target ID:', '').trim();
        }
      });
      console.log('Using body parsing:', { moduleValue, targetIdValue });
    }

    // Navigate to the appropriate screen
    if (moduleValue && targetIdValue && navigationRef?.current) {
      try {
        console.log('Navigating to:', { moduleName: moduleValue, recordId: targetIdValue });
        navigationRef.current.navigate('ModuleDetailScreen', { 
          moduleName: moduleValue, 
          recordId: targetIdValue 
        });
      } catch (navError) {
        console.warn('Navigation error:', navError);
      }
    } else {
      console.warn('Missing navigation data:', { moduleValue, targetIdValue, hasNavRef: !!navigationRef?.current });
    }
  });

  // Listener for when app is launched by tapping a notification
  const notificationResponseReceivedListener = Notifications.addNotificationResponseReceivedListener(response => {
    // const notificationData = response.notification.request.content.data;
    // if (notificationData) {
    //   console.log('App launched from notification with data:', notificationData);
    //   // Handle navigation or actions based on notification data
    // }
  });

  // Return cleanup function
  return () => {
    notificationListener.remove();
    responseListener.remove();
    notificationResponseReceivedListener.remove();
  };
}

// Get device info for debugging
export function getDeviceInfo() {
  return {
    isDevice: Device.isDevice,
    platform: Platform.OS,
    deviceType: Device.deviceType,
    deviceName: Device.deviceName,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
  };
}

// Send a local test notification (for testing purposes)
export async function sendTestNotification() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔥 CRITICAL Test Notification",
        body: "Module: Accounts\nTarget ID: 12345\nThis tests killed-app delivery!",
        data: { 
          type: 'crm_notification',
          module: 'Accounts', 
          targetId: '12345',
          timestamp: Date.now(),
          action: 'navigate_to_detail'
        },
        sound: 'default',
        priority: Notifications.AndroidImportance.MAX,
        vibrate: [0, 500, 250, 500],
        badge: 1,
      },
      trigger: { seconds: 2 }, // Send after 2 seconds
    });
    return true;
  } catch (error) {
    console.error('❌ Failed to send test notification:', error);
    return false;
  }
}

// Test notification for killed app scenario
export async function sendKilledAppTestNotification(delaySeconds = 10) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Kill App Test",
        body: "Module: Contacts\nTarget ID: 67890\nKill app NOW! Will arrive in " + delaySeconds + "s",
        data: { 
          module: 'Contacts', 
          targetId: '67890',
          type: 'crm_notification'
        },
        sound: 'default',
        priority: Notifications.AndroidImportance.MAX,
        vibrate: [0, 1000, 500, 1000],
        badge: 1,
        categoryIdentifier: 'critical',
      },
      trigger: { seconds: delaySeconds },
    });
    
    console.log(`Test scheduled for ${delaySeconds}s. KILL THE APP NOW!`);
    return true;
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}

// Check notification permissions status
export async function checkNotificationPermissions() {
  try {
    const settings = await Notifications.getPermissionsAsync();
    const detailed = {
      canAskAgain: settings.canAskAgain,
      granted: settings.granted,
      ios: settings.ios,
      android: settings.android,
      status: settings.status,
    };
    
    return detailed;
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return null;
  }
}

// Get notification settings guidance for killed app issue
export function getKilledAppNotificationGuidance() {
  const guidance = {
    android: {
      title: "📱 Android Settings for Background Notifications",
      steps: [
        "🔋 **Battery Optimization**: Settings → Apps → CRM App → Battery → Don't optimize",
        "📶 **Auto-start Management**: Settings → Apps → CRM App → Auto-start → Enable",
        "🔔 **Notification Settings**: Settings → Apps → CRM App → Notifications → Allow all",
        "⚡ **Background App Refresh**: Settings → Apps → CRM App → Battery → Background activity → Allow",
        "🛡️ **Protected Apps**: Settings → Security → Protected apps → Enable CRM App",
        "💤 **Doze Mode**: Settings → Battery → Battery optimization → CRM App → Don't optimize"
      ],
      brands: {
        xiaomi: "Settings → Apps → Manage apps → CRM App → Other permissions → Display pop-up windows while running in background",
        huawei: "Settings → Apps → CRM App → Launch → Manage manually → Enable all options",
        oppo: "Settings → Apps → CRM App → App battery usage → Allow background activity",
        vivo: "Settings → Apps → CRM App → Background app refresh → Allow",
        samsung: "Settings → Apps → CRM App → Battery → Allow background activity",
        oneplus: "Settings → Apps → CRM App → App battery usage → Don't optimize"
      }
    },
    ios: {
      title: "📱 iOS Settings for Background Notifications", 
      steps: [
        "🔔 **Notifications**: Settings → Notifications → CRM App → Allow Notifications",
        "📱 **Background App Refresh**: Settings → General → Background App Refresh → CRM App → ON",
        "🔋 **Low Power Mode**: Disable Low Power Mode when expecting notifications",
        "⏰ **Focus/Do Not Disturb**: Add CRM App to allowed apps",
        "🔒 **Screen Time**: Don't set app limits for CRM App"
      ]
    },
    serverPayload: {
      title: "🚀 Server Payload Requirements",
      requirements: [
        "✅ **Priority**: 'high' (matches server config)",
        "✅ **Channel ID**: 'high-priority' (matches server config)", 
        "✅ **Sound**: 'default' (matches server config)",
        "⚠️ **Missing**: Add 'data' field for better handling",
        "⚠️ **Consider**: Add 'badge' count for iOS"
      ]
    }
  };
  
  return guidance;
}

// Enhanced function to detect potential killed-app notification issues
export async function diagnosePushNotificationIssues() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    device: getDeviceInfo(),
    permissions: await checkNotificationPermissions(),
    issues: [],
    recommendations: []
  };

  // Check permissions
  if (!diagnostics.permissions?.granted) {
    diagnostics.issues.push("❌ Notifications permission not granted");
    diagnostics.recommendations.push("Request notification permissions");
  }

  // Check device type
  if (!diagnostics.device.isDevice) {
    diagnostics.issues.push("❌ Running on emulator/simulator");
    diagnostics.recommendations.push("Test on physical device for accurate results");
  }

  // Platform-specific checks
  if (diagnostics.device.platform === 'android') {
    diagnostics.recommendations.push("Check battery optimization settings");
    diagnostics.recommendations.push("Verify auto-start permissions");
    diagnostics.recommendations.push("Ensure background activity is allowed");
  }

  if (diagnostics.device.platform === 'ios') {
    diagnostics.recommendations.push("Check Background App Refresh settings");
    diagnostics.recommendations.push("Verify Focus/Do Not Disturb settings");
  }

  return diagnostics;
}