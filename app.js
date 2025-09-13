import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppRouter from "./src/commons/AppRouter";
import { initializeLocaleCache } from './src/utils/format/FormatDateTime_Zones';
import { setupNotificationListeners } from './src/utils/PushNotifications';

export default function App() {
  // Initialize locale cache for date and time formatting
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeLocaleCache();
      } catch (error) {
        console.warn('No locale cache found');
      }
    };
    initializeApp();
  }, []);

  // Setup push notification listeners
  useEffect(() => {
    const cleanupNotificationListeners = setupNotificationListeners();
    
    // Handle app state changes for better background notification handling
    const handleAppStateChange = (nextAppState) => {
      
      if (nextAppState === 'active') {
        // App is now active - clear badge count
        Notifications.setBadgeCountAsync(0);
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Handle notification when app is launched from killed state
    Notifications.getLastNotificationResponseAsync()
      .then(response => {
        if (response) {
          // Handle navigation or data processing here
        }
      })
      .catch(error => {
        console.warn('Error getting last notification response:', error);
      });
    
    // Cleanup function
    return () => {
      cleanupNotificationListeners();
      appStateSubscription?.remove();
    };
  }, []);

  return (
      <GestureHandlerRootView style={{ flex: 1}}>
        <AppRouter />
      </GestureHandlerRootView>
  );
}