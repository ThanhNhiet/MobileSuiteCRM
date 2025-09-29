import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState, Platform, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppRouter from "./src/commons/AppRouter";
import { initializeLocaleCache } from './src/utils/format/FormatDateTime_Zones';
import { setupNotificationListeners } from './src/utils/PushNotifications';

// Set global font for all Text components - Cross-platform compatible
const setupGlobalTextStyles = () => {
  // Cross-platform default text styles
  const getDefaultTextStyle = () => {
    if (Platform.OS === "android") {
      return {
        fontFamily: "System",
        includeFontPadding: false,
        textAlignVertical: "center",
      };
    } else if (Platform.OS === "ios") {
      return {
        fontFamily: "System",
        fontWeight: "normal",
      };
    }
    // Fallback for other platforms
    return {
      fontFamily: "System",
    };
  };

  // Try modern approach first
  try {
    const originalTextRender = Text.render;
    if (originalTextRender) {
      Text.render = function (props, ref) {
        const defaultStyle = getDefaultTextStyle();
        const newProps = {
          ...props,
          style: [defaultStyle, props.style],
        };
        return originalTextRender.call(this, newProps, ref);
      };
      return;
    }
  } catch (error) {
    console.warn("Modern Text override failed, using fallback:", error);
  }

  // Fallback approach for compatibility
  try {
    const defaultProps = Text.defaultProps || {};
    Text.defaultProps = {
      ...defaultProps,
      style: [getDefaultTextStyle(), defaultProps.style].filter(Boolean),
    };
  } catch (error) {
    console.warn("Text defaultProps fallback failed:", error);
  }
};

// Initialize global text styles
setupGlobalTextStyles();

export default function App() {
  const navigationRef = useRef();

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
    const cleanupNotificationListeners = setupNotificationListeners(navigationRef);

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
    <NavigationContainer ref={navigationRef}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppRouter />

      </GestureHandlerRootView>
    </NavigationContainer>
  );
}