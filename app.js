import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppRouter from "./src/commons/AppRouter";
import { initializeLocaleCache } from './src/utils/format/FormatDateTime';

export default function App() {
  // Initialize locale cache for date and time formatting
  useEffect(() => {
    const initializeCache = async () => {
      try {
        await initializeLocaleCache();
        console.log("Locale cache initialized successfully");
      } catch (error) {
        console.error("Error initializing locale cache:", error);
      }
    };

    initializeCache();
  }, []);

  return (
      <GestureHandlerRootView style={{ flex: 1}}>
        <AppRouter />
      </GestureHandlerRootView>
  );
}