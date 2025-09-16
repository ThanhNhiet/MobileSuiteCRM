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
    // Create notification channel for Android with high priority
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });

    // Create a high priority channel for important notifications
    await Notifications.setNotificationChannelAsync('high-priority', {
      name: 'High Priority',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
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
    // console.log('body:', response.notification.request.content.body);
    // Parse body string to extract Module and Target ID
    let moduleValue = null;
    let targetIdValue = null;
    
    if (response.notification?.request?.content?.body) {
      const body = response.notification.request.content.body;
      // Split by line
      const lines = body.split('\n');
      lines.forEach(line => {
        if (line.startsWith('Module:')) {
          moduleValue = line.replace('Module:', '').trim();
        }
        if (line.startsWith('Target ID:')) {
          targetIdValue = line.replace('Target ID:', '').trim();
        }
      });
    }

    // Navigate to the appropriate screen based on the notification
    if (moduleValue && targetIdValue && navigationRef?.current) {
      try {
        navigationRef.current.navigate('ModuleDetailScreen', { 
          moduleName: moduleValue, 
          recordId: targetIdValue 
        });
      } catch (navError) {
        console.warn('Navigation error:', navError);
      }
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
        title: "Test Notification 📱",
        body: "This is a test notification from your CRM app!",
        data: { type: 'test', timestamp: Date.now() },
        sound: 'default',
        priority: Notifications.AndroidImportance.HIGH,
        vibrate: [0, 250, 250, 250],
      },
      trigger: { seconds: 2 }, // Send after 2 seconds
    });
    return true;
  } catch (error) {
    console.error('❌ Failed to send test notification:', error);
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