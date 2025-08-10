import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../../configs/AxiosConfig';
import { getUserIdFromToken } from '../../../utils/DecodeToken';

//GET /Api/V8/module/Users/{id}?fields[User]={nameFields}
export const getUserProfileApi = async (nameFields) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);

        const response = await axiosInstance.get(`/Api/V8/module/Users/${userId}`, {
            params: {
                'fields[User]': nameFields
            }
        });
        return response.data;
    } catch (error) {
        console.warn("Get User Profile API error:", error);
        throw error;
    }
}

//GET /Api/V8/custom/Users/detail-fields
export const getUserDetailFieldsApi = async () => {
    try {
        const response = await axiosInstance.get('/Api/V8/custom/Users/detail-fields');
        return response.data;
    } catch (error) {
        console.warn("Get User Detail Fields API error:", error);
        throw error;
    }
}

//GET /Api/V8/custom/Users/edit-fields
export const getUserEditFieldsApi = async () => {
    try {
        const response = await axiosInstance.get('/Api/V8/custom/Users/edit-fields');
        return response.data;
    } catch (error) {
        console.warn("Get User Edit Fields API error:", error);
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
//body:{ "data": {"type": "Users","id": "","attributes": {"name": "",...}}}
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

//GET /Api/V8/custom/username/{id}
export const getUsernameApi = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);
        const response = await axiosInstance.get(`/Api/V8/custom/username/${userId}`);
        return response.data;
    } catch (error) {
        console.warn("Get Username API error:", error);
        throw error;
    }
};

//GET /Api/V8/custom/{module}/language/lang=vi_VN
export const getLanguageApi = async (module, lang) => {
  try {
    const response = await axiosInstance.get(`/Api/V8/custom/${module}/language/lang=${lang}`);
    return response.data;
  } catch (error) {
    console.warn("Get Language API error:", error);
    throw error;
  }
}

//GET /Api/V8/custom/system/language/lang=vi_VN
export const getSystemLanguageApi = async (lang = "vi_VN") => {
  try {
    const response = await axiosInstance.get(`/Api/V8/custom/system/language/lang=${lang}`);
    return response.data;
  } catch (error) {
    console.warn("Get System Language API error:", error);
    throw error;
  }
}

//GET /Api/V8/custom/{module}/list-fields
export const getModuleListFieldsApi = async (module) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/custom/${module}/list-fields`);
        return response.data;
    } catch (error) {
        console.warn("Get Module List Fields API error:", error);
        throw error;
    }
};

//GET /Api/V8/custom/{module}/detail-fields
export const getModuleDetailFieldsApi = async (module) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/custom/${module}/detail-fields`);
        return response.data;
    } catch (error) {
        console.warn("Get Module Detail Fields API error:", error);
        throw error;
    }
};

//GET /Api/V8/custom/{module}/edit-fields
export const getModuleEditFieldsApi = async (module) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/custom/${module}/edit-fields`);
        return response.data;
    } catch (error) {
        console.warn("Get Module Edit Fields API error:", error);
        throw error;
    }
};

//GET /Api/V8/meta/fields/{module}
export const getModuleFieldsRequiredApi = async (module) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/meta/fields/${module}`);
        return response.data;
    } catch (error) {
        console.warn("Get Module Fields API error:", error);
        throw error;
    }
};

//GET /Api/V8/module/Currencies?filter[deleted][eq]=0&filter[status][eq]=Active&fields[Currencies]=name,symbol
export const getActiveCurrenciesNameApi = async () => {
    try {
        const response = await axiosInstance.get(`/Api/V8/module/Currencies?filter[deleted][eq]=0&filter[status][eq]=Active&fields[Currencies]=name,symbol`);
        return response.data;
    } catch (error) {
        console.warn("Get Active Currencies API error:", error);
        throw error;
    }
};

//GET /Api/V8/module/Currencies?filter[deleted][eq]=0&filter[status][eq]=Active&fields[Currencies]=name,symbol,iso4217,conversion_rate
export const getDetailCurrenciesApi = async () => {
    try {
        const response = await axiosInstance.get(`/Api/V8/module/Currencies?filter[deleted][eq]=0&filter[status][eq]=Active&fields[Currencies]=name,symbol,iso4217,conversion_rate`);
        return response.data;
    } catch (error) {
        console.warn("Get Active Currencies API error:", error);
        throw error;
    }
};
