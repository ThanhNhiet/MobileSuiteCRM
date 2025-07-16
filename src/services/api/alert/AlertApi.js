import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../../configs/AxiosConfig';
import { getUserIdFromToken } from '../../../utils/DecodeToken';

//GET /Api/V8/module/Alerts?filter[assigned_user_id][eq]={id}&filter[deleted][eq]=0
//&page[size]=6&page[number]=1&sort=-date_entered
export const getAlertsApi = async (pageSize = 6, pageNumber = 1) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);
        
        const response = await axiosInstance.get(`/Api/V8/module/Alerts`, {
            params: {
                'filter[assigned_user_id][eq]': userId,
                'filter[deleted][eq]': 0,
                'page[size]': pageSize,
                'page[number]': pageNumber,
                'sort': '-date_entered'
            }
        });
        return response.data;
    } catch (error) {
        console.warn("Get Alerts API error:", error);
        throw error;
    }
}

//GET /Api/V8/module/Alerts?filter[assigned_user_id][eq]={id}&filter[deleted][eq]=0&filter[is_read][eq]=0
export const getUnreadAlertsCountApi = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);
        
        const response = await axiosInstance.get(`/Api/V8/module/Alerts`, {
            params: {
                'filter[assigned_user_id][eq]': userId,
                'filter[deleted][eq]': 0,
                'filter[is_read][eq]': 0,
                'page[size]': 1 // Chỉ cần count
            }
        });
        return response.data.meta['total-pages'] * response.data.meta['records-on-this-page'] || 0;
    } catch (error) {
        console.warn("Get Unread Alerts Count API error:", error);
        throw error;
    }
}

//PATCH /Api/V8/module - Đánh dấu đã đọc
export const markAlertAsReadApi = async (alertId) => {
    try {
        const response = await axiosInstance.patch(`/Api/V8/module`, {
            data: {
                type: 'Alerts',
                id: alertId,
                attributes: {
                    is_read: '1'
                }
            }
        });
        return response.data;
    } catch (error) {
        console.warn("Mark Alert As Read API error:", error);
        throw error;
    }
}

//Delete /Api/V8/module/Alerts/{id} - Xóa thông báo
export const deleteAlertApi = async (alertId) => {
    try {
        const response = await axiosInstance.delete(`/Api/V8/module/Alerts/${alertId}`);
        return response.data;
    } catch (error) {
        console.warn("Delete Alert API error:", error);
        throw error;
    }
}