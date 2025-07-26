import { useCallback, useEffect, useState } from 'react';
import { createNoteApi, createNoteParentRelationApi, getNoteFieldsApi, getNotesLanguageApi } from '../../api/note/NoteApi';

export const useNoteCreate = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    
    // Form fields
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parent_type: '',
        parentid: ''
    });
    
    // Fields configuration
    const [createFields, setCreateFields] = useState([]);

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
            const createFieldNames = ['name', 'description', 'parent_type', 'parent_id'];
            
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
            // console.log('Initialized create fields and language for Note');
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
        
        // If parentid is provided, parent_type must be selected
        if (formData.parentid?.trim() && !formData.parent_type) {
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
            
            // Prepare note data (only basic fields)
            const noteData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
            };
            
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
            if (formData.parent_type && formData.parentid?.trim()) {
                console.log('Creating relationship:', formData.parent_type, formData.parentid.trim(), noteId);
                await createNoteParentRelationApi(formData.parent_type, formData.parentid.trim(), noteId);
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
        setFormData({
            name: '',
            description: '',
            parent_type: '',
            parentid: ''
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
        isFormValid
    };
};
