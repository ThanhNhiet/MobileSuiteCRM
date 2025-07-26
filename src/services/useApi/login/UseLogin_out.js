// src/useApi/Login.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Keyboard } from 'react-native';
import { cacheManager } from '../../../utils/CacheManager';
import { getLanguageApi, getSystemLanguageApi, loginApi, logoutApi } from '../../api/login/Login_outApi';
import { eventEmitter } from '../../EventEmitter';

export const useLogin_out = () => {
  const navigation = useNavigation();
  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('vi_VN'); // Default language

  // Định nghĩa các module cần cache language
  const modules = ['Accounts', 'Meetings', 'Notes', 'Tasks', 'Users'];

  // Function để fetch và cache language data cho tất cả modules
  const fetchAndCacheLanguageData = async (lang) => {
    try {
      console.log(`Starting to fetch and cache language data for: ${lang}`);
      
      // Fetch và cache system language
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

      // Fetch và cache language cho từng module
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
      
      console.log(`Completed caching language data for: ${lang}`);
    } catch (error) {
      console.warn('Error in fetchAndCacheLanguageData:', error);
    }
  };

  // Function để handle chọn ngôn ngữ
  const handleLanguageSelect = (lang) => {
    setSelectedLanguage(lang);
  };

  // Function to handle login
  const handleLogin = async () => {
    if (!website.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    Keyboard.dismiss();
    try {
      setLoading(true);
      const response = await loginApi(username, password);
      const token = response?.access_token;
      const refreshToken = response?.refresh_token;

      if (token) {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('refreshToken', refreshToken || '');
        await AsyncStorage.setItem('selectedLanguage', selectedLanguage);
        
        // Sau khi đăng nhập thành công, fetch và cache language data
        await fetchAndCacheLanguageData(selectedLanguage);
        
        //log
        // console.log('Login successful, token:', token);
        // console.log('Refresh token:', refreshToken);
        navigation.navigate('HomeScreen');
      } else {
        Alert.alert('Lỗi', 'Không nhận được token từ máy chủ');
      }
    } catch (err) {
      console.warn('Login failed', err);
      Alert.alert('Lỗi', 'Sai tên đăng nhập hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  // function to handle logout
  const handleLogout = async () => {
    try {
      // Emit logout event to clear all data in other hooks
      eventEmitter.emit('logout');
      
      await logoutApi();
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      navigation.navigate('LoginScreen');
    } catch (error) {
      console.warn('Logout failed', error);
      Alert.alert('Lỗi', 'Không thể đăng xuất');
    }
  };

  return {
    website, setWebsite,
    username, setUsername,
    password, setPassword,
    handleLogin,
    handleLogout,
    loading,
    selectedLanguage,
    handleLanguageSelect
  };
};
