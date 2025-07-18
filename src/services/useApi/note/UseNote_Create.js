import { useCallback, useEffect, useState } from 'react';
import { checkParentNameExistsApi, createNoteApi, getNoteFieldsApi, getNotesLanguageApi } from '../../api/note/NoteApi';

export const useNoteCreate = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    
    // Form fields
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parent_type: '',
        parent_name: ''
    });
    
    // Fields configuration
    const [createFields, setCreateFields] = useState([]);
    const [parentTypeOptions, setParentTypeOptions] = useState([
        { value: '', label: 'Chọn loại' },
        { value: 'Accounts', label: 'Khách hàng' },
        { value: 'Users', label: 'Người dùng' },
        { value: 'Tasks', label: 'Công việc' },
        { value: 'Meetings', label: 'Cuộc họp' }
    ]);

    // Initialize create fields and language
    const initializeCreateFields = useCallback(async () => {
        try {
            // Get all fields for Notes module
            const fieldsResponse = await getNoteFieldsApi();
            const allFields = fieldsResponse.data.attributes;
            
            // Get language data
            const languageResponse = await getNotesLanguageApi();
            const modStrings = languageResponse.data.mod_strings;
            
            // Filter fields for create form (required + commonly used)
            const createFieldNames = ['name', 'description', 'parent_type', 'parent_name'];
            
            const fieldsConfig = createFieldNames.map(fieldName => {
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
            
            setCreateFields(fieldsConfig);
            console.log('Initialized create fields and language for Note');
        } catch (err) {
            console.warn('Initialize create fields error:', err);
            setError('Không thể tải cấu hình tạo ghi chú');
        }
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

    // Validate form
    const validateForm = useCallback(async () => {
        const errors = {};
        
        // Check required fields
        createFields.forEach(field => {
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
    }, [formData, createFields]);

    // Get parent type label
    const getParentTypeLabel = useCallback((parentType) => {
        const option = parentTypeOptions.find(opt => opt.value === parentType);
        return option ? option.label : parentType;
    }, [parentTypeOptions]);

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
            
            // Prepare note data
            const noteData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
            };
            
            // Add parent info if provided
            if (formData.parent_type && formData.parent_name?.trim()) {
                noteData.parent_type = formData.parent_type;
                noteData.parent_name = formData.parent_name.trim();
            }
            
            const response = await createNoteApi(noteData);
            
            return {
                success: true,
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
        setFormData({
            name: '',
            description: '',
            parent_type: '',
            parent_name: ''
        });
        setValidationErrors({});
        setError(null);
    }, []);

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

    // Initialize on component mount
    useEffect(() => {
        initializeCreateFields();
    }, [initializeCreateFields]);

    return {
        // Data
        formData,
        createFields,
        parentTypeOptions,
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
        getParentTypeLabel,
        isFormValid
    };
};
