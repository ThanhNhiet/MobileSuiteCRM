import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { cacheManager } from '../../../utils/cacheViewManagement/CacheManager';
import ReadCacheView from '../../../utils/cacheViewManagement/ReadCacheView';
import { SystemLanguageUtils } from '../../../utils/cacheViewManagement/SystemLanguageUtils';
import WriteCacheView from '../../../utils/cacheViewManagement/WriteCacheView';
import {
    createModuleRecordApi,
    createModuleRelationshipApi,
    getEnumsApi,
    getModuleEditFieldsApi,
    getModuleFieldsRequiredApi,
    getRelateModuleApi,
    postFileModuleApi
} from '../../api/module/ModuleApi';

export const useModule_Create = (moduleName) => {
    // SystemLanguageUtils instance
    const systemLanguageUtils = SystemLanguageUtils.getInstance();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [relateModuleData, setRelateModuleData] = useState({});

    // Form fields - will be initialized dynamically based on editviewdefs
    const [formData, setFormData] = useState({});

    // Fields configuration
    const [createFields, setCreateFields] = useState([]);

    // Enum fields data
    const [enumFieldsData, setEnumFieldsData] = useState({});

    // Get default fields for different modules
    const getDefaultFieldsForModule = (module) => {
        const defaultFields = {
            'Notes': {
                "contact_name": "",
                "parent_name": "",
                "name": "",
                "filename": "",
                "description": "LBL_NOTE_STATUS",
                "assigned_user_name": "LBL_ASSIGNED_TO"
            },
            'Tasks': {
                "name": "LBL_SUBJECT",
                "status": "LBL_STATUS",
                "priority": "LBL_PRIORITY",
                "date_due": "LBL_DUE_DATE",
                "parent_name": "",
                "assigned_user_name": "LBL_ASSIGNED_TO",
                "description": "LBL_DESCRIPTION"
            },
            'Meetings': {
                "name": "LBL_SUBJECT",
                "date_start": "LBL_DATE_TIME",
                "duration_hours": "LBL_DURATION",
                "location": "LBL_LOCATION",
                "parent_name": "",
                "assigned_user_name": "LBL_ASSIGNED_TO",
                "description": "LBL_DESCRIPTION"
            },
            'Accounts': {
                "name": "LBL_NAME",
                "account_type": "LBL_TYPE",
                "industry": "LBL_INDUSTRY",
                "annual_revenue": "LBL_ANNUAL_REVENUE",
                "phone_office": "LBL_PHONE_OFFICE",
                "email1": "LBL_EMAIL_ADDRESS",
                "billing_address_city": "LBL_CITY",
                "assigned_user_name": "LBL_ASSIGNED_TO",
                "description": "LBL_DESCRIPTION"
            },
            'Contacts': {
                "first_name": "LBL_FIRST_NAME",
                "last_name": "LBL_LAST_NAME",
                "title": "LBL_TITLE",
                "phone_work": "LBL_OFFICE_PHONE",
                "email1": "LBL_EMAIL_ADDRESS",
                "account_name": "LBL_ACCOUNT_NAME",
                "assigned_user_name": "LBL_ASSIGNED_TO"
            },
            'Opportunities': {
                "name": "LBL_OPPORTUNITY_NAME",
                "account_name": "LBL_ACCOUNT_NAME",
                "sales_stage": "LBL_SALES_STAGE",
                "amount": "LBL_AMOUNT",
                "date_closed": "LBL_DATE_CLOSED",
                "probability": "LBL_PROBABILITY",
                "assigned_user_name": "LBL_ASSIGNED_TO",
                "description": "LBL_DESCRIPTION"
            }
        };

        return defaultFields[module] || {
            "name": "LBL_NAME",
            "assigned_user_name": "LBL_ASSIGNED_TO",
            "description": "LBL_DESCRIPTION"
        };
    };

    // Initialize create fields and language
    const initializeCreateFields = useCallback(async () => {
        try {
            // 1. Check cache editviewdefs.json
            let fieldsData;
            const cachedFields = await ReadCacheView.getModuleField(moduleName, 'editviewdefs');

            if (!cachedFields) {
                // If no cache, fetch from API
                const fieldsResponse = await getModuleEditFieldsApi(moduleName);
                fieldsData = fieldsResponse;

                // Save to cache
                await WriteCacheView.saveModuleField(moduleName, 'editviewdefs', fieldsData);
            } else {
                // Use cached data
                fieldsData = cachedFields;
            }

            // 2. Get current language
            const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
            let languageData = await cacheManager.getModuleLanguage(moduleName, selectedLanguage);

            // If no language data, check if language cache exists
            if (!languageData) {
                const languageExists = await cacheManager.checkModuleLanguageExists(moduleName, selectedLanguage);
                if (!languageExists) {
                    // Language cache missing - user needs to login to fetch data
                }
            }

            // 3. Get required fields from cache or API
            let requiredFields;
            const cachedRequiredFields = await ReadCacheView.getModuleField(moduleName, 'requiredfields');

            if (!cachedRequiredFields) {
                // If no cache, fetch from API
                const requiredFieldsResponse = await getModuleFieldsRequiredApi(moduleName);
                requiredFields = requiredFieldsResponse.data.attributes;

                // Save to cache with name requiredfields.json
                await WriteCacheView.saveModuleField(moduleName, 'requiredfields', requiredFields);
            } else {
                // Use cached data
                requiredFields = cachedRequiredFields;
            }

            // Get mod_strings and app_strings from language data structure
            let modStrings = null;
            let appStrings = null;
            if (languageData && languageData.data) {
                modStrings = languageData.data.mod_strings;
                appStrings = languageData.data.app_strings;
            }

            // Function to find translation
            const findTranslation = (key) => {
                if (modStrings && modStrings[key]) {
                    return modStrings[key];
                }
                if (appStrings && appStrings[key]) {
                    return appStrings[key];
                }
                return null;
            };

            // Check if fieldsData is valid
            if (!fieldsData || typeof fieldsData !== 'object' || Object.keys(fieldsData).length === 0) {
                // Use default fields structure
                fieldsData = getDefaultFieldsForModule(moduleName);
            }

            // Find enum fields (type === 'enum' or type === 'parent_type' or type === 'relate')
            const enumFields = [];
            const relateFields = [];
            Object.entries(requiredFields).forEach(([fieldKey, fieldInfo]) => {
                if (fieldInfo.type === 'enum' || fieldInfo.type === 'parent_type') {
                    enumFields.push(fieldKey);
                } else if (fieldInfo.type === 'relate') {
                    relateFields.push(fieldKey);
                }
            });

            // Fetch enum data if there are enum fields
            if (enumFields.length > 0) {
                try {
                    const enumsResponse = await getEnumsApi(moduleName, enumFields.join(','), selectedLanguage);
                    if (enumsResponse && enumsResponse.success && enumsResponse.fields) {
                        setEnumFieldsData(enumsResponse.fields);
                    }
                } catch (enumErr) {
                    console.warn(`Error fetching enum data for ${moduleName}:`, enumErr);
                }
            }
            // Fetch relate module data if there are relate fields
            if (relateFields.length > 0) {
                try {
                    const fields_relateType = relateFields.join(',');
                    const relateResponse = await getRelateModuleApi(moduleName, fields_relateType);
                    if (relateResponse && relateResponse.success && relateResponse.fields) {
                        setRelateModuleData(relateResponse.fields);
                    }
                } catch (relateErr) {
                    console.warn(`Error fetching relate module data for ${moduleName}:`, relateErr);
                }
            }

            // 4. Create createFields with translation and required info
            let createFieldsData = Object.entries(fieldsData).map(([fieldKey, labelValue]) => {
                let vietnameseLabel = fieldKey; // Default fallback

                if ((modStrings || appStrings) && labelValue && typeof labelValue === 'string' && labelValue.trim() !== '') {
                    const translation = findTranslation(labelValue);
                    if (translation) {
                        vietnameseLabel = translation;
                    }
                }

                // If no translation found, try multiple patterns
                if (vietnameseLabel === fieldKey) {
                    let translation = null;

                    // Handle special cases for each field
                    if (fieldKey === 'assigned_user_name') {
                        const patterns = ['LBL_ASSIGNED_TO', 'LBL_LIST_ASSIGNED_TO_NAME', 'LBL_ASSIGNED_TO_USER'];
                        for (const pattern of patterns) {
                            translation = findTranslation(pattern);
                            if (translation) break;
                        }
                    } else if (fieldKey === 'name') {
                        const patterns = ['LBL_NAME', 'LBL_EMAIL_ACCOUNTS_NAME', 'LBL_FIRST_NAME'];
                        for (const pattern of patterns) {
                            translation = findTranslation(pattern);
                            if (translation) break;
                        }
                    } else if (fieldKey === 'parent_name') {
                        const patterns = ['LBL_PARENT_NAME', 'LBL_LIST_PARENT_NAME', 'LBL_RELATED_TO'];
                        for (const pattern of patterns) {
                            translation = findTranslation(pattern);
                            if (translation) break;
                        }
                    } else {
                        // Try standard patterns
                        const lblKey = `LBL_${fieldKey.toUpperCase()}`;
                        translation = findTranslation(lblKey);

                        if (!translation) {
                            const listKey = `LBL_LIST_${fieldKey.toUpperCase()}`;
                            translation = findTranslation(listKey);
                        }
                    }

                    vietnameseLabel = translation || labelValue || fieldKey;
                }

                // Get required info from requiredFields
                const fieldInfo = requiredFields[fieldKey] || {};
                const isRequired = fieldInfo.required === true || fieldInfo.required === 'true';

                // Add red * for required fields
                const finalLabel = isRequired ? `${vietnameseLabel} *` : vietnameseLabel;

                // Determine field type
                const fieldType = fieldInfo.type || 'text';

                // Special handling for enum and parent_type fields
                if (fieldType === 'enum' || fieldType === 'radioenum' || fieldType === 'parent_type') {
                    return {
                        key: fieldKey,
                        label: finalLabel,
                        type: 'select', // Use select type for UI rendering
                        fieldType: fieldType, // Store the original field type for API
                        required: isRequired
                    };
                }
                
                // Special handling for bool fields (checkbox)
                if (fieldType === 'bool') {
                    return {
                        key: fieldKey,
                        label: finalLabel,
                        type: 'bool', // Use bool type for UI rendering as checkbox
                        fieldType: fieldType,
                        required: isRequired
                    };
                }
                
                // Special handling for function fields (disabled input)
                if (fieldType === 'function') {
                    return {
                        key: fieldKey,
                        label: finalLabel,
                        type: 'function', // Disabled input field
                        fieldType: fieldType,
                        required: isRequired
                    };
                }
                
                // Special handling for readonly fields (disabled input)
                if (fieldType === 'readonly') {
                    return {
                        key: fieldKey,
                        label: finalLabel,
                        type: 'readonly', // Disabled input field
                        fieldType: fieldType,
                        required: isRequired
                    };
                }
                // Special handling for relate fields
                if (fieldType === 'relate') {
                    return {
                        key: fieldKey,
                        label: finalLabel,
                        type: 'relate',
                        fieldType: fieldType,
                        required: isRequired
                    };
                }

                return {
                    key: fieldKey,
                    label: finalLabel,
                    type: fieldType,
                    required: isRequired
                };
            });

            // Make sure parent_type is before parent_name if both exist
            const hasParentName = createFieldsData.some(field => field.key === 'parent_name');
            const hasParentType = createFieldsData.some(field => field.key === 'parent_type');

            if (hasParentName && !hasParentType && requiredFields.parent_type) {
                // Get translation for parent_type
                let parentTypeLabel = 'parent_type';
                const patterns = ['LBL_PARENT_TYPE', 'LBL_TYPE', 'LBL_LIST_PARENT_TYPE'];
                for (const pattern of patterns) {
                    const translation = findTranslation(pattern);
                    if (translation) {
                        parentTypeLabel = translation;
                        break;
                    }
                }

                // Add parent_type field (modal)
                const parentTypeField = {
                    key: 'parent_type',
                    label: parentTypeLabel,
                    type: 'select',
                    fieldType: 'parent_type',
                    required: requiredFields.parent_type.required === true || requiredFields.parent_type.required === 'true'
                };

                // Find appropriate position to insert parent_type before parent_name
                const parentNameIndex = createFieldsData.findIndex(field => field.key === 'parent_name');
                if (parentNameIndex !== -1) {
                    // Insert parent_type before parent_name
                    createFieldsData.splice(parentNameIndex, 0, parentTypeField);
                }
            }

            setCreateFields(createFieldsData);

            // Initialize form data with empty values
            const initialFormData = {};
            createFieldsData.forEach(field => {
                // Set default values based on field type
                if (field.type === 'bool') {
                    // For boolean fields, default to "0" (unchecked)
                    initialFormData[field.key] = "0";
                } else if (field.type === 'function') {
                    // For function fields, use "not available to use" as placeholder
                    initialFormData[field.key] = "not available to use";
                } else {
                    // For other fields, use empty string
                    initialFormData[field.key] = '';
                }
            });
            // Ensure these fields are always included
            initialFormData['parent_id'] = '';
            initialFormData['assigned_user_id'] = '';
            setFormData(initialFormData);

        } catch (err) {
            console.warn('Initialize create fields error:', err);
            const errorMsg = await systemLanguageUtils.translate('ERR_AJAX_LOAD_FAILURE') || 'Không thể tải cấu hình tạo mới';
            setError(errorMsg);
        }
    }, [moduleName]);

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
        
        // Check required fields and validate numeric fields
        for (const field of createFields) {
            const fieldValue = formData[field.key]?.trim ? formData[field.key]?.trim() : formData[field.key] || '';
            
            // Special handling for boolean fields - they're always valid with values "0" or "1"
            if (field.type === 'bool') {
                // Skip further validation for boolean fields
                continue;
            }
            
            // Skip validation for function and readonly fields
            if (field.type === 'function' || field.type === 'readonly') {
                continue;
            }
            
            // Check required fields (except for bool/function/readonly fields)
            if (field.required && !fieldValue) {
                const requiredMessage = await systemLanguageUtils.translate('ERROR_MISSING_COLLECTION_SELECTION') || 'Bắt buộc nhập';
                errors[field.key] = `${requiredMessage}`;
                continue;
            }
            
            // Validate numeric fields
            if (fieldValue && (field.type === 'int' || field.type === 'currency')) {
                // For int fields, verify it's a valid integer
                if (field.type === 'int' && !/^[0-9]+$/.test(fieldValue)) {
                    const errorMessage = await systemLanguageUtils.translate('ERROR_INVALID_INTEGER') || 'Phải là số nguyên';
                    errors[field.key] = errorMessage;
                }
                
                // For currency fields, verify it's a valid number
                if (field.type === 'currency' && !/^[0-9]*\.?[0-9]*$/.test(fieldValue)) {
                    const errorMessage = await systemLanguageUtils.translate('ERROR_INVALID_CURRENCY') || 'Phải là số';
                    errors[field.key] = errorMessage;
                }
            }
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData, createFields]);    // Create record
    const createRecord = useCallback(async (uploadedFilename = null, mime_type = null) => {
        try {
            setLoading(true);
            setError(null);

            // Validate form
            const isValid = await validateForm();
            if (!isValid) {
                setLoading(false);
                return {
                    success: false,
                    message: 'Form validation failed'
                };
            }

            // Prepare record data (exclude only parent_id and assigned_user_id from API call, include parent_type)
            const excludeFields = ['parent_id', 'assigned_user_id']; // Exclude temporary ID fields
            const recordData = {};

            Object.keys(formData).forEach(key => {
                // Find the field definition to get its type
                const fieldDef = createFields.find(f => f.key === key);
                
                // Skip function fields - they're not editable and shouldn't be submitted
                if (fieldDef && fieldDef.type === 'function') {
                    return;
                }
                
                // For boolean fields, always include them as 0 or 1
                if (fieldDef && fieldDef.type === 'bool') {
                    recordData[key] = formData[key] === "1" ? "1" : "0";
                    return;
                }
                
                // For readonly fields, include them even if empty
                if (fieldDef && fieldDef.type === 'readonly' && formData[key] !== undefined) {
                    recordData[key] = formData[key].trim ? formData[key].trim() : formData[key];
                    return;
                }
                
                // For regular fields, only include if they're not in excludeFields and have a value
                if (!excludeFields.includes(key) && formData[key]?.trim && formData[key].trim()) {
                    // For enum fields, we store the key (not the translated value)
                    recordData[key] = formData[key].trim();
                }
            });

            // Add assigned_user_id if selected
            if (formData.assigned_user_id?.trim()) {
                recordData.assigned_user_id = formData.assigned_user_id.trim();
            }

            // Create the record first
            if (
                recordData?.duration_hours &&
                recordData?.duration_minutes === undefined
            ) {
                recordData.duration_minutes = "0";
            }
            
            // Add filename from uploaded file (ưu tiên filename từ upload)
            if (uploadedFilename) {
                console.log('Adding uploaded filename to recordData:', uploadedFilename);
                recordData.filename = uploadedFilename;
                
                // Chỉ thêm mime_type nếu có giá trị hợp lệ
                if (mime_type && mime_type !== 'application/x-empty') {
                    console.log('Adding mime_type to recordData:', mime_type);
                    recordData.file_mime_type = mime_type;
                } else {
                    // Fallback: xác định mime_type từ file extension
                    const fileExtension = uploadedFilename.split('.').pop().toLowerCase();
                    const mimeTypeMap = {
                        'jpg': 'image/jpeg',
                        'jpeg': 'image/jpeg', 
                        'png': 'image/png',
                        'gif': 'image/gif',
                        'pdf': 'application/pdf',
                        'doc': 'application/msword',
                        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'txt': 'text/plain'
                    };
                    recordData.file_mime_type = mimeTypeMap[fileExtension] || 'application/octet-stream';
                }
            } else if (formData.filename && formData.filename.trim() !== '') {
                console.log('Filename from formData:', formData.filename);
                recordData.filename = formData.filename.trim();
                recordData.file_mime_type = mime_type || 'application/octet-stream';
            }

            console.log('Record data to create:', recordData);
            const response = await createModuleRecordApi(moduleName, recordData);

            // Extract record ID from response - handle multiple possible structures
            let recordId = null;

            // Try different ways to extract the ID
            if (response?.data?.id) {
                recordId = response.data.id;
            } else if (response?.id) {
                recordId = response.id;
            } else if (response?.data?.data?.id) {
                recordId = response.data.data.id;
            } else if (typeof response === 'string') {
                // If response is a string containing JSON, try to parse it
                try {
                    const jsonMatch = response.match(/"id":\s*"([^"]+)"/);
                    if (jsonMatch) {
                        recordId = jsonMatch[1];
                    }
                } catch (parseErr) {
                    console.warn('Failed to parse ID from string response:', parseErr);
                }
            }

            if (!recordId) {
                console.error('Full response structure:', JSON.stringify(response, null, 2));
                const extractError = await systemLanguageUtils.translate('ERROR_EXTRACT_RECORD_ID') || 'Cannot extract record ID from response';
                throw new Error(extractError);
            }

            // Create parent relationship if specified
            if (formData.parent_type && formData.parent_id?.trim()) {
                await createModuleRelationshipApi(formData.parent_type, formData.parent_id.trim(), moduleName, recordId);
            }

            return {
                success: true,
                recordId: recordId
            };
        } catch (err) {
            const createErrorMessage = await systemLanguageUtils.translate('UPLOAD_REQUEST_ERROR') || 'Lỗi khi tạo bản ghi';
            const errorMessage = err.response?.data?.message || err.message || createErrorMessage;
            setError(errorMessage);
            console.warn('Create record error:', err);
            return {
                success: false,
                message: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, [formData, validateForm, moduleName]);

    // Reset form
    const resetForm = useCallback(() => {
        // Reset to initial empty values based on current createFields
        const initialFormData = {};
        createFields.forEach(field => {
            // Set default values based on field type
            if (field.type === 'bool') {
                // For boolean fields, default to "0" (unchecked)
                initialFormData[field.key] = "0";
            } else if (field.type === 'function') {
                // For function fields, use "not available to use" as placeholder
                initialFormData[field.key] = "not available to use";
            } else {
                // For other fields, use empty string
                initialFormData[field.key] = '';
            }
        });
        // Ensure these fields are always included
        initialFormData['parent_id'] = '';
        initialFormData['assigned_user_id'] = '';
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
        // Find the primary field (name, first_name, etc.)
        const primaryField = createFields.find(field =>
            field.key === 'name' || field.key === 'first_name' || field.key === 'subject'
        );
        const primaryValue = primaryField ? formData[primaryField.key]?.trim() : '';

        return primaryValue && Object.keys(validationErrors).length === 0;
    }, [formData, validationErrors, createFields]);

    // Check if parent_name field exists in editviewdefs
    const hasParentNameField = useCallback(() => {
        return createFields.some(field => field.key === 'parent_name');
    }, [createFields]);

    // THIS FUNCTION IS FALLBACK. Get translated parent type options
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

    // Initialize on component mount
    useEffect(() => {
        if (moduleName) {
            initializeCreateFields();
        }
    }, [initializeCreateFields, moduleName]);

    // Get enum field options for a specific field
    const getEnumOptions = useCallback((fieldKey) => {
        // If we have enum data for this field
        if (enumFieldsData && enumFieldsData[fieldKey] && enumFieldsData[fieldKey].values) {
            // Convert the values object to an array of options
            return Object.entries(enumFieldsData[fieldKey].values).map(([key, value]) => ({
                value: key,     // This is the actual value to store (e.g., "Planned")
                label: value    // This is the translated value to display (e.g., "Đã lên kế hoạch")
            }));
        }

        // Default empty array if no options found
        return [];
    }, [enumFieldsData]);

    // Get translated label for an enum value
    const getEnumLabel = useCallback((fieldKey, value) => {
        // If we have enum data for this field and the value exists
        if (enumFieldsData && enumFieldsData[fieldKey] && enumFieldsData[fieldKey].values && enumFieldsData[fieldKey].values[value]) {
            return enumFieldsData[fieldKey].values[value];
        }

        // Return the original value if no translation found
        return value;
    }, [enumFieldsData]);


    // Check if field is an enum type (enum or parent_type)
    const isEnumField = useCallback((fieldKey) => {
        const field = createFields.find(f => f.key === fieldKey);
        return field && (field.type === 'select' || field.fieldType === 'enum' || field.fieldType === 'parent_type');
    }, [createFields]);
    const [isFile,setIsFile] = useState(false);

    useEffect(() => {
        createFields.forEach(field => {
            if (field.key === 'filename') {
                setIsFile(true);
            }
        });
    },[createFields]);
    // Save file to module
    const saveFile = useCallback(async (moduleName,file) => {
        try {
            if (!file || !moduleName) return;
            const data = await postFileModuleApi(moduleName, file);
            if (!data || !data.success) {
                console.warn('Save File API response error:', data.message);
                const errorMsg = await systemLanguageUtils.translate('UPLOAD_REQUEST_ERROR') || 'Lỗi khi tải tệp lên';
                throw new Error(errorMsg);
            }
            const kq = {
                success: data.success,
                fileName: data.fileName,
                original_filename: data.original_filename,
                fileUrl: data.file_url,
                mime_type: data.mime_type,
                preview: data.preview_url,
                download: data.download_url
            };
            return kq;
        } catch (error) {
            console.warn("Save File API error:", error);
            throw error;
        }
    }, [moduleName]);
    // Check if field is a boolean type (checkbox)
    const isBoolField = useCallback((fieldKey) => {
        const field = createFields.find(f => f.key === fieldKey);
        return field && (field.type === 'bool' || field.fieldType === 'bool');
    }, [createFields]);
    
    // Check if field is a function type (disabled)
    const isFunctionField = useCallback((fieldKey) => {
        const field = createFields.find(f => f.key === fieldKey);
        return field && (field.type === 'function' || field.fieldType === 'function');
    }, [createFields]);
    
    // Check if field is a readonly type (disabled)
    const isReadonlyField = useCallback((fieldKey) => {
        const field = createFields.find(f => f.key === fieldKey);
        return field && (field.type === 'readonly' || field.fieldType === 'readonly');
    }, [createFields]);

    // Check if field is a relate type
    const isRelateField = useCallback((fieldKey) => {
        const field = createFields.find(f => f.key === fieldKey);
        return field && (field.type === 'relate' || field.fieldType === 'relate');
    }, [createFields]);
    
    // Get the related module name for a relate field
    const getRelatedModuleName = useCallback((fieldKey) => {
        if (relateModuleData && relateModuleData[fieldKey] && relateModuleData[fieldKey].module_relate) {
            return relateModuleData[fieldKey].module_relate;
        }
        return null;
    }, [relateModuleData]);
    
    // Toggle boolean field value (0 or 1)
    const toggleBoolField = useCallback((fieldKey) => {
        const currentValue = getFieldValue(fieldKey);
        // Toggle between "1" and "0" (as strings to match API requirements)
        const newValue = currentValue === "1" ? "0" : "1";
        updateField(fieldKey, newValue);
    }, [getFieldValue, updateField]);

    return {
        formData,
        setFormData, // Thêm dòng này
        createFields,
        loading,
        error,
        validationErrors,
        enumFieldsData,
        relateModuleData,
        updateField,
        createRecord,
        resetForm,
        validateForm,
        toggleBoolField,

        // Helpers
        getFieldValue,
        getFieldLabel,
        getFieldError,
        isFormValid,
        hasParentNameField,
        getParentTypeOptions,
        getEnumOptions,
        getEnumLabel,
        isEnumField,
        saveFile,
        isFile,

        isBoolField,
        isFunctionField,
        isReadonlyField,
        isRelateField,
        getRelatedModuleName
    };
};