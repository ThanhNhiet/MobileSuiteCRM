import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { cacheManager } from '../../../utils/CacheManager';
import { readCacheView } from '../../../utils/cacheViewManagement/Notes/ReadCacheView';
import { writeCacheView } from '../../../utils/cacheViewManagement/Notes/WriteCacheView';
import { checkParentNameExistsApi, createNoteApi, createNoteParentRelationApi, getNoteEditFieldsApi, getNoteFieldsRequiredApi } from '../../api/note/NoteApi';

export const useNoteCreate = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    
    // Form fields - will be initialized dynamically based on editviewdefs
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    
    // Fields configuration
    const [createFields, setCreateFields] = useState([]);

    // Initialize create fields and language
    const initializeCreateFields = useCallback(async () => {
        try {
            // 1. Kiểm tra cache editviewdefs.json có tồn tại không
            let fieldsData;
            const cachedFields = await readCacheView.readCacheFile('editviewdefs', 'Notes');
            
            if (!cachedFields) {
                // Nếu chưa có cache, fetch từ API
                const fieldsResponse = await getNoteEditFieldsApi();
                fieldsData = fieldsResponse;
                
                // Lưu vào cache
                await writeCacheView.writeCacheFile('editviewdefs', 'Notes', fieldsData);
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
            
            // 3. Lấy required fields từ cache hoặc API
            let requiredFields;
            const cachedRequiredFields = await readCacheView.readCacheFile('requiredfields', 'Notes');
            
            if (!cachedRequiredFields) {
                // Nếu chưa có cache, fetch từ API
                const requiredFieldsResponse = await getNoteFieldsRequiredApi();
                requiredFields = requiredFieldsResponse.data.attributes;
                
                // Lưu vào cache với tên requiredfields.json
                await writeCacheView.writeCacheFile('requiredfields', 'Notes', requiredFields);
            } else {
                // Nếu có cache, sử dụng cache
                requiredFields = cachedRequiredFields;
            }
            
            // Lấy mod_strings và app_strings từ cấu trúc language data
            let modStrings = null;
            let appStrings = null;
            if (languageData && languageData.data) {
                modStrings = languageData.data.mod_strings;
                appStrings = languageData.data.app_strings;
            }
            
            // Kiểm tra fieldsData có hợp lệ không
            if (!fieldsData || typeof fieldsData !== 'object' || Object.keys(fieldsData).length === 0) {
                // Using default fields structure
                fieldsData = {
                    "contact_name": "",
                    "parent_name": "",
                    "name": "",
                    "filename": "",
                    "description": "LBL_NOTE_STATUS",
                    "assigned_user_name": "LBL_ASSIGNED_TO"
                };
            }
            
            // 4. Tạo createFields với bản dịch và required info
            let createFieldsData = Object.entries(fieldsData).map(([fieldKey, labelValue]) => {
                let vietnameseLabel = fieldKey; // Default fallback
                
                if (modStrings || appStrings) {
                    if (labelValue && typeof labelValue === 'string' && labelValue.trim() !== '') {
                        // Sử dụng labelValue từ API để tìm trong modStrings trước, sau đó app_strings
                        let translation = null;
                        
                        if (modStrings && modStrings[labelValue]) {
                            translation = modStrings[labelValue];
                        } else if (appStrings && appStrings[labelValue]) {
                            translation = appStrings[labelValue];
                        }
                        
                        // Nếu không tìm thấy, thử tìm với các pattern khác
                        if (!translation) {
                            const listKey = labelValue.replace('LBL_', 'LBL_LIST_');
                            if (modStrings && modStrings[listKey]) {
                                translation = modStrings[listKey];
                            } else if (appStrings && appStrings[listKey]) {
                                translation = appStrings[listKey];
                            }
                        }
                        
                        vietnameseLabel = translation || labelValue;
                    } else {
                        // Nếu labelValue rỗng, áp dụng phương pháp cũ: chuyển thành định dạng LBL_FIELD
                        let translation = null;
                        
                        // Xử lý trường hợp đặc biệt cho từng field
                        if (fieldKey === 'assigned_user_name') {
                            // Thử nhiều pattern cho assigned_user_name
                            const patterns = ['LBL_ASSIGNED_TO', 'LBL_LIST_ASSIGNED_TO_NAME', 'LBL_ASSIGNED_TO_USER'];
                            for (const pattern of patterns) {
                                if (modStrings && modStrings[pattern]) {
                                    translation = modStrings[pattern];
                                    break;
                                } else if (appStrings && appStrings[pattern]) {
                                    translation = appStrings[pattern];
                                    break;
                                }
                            }
                        } else if (fieldKey === 'name') {
                            // Thử nhiều pattern cho name field
                            const patterns = ['LBL_NAME', 'LBL_EMAIL_ACCOUNTS_NAME', 'LBL_FIRST_NAME'];
                            for (const pattern of patterns) {
                                if (modStrings && modStrings[pattern]) {
                                    translation = modStrings[pattern];
                                    break;
                                } else if (appStrings && appStrings[pattern]) {
                                    translation = appStrings[pattern];
                                    break;
                                }
                            }
                        } else {
                            // Các field khác
                            const lblKey = `LBL_${fieldKey.toUpperCase()}`;
                            if (modStrings && modStrings[lblKey]) {
                                translation = modStrings[lblKey];
                            } else if (appStrings && appStrings[lblKey]) {
                                translation = appStrings[lblKey];
                            }
                        }
                        
                        // Thử các pattern khác nếu không tìm thấy
                        if (!translation && !['assigned_user_name', 'name'].includes(fieldKey)) {
                            const listKey = `LBL_LIST_${fieldKey.toUpperCase()}`;
                            if (modStrings && modStrings[listKey]) {
                                translation = modStrings[listKey];
                            } else if (appStrings && appStrings[listKey]) {
                                translation = appStrings[listKey];
                            }
                        }
                        
                        vietnameseLabel = translation || fieldKey;
                    }
                } else {
                    // Nếu không có dữ liệu ngôn ngữ, sử dụng labelValue hoặc fieldKey
                    if (labelValue && typeof labelValue === 'string' && labelValue.trim() !== '') {
                        vietnameseLabel = labelValue;
                    } else if (fieldKey === 'assigned_user_name') {
                        // Xử lý trường hợp đặc biệt cho assigned_user_name - thử nhiều pattern
                        vietnameseLabel = 'LBL_LIST_ASSIGNED_TO_NAME';
                    } else {
                        vietnameseLabel = fieldKey;
                    }
                }
                
                // Lấy thông tin required từ requiredFields
                const fieldInfo = requiredFields[fieldKey] || {};
                const isRequired = fieldInfo.required === true || fieldInfo.required === 'true';
                
                // Thêm dấu * đỏ cho required fields
                const finalLabel = isRequired ? `${vietnameseLabel} *` : vietnameseLabel;
                
                return {
                    key: fieldKey,
                    label: finalLabel,
                    type: fieldInfo.type || 'text',
                    required: isRequired
                };
            });
            
            // Nếu có parent_name trong editviewdefs, thêm parent_type và parent_id để có modal
            const hasParentName = fieldsData.hasOwnProperty('parent_name');
            if (hasParentName) {
                // Lấy bản dịch cho parent_type
                let parentTypeLabel = 'parent_type';
                if (modStrings || appStrings) {
                    const patterns = ['LBL_PARENT_TYPE', 'LBL_TYPE', 'LBL_LIST_PARENT_TYPE'];
                    for (const pattern of patterns) {
                        if (modStrings && modStrings[pattern]) {
                            parentTypeLabel = modStrings[pattern];
                            break;
                        } else if (appStrings && appStrings[pattern]) {
                            parentTypeLabel = appStrings[pattern];
                            break;
                        }
                    }
                }
                
                // Lấy bản dịch cho parent_id
                let parentIdLabel = 'parent_id';
                if (modStrings || appStrings) {
                    const patterns = ['LBL_PARENT_ID', 'LBL_ID', 'LBL_LIST_PARENT_ID'];
                    for (const pattern of patterns) {
                        if (modStrings && modStrings[pattern]) {
                            parentIdLabel = modStrings[pattern];
                            break;
                        } else if (appStrings && appStrings[pattern]) {
                            parentIdLabel = appStrings[pattern];
                            break;
                        }
                    }
                }
                
                // Remove parent_name from createFieldsData first if it exists
                createFieldsData = createFieldsData.filter(field => field.key !== 'parent_name');
                
                // Thêm parent_type field (modal)
                const parentTypeField = {
                    key: 'parent_type',
                    label: parentTypeLabel,
                    type: 'select',
                    required: false
                };
                
                // Thêm parent_id field (input)
                const parentIdField = {
                    key: 'parent_id',
                    label: parentIdLabel,
                    type: 'text',
                    required: false
                };
                
                // Get parent_name field from original fieldsData
                const parentNameField = {
                    key: 'parent_name',
                    label: fieldsData.parent_name.label || 'Parent Name',
                    type: fieldsData.parent_name.type || 'text',
                    required: fieldsData.parent_name.required || false
                };
                
                // Thêm vào đầu danh sách để hiển thị trước (parent_name first, then parent_type, parent_id)
                createFieldsData.unshift(parentIdField);
                createFieldsData.unshift(parentTypeField);
                createFieldsData.unshift(parentNameField);
            }
            
            setCreateFields(createFieldsData);
            
            // Initialize form data with empty values
            const initialFormData = {};
            createFieldsData.forEach(field => {
                initialFormData[field.key] = '';
            });
            setFormData(initialFormData);
            
        } catch (err) {
            console.warn('Initialize create fields error:', err);
            setError('Error loading note create fields');
        }
    }, []);

    // Update form field
    const updateField = useCallback(async (fieldKey, value) => {
        // Update form data first
        setFormData(prev => ({
            ...prev,
            [fieldKey]: value
        }));
        
        // Clear validation error when field is updated
        if (validationErrors[fieldKey]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldKey];
                return newErrors;
            });
        }
        
        // Clear parent_name when parent_type changes
        if (fieldKey === 'parent_type') {
            setFormData(prev => ({
                ...prev,
                parent_name: '',
                parent_id: '',
                parent_check_error: null
            }));
        }
        
        // Clear parent check results when parent_id changes
        if (fieldKey === 'parent_id') {
            setFormData(prev => ({
                ...prev,
                parent_name: '',
                parent_check_error: null
            }));
        }
    }, [validationErrors]);

    // Validate form
    const validateForm = useCallback(async () => {
        const errors = {};
        
        // Check required fields
        createFields.forEach(field => {
            if (field.required && !formData[field.key]?.trim()) {
                errors[field.key] = `${field.label} là bắt buộc`;
            }
        });
        
        // If parent_id is provided, parent_type must be selected
        if (formData.parent_id?.trim() && !formData.parent_type) {
            errors.parent_type = 'Phải chọn loại khi có ID liên quan';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData, createFields]);

    // Create note
    const createNote = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Validate form
            const isValid = await validateForm();
            if (!isValid) {
                setLoading(false);
                return false;
            }
            // console.log('Creating note with data:', formData);
            
            // Prepare note data (exclude parent relationship fields and temporary fields)
            const excludeFields = ['parent_type', 'parent_id', 'parent_name', 'parent_check_error'];
            const noteData = {};
            
            Object.keys(formData).forEach(key => {
                if (!excludeFields.includes(key) && formData[key]?.trim()) {
                    noteData[key] = formData[key].trim();
                }
            });
            
            // Create the note first
            const response = await createNoteApi(noteData);
            // console.log('Note created successfully:', response);
            
            // Extract note ID from response - handle multiple possible structures
            let noteId = null;
            
            // Try different ways to extract the ID
            if (response?.data?.id) {
                noteId = response.data.id;
            } else if (response?.id) {
                noteId = response.id;
            } else if (response?.data?.data?.id) {
                noteId = response.data.data.id;
            } else if (typeof response === 'string') {
                // If response is a string containing JSON, try to parse it
                try {
                    const jsonMatch = response.match(/"id":\s*"([^"]+)"/);
                    if (jsonMatch) {
                        noteId = jsonMatch[1];
                    }
                } catch (parseErr) {
                    console.warn('Failed to parse ID from string response:', parseErr);
                }
            }
            
            // console.log('Extracted noteId:', noteId);
            
            if (!noteId) {
                console.error('Full response structure:', JSON.stringify(response, null, 2));
                throw new Error('Không thể lấy ID của ghi chú vừa tạo');
            }
            
            // Create parent relationship if specified
            if (formData.parent_type && formData.parent_id?.trim()) {
                console.log('Creating relationship:', formData.parent_type, formData.parent_id.trim(), noteId);
                await createNoteParentRelationApi(formData.parent_type, formData.parent_id.trim(), noteId);
            }
            
            return {
                success: true,
                noteId: noteId
            };
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Không thể tạo ghi chú';
            setError(errorMessage);
            console.warn('Create note error:', err);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, [formData, validateForm]);

    // Reset form
    const resetForm = useCallback(() => {
        // Reset to initial empty values based on current createFields
        const initialFormData = {};
        createFields.forEach(field => {
            initialFormData[field.key] = '';
        });
        setFormData(initialFormData);
        setValidationErrors({});
        setError(null);
    }, [createFields]);

    // Get field value
    const getFieldValue = useCallback((fieldKey) => {
        return formData[fieldKey] || '';
    }, [formData]);

    // Get field label
    const getFieldLabel = useCallback((fieldKey) => {
        const field = createFields.find(f => f.key === fieldKey);
        return field ? field.label : fieldKey;
    }, [createFields]);

    // Get field validation error
    const getFieldError = useCallback((fieldKey) => {
        return validationErrors[fieldKey] || null;
    }, [validationErrors]);

    // Check if form is valid for submission
    const isFormValid = useCallback(() => {
        return formData.name?.trim() && Object.keys(validationErrors).length === 0;
    }, [formData.name, validationErrors]);

    // Check if parent_name field exists in editviewdefs
    const hasParentNameField = useCallback(() => {
        return createFields.some(field => field.key === 'parent_name');
    }, [createFields]);

    // Check parent name exists
    const checkParentName = useCallback(async () => {
        if (!formData.parent_type || !formData.parent_id?.trim()) {
            setFormData(prev => ({
                ...prev,
                parent_name: '',
                parent_check_error: 'Vui lòng chọn loại và nhập ID'
            }));
            return;
        }

        try {
            console.log('Checking parent name for type:', formData.parent_type, 'and ID:', formData.parent_id.trim());
            const result = await checkParentNameExistsApi(formData.parent_type, formData.parent_id.trim());
            console.log('Parent name check result:', result);
            
            // If result is a string, it means parent was found and result is the name
            if (typeof result === 'string' && result.trim()) {
                setFormData(prev => ({
                    ...prev,
                    parent_name: result.trim(),
                    parent_check_error: null
                }));
            } else if (result && result.success) {
                // If result is an object with success property
                setFormData(prev => ({
                    ...prev,
                    parent_name: result.data?.name || result.name || '',
                    parent_check_error: null
                }));
            } else {
                // Parent not found
                setFormData(prev => ({
                    ...prev,
                    parent_name: '',
                    parent_check_error: result?.error || 'Không tìm thấy parent'
                }));
            }
        } catch (err) {
            console.warn('Check parent error:', err);
            setFormData(prev => ({
                ...prev,
                parent_name: '',
                parent_check_error: 'Lỗi kiểm tra parent'
            }));
        }
    }, [formData.parent_type, formData.parent_id]);

    // Clear parent relationship
    const clearParentRelationship = useCallback(() => {
        setFormData(prev => ({
            ...prev,
            parent_type: '',
            parent_id: '',
            parent_name: '',
            parent_check_error: null
        }));
    }, []);

    // Initialize on component mount
    useEffect(() => {
        initializeCreateFields();
    }, [initializeCreateFields]);

    return {
        // Data
        formData,
        createFields,
        loading,
        error,
        validationErrors,
        
        // Actions
        updateField,
        createNote,
        resetForm,
        validateForm,
        checkParentName,
        clearParentRelationship,
        
        // Helpers
        getFieldValue,
        getFieldLabel,
        getFieldError,
        isFormValid,
        hasParentNameField
    };
};
