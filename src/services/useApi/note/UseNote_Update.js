import { useCallback, useEffect, useState } from 'react';
import { createNoteParentRelationApi, deleteNoteParentRelationApi, getNoteFieldsApi, getNotesLanguageApi, updateNoteApi } from '../../api/note/NoteApi';

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
        parentid: ''
    });
    
    // Track original data for comparison
    const [originalData, setOriginalData] = useState({});
    
    // Fields configuration
    const [updateFields, setUpdateFields] = useState([]);

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
            const updateFieldNames = ['name', 'description', 'parent_type', 'parent_id'];
            
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
            // console.log('Initialized update fields and language for Note');
        } catch (err) {
            console.warn('Initialize update fields error:', err);
            setError('Không thể tải cấu hình cập nhật ghi chú');
        }
    }, []);

    // Load note data into form
    const loadNoteData = useCallback((noteData) => {
        console.log('Loading note data into update form:', noteData);
        if (!noteData) return;
        
        const formValues = {
            id: noteData.id || '',
            name: noteData.name || '',
            description: noteData.description || '',
            parent_type: noteData.parent_type || '',
            parentid: noteData.parent_id || ''
        };
        
        setFormData(formValues);
        setOriginalData(formValues);
        setValidationErrors({});
        setError(null);
        
        // console.log('Loaded note data into update form:', noteData.name);
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
        
        // If parentid is provided, parent_type must be selected
        if (formData.parentid?.trim() && !formData.parent_type) {
            errors.parent_type = 'Phải chọn loại khi có ID liên quan';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData, updateFields]);

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
            
            // Prepare basic update data (only name and description)
            const updateData = {};
            ['name', 'description'].forEach(key => {
                if (formData[key] !== originalData[key]) {
                    updateData[key] = formData[key].trim();
                }
            });
            
            // Update basic note data if there are changes
            if (Object.keys(updateData).length > 0) {
                await updateNoteApi(formData.id, updateData);
            }
            
            // Handle parent relationship changes
            const oldParentType = originalData.parent_type;
            const oldParentId = originalData.parentid;
            const newParentType = formData.parent_type;
            const newParentId = formData.parentid?.trim();
            
            // If parent relationship has changed
            if (oldParentType !== newParentType || oldParentId !== newParentId) {
                // Delete old relationship if it exists
                if (oldParentType && oldParentId) {
                    try {
                        await deleteNoteParentRelationApi(oldParentType, oldParentId, formData.id);
                    } catch (err) {
                        console.warn('Delete old parent relation error:', err);
                        // Continue execution even if delete fails
                    }
                }
                
                // Create new relationship if specified
                if (newParentType && newParentId) {
                    await createNoteParentRelationApi(newParentType, newParentId, formData.id);
                }
            }
            
            // Update original data to reflect saved state
            setOriginalData({ ...formData });
            
            return {
                success: true,
                noteId: formData.id,
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
        isFormValid,
        hasChanges
    };
};
