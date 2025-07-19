import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../../configs/AxiosConfig';
import { getUserIdFromToken } from '../../../utils/DecodeToken';

//GET /Api/V8/custom/Tasks/language/lang=vi_vn
export const getTasksLanguageApi = async (lang = "vi_vn") => {
    try {
        const response = await axiosInstance.get(`/Api/V8/custom/Tasks/language/lang=${lang}`);
        return response.data;
    } catch (error) {
        console.warn("Get Tasks Language API error:", error);
        throw error;
    }
}

//GET /Api/V8/custom/Meetings/language/lang=vi_vn
export const getMeetingsLanguageApi = async (lang = "vi_vn") => {
    try {
        const response = await axiosInstance.get(`/Api/V8/custom/Meetings/language/lang=${lang}`);
        return response.data;
    } catch (error) {
        console.warn("Get Meetings Language API error:", error);
        throw error;
    }
}
//GET Task by month
//GET {{suitecrm.url}}/V8/module/Tasks?fields[Tasks]=name,date_start,date_due
//&filter[date_start][gte]={yyyy-MM-dd}&filter[date_start][lt]={yyyy-MM-dd}
//&filter[assigned_user_id][eq]={id}
//&filter[deleted][eq]=0&sort=-date_start
export const getTasksByMonthApi = async (startDate, endDate) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);
        
        const response = await axiosInstance.get(`/Api/V8/module/Tasks`, {
            params: {
                'fields[Tasks]': 'name,date_start,date_due',
                'filter[date_start][gte]': startDate,
                'filter[date_start][lt]': endDate,
                'filter[assigned_user_id][eq]': userId,
                'filter[deleted][eq]': 0,
                'sort': '-date_start'
            }
        });
        return response.data;
    } catch (error) {
        console.warn("Get Tasks by Month API error:", error);
        throw error;
    }
}

//GET Meeting by month
//GET {{suitecrm.url}}/V8/module/Meetings?fields[Meetings]=name,date_start,date_end,duration_hours,duration_minutes
//&filter[date_start][gte]={yyyy-MM-dd}&filter[date_start][lt]={yyyy-MM-dd}
//&filter[assigned_user_id][eq]={id}
//&filter[deleted][eq]=0&sort=-date_start
export const getMeetingsByMonthApi = async (startDate, endDate) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);
        
        const response = await axiosInstance.get(`/Api/V8/module/Meetings`, {
            params: {
                'fields[Meetings]': 'name,date_start,date_end,duration_hours,duration_minutes',
                'filter[date_start][gte]': startDate,
                'filter[date_start][lt]': endDate,
                'filter[assigned_user_id][eq]': userId,
                'filter[deleted][eq]': 0,
                'sort': '-date_start'
            }
        });
        return response.data;
    } catch (error) {
        console.warn("Get Meetings by Month API error:", error);
        throw error;
    }
}