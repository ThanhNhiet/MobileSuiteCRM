import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import axiosInstance from '../../../configs/AxiosConfig';

//POST http://localhost/suitecrm7/Api/access_token
export const loginApi = async (website, username, password) => {
  try {
    const { client_id, client_secret } = (await axios.get(`${website}/custom/public/api/get_secret.php`)).data;

    const response = await axios.post(`${website}/Api/access_token`, {
      grant_type: 'password',
      client_id: client_id,
      client_secret: client_secret,
      username: username,
      password: password
    });
    return response.data;
  } catch (error) {
    console.warn("Login API error:", error);
    throw error;
  }
}

// Refresh token API
export const refreshTokenApi = async (refreshToken) => {
  try {
    console.log("Attempting to refresh token...");
    const storedUrl = await AsyncStorage.getItem('url');
    const { client_id, client_secret } = (await axios.get(`${storedUrl}/custom/public/api/get_secret.php`)).data;
    const response = await axios.post(`${storedUrl}/Api/access_token`, {
      grant_type: 'refresh_token',
      client_id: client_id,
      client_secret: client_secret,
      refresh_token: refreshToken
    });
    console.log("Token refreshed successfully");
    return response.data;
  } catch (error) {
    console.warn("Refresh token API error:", error);
    throw error;
  }
}

//POST http://localhost/suitecrm7/Api/V8/logout
export const logoutApi = async () => {
  try {
    const response = await axiosInstance.post(`/Api/V8/logout`);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('refreshToken');
    return response.data;
  } catch (error) {
    console.warn("Logout API error:", error);
    throw error;
  }
}

//GET http://localhost/suitecrm7/custom/public/api/get_languages.php
export const getAvailableLanguagesApi = async () => {
  try {
    const storedUrl = await AsyncStorage.getItem('url');
    const response = await axios.get(`${storedUrl}/custom/public/api/get_languages.php`);
   // console.log("Available languages fetched:", response.data);
    return response.data;
  } catch (error) {
    console.warn("Get API languages error:", error);
    throw error;
  }
}

//GET http://localhost/suitecrm7/Api/V8/custom/{module}/language/lang=vi_VN
export const getLanguageApi = async (module, lang) => {
  try {
    const response = await axiosInstance.get(`/Api/V8/custom/${module}/language/lang=${lang}`);
    return response.data;
  } catch (error) {
    console.warn("Get Language API error:", error);
    throw error;
  }
}

//GET http://localhost/suitecrm7/Api/V8/custom/system/language/lang=vi_VN
export const getSystemLanguageApi = async (lang = "vi_VN") => {
  try {
    const response = await axiosInstance.get(`/Api/V8/custom/system/language/lang=${lang}`);
    return response.data;
  } catch (error) {
    console.warn("Get System Language API error:", error);
    throw error;
  }
}
