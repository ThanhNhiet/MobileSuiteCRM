import { CLIENT_ID, CLIENT_SECRET } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import axiosInstance from '../../../configs/AxiosConfig';
import { LOCALHOST_IP } from '../../../utils/localhost';

//POST http://localhost/suitecrm7/Api/access_token
export const loginApi = async (username, password) => {
  try {
    // console.log("Using CLIENT_ID:", CLIENT_ID);
    // console.log("Using CLIENT_SECRET:", CLIENT_SECRET);
    // console.log("LOCALHOST_IP:", LOCALHOST_IP);
    const response = await axios.post(`${LOCALHOST_IP}/Api/access_token`, {
      grant_type: 'password',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      username: username,
      password: password
    });
    return response.data;
  } catch (error) {
    console.warn("Login API error:", error);
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

//GET http://localhost/suitecrm7/custom/api_languages.php
export const getAvailableLanguagesApi = async () => {
  try {
    const response = await axios.get(`${LOCALHOST_IP}/custom/api_languages.php`);
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
