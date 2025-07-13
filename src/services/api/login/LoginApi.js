//login api
import { CLIENT_ID, CLIENT_SECRET } from '@env';
import axios from "axios";
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