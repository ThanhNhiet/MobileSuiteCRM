// Login authentication hook with language management
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Keyboard } from 'react-native';
import ModulesConfig from '../../../configs/ModulesConfig';
import RolesConfig from '../../../configs/RolesConfig';
import { cacheManager } from '../../../utils/cacheViewManagement/CacheManager';
import { getLanguageApi, getSystemLanguageApi, loginApi, logoutApi, refreshTokenApi } from '../../api/login/Login_outApi';
import { eventEmitter } from '../../EventEmitter';

export const useLogin_out = () => {
  const navigation = useNavigation();
  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Loading state for auth check
  const [selectedLanguage, setSelectedLanguage] = useState('vi_VN'); // Default language

  // Get accessible modules dynamically from API and user permissions
  const getAccessibleModules = async () => {
    try {
      const rolesConfig = RolesConfig.getInstance();
      const modulesConfig = ModulesConfig.getInstance();
      
      // Load user roles and modules if not already loaded
      await Promise.all([
        rolesConfig.loadUserRoles(),
        modulesConfig.loadModules()
      ]);
      
      const allModules = modulesConfig.getFilteredModules();
      const accessibleModules = [];
      
      // Filter modules by user permissions
      for (const [moduleName] of Object.entries(allModules)) {
        if (rolesConfig.hasModuleAccess(moduleName)) {
          accessibleModules.push(moduleName);
        }
      }
      
      // Always include special modules that don't follow standard patterns
      const specialModules = ['Users', 'Alerts', 'Calendar'];
      for (const specialModule of specialModules) {
        if (!accessibleModules.includes(specialModule)) {
          accessibleModules.push(specialModule);
        }
      }
      
      return accessibleModules;
    } catch (error) {
      console.warn('Error getting accessible modules, using fallback:', error);
      // Fallback to essential modules if API fails
      return ['Accounts', 'Meetings', 'Notes', 'Tasks', 'Users', 'Calendar', 'Alerts'];
    }
  };

  // Function to fetch and cache language data for all accessible modules
  const fetchAndCacheLanguageData = async (lang) => {
    try {
      console.log(`Starting to fetch and cache language data for: ${lang}`);
      
      // Fetch and cache system language
      try {
        const systemLanguageExists = await cacheManager.checkSystemLanguageExists(lang);
        if (!systemLanguageExists) {
          console.log(`Fetching system language: ${lang}`);
          const systemLangData = await getSystemLanguageApi(lang);
          await cacheManager.saveSystemLanguage(lang, systemLangData);
        } else {
          console.log(`System language ${lang} already exists`);
        }
      } catch (error) {
        console.warn('Error fetching system language:', error);
      }
      
      // Get accessible modules dynamically
      const modules = await getAccessibleModules();
      
      // Fetch and cache language for each accessible module
      for (const module of modules) {
        try {
          const languageExists = await cacheManager.checkModuleLanguageExists(module, lang);
          if (!languageExists) {
            console.log(`Fetching language for module: ${module} (${lang})`);
            const languageData = await getLanguageApi(module, lang);
            await cacheManager.saveModuleLanguage(module, lang, languageData);
          } else {
            console.log(`Language ${lang} for module ${module} already exists`);
          }
        } catch (error) {
          console.warn(`Error fetching language for module ${module}:`, error);
        }
      }
    } catch (error) {
      console.warn('Error in fetchAndCacheLanguageData:', error);
    }
  };

  // Function to handle language selection
  const handleLanguageSelect = (lang) => {
    setSelectedLanguage(lang);
  };

  // Function to check existing authentication
  const checkExistingAuth = async () => {
    try {
      setIsCheckingAuth(true);
      
      // Check if refresh token exists
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const existingToken = await AsyncStorage.getItem('token');
      const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
      
      if (savedLanguage) {
        setSelectedLanguage(savedLanguage);
      }
      
      // If we have both tokens, try to validate them
      if (refreshToken && refreshToken.trim() !== '' && existingToken && existingToken.trim() !== '') {
        console.log('Found tokens, validating authentication...');
        
        try {
          // Try a simple API call to validate current token
          const storedUrl = await AsyncStorage.getItem('url');
          const testResponse = await fetch(`${storedUrl}/Api/V8/custom/system/language/lang=${savedLanguage || selectedLanguage}`, {
            headers: {
              'Authorization': `Bearer ${existingToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 seconds
          });
          
          if (testResponse.ok) {
            console.log('Current token is valid, navigating to HomeScreen');
            // Fetch and cache language data if needed
            await fetchAndCacheLanguageData(savedLanguage || selectedLanguage);
            // Emit login success event
            eventEmitter.emit('loginSuccess');
            navigation.navigate('HomeScreen');
            return;
          }
        } catch (tokenTestError) {
          console.log('Current token invalid, trying refresh...');
        }
        
        // If current token is invalid, try refresh
        try {
          const response = await refreshTokenApi(refreshToken);
          const newAccessToken = response?.access_token;
          const newRefreshToken = response?.refresh_token;
          
          if (newAccessToken) {
            // Save new tokens
            await AsyncStorage.setItem('token', newAccessToken);
            if (newRefreshToken) {
              await AsyncStorage.setItem('refreshToken', newRefreshToken);
            }
            
            console.log('Token refreshed successfully, navigating to HomeScreen');
            
            // Fetch and cache language data if needed
            await fetchAndCacheLanguageData(savedLanguage || selectedLanguage);
            
            // Emit login success event
            eventEmitter.emit('loginSuccess');
            
            // Navigate to HomeScreen directly
            navigation.navigate('HomeScreen');
            return;
          }
        } catch (refreshError) {
          console.warn('Failed to refresh token:', refreshError);
          // Clear invalid tokens
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('refreshToken');
        }
      }
      
      // If no valid tokens found, stay on login screen
      console.log('No valid authentication found, staying on login screen');
      
    } catch (error) {
      console.warn('Error checking existing auth:', error);
      // Clear potentially corrupted tokens
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Function to handle login
  const handleLogin = async () => {
    if (!website.trim()) {
      Alert.alert('Error', 'Please enter your website link');
      return;
    }
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required information');
      return;
    }
    Keyboard.dismiss();
    try {
      setLoading(true);
      const response = await loginApi(website, username, password);
      const token = response?.access_token;
      const refreshToken = response?.refresh_token;

      if (token) {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('refreshToken', refreshToken || '');
        await AsyncStorage.setItem('selectedLanguage', selectedLanguage);
        
        // After successful login, fetch and cache language data
        await fetchAndCacheLanguageData(selectedLanguage);
        
        // Emit login success event
        eventEmitter.emit('loginSuccess');
        
        navigation.navigate('HomeScreen');
      } else {
        Alert.alert('Error', 'No token received from server');
      }
    } catch (err) {
      console.warn('Login failed', err);
      Alert.alert('Error', 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle logout
  const handleLogout = async () => {
    try {
      // Emit logout event to clear all data in other hooks
      eventEmitter.emit('logout');
      
      await logoutApi();
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      
      // Clear user data but keep language preference
      setUsername('');
      setPassword('');
      
      navigation.navigate('LoginScreen');
    } catch (error) {
      console.warn('Logout failed', error);
      Alert.alert('Error', 'Unable to logout');
    }
  };

  return {
    website, setWebsite,
    username, setUsername,
    password, setPassword,
    handleLogin,
    handleLogout,
    loading,
    isCheckingAuth, // Export auth checking state
    selectedLanguage,
    handleLanguageSelect,
    checkExistingAuth // Export for manual auth check if needed
  };
};
