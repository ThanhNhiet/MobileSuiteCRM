import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../../configs/AxiosConfig';
import { getUserIdFromToken } from '../../../utils/DecodeToken';

//GET /Api/V8/custom/Notes/language/lang=vi_vn
export const getNotesLanguageApi = async (lang = "vi_vn") => {
    try {
        const response = await axiosInstance.get(`/Api/V8/custom/Notes/language/lang=${lang}`);
        return response.data;
    } catch (error) {
        console.warn("Get Notes Language API error:", error);
        throw error;
    }
};

//What fields are available for Note list
//GET /Api/V8/custom/Notes/default-fields
export const getNoteListFieldsApi = async () => {
    try {
        const response = await axiosInstance.get(`/Api/V8/custom/Notes/default-fields`);
        return response.data;
    } catch (error) {
        console.warn("Get Note List Fields API error:", error);
        throw error;
    }
};

//What fields are available for Note detail
//GET /Api/V8/meta/fields/Notes
export const getNoteFieldsApi = async () => {
    try {
        const response = await axiosInstance.get(`/Api/V8/meta/fields/Notes`);
        return response.data;
    } catch (error) {
        console.warn("Get Note Fields API error:", error);
        throw error;
    }
};

//For list view
//GET /Api/V8/module/Notes
//?filter[assigned_user_id][eq]={id}&filter[deleted][eq]=0
//&fields[Notes]=name,date_entered,parent_type,parent_name&page[size]=10&page[number]=1&sort=-date_entered
export const getNotesApi = async (pageSize = 10, pageNumber = 1, nameFields) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);

        const response = await axiosInstance.get(`/Api/V8/module/Notes`, {
            params: {
                'filter[assigned_user_id][eq]': userId,
                'filter[deleted][eq]': 0,
                'fields[Notes]': nameFields,
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

//For search by parent_type
// export const searchNotesByParentTypeApi = async (parentType, pageSize = 10, pageNumber = 1, nameFields) => {
//     try {
//         const token = await AsyncStorage.getItem('token');
//         const userId = getUserIdFromToken(token);
//         const response = await axiosInstance.get(`/Api/V8/module/Notes`, {
//             params: {
//                 'filter[assigned_user_id][eq]': userId,
//                 'filter[deleted][eq]': 0,
//                 'filter[parent_type][eq]': parentType,
//                 'fields[Notes]': nameFields,
//                 'page[size]': pageSize,
//                 'page[number]': pageNumber,
//                 'sort': '-date_entered'
//             }
//         });
//         console.log("Search Notes by Parent Type API response:", response.data);
//         return response.data;
//     } catch (error) {
//         console.warn("Search Notes by Parent Type API error:", error);
//         throw error;
//     }
// };

//For detail view
//GET /Api/V8/module/Notes/{id}?fields[Notes]={nameFields}
export const getNoteDetailApi = async (noteId, nameFields) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/module/Notes/${noteId}`, {
            params: {
                'fields[Notes]': nameFields
            }
        });
        return response.data;
    } catch (error) {
        console.warn("Get Note Detail API error:", error);
        throw error;
    }
};

//POST /Api/V8/module
// body: { "data": { "type": "Notes", "attributes": { "name": "", "description": "", ... } } }
export const createNoteApi = async (noteData) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);

        const response = await axiosInstance.post(`/Api/V8/module`, {
            data: {
                type: 'Notes',
                attributes: {
                    assigned_user_id: userId,
                    ...noteData
                }
            }
        });
        return response.data;
    } catch (error) {
        console.warn("Create Note API error:", error);
        throw error;
    }
};

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
        console.log("Update Note API response:", response.data);
        return response.data;
    } catch (error) {
        console.warn("Update Note API error:", error);
        throw error;
    }
};

//DELETE /Api/V8/module/Notes/{id}
export const deleteNoteApi = async (noteId) => {
    try {
        const response = await axiosInstance.delete(`/Api/V8/module/Notes/${noteId}`);
        return response.data;
    } catch (error) {
        console.warn("Delete Note API error:", error);
        throw error;
    }
};

//Check if parent_name is exists
//GET /Api/V8/module/{Modules}?filter[name][eq]={parentName}
export const checkParentNameExistsApi = async (parentType, parentId) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/module/${parentType}/${parentId}`, {
            params: {
                'fields[Accounts]': 'name'
            }
        });
        if (response.data.data !== null) {
            return response.data.data.attributes.name;
        }else{
            return null;
        }
    } catch (error) {
        console.warn("Check Parent Name Exists API error:", error);
        throw error;
    }
};

//Create relation between Note and Parent
//POST /Api/V8/module/{parent_type}/{parent_id}/relationships
export const createNoteParentRelationApi = async (parentType, parentId, noteId) => {
    try {
        const response = await axiosInstance.post(`/Api/V8/module/${parentType}/${parentId}/relationships`, {
            data: {
                type: 'Notes',
                id: noteId
            }
        });
        return response.data;
    } catch (error) {
        console.warn("Create Note Parent Relation API error:", error);
        throw error;
    }
};

//Delete relation between Note and Parent
//DELETE /Api/V8/module/{parent_type}/{parent_id}/relationships/notes/{note_id}
export const deleteNoteParentRelationApi = async (parentType, parentId, noteId) => {
    try {
        const response = await axiosInstance.delete(`/Api/V8/module/${parentType}/${parentId}/relationships/notes/${noteId}`);
        return response.data;
    } catch (error) {
        console.warn("Delete Note Parent Relation API error:", error);
        throw error;
    }
};

//Get parent_id by note_id
//GET /Api/V8/module/Notes/{note_id}?fields[Notes]=parent_id
export const getParentIdByNoteIdApi = async (noteId) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/module/Notes/${noteId}`, {
            params: {
                'fields[Notes]': 'parent_id'
            }
        });
        console.log("Get Parent ID by Note ID API response:", response.data.data.attributes.parent_id);
        return response.data.data.attributes.parent_id;
    } catch (error) {
        console.warn("Get Parent ID by Note ID API error:", error);
        throw error;
    }
};