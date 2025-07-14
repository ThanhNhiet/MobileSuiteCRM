//login api
import { CLIENT_ID, CLIENT_SECRET } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import axiosInstance from '../../../configs/AxiosConfig';
import { LOCALHOST_IP } from '../../../utils/localhost';

//POST http://localhost/suitecrm7/Api/access_token
export const loginApi = async (username, password) => {
  try {
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
