// src/useApi/Login.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Keyboard } from 'react-native';
import { loginApi, logoutApi } from '../../api/login/Login_outApi';

export const useLogin_out = () => {
  const navigation = useNavigation();
  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      await logoutApi();
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
    loading
  };
};
