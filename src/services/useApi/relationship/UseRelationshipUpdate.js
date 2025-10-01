import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { cacheManager } from '../../../utils/cacheViewManagement/CacheManager';
import ReadCacheView from '../../../utils/cacheViewManagement/ReadCacheView';
import { SystemLanguageUtils } from '../../../utils/cacheViewManagement/SystemLanguageUtils';
import WriteCacheView from '../../../utils/cacheViewManagement/WriteCacheView';
import { convertToUTC, parseTimezoneString } from '../../../utils/format/FormatDateTime_Zones';
import {
    createModuleRelationshipApi,
    deleteModuleRelationshipApi,
    getEnumsApi,
    getModuleEditFieldsApi,
    getModuleFieldsRequiredApi,
    getRelateModuleApi,
    postFileModuleApi,
    updateModuleRecordApi
} from '../../api/module/ModuleApi';

export const useRelationshipUpdate = (moduleName, initialRecordData = null) => {
    // SystemLanguageUtils instance
    const systemLanguageUtils = SystemLanguageUtils.getInstance();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    // Form fields - will be initialized dynamically based on editviewdefs
    const [formData, setFormData] = useState({});

    // Track original data for comparison
    const [originalData, setOriginalData] = useState({});

    // Fields configuration
    const [updateFields, setUpdateFields] = useState([]);

    // Enum fields data - similar to useModule_Create
    const [enumFieldsData, setEnumFieldsData] = useState({});

    // Relate fields data - store relate module information
    const [relateModuleData, setRelateModuleData] = useState({});

    // Get default fields for different modules - just like useModule_Create
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
            },
            'Calls': {
                "name": "LBL_SUBJECT",
                "status": "LBL_STATUS",
                "direction": "LBL_DIRECTION",
                "date_start": "LBL_DATE",
                "parent_name": "",
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

    // Initialize update fields and language - similar to initializeCreateFields in useModule_Create
    const initializeUpdateFields = useCallback(async () => {
        try {
            if (!moduleName) {
                throw new Error('Module name is required');
            }

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

            // Find enum fields (type === 'enum' or type === 'parent_type')
            const enumFields = [];
            // Find relate fields (type === 'relate')
            const relateFields = [];

            Object.entries(requiredFields).forEach(([fieldKey, fieldInfo]) => {
                if (fieldInfo.type === 'enum' || fieldInfo.type === 'parent_type') {
                    enumFields.push(fieldKey);
                } else if (fieldInfo.type === 'relate') {
                    relateFields.push(fieldKey);
                }
            });

            // Fetch enum data if there are enum fields - like in useModule_Create
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

            // Fetch relate data if there are relate fields
            if (relateFields.length > 0) {
                try {
                    const relateResponse = await getRelateModuleApi(moduleName, relateFields.join(','));
                    if (relateResponse && relateResponse.success && relateResponse.fields) {
                        setRelateModuleData(relateResponse.fields);
                    }
                } catch (relateErr) {
                    console.warn(`Error fetching relate data for ${moduleName}:`, relateErr);
                }
            }

            // 4. Create updateFields with translation and required info - similar to createFields in useModule_Create
            let updateFieldsData = Object.entries(fieldsData).map(([fieldKey, labelValue]) => {
                let vietnameseLabel = fieldKey; // Default fallback

                if ((modStrings || appStrings) && labelValue && typeof labelValue === 'string' && labelValue.trim() !== '') {
                    const translation = findTranslation(labelValue);
                    if (translation) {
                        vietnameseLabel = translation;
                    }
                }

                // If no translation found, try multiple patterns - just like in useModule_Create
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

                // Special handling for enum and parent_type fields - just like in useModule_Create
                if (fieldType === 'enum' || fieldType === 'parent_type') {
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
                        type: 'relate', // Use relate type for UI rendering
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

            // Make sure parent_type is before parent_name if both exist - just like in useModule_Create
            const hasParentName = updateFieldsData.some(field => field.key === 'parent_name');
            const hasParentType = updateFieldsData.some(field => field.key === 'parent_type');

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
                const parentNameIndex = updateFieldsData.findIndex(field => field.key === 'parent_name');
                if (parentNameIndex !== -1) {
                    // Insert parent_type before parent_name
                    updateFieldsData.splice(parentNameIndex, 0, parentTypeField);
                }
            }

            setUpdateFields(updateFieldsData);

            // Initialize form data with empty values
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
            const errorMsg = await systemLanguageUtils.translate('ERR_AJAX_LOAD_FAILURE') || 'Không thể tải cấu hình cập nhật';
            setError(errorMsg);
        }
    }, [moduleName]);

    // Load record data into form
    const loadRecordData = useCallback((recordData) => {
        if (!recordData) return;

        // Tạo formValues dựa trên updateFields đã được khởi tạo
        const formValues = { id: recordData.id || '' };

        // Thêm các field từ updateFields vào formData
        updateFields.forEach(field => {
            // Handle boolean fields differently - ensure they're "0" or "1" as strings
            if (field.type === 'bool' || field.fieldType === 'bool') {
                // Convert boolean or string values to "0" or "1"
                const boolValue = recordData[field.key];
                if (boolValue === true || boolValue === 'true' || boolValue === '1' || boolValue === 1) {
                    formValues[field.key] = "1";
                } else {
                    formValues[field.key] = "0";
                }
            }
            // Handle function fields with default placeholder
            else if (field.type === 'function' || field.fieldType === 'function') {
                formValues[field.key] = recordData[field.key] || "not available to use";
            }
            // Handle all other fields normally
            else {
                formValues[field.key] = recordData[field.key] || '';
            }
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
            // Skip validation for bool, function and readonly fields
            if (field.type === 'bool' || field.type === 'function' || field.type === 'readonly') {
                continue;
            }

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
    const updateRecord = useCallback(async (uploadedFilename = null, mime_type = null) => {
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
                // Find the field definition to get its type
                const fieldDef = updateFields.find(f => f.key === key);

                // Skip function fields - they're not editable
                if (fieldDef && fieldDef.type === 'function') {
                    return;
                }

                // For boolean fields, always include them as 0 or 1 if changed
                if (fieldDef && fieldDef.type === 'bool' && formData[key] !== originalData[key]) {
                    updateData[key] = formData[key] === "1" ? "1" : "0";
                    return;
                }

                // For readonly fields that have changed, include them
                if (fieldDef && fieldDef.type === 'readonly' && formData[key] !== originalData[key]) {
                    updateData[key] = formData[key];
                    return;
                }

                // For regular fields that have changed and aren't excluded
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
                // Special handling for duration - convert to duration_hours and duration_minutes only
                if (updateData.duration) {
                    const totalSeconds = parseInt(updateData.duration, 10) || 0;
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);

                    updateData.duration_hours = hours;
                    updateData.duration_minutes = minutes;
                    
                    // Remove duration field as server should only receive duration_hours/duration_minutes
                    delete updateData.duration;
                }
                
                // If duration_hours or duration_minutes changed, calculate new date_end
                if (updateData.duration_hours !== undefined || updateData.duration_minutes !== undefined) {
                    const currentDateStart = updateData.date_start || formData.date_start || originalData.date_start;
                    const currentDurationHours = updateData.duration_hours !== undefined ? 
                        parseInt(updateData.duration_hours) : 
                        parseInt(formData.duration_hours || originalData.duration_hours || 0);
                    const currentDurationMinutes = updateData.duration_minutes !== undefined ? 
                        parseInt(updateData.duration_minutes) : 
                        parseInt(formData.duration_minutes || originalData.duration_minutes || 0);
                        
                    if (currentDateStart) {
                        const startDate = new Date(currentDateStart);
                        const totalMinutes = (currentDurationHours * 60) + currentDurationMinutes;
                        const endDate = new Date(startDate.getTime() + (totalMinutes * 60 * 1000));
                        
                        // Format date_end in the same format as date_start
                        const year = endDate.getFullYear();
                        const month = String(endDate.getMonth() + 1).padStart(2, '0');
                        const day = String(endDate.getDate()).padStart(2, '0');
                        const hours = String(endDate.getHours()).padStart(2, '0');
                        const minutes = String(endDate.getMinutes()).padStart(2, '0');
                        const seconds = String(endDate.getSeconds()).padStart(2, '0');
                        
                        updateData.date_end = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                    }
                }
                if (updateData.date_start) {
                    const timezone_store = await AsyncStorage.getItem('timezone') || '';
                    const timezone_utc = parseTimezoneString(timezone_store).utc; // e.g., "+07:00"
                    if (timezone_utc) {
                        updateData.date_start = convertToUTC(updateData.date_start, timezone_utc);
                    }
                }
                if (updateData.date_end) {
                    const timezone_store = await AsyncStorage.getItem("timezone") || "";
                    const timezone_utc = parseTimezoneString(timezone_store).utc;

                    if (timezone_utc) {
                        updateData.date_end = convertToUTC(updateData.date_end, timezone_utc);
                    }
                }
                // Add filename from uploaded file (ưu tiên filename từ upload)
                if (uploadedFilename) {
                    updateData.filename = uploadedFilename;

                // Chỉ thêm mime_type nếu có giá trị hợp lệ
                if (mime_type && mime_type !== 'application/x-empty') {
                    updateData.file_mime_type = mime_type;
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
                    updateData.file_mime_type = mimeTypeMap[fileExtension] || 'application/octet-stream';
                }
            } else if (formData.filename && formData.filename.trim() !== '') {
                updateData.filename = formData.filename.trim();
                updateData.file_mime_type = mime_type || 'application/octet-stream';
            }
            console.log('Update data:', updateData);
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

    // Get enum field options for a specific field - copied from useModule_Create
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

    // Get translated label for an enum value - copied from useModule_Create
    const getEnumLabel = useCallback((fieldKey, value) => {
        // If we have enum data for this field and the value exists
        if (enumFieldsData && enumFieldsData[fieldKey] && enumFieldsData[fieldKey].values && enumFieldsData[fieldKey].values[value]) {
            return enumFieldsData[fieldKey].values[value];
        }

        // Return the original value if no translation found
        return value;
    }, [enumFieldsData]);

    // Check if field is an enum type (enum or parent_type) - copied from useModule_Create
    const isEnumField = useCallback((fieldKey) => {
        const field = updateFields.find(f => f.key === fieldKey);
        return field && (field.type === 'select' || field.fieldType === 'enum' || field.fieldType === 'parent_type');
    }, [updateFields]);

    // Check if field is a boolean type (checkbox)
    const isBoolField = useCallback((fieldKey) => {
        const field = updateFields.find(f => f.key === fieldKey);
        return field && (field.type === 'bool' || field.fieldType === 'bool');
    }, [updateFields]);

    // Check if field is a function type (disabled)
    const isFunctionField = useCallback((fieldKey) => {
        const field = updateFields.find(f => f.key === fieldKey);
        return field && (field.type === 'function' || field.fieldType === 'function');
    }, [updateFields]);

    // Check if field is a readonly type (disabled)
    const isReadonlyField = useCallback((fieldKey) => {
        const field = updateFields.find(f => f.key === fieldKey);
        return field && (field.type === 'readonly' || field.fieldType === 'readonly');
    }, [updateFields]);

    // Toggle boolean field value (0 or 1)
    const toggleBoolField = useCallback((fieldKey) => {
        const currentValue = getFieldValue(fieldKey);
        // Toggle between "1" and "0" (as strings to match API requirements)
        const newValue = currentValue === "1" ? "0" : "1";
        updateField(fieldKey, newValue);
    }, [getFieldValue, updateField]);

    // Check if field is a relate type
    const isRelateField = useCallback((fieldKey) => {
        const field = updateFields.find(f => f.key === fieldKey);
        return field && (field.type === 'relate' || field.fieldType === 'relate');
    }, [updateFields]);

    // Get related module name for a relate field
    const getRelatedModuleName = useCallback((fieldKey) => {
        if (relateModuleData && relateModuleData[fieldKey] && relateModuleData[fieldKey].module) {
            return relateModuleData[fieldKey].module;
        }
        return null;
    }, [relateModuleData]);

    // Handle relate field selection (when user selects a record from SearchModulesScreen)
    const handleRelateFieldSelect = useCallback(async (fieldKey, selectedRecord) => {
        if (!selectedRecord) return;

        // Update the relate field with selected record name
        await updateField(fieldKey, selectedRecord.name || '');

        // Also update the corresponding ID field if it exists
        const idFieldKey = fieldKey.replace('_name', '_id');
        if (selectedRecord.id) {
            await updateField(idFieldKey, selectedRecord.id);
        }
    }, [updateField]);

    const [isFile, setIsFile] = useState(false);

    useEffect(() => {
        updateFields.forEach(field => {
            if (field.key === 'filename') {
                setIsFile(true);
            }
        });
    }, [updateFields]);

    // Save file to module
        const saveFile = useCallback(async (moduleName, file) => {
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


    return {
        // Data
        formData,
        originalData,
        updateFields,
        loading,
        error,
        validationErrors,
        enumFieldsData,
        relateModuleData,
        // file
        saveFile,
        isFile,

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
        getParentTypeOptions,
        getEnumOptions,
        getEnumLabel,
        isEnumField,
        isBoolField,
        isFunctionField,
        isReadonlyField,
        toggleBoolField,
        isRelateField,
        getRelatedModuleName,
        handleRelateFieldSelect
    };
};