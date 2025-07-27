import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { cacheManager } from '../../../utils/CacheManager';
import { readCacheView } from '../../../utils/cacheViewManagement/Notes/ReadCacheView';
import { writeCacheView } from '../../../utils/cacheViewManagement/Notes/WriteCacheView';
import { deleteNoteApi, getNoteDetailApi, getNoteDetailFieldsApi, getParentIdByNoteIdApi } from '../../api/note/NoteApi';

export const useNoteDetail = (noteId) => {
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    
    // Fields and labels
    const [detailFields, setDetailFields] = useState([]);
    const [nameFields, setNameFields] = useState('');
    const [parentId, setParentId] = useState('');

    // Initialize fields and language for detail view
    const initializeDetailFields = useCallback(async () => {
        try {
            // 1. Kiểm tra cache detailviewdefs.json có tồn tại không
            let fieldsData;
            const cachedFields = await readCacheView.readCacheFile('detailviewdefs', 'Notes');
            
            if (!cachedFields) {
                // Nếu chưa có cache, fetch từ API
                const fieldsResponse = await getNoteDetailFieldsApi();
                fieldsData = fieldsResponse;
                
                // Lưu vào cache
                await writeCacheView.writeCacheFile('detailviewdefs', 'Notes', fieldsData);
            } else {
                // Nếu có cache, sử dụng cache
                fieldsData = cachedFields;
            }
            
            // 2. Lấy ngôn ngữ hiện tại
            const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
            let languageData = await cacheManager.getModuleLanguage('Notes', selectedLanguage);
            
            // Nếu không có language data, thử fetch lại
            if (!languageData) {
                const languageExists = await cacheManager.checkModuleLanguageExists('Notes', selectedLanguage);
                if (!languageExists) {
                    // Language cache missing - user needs to login to fetch data
                }
            }
            
            // Lấy mod_strings và app_strings từ cấu trúc language data
            let modStrings = null;
            let appStrings = null;
            if (languageData && languageData.data) {
                modStrings = languageData.data.mod_strings;
                appStrings = languageData.data.app_strings;
            }
            
            // Helper function để tìm translation với fallback pattern
            const findTranslation = (key) => {
                if (modStrings && modStrings[key]) {
                    return modStrings[key];
                }
                if (appStrings && appStrings[key]) {
                    return appStrings[key];
                }
                return null;
            };
            
            // Kiểm tra fieldsData có hợp lệ không
            if (!fieldsData || typeof fieldsData !== 'object' || Object.keys(fieldsData).length === 0) {
                // Using default fields structure với key có trong language file
                fieldsData = {
                    "name": "LBL_NOTE_SUBJECT",
                    "parent_name": "LBL_RELATED_TO", 
                    "date_entered": "LBL_DATE_ENTERED",
                    "date_modified": "LBL_DATE_MODIFIED",
                    "created_by_name": "LBL_CREATED_BY",
                    "modified_by_name": "LBL_MODIFIED_BY",
                    "assigned_user_name": "LBL_LIST_ASSIGNED_TO_NAME",
                    "description": "LBL_DESCRIPTION"
                };
            }
            
            // 3. Tạo nameFields string từ fieldsData
            const fieldKeys = Object.keys(fieldsData);
            const nameFieldsString = fieldKeys.join(',');
            setNameFields(nameFieldsString);
            
            // 4. Tạo detailFields với bản dịch
            const detailFieldsData = Object.entries(fieldsData).map(([fieldKey, labelValue]) => {
                let vietnameseLabel = fieldKey; // Default fallback
                
                if (modStrings || appStrings) {
                    if (labelValue && typeof labelValue === 'string' && labelValue.trim() !== '') {
                        // Sử dụng labelValue từ API để tìm trong modStrings/appStrings
                        let translation = findTranslation(labelValue);
                        
                        // Nếu không tìm thấy, thử tìm với các pattern khác
                        if (!translation) {
                            const listKey = labelValue.replace('LBL_', 'LBL_LIST_');
                            translation = findTranslation(listKey);
                        }
                        
                        vietnameseLabel = translation || labelValue;
                    } else {
                        // Nếu labelValue rỗng, áp dụng phương pháp tự động tạo key
                        let translation = null;
                        
                        // Xử lý trường hợp đặc biệt cho assigned_user_name
                        if (fieldKey === 'assigned_user_name') {
                            // Thử các pattern cho assigned_user_name theo thứ tự ưu tiên
                            const patterns = [
                                'LBL_LIST_ASSIGNED_TO_NAME',
                                'LBL_ASSIGNED_TO',
                                'LBL_ASSIGNED_TO_USER'
                            ];
                            
                            for (const pattern of patterns) {
                                translation = findTranslation(pattern);
                                if (translation) break;
                            }
                        } else {
                            // Các field khác - thử pattern chuẩn
                            const upperFieldKey = fieldKey.toUpperCase();
                            const patterns = [
                                `LBL_${upperFieldKey}`,
                                `LBL_LIST_${upperFieldKey}`
                            ];
                            
                            for (const pattern of patterns) {
                                translation = findTranslation(pattern);
                                if (translation) break;
                            }
                        }
                        
                        vietnameseLabel = translation || fieldKey;
                    }
                } else {
                    // Nếu không có dữ liệu ngôn ngữ, sử dụng labelValue hoặc fieldKey
                    if (labelValue && typeof labelValue === 'string' && labelValue.trim() !== '') {
                        vietnameseLabel = labelValue;
                    } else if (fieldKey === 'assigned_user_name') {
                        // Xử lý trường hợp đặc biệt cho assigned_user_name - fallback key
                        vietnameseLabel = 'LBL_LIST_ASSIGNED_TO_NAME';
                    } else {
                        vietnameseLabel = fieldKey;
                    }
                }
                
                return {
                    key: fieldKey,
                    label: vietnameseLabel,
                    type: 'text', // Default type, có thể mở rộng sau
                    required: false // Default required, có thể mở rộng sau
                };
            });
            
            // Thêm id vào detailFields với translation phù hợp
            const idLabel = findTranslation('LBL_ID') || 'ID';
            detailFieldsData.unshift({
                key: 'id',
                label: idLabel,
                type: 'text',
                required: false
            });
            
            setDetailFields(detailFieldsData);
            
        } catch (err) {
            console.warn('Initialize detail fields error:', err);
            setError('Không thể tải cấu hình hiển thị chi tiết');
        }
    }, []);

    // Fetch note detail
    const fetchNoteDetail = useCallback(async (isRefresh = false) => {
        if (!noteId || !nameFields) return;
        
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // First, get parent ID
            const parentIdResponse = await getParentIdByNoteIdApi(noteId);
            if (parentIdResponse) {
                setParentId(parentIdResponse);
            }

            // Then, get note detail
            const response = await getNoteDetailApi(noteId, nameFields);
            
            // Process note data
            const noteData = {
                id: response.data.id,
                type: response.data.type,
                parent_id: parentIdResponse || parentId,
                ...response.data.attributes
            };
            
            setNote(noteData);
            
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Không thể tải chi tiết ghi chú';
            setError(errorMessage);
            console.warn('Fetch note detail error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [noteId, nameFields, parentId]);

    // Delete note
    const deleteNote = useCallback(async () => {
        if (!noteId) return false;
        
        try {
            setDeleting(true);
            setError(null);
            
            await deleteNoteApi(noteId);
            
            return true;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Không thể xóa ghi chú';
            setError(errorMessage);
            console.warn('Delete note error:', err);
            return false;
        } finally {
            setDeleting(false);
        }
    }, [noteId]);

    // Refresh function
    const refreshNote = useCallback(() => {
        fetchNoteDetail(true);
    }, [fetchNoteDetail]);

    // Get field value for display
    const getFieldValue = useCallback((fieldKey) => {
        if (!note) return '';
        return note[fieldKey] || '';
    }, [note]);

    // Get field label
    const getFieldLabel = useCallback((fieldKey) => {
        const field = detailFields.find(f => f.key === fieldKey);
        return field ? field.label : fieldKey;
    }, [detailFields]);

    // Check if field should be displayed
    const shouldDisplayField = useCallback((fieldKey) => {
        const value = getFieldValue(fieldKey);
        // Hide empty fields except for required ones
        const field = detailFields.find(f => f.key === fieldKey);
        return value || (field && field.required);
    }, [getFieldValue, detailFields]);

    // Initialize on component mount
    useEffect(() => {
        initializeDetailFields();
    }, [initializeDetailFields]);

    // Fetch note when fields are ready
    useEffect(() => {
        if (nameFields && noteId) {
            fetchNoteDetail(false);
        }
    }, [nameFields, noteId, fetchNoteDetail]);

    return {
        // Data
        note,
        detailFields,
        loading,
        refreshing,
        error,
        deleting,
        
        // Actions
        fetchNoteDetail,
        refreshNote,
        deleteNote,
        
        // Helpers
        getFieldValue,
        getFieldLabel,
        shouldDisplayField
    };
};
