import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppRouter from "./src/commons/AppRouter";
import { initializeLocaleCache } from './src/utils/format/FormatDateTime';
import { setUrl } from './src/utils/UrlManagement';

export default function App() {
  // Initialize locale cache for date and time formatting
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeLocaleCache();
        console.log('Locale cache initialized');
  
        const storedUrl = await AsyncStorage.getItem('url');
        if (storedUrl) {
          setUrl(storedUrl);
          console.log('URL loaded from AsyncStorage:', storedUrl);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
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