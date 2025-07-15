import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../../configs/AxiosConfig';
import { getUserIdFromToken } from '../../../utils/DecodeToken';

//GET /Api/V8/module/Users/{id}?fields[User]=full_name,description,date_entered,date_modified,modified_by_name,phone_work,phone_fax,phone_mobile,address_street,address_city,address_country,employee_status,reports_to_name,email1
export const getUserProfileApi = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);
        
        const response = await axiosInstance.get(`/Api/V8/module/Users/${userId}`, {
            params: {
                'fields[User]': 'full_name,description,date_entered,date_modified,modified_by_name,phone_work,phone_fax,phone_mobile,address_street,address_city,address_country,employee_status,reports_to_name,email1'
            }
        });
        return response.data;
    } catch (error) {
        console.warn("Get User Profile API error:", error);
        throw error;
    }
}

//POST /Api/V8/custom/change-password/{id}
//body:{ "old_password": "", "new_password": ""}
export const changePasswordApi = async (oldPassword, newPassword) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);
        
        const response = await axiosInstance.post(`/Api/V8/custom/change-password/${userId}`, {
            old_password: oldPassword,
            new_password: newPassword
        });
        return response.data;
    } catch (error) {
        console.warn("Change Password API error:", error);
        throw error;
    }
}

//PATCH /Api/V8/module
//body:
//{
//   "data": {
//     "type": "Users",
//     "id": "",
//     "attributes": {
//       "name": "",
//       ...
//     }
//   }
// }
export const updateUserProfileApi = async (updateData) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);
        
        const response = await axiosInstance.patch(`/Api/V8/module`, {
            data: {
                type: 'Users',
                id: userId,
                attributes: updateData
            }
        });
        return response.data;
    } catch (error) {
        console.warn("Update User Profile API error:", error);
        throw error;
    }
}