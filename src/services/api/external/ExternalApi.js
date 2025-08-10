import { getUserIdFromToken } from '@/src/utils/DecodeToken';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../../configs/AxiosConfig';

//Search by keywords
//GET /Api/V8/custom/{parent_type}?keyword={keyword}&page={page}
export const searchModulesApi = async (parent_type, keyword, page = 1) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/custom/${parent_type}`, {
            params: {
                'keyword': keyword,
                'page': page
            }
        });
        return response.data;
    } catch (error) {
        console.warn("Search Modules API error:", error);
        throw error;
    }
};

//Get all modules
//GET /Api/V8/meta/modules
export const getAllModulesApi = async () => {
    try {
        const response = await axiosInstance.get(`/Api/V8/meta/modules`);
        return response.data;
    } catch (error) {
        console.warn("Get All Modules API error:", error);
        throw error;
    }
};

//Get role
//GET /Api/V8/custom/user/{user_id}/roles
export const getUserRolesApi = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        const user_id = getUserIdFromToken(token);
        const response = await axiosInstance.get(`/Api/V8/custom/user/${user_id}/roles`);
        return response.data;
    } catch (error) {
        console.warn("Get User Roles API error:", error);
        throw error;
    }
};
