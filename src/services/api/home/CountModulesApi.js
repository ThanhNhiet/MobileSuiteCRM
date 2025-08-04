import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../../configs/AxiosConfig';
import { getUserIdFromToken } from '../../../utils/DecodeToken';


// Count all accounts
// GET Api/V8/module/Accounts?fields[Accounts]=id&filter[deleted][eq]=0&page[size]=1
export const getCountAllAccounts = async () => {
    try {
        const response = await axiosInstance.get(
            '/Api/V8/module/Accounts',
            {
                params: {
                    'fields[Accounts]': 'id',
                    'filter[deleted][eq]': 0,
                    'page[size]': 1,
                }
            }
        );
        
        // Safe access to meta data with fallback
        const totalPages = response?.data?.meta?.['total-pages'];
        
        if (totalPages === undefined || totalPages === null || typeof totalPages !== 'number' || totalPages < 0) {
            return 0;
        }
        
        return totalPages;
    } catch (error) {
        console.error('Error fetching all account count:', error);
        throw error;
    }
}

// Count my meetings
// GET Api/V8/module/Meetings?fields[Meetings]=id&filter[assigned_user_id][eq]={userId}&filter[deleted][eq]=0&page[size]=1
export const getCountMyMeetings = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);
        const response = await axiosInstance.get(
            '/Api/V8/module/Meetings',
            {
                params: {
                    'fields[Meetings]': 'id',
                    'filter[assigned_user_id][eq]': userId,
                    'filter[deleted][eq]': 0,
                    'page[size]': 1,
                }
            }
        );
        
        // Safe access to meta data with fallback
        const totalPages = response?.data?.meta?.['total-pages'];
        
        if (totalPages === undefined || totalPages === null || typeof totalPages !== 'number' || totalPages < 0) {
            return 0;
        }
        
        return totalPages;
    } catch (error) {
        console.error('Error fetching my meeting count:', error);
        throw error;
    }
}

// Count my tasks
// GET Api/V8/module/Tasks?fields[Tasks]=id&filter[assigned_user_id][eq]={userId}&filter[deleted][eq]=0&page[size]=1
export const getCountMyTasks = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);
        const response = await axiosInstance.get(
            '/Api/V8/module/Tasks',
            {
                params: {
                    'fields[Tasks]': 'id',
                    'filter[assigned_user_id][eq]': userId,
                    'filter[deleted][eq]': 0,
                    'page[size]': 1,
                }
            }
        );
        
        // Safe access to meta data with fallback
        const totalPages = response?.data?.meta?.['total-pages'];
        
        if (totalPages === undefined || totalPages === null || typeof totalPages !== 'number' || totalPages < 0) {
            return 0;
        }
        
        return totalPages;
    } catch (error) {
        console.error('Error fetching my task count:', error);
        throw error;
    }
}

// Count my notes
// GET Api/V8/module/Notes?fields[Notes]=id&filter[assigned_user_id][eq]={userId}&filter[deleted][eq]=0&page[size]=1
export const getCountMyNotes = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);
        const response = await axiosInstance.get(
            '/Api/V8/module/Notes',
            {
                params: {
                    'fields[Notes]': 'id',
                    'filter[assigned_user_id][eq]': userId,
                    'filter[deleted][eq]': 0,
                    'page[size]': 1,
                }
            }
        );
        
        // Safe access to meta data with fallback
        const totalPages = response?.data?.meta?.['total-pages'];
        
        if (totalPages === undefined || totalPages === null || typeof totalPages !== 'number' || totalPages < 0) {
            return 0;
        }
        
        return totalPages;
    } catch (error) {
        console.error('Error fetching my note count:', error);
        throw error;
    }
}
