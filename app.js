import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppRouter from "./src/commons/AppRouter";
import { initializeLocaleCache } from './src/utils/format/FormatDateTime';

export default function App() {
  // Initialize locale cache for date and time formatting
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeLocaleCache();
        console.log('Locale cache initialized');
      } catch (error) {
        console.warn('No locale cache found');
      }
    };
    initializeApp();
  }, []);

  return (
      <GestureHandlerRootView style={{ flex: 1}}>
        <AppRouter />
      </GestureHandlerRootView>
  );
}