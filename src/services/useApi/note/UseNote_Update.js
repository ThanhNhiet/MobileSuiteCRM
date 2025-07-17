import { useCallback, useEffect, useState } from 'react';
import { checkParentNameExistsApi, getNoteFieldsApi, getNotesLanguageApi, updateNoteApi } from '../../api/note/NoteApi';

export const useNoteUpdate = (initialNoteData = null) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    
    // Form fields
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        parent_type: '',
        parent_name: ''
    });
    
    // Track original data for comparison
    const [originalData, setOriginalData] = useState({});
    
    // Fields configuration
    const [updateFields, setUpdateFields] = useState([]);
    const [parentTypeOptions, setParentTypeOptions] = useState([
        { value: '', label: 'Chọn loại' },
        { value: 'Accounts', label: 'Khách hàng' },
        { value: 'Users', label: 'Người dùng' },
        { value: 'Tasks', label: 'Công việc' },
        { value: 'Meetings', label: 'Cuộc họp' }
    ]);

    // Initialize update fields and language
    const initializeUpdateFields = useCallback(async () => {
        try {
            // Get all fields for Notes module
            const fieldsResponse = await getNoteFieldsApi();
            const allFields = fieldsResponse.data.attributes;
            
            // Get language data
            const languageResponse = await getNotesLanguageApi();
            const modStrings = languageResponse.data.mod_strings;
            
            // Filter fields for update form (editable fields)
            const updateFieldNames = ['name', 'description', 'parent_type', 'parent_name'];
            
            const fieldsConfig = updateFieldNames.map(fieldName => {
                const fieldInfo = allFields[fieldName] || {};
                const labelKey = `LBL_${fieldName.toUpperCase()}`;
                const vietnameseLabel = modStrings[labelKey] || 
                                     modStrings[`LBL_LIST_${fieldName.toUpperCase()}`] ||
                                     fieldName.replace(/_/g, ' ').toUpperCase();
                
                return {
                    key: fieldName,
                    label: vietnameseLabel,
                    type: fieldInfo.type || 'text',
                    required: fieldInfo.required || fieldName === 'name', // name is always required
                    placeholder: `Nhập ${vietnameseLabel.toLowerCase()}`
                };
            });
            
            setUpdateFields(fieldsConfig);
            console.log('Initialized update fields and language for Note');
        } catch (err) {
            console.warn('Initialize update fields error:', err);
            setError('Không thể tải cấu hình cập nhật ghi chú');
        }
    }, []);

    // Load note data into form
    const loadNoteData = useCallback((noteData) => {
        if (!noteData) return;
        
        const formValues = {
            id: noteData.id || '',
            name: noteData.name || '',
            description: noteData.description || '',
            parent_type: noteData.parent_type || '',
            parent_name: noteData.parent_name || ''
        };
        
        setFormData(formValues);
        setOriginalData(formValues);
        setValidationErrors({});
        setError(null);
        
        console.log('Loaded note data into update form:', noteData.name);
    }, []);

    // Update form field
    const updateField = useCallback((fieldKey, value) => {
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
        return Object.keys(formData).some(key => 
            formData[key] !== originalData[key]
        );
    }, [formData, originalData]);

    // Validate form
    const validateForm = useCallback(async () => {
        const errors = {};
        
        // Check required fields
        updateFields.forEach(field => {
            if (field.required && !formData[field.key]?.trim()) {
                errors[field.key] = `${field.label} là bắt buộc`;
            }
        });
        
        // Check parent_name exists if parent_type is selected
        if (formData.parent_type && formData.parent_name?.trim()) {
            try {
                const exists = await checkParentNameExistsApi(formData.parent_type, formData.parent_name.trim());
                if (!exists) {
                    errors.parent_name = `${formData.parent_name} không tồn tại trong ${getParentTypeLabel(formData.parent_type)}`;
                }
            } catch (err) {
                console.warn('Check parent name error:', err);
                errors.parent_name = 'Không thể kiểm tra tên liên quan';
            }
        }
        
        // If parent_name is provided, parent_type must be selected
        if (formData.parent_name?.trim() && !formData.parent_type) {
            errors.parent_type = 'Phải chọn loại khi có tên liên quan';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData, updateFields]);

    // Get parent type label
    const getParentTypeLabel = useCallback((parentType) => {
        const option = parentTypeOptions.find(opt => opt.value === parentType);
        return option ? option.label : parentType;
    }, [parentTypeOptions]);

    // Update note
    const updateNote = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Check if there are changes
            if (!hasChanges()) {
                setLoading(false);
                return {
                    success: false,
                    error: 'Không có thay đổi nào để lưu'
                };
            }
            
            // Validate form
            const isValid = await validateForm();
            if (!isValid) {
                setLoading(false);
                return false;
            }
            
            // Prepare update data (only changed fields)
            const updateData = {};
            Object.keys(formData).forEach(key => {
                if (key !== 'id' && formData[key] !== originalData[key]) {
                    if (key === 'name' || key === 'description') {
                        updateData[key] = formData[key].trim();
                    } else {
                        updateData[key] = formData[key];
                    }
                }
            });
            
            // If parent info is being updated, include both fields
            if ('parent_type' in updateData || 'parent_name' in updateData) {
                updateData.parent_type = formData.parent_type;
                updateData.parent_name = formData.parent_name?.trim() || '';
            }
            
            const response = await updateNoteApi(formData.id, updateData);
            
            // Update original data to reflect saved state
            setOriginalData({ ...formData });
            
            console.log('Note updated successfully:', response.data.id);
            return {
                success: true,
                noteId: response.data.id,
                noteData: response.data,
                updatedFields: Object.keys(updateData)
            };
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Không thể cập nhật ghi chú';
            setError(errorMessage);
            console.warn('Update note error:', err);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, [formData, originalData, hasChanges, validateForm]);

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

    // Get field label
    const getFieldLabel = useCallback((fieldKey) => {
        const field = updateFields.find(f => f.key === fieldKey);
        return field ? field.label : fieldKey;
    }, [updateFields]);

    // Get field validation error
    const getFieldError = useCallback((fieldKey) => {
        return validationErrors[fieldKey] || null;
    }, [validationErrors]);

    // Check if form is valid for submission
    const isFormValid = useCallback(() => {
        return formData.name?.trim() && Object.keys(validationErrors).length === 0 && hasChanges();
    }, [formData.name, validationErrors, hasChanges]);

    // Initialize on component mount
    useEffect(() => {
        initializeUpdateFields();
    }, [initializeUpdateFields]);

    // Load initial data when provided
    useEffect(() => {
        if (initialNoteData) {
            loadNoteData(initialNoteData);
        }
    }, [initialNoteData, loadNoteData]);

    return {
        // Data
        formData,
        originalData,
        updateFields,
        parentTypeOptions,
        loading,
        error,
        validationErrors,
        
        // Actions
        loadNoteData,
        updateField,
        updateNote,
        resetForm,
        validateForm,
        
        // Helpers
        getFieldValue,
        getFieldLabel,
        getFieldError,
        getParentTypeLabel,
        isFormValid,
        hasChanges
    };
};
