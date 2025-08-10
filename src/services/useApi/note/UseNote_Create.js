import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { cacheManager } from '../../../utils/cacheViewManagement/CacheManager';
import ReadCacheView from '../../../utils/cacheViewManagement/ReadCacheView';
import { SystemLanguageUtils } from '../../../utils/cacheViewManagement/SystemLanguageUtils';
import WriteCacheView from '../../../utils/cacheViewManagement/WriteCacheView';
import { createNoteApi, createNoteParentRelationApi, getNoteEditFieldsApi, getNoteFieldsRequiredApi } from '../../api/note/NoteApi';

export const useNoteCreate = () => {
    // SystemLanguageUtils instance
    const systemLanguageUtils = SystemLanguageUtils.getInstance();
    
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
            const cachedFields = await ReadCacheView.getModuleField('Notes', 'editviewdefs');
            
            if (!cachedFields) {
                // Nếu chưa có cache, fetch từ API
                const fieldsResponse = await getNoteEditFieldsApi();
                fieldsData = fieldsResponse;
                
                // Lưu vào cache
                await WriteCacheView.saveModuleField('Notes', 'editviewdefs', fieldsData);
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
            const cachedRequiredFields = await ReadCacheView.getModuleField('Notes', 'requiredfields');
            
            if (!cachedRequiredFields) {
                // Nếu chưa có cache, fetch từ API
                const requiredFieldsResponse = await getNoteFieldsRequiredApi();
                requiredFields = requiredFieldsResponse.data.attributes;
                
                // Lưu vào cache với tên requiredfields.json
                await WriteCacheView.saveModuleField('Notes', 'requiredfields', requiredFields);
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
                        } else if (fieldKey === 'parent_name') {
                            // Thử nhiều pattern cho parent_name field
                            const patterns = ['LBL_PARENT_NAME', 'LBL_LIST_PARENT_NAME', 'LBL_RELATED_TO'];
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
                        if (!translation && !['assigned_user_name', 'name', 'parent_name'].includes(fieldKey)) {
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
                    } else if (fieldKey === 'parent_name') {
                        // Xử lý trường hợp đặc biệt cho parent_name
                        vietnameseLabel = 'LBL_PARENT_NAME';
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
            
            // Nếu có parent_name trong editviewdefs, thêm parent_type để có modal
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
                
                // Thêm parent_type field (modal)
                const parentTypeField = {
                    key: 'parent_type',
                    label: parentTypeLabel,
                    type: 'select',
                    required: false
                };
                
                // Tìm vị trí của contact_name và chèn parent_type sau nó
                const contactNameIndex = createFieldsData.findIndex(field => field.key === 'contact_name');
                if (contactNameIndex !== -1) {
                    // Chèn parent_type sau contact_name
                    createFieldsData.splice(contactNameIndex + 1, 0, parentTypeField);
                } else {
                    // Nếu không tìm thấy contact_name, thêm vào đầu danh sách như cũ
                    createFieldsData.unshift(parentTypeField);
                }
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
            setError(systemLanguageUtils.translate('ERR_AJAX_LOAD_FAILURE'));
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
    }, [validationErrors]);

    // Validate form
    const validateForm = useCallback(async () => {
        const errors = {};
        
        // Check required fields
        for (const field of createFields) {
            if (field.required && !formData[field.key]?.trim()) {
                const requiredMessage = await systemLanguageUtils.translate('ERROR_MISSING_COLLECTION_SELECTION') || 'Bắt buộc nhập';
                errors[field.key] = `${requiredMessage}`;
            }
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
            
            // Prepare note data (exclude only parent_id and assigned_user_id from API call, include parent_type)
            const excludeFields = ['parent_id', 'assigned_user_id']; // Exclude temporary ID fields
            const noteData = {};
            
            Object.keys(formData).forEach(key => {
                if (!excludeFields.includes(key) && formData[key]?.trim()) {
                    noteData[key] = formData[key].trim();
                }
            });

            // Add assigned_user_id if selected
            if (formData.assigned_user_id?.trim()) {
                noteData.assigned_user_id = formData.assigned_user_id.trim();
            }
            
            // Create the note first
            const response = await createNoteApi(noteData);
            
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
            
            if (!noteId) {
                console.error('Full response structure:', JSON.stringify(response, null, 2));
                const extractError = await systemLanguageUtils.translate('ERROR_EXTRACT_NOTE_ID') || 'Cannot extract note ID from response';
                throw new Error(extractError);
            }
            
            // Create parent relationship if specified
            if (formData.parent_type && formData.parent_id?.trim()) {
                await createNoteParentRelationApi(formData.parent_type, formData.parent_id.trim(), noteId);
            }
            
            return {
                success: true,
                noteId: noteId
            };
        } catch (err) {
            const createErrorMessage = await systemLanguageUtils.translate('UPLOAD_REQUEST_ERROR') || 'Lỗi khi tạo ghi chú';
            const errorMessage = err.response?.data?.message || err.message || createErrorMessage;
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

    // Get translated parent type options
    const getParentTypeOptions = useCallback(async () => {
        const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
        let languageData = await cacheManager.getModuleLanguage('Notes', selectedLanguage);

        let modStrings = null;
        let appStrings = null;
        if (languageData && languageData.data) {
            modStrings = languageData.data.mod_strings;
            appStrings = languageData.data.app_strings;
        }

        const baseOptions = [
            { value: 'Accounts', labelKeys: ['LBL_ACCOUNTS', 'LBL_ACCOUNT'], fallback: systemLanguageUtils.translate('LBL_ACCOUNTS') },
            { value: 'Contacts', labelKeys: ['LBL_CONTACTS', 'LBL_CONTACT'], fallback: systemLanguageUtils.translate('LBL_CONTACTS') },
            { value: 'Tasks', labelKeys: ['LBL_EMAIL_QC_TASKS', 'LBL_TASKS'], fallback: systemLanguageUtils.translate('LBL_TASKS') },
            { value: 'Meetings', labelKeys: ['LBL_MEETINGS'], fallback: systemLanguageUtils.translate('LBL_MEETINGS') }
        ];

        return baseOptions.map(option => {
            let label = option.fallback;

            // Try to find translation in mod_strings first, then app_strings
            for (const labelKey of option.labelKeys) {
                if (modStrings && modStrings[labelKey]) {
                    label = modStrings[labelKey];
                    break;
                } else if (appStrings && appStrings[labelKey]) {
                    label = appStrings[labelKey];
                    break;
                }
            }

            return {
                value: option.value,
                label: label
            };
        });
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
        
        // Helpers
        getFieldValue,
        getFieldLabel,
        getFieldError,
        isFormValid,
        hasParentNameField,
        getParentTypeOptions
    };
};
