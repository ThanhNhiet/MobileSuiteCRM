import { useCallback, useEffect, useState } from 'react';
import { deleteNoteApi, getNoteDetailApi, getNoteFieldsApi, getNotesLanguageApi } from '../../api/note/NoteApi';

export const useNoteDetail = (noteId) => {
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    
    // Fields and labels
    const [detailFields, setDetailFields] = useState([]);
    const [nameFields, setNameFields] = useState('');

    // Initialize fields and language for detail view
    const initializeDetailFields = useCallback(async () => {
        try {
            // Get all fields for Notes module
            const fieldsResponse = await getNoteFieldsApi();
            const allFields = fieldsResponse.data.attributes;
            
            // Filter required fields and commonly used fields
            const requiredFields = Object.entries(allFields)
                .filter(([fieldName, fieldInfo]) => 
                    fieldInfo.required || 
                    ['id', 'name', 'date_entered', 'date_modified', 'modified_by_name', 
                     'parent_type', 'parent_name', 'description', 'created_by_name', 
                     'assigned_user_name'].includes(fieldName)
                )
                .map(([fieldName]) => fieldName);
            
            const nameFieldsString = requiredFields.join(',');
            setNameFields(nameFieldsString);
            
            // Get language data
            const languageResponse = await getNotesLanguageApi();
            const modStrings = languageResponse.data.mod_strings;
            
            // Create field configuration with Vietnamese labels
            const fieldsConfig = requiredFields.map(fieldName => {
                const labelKey = `LBL_${fieldName.toUpperCase()}`;
                const vietnameseLabel = modStrings[labelKey] || 
                                     modStrings[`LBL_LIST_${fieldName.toUpperCase()}`] ||
                                     fieldName.replace(/_/g, ' ').toUpperCase();
                
                const fieldInfo = allFields[fieldName] || {};
                
                return {
                    key: fieldName,
                    label: vietnameseLabel,
                    type: fieldInfo.type || 'text',
                    required: fieldInfo.required || false
                };
            });
            
            setDetailFields(fieldsConfig);
            // console.log('Initialized detail fields and language for Note');
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

            const response = await getNoteDetailApi(noteId, nameFields);
            
            // Process note data
            const noteData = {
                id: response.data.id,
                type: response.data.type,
                ...response.data.attributes
            };
            
            setNote(noteData);
            // console.log('Loaded note detail:', noteData.name);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Không thể tải chi tiết ghi chú';
            setError(errorMessage);
            console.warn('Fetch note detail error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [noteId, nameFields]);

    // Delete note
    const deleteNote = useCallback(async () => {
        if (!noteId) return false;
        
        try {
            setDeleting(true);
            setError(null);
            
            await deleteNoteApi(noteId);
            
            // console.log('Note deleted successfully:', noteId);
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
