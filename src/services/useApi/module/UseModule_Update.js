import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { ModuleLanguageUtils } from '../../../utils/cacheViewManagement/ModuleLanguageUtils';
import { getModuleDetailApi, getModuleEditFieldsApi, updateModuleRecordApi } from '../../api/module/ModuleApi';

export const useModuleUpdate = (moduleName, recordId, initialRecord) => {
    const [formData, setFormData] = useState({});
    const [formFields, setFormFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Initialize ModuleLanguageUtils for this specific module
    const moduleLanguageUtils = new ModuleLanguageUtils(moduleName);

    // Initialize form data
    useEffect(() => {
        const initializeForm = async () => {
            if (!moduleName || !recordId) {
                setError('Module name and record ID are required');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                let recordData = initialRecord;
                
                // If no initial record provided, fetch it
                if (!recordData) {
                    // Use ModuleApi to get record detail
                    const editFieldsResponse = await getModuleEditFieldsApi(moduleName);
                    const fieldsToFetch = editFieldsResponse?.data?.attributes 
                        ? Object.keys(editFieldsResponse.data.attributes).join(',')
                        : 'name,description,assigned_user_id,created_by,date_entered,date_modified';

                    const response = await getModuleDetailApi(moduleName, recordId, fieldsToFetch);

                    if (response.data && response.data.attributes) {
                        recordData = response.data.attributes;
                    } else {
                        throw new Error('Failed to fetch record');
                    }
                }

                // Process record data for form
                await processRecordForForm(recordData);

            } catch (err) {
                console.error('Error initializing form:', err);
                setError(err.message || 'An error occurred while loading form');
            } finally {
                setLoading(false);
            }
        };

        initializeForm();
    }, [moduleName, recordId, initialRecord]);

    // Process record data to create form fields
    const processRecordForForm = async (recordData) => {
        try {
            // Get field labels from translation
            const fieldKeys = Object.keys(recordData).filter(key => 
                !key.toLowerCase().includes('id') && 
                !key.toLowerCase().includes('created') && 
                !key.toLowerCase().includes('updated')
            );
            
            const translatedLabels = await moduleLanguageUtils.translateKeys(fieldKeys);

            // Create form fields
            const fields = fieldKeys.map(key => {
                const label = translatedLabels[key] || key;
                
                // Determine field type
                let fieldType = 'text';
                if (key.toLowerCase().includes('email')) {
                    fieldType = 'email';
                } else if (key.toLowerCase().includes('description') || 
                          key.toLowerCase().includes('note') || 
                          key.toLowerCase().includes('content')) {
                    fieldType = 'textarea';
                }

                return {
                    key,
                    label,
                    type: fieldType
                };
            });

            setFormFields(fields);
            setFormData(recordData);

        } catch (err) {
            console.error('Error processing record for form:', err);
        }
    };

    // Update field value
    const updateField = useCallback((fieldKey, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldKey]: value
        }));
    }, []);

    // Save record using ModuleApi
    const saveRecord = useCallback(async () => {
        if (!formData || Object.keys(formData).length === 0) {
            Alert.alert('Lỗi', 'Không có dữ liệu để lưu');
            return false;
        }

        try {
            setSaving(true);
            
            // Use ModuleApi updateModuleRecordApi
            const response = await updateModuleRecordApi(moduleName, recordId, formData);
            
            if (response.data) {
                return true;
            } else {
                throw new Error('Failed to update record');
            }

        } catch (err) {
            console.error('Error saving record:', err);
            Alert.alert(
                'Lỗi',
                err.message || 'Có lỗi xảy ra khi lưu bản ghi',
                [{ text: 'OK' }]
            );
            return false;
        } finally {
            setSaving(false);
        }
    }, [formData, moduleName, recordId]);

    // Reset form to initial state
    const resetForm = useCallback(() => {
        if (initialRecord) {
            setFormData(initialRecord);
            setError(null);
        }
    }, [initialRecord]);

    return {
        formData,
        formFields,
        loading,
        saving,
        error,
        updateField,
        saveRecord,
        resetForm
    };
};