import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { cacheManager } from '../../../utils/cacheViewManagement/CacheManager';
import ReadCacheView from '../../../utils/cacheViewManagement/ReadCacheView';
import { SystemLanguageUtils } from '../../../utils/cacheViewManagement/SystemLanguageUtils';
import WriteCacheView from '../../../utils/cacheViewManagement/WriteCacheView';
import {
    createModuleRelationshipApi,
    deleteModuleRelationshipApi,
    getModuleEditFieldsApi,
    getModuleFieldsRequiredApi,
    updateModuleRecordApi
} from '../../api/module/ModuleApi';

export const useModuleUpdate = (moduleName, initialRecordData = null) => {
    // SystemLanguageUtils instance
    const systemLanguageUtils = SystemLanguageUtils.getInstance();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    // Form fields - will be initialized dynamically based on editviewdefs
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        assigned_user_name: '',
        assigned_user_id: '',
        parent_name: '',
        parent_type: '',
        parent_id: ''
    });

    // Track original data for comparison
    const [originalData, setOriginalData] = useState({});

    // Fields configuration
    const [updateFields, setUpdateFields] = useState([]);

    // Initialize update fields and language
    const initializeUpdateFields = useCallback(async () => {
        try {
            if (!moduleName) {
                throw new Error('Module name is required');
            }

            // 1. Kiểm tra cache editviewdefs.json có tồn tại không
            let fieldsData;
            const cachedFields = await ReadCacheView.getModuleField(moduleName, 'editviewdefs');

            if (!cachedFields) {
                // Nếu chưa có cache, fetch từ API
                const fieldsResponse = await getModuleEditFieldsApi(moduleName);
                fieldsData = fieldsResponse;

                // Lưu vào cache
                await WriteCacheView.saveModuleField(moduleName, 'editviewdefs', fieldsData);
            } else {
                // Nếu có cache, sử dụng cache
                fieldsData = cachedFields;
            }

            // 2. Lấy ngôn ngữ hiện tại
            const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
            let languageData = await cacheManager.getModuleLanguage(moduleName, selectedLanguage);

            // Nếu không có language data, thử fetch lại
            if (!languageData) {
                const languageExists = await cacheManager.checkModuleLanguageExists(moduleName, selectedLanguage);
                if (!languageExists) {
                    // Language cache missing - user needs to login to fetch data
                }
            }

            // 3. Lấy required fields từ cache hoặc API
            let requiredFields;
            const cachedRequiredFields = await ReadCacheView.getModuleField(moduleName, 'requiredfields');

            if (!cachedRequiredFields) {
                // Nếu chưa có cache, fetch từ API
                const requiredFieldsResponse = await getModuleFieldsRequiredApi(moduleName);
                requiredFields = requiredFieldsResponse.data.attributes;

                // Lưu vào cache với tên requiredfields.json
                await WriteCacheView.saveModuleField(moduleName, 'requiredfields', requiredFields);
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
                    "name": "LBL_NAME",
                    "description": "LBL_DESCRIPTION",
                    "assigned_user_name": "LBL_ASSIGNED_TO"
                };
            }

            // 4. Tạo updateFields với bản dịch và required info
            const updateFieldsData = Object.entries(fieldsData).map(([fieldKey, labelValue]) => {
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

                // Tìm vị trí thích hợp để chèn parent_type
                const parentNameIndex = updateFieldsData.findIndex(field => field.key === 'parent_name');
                if (parentNameIndex !== -1) {
                    // Chèn parent_type trước parent_name để parent_type hiển thị trước
                    updateFieldsData.splice(parentNameIndex, 0, parentTypeField);
                } else {
                    // Fallback: tìm vị trí sau name
                    const nameIndex = updateFieldsData.findIndex(field => field.key === 'name');
                    if (nameIndex !== -1) {
                        // Chèn parent_type sau name
                        updateFieldsData.splice(nameIndex + 1, 0, parentTypeField);
                    } else {
                        // Nếu không tìm thấy name, thêm vào đầu danh sách
                        updateFieldsData.unshift(parentTypeField);
                    }
                }
            }

            setUpdateFields(updateFieldsData);

            // Initialize form data with empty values for all fields
            const initialFormData = { id: '' };
            updateFieldsData.forEach(field => {
                if (field.key !== 'id') {
                    initialFormData[field.key] = '';
                }
            });
            // Ensure these fields are always included
            initialFormData['parent_id'] = '';
            initialFormData['assigned_user_id'] = '';
            setFormData(initialFormData);
            setOriginalData(initialFormData);

        } catch (err) {
            console.warn('Initialize update fields error:', err);
            setError(systemLanguageUtils.translate('ERR_AJAX_LOAD_FAILURE'));
        }
    }, [moduleName]);

    // Load record data into form
    const loadRecordData = useCallback((recordData) => {
        if (!recordData) return;

        // Tạo formValues dựa trên updateFields đã được khởi tạo
        const formValues = { id: recordData.id || '' };

        // Thêm các field từ updateFields vào formData
        updateFields.forEach(field => {
            formValues[field.key] = recordData[field.key] || '';
        });
        
        // Ensure these fields are always included, even if not in updateFields
        formValues['parent_id'] = recordData['parent_id'] || '';
        formValues['assigned_user_id'] = recordData['assigned_user_id'] || '';

        // Create clean originalData without temporary fields
        const cleanOriginalData = { ...formValues };

        setFormData(formValues);
        setOriginalData(cleanOriginalData);
        setValidationErrors({});
        setError(null);

    }, [updateFields]);

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

    // Check if form has changes
    const hasChanges = useCallback(() => {
        const excludeFields = []; // No fields to exclude
        return Object.keys(formData).some(key =>
            !excludeFields.includes(key) && formData[key] !== originalData[key]
        );
    }, [formData, originalData]);

    // Check if parent_name field exists in editviewdefs
    const hasParentNameField = useCallback(() => {
        return updateFields.some(field => field.key === 'parent_name');
    }, [updateFields]);

    // Validate form
    const validateForm = useCallback(async () => {
        const errors = {};

        // Check required fields - chỉ validate field có required = true
        for (const field of updateFields) {
            if (field.required) {
                const fieldValue = formData[field.key];

                // Kiểm tra field rỗng hoặc chỉ chứa khoảng trắng
                if (!fieldValue || (typeof fieldValue === 'string' && !fieldValue.trim())) {
                    // Tạo error message với label đã loại bỏ dấu *
                    const requiredMessage = await systemLanguageUtils.translate('ERROR_MISSING_COLLECTION_SELECTION') || 'Bắt buộc nhập';
                    errors[field.key] = `${requiredMessage}`;
                }
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData, updateFields]);

    // Update record
    const updateRecord = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Check if there are changes
            if (!hasChanges()) {
                setLoading(false);
                const noDataLabel = await systemLanguageUtils.translate('LBL_NO_DATA') || 'Không có dữ liệu';
                const openNewLabel = await systemLanguageUtils.translate('Open_New') || 'mới';
                return {
                    success: false,
                    error: `${noDataLabel} ${openNewLabel}`
                };
            }

            // Validate form
            const isValid = await validateForm();
            if (!isValid) {
                setLoading(false);
                return false;
            }

            // Prepare basic update data (exclude parent-related and special fields)
            const updateData = {};
            const excludeFields = ['id', 'parent_id']; // Exclude parent_id but allow assigned_user_id

            Object.keys(formData).forEach(key => {
                if (!excludeFields.includes(key) && formData[key] !== originalData[key]) {
                    updateData[key] = formData[key]?.trim ? formData[key].trim() : formData[key];
                }
            });

            // Handle assigned_user_id separately to ensure it's included if changed
            if (formData.assigned_user_id !== originalData.assigned_user_id) {
                updateData.assigned_user_id = formData.assigned_user_id;
            }

            // Update basic record data if there are changes
            if (Object.keys(updateData).length > 0) {
                await updateModuleRecordApi(moduleName, formData.id, updateData);
            }

            // Handle parent relationship changes
            const oldParentType = originalData.parent_type;
            const oldParentName = originalData.parent_name;
            const oldParentId = originalData.parent_id;
            const newParentType = formData.parent_type;
            const newParentName = formData.parent_name?.trim();
            const newParentId = formData.parent_id;

            // If parent relationship has changed
            if (oldParentType !== newParentType || oldParentName !== newParentName || oldParentId !== newParentId) {
                // Create new relationship if specified and we have parent_id
                if (newParentType && newParentName && newParentId) {
                    await createModuleRelationshipApi(newParentType, newParentId, moduleName, formData.id);
                }
            }

            // Update original data to reflect saved state
            setOriginalData({ ...formData });

            return {
                success: true,
                recordId: formData.id,
                updatedFields: Object.keys(updateData)
            };
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || systemLanguageUtils.translate('ERR_AJAX_LOAD_FAILURE');
            setError(errorMessage);
            console.warn('Update record error:', err);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, [moduleName, formData, originalData, hasChanges, validateForm]);

    // Reset form to original state
    const resetForm = useCallback(() => {
        setFormData({ ...originalData });
        setValidationErrors({});
        setError(null);
    }, [originalData]);

    // Get field value
    const getFieldValue = useCallback((fieldKey) => {
        return formData[fieldKey] || '';
    }, [formData]);

    // Get field label with styled required indicator
    const getStyledFieldLabel = useCallback((fieldKey) => {
        const field = updateFields.find(f => f.key === fieldKey);
        if (!field) return fieldKey;

        if (field.required) {
            // Tách label và dấu * để có thể style riêng
            const labelText = field.label.replace(' *', '');
            return {
                text: labelText,
                required: true
            };
        }

        return {
            text: field.label,
            required: false
        };
    }, [updateFields]);

    // Get field label (original function for backward compatibility)
    const getFieldLabel = useCallback((fieldKey) => {
        const field = updateFields.find(f => f.key === fieldKey);
        return field ? field.label : fieldKey;
    }, [updateFields]);

    // Get field validation error
    const getFieldError = useCallback((fieldKey) => {
        return validationErrors[fieldKey] || null;
    }, [validationErrors]);

    // Check if field is required
    const isFieldRequired = useCallback((fieldKey) => {
        const field = updateFields.find(f => f.key === fieldKey);
        return field ? field.required : false;
    }, [updateFields]);

    // Check if form is valid for submission
    const isFormValid = useCallback(() => {
        // Kiểm tra tất cả required fields có được điền không
        const hasRequiredFieldsError = updateFields.some(field => {
            if (field.required) {
                const fieldValue = formData[field.key];
                return !fieldValue || (typeof fieldValue === 'string' && !fieldValue.trim());
            }
            return false;
        });

        return !hasRequiredFieldsError && Object.keys(validationErrors).length === 0 && hasChanges();
    }, [formData, updateFields, validationErrors, hasChanges]);

    // Get translated parent type options
    const getParentTypeOptions = useCallback(async () => {
        const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
        let languageData = await cacheManager.getModuleLanguage(moduleName, selectedLanguage);

        let modStrings = null;
        let appStrings = null;
        if (languageData && languageData.data) {
            modStrings = languageData.data.mod_strings;
            appStrings = languageData.data.app_strings;
        }

        // All available modules with their translation keys and fallbacks
        const allModuleOptions = [
            { value: 'Accounts', labelKeys: ['LBL_ACCOUNTS', 'LBL_ACCOUNT'], fallback: 'Account' },
            { value: 'Contacts', labelKeys: ['LBL_CONTACTS', 'LBL_CONTACT'], fallback: 'Contact' },
            { value: 'Tasks', labelKeys: ['LBL_EMAIL_QC_TASKS', 'LBL_TASKS'], fallback: 'Task' },
            { value: 'Opportunities', labelKeys: ['LBL_OPPORTUNITIES', 'LBL_OPPORTUNITY'], fallback: 'Opportunity' },
            { value: 'Bugs', labelKeys: ['LBL_BUGS', 'LBL_BUG'], fallback: 'Bug' },
            { value: 'Cases', labelKeys: ['LBL_CASES', 'LBL_CASE'], fallback: 'Case' },
            { value: 'Leads', labelKeys: ['LBL_LEADS', 'LBL_LEAD'], fallback: 'Lead' },
            { value: 'Projects', labelKeys: ['LBL_PROJECTS', 'LBL_PROJECT'], fallback: 'Project' },
            { value: 'ProjectTasks', labelKeys: ['LBL_PROJECT_TASKS', 'LBL_PROJECT_TASK'], fallback: 'Project Task' },
            { value: 'Targets', labelKeys: ['LBL_TARGETS', 'LBL_TARGET'], fallback: 'Target' },
            { value: 'Contracts', labelKeys: ['LBL_CONTRACTS', 'LBL_CONTRACT'], fallback: 'Contract' },
            { value: 'Invoices', labelKeys: ['LBL_INVOICES', 'LBL_INVOICE'], fallback: 'Invoice' },
            { value: 'Quotes', labelKeys: ['LBL_QUOTES', 'LBL_QUOTE'], fallback: 'Quote' },
            { value: 'Products', labelKeys: ['LBL_PRODUCTS', 'LBL_PRODUCT'], fallback: 'Product' },
            { value: 'Meetings', labelKeys: ['LBL_MEETINGS', 'LBL_MEETING'], fallback: 'Meeting' },
            { value: 'Calls', labelKeys: ['LBL_CALLS', 'LBL_CALL'], fallback: 'Call' },
            { value: 'Emails', labelKeys: ['LBL_EMAILS', 'LBL_EMAIL'], fallback: 'Email' },
            { value: 'Documents', labelKeys: ['LBL_DOCUMENTS', 'LBL_DOCUMENT'], fallback: 'Document' },
            { value: 'Notes', labelKeys: ['LBL_NOTES', 'LBL_NOTE'], fallback: 'Note' }
        ];

        // Filter options based on current module rules:
        // 1. If current module is not Notes, exclude Notes from options
        // 2. Always exclude current module from options
        // 3. For Notes module, should have 18 options (19 total - 1 current module)
        let filteredOptions = allModuleOptions.filter(option => {
            // Exclude current module
            if (option.value === moduleName) {
                return false;
            }
            
            // If current module is not Notes, exclude Notes from options
            if (moduleName !== 'Notes' && option.value === 'Notes') {
                return false;
            }
            
            return true;
        });

        // Translate the filtered options
        return filteredOptions.map(option => {
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
    }, [moduleName]);

    // Handle delete parent relationship
    const handleDeleteRelationship = useCallback(async () => {
        try {
            const currentParentType = formData.parent_type;

            // Check if there's a relationship to delete
            if (!currentParentType) {
                // Clear the form fields if no relationship exists
                await updateField('parent_type', '');
                await updateField('parent_name', '');
                return {
                    success: true,
                    message: 'Parent relationship cleared'
                };
            }

            // Validate record ID
            if (!formData.id) {
                throw new Error('Record ID is required for deleting parent relationship');
            }

            // Delete the relationship via API
            console.log('Deleting parent relationship for record ID:', formData.id);
            console.log('Current parent type:', currentParentType);
            await deleteModuleRelationshipApi(currentParentType, formData.parent_id, moduleName, formData.id);

            // Clear the form fields after successful deletion
            await updateField('parent_type', '');
            await updateField('parent_name', '');
            await updateField('parent_id', '');

            // Update original data to reflect the change
            setOriginalData(prev => ({
                ...prev,
                parent_type: '',
                parent_name: '',
                parent_id: ''
            }));

            return {
                success: true,
                message: 'Parent relationship deleted successfully'
            };
        } catch (err) {
            console.warn('Delete parent relationship error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to delete parent relationship';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        }
    }, [formData.parent_type, formData.id, updateField]);

    // Initialize on component mount
    useEffect(() => {
        initializeUpdateFields();
    }, [initializeUpdateFields]);

    // Load initial data when provided
    useEffect(() => {
        if (initialRecordData) {
            loadRecordData(initialRecordData);
        }
    }, [initialRecordData, loadRecordData]);

    return {
        // Data
        formData,
        originalData,
        updateFields,
        loading,
        error,
        validationErrors,

        // Actions
        loadRecordData,
        updateField,
        updateRecord,
        resetForm,
        validateForm,
        handleDeleteRelationship,

        // Helpers
        getFieldValue,
        getFieldLabel,
        getStyledFieldLabel,
        getFieldError,
        isFieldRequired,
        isFormValid,
        hasChanges,
        hasParentNameField,
        getParentTypeOptions
    };
};