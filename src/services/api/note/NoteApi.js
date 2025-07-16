import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../../configs/AxiosConfig';
import { getUserIdFromToken } from '../../../utils/DecodeToken';

//For list view
//GET /Api/V8/module/Notes
//?filter[assigned_user_id][eq]={id}&filter[deleted][eq]=0
//&fields[Notes]=name,date_entered,parent_type,parent_name&page[size]=10&page[number]=1&sort=-date_entered
export const getNotesApi = async (pageSize = 10, pageNumber = 1) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);
        
        const response = await axiosInstance.get(`/Api/V8/module/Notes`, {
            params: {
                'filter[assigned_user_id][eq]': userId,
                'filter[deleted][eq]': 0,
                'fields[Notes]': 'name,date_entered,parent_type,parent_name',
                'page[size]': pageSize,
                'page[number]': pageNumber,
                'sort': '-date_entered'
            }
        });
        return response.data;
    } catch (error) {
        console.warn("Get Note List API error:", error);
        throw error;
    }
};

//For detail view
//GET /Api/V8/module/Notes/{id}
//?fields[Notes]=id,name,date_entered,date_modified,modified_by_name,parent_type,parent_name,description
export const getNoteDetailApi = async (noteId) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/module/Notes/${noteId}`, {
            params: {
                'fields[Notes]': 'id,name,date_entered,date_modified,modified_by_name,parent_type,parent_name,description'
            }
        });
        return response.data;
    } catch (error) {
        console.warn("Get Note Detail API error:", error);
        throw error;
    }
}

//POST /Api/V8/module
// body: { "data": { "type": "Notes", "attributes": { "name": "", "description": "", ... } } }
export const createNoteApi = async (noteData) => {
    try {
        const response = await axiosInstance.post(`/Api/V8/module`, {
            data: {
                type: 'Notes',
                attributes: noteData
            }
        });
        return response.data;
    } catch (error) {
        console.warn("Create Note API error:", error);
        throw error;
    }
}

//PATCH /Api/V8/module
// body: { "data": { "type": "Notes", "id": "", "attributes": { "name": "", "description": "", ... } } }
export const updateNoteApi = async (noteId, noteData) => {
    try {
        const response = await axiosInstance.patch(`/Api/V8/module`, {
            data: {
                type: 'Notes',
                id: noteId,
                attributes: noteData
            }
        });
        return response.data;
    } catch (error) {
        console.warn("Update Note API error:", error);
        throw error;
    }
}

//DELETE /Api/V8/module/Notes/{id}
export const deleteNoteApi = async (noteId) => {
    try {
        const response = await axiosInstance.delete(`/Api/V8/module/Notes/${noteId}`);
        return response.data;
    } catch (error) {
        console.warn("Delete Note API error:", error);
        throw error;
    }
}
