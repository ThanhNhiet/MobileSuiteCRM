import { useEffect, useState } from 'react';
import ReadCacheView from '../../../utils/cacheViewManagement/ReadCacheView';
import { UserLanguageUtils } from '../../../utils/cacheViewManagement/Users/UserLanguageUtils';
import WriteCacheView from '../../../utils/cacheViewManagement/WriteCacheView';
import { getUserEditFieldsApi, getUserProfileApi, getUsernameApi, updateUserProfileApi } from '../../api/user/UserApi';

export const useUpdateProfile = () => {
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [fieldLabels, setFieldLabels] = useState({});
    const [nameFields, setNameFields] = useState('');
    const [formData, setFormData] = useState({});
    const [profileDetailData, setProfileDetailData] = useState({});

    const userLanguageUtils = UserLanguageUtils.getInstance();

    // Hidden fields
    const hiddenFields = ['status', 'UserType', 'factor_auth', 'employee_status', 'show_on_employees', 'reports_to_name'];
    
    // Required fields
    const requiredFields = ['user_name', 'last_name'];

    // Messenger type options
    const messengerOptions = [
        { label: '---', value: '---' },
        { label: 'Yahho!', value: 'Yahho!' },
        { label: 'AOL', value: 'AOL' },
        { label: 'MSN', value: 'MSN' }
    ];

    // Load or fetch edit fields configuration
    const loadEditFields = async () => {
        try {
            // Try to get edit fields from cache
            let editFields = await ReadCacheView.getModuleField('Users', 'editviewdefs');
            
            if (!editFields) {
                // Fetch from API and cache
                const response = await getUserEditFieldsApi();
                editFields = response;
                
                // Save to cache
                await WriteCacheView.saveModuleField('Users', 'editviewdefs', editFields);
            }

            // Filter out hidden fields
            const visibleFields = Object.keys(editFields).filter(fieldName => 
                !hiddenFields.includes(fieldName)
            );
            
            const nameFieldsString = visibleFields.join(',');
            setNameFields(nameFieldsString);

            // Generate field labels with fallback system - always translate keys to values
            const fieldLabelFallbacks = {
                "user_name": "LBL_USER_NAME",
                "first_name": "LBL_FIRST_NAME", 
                "last_name": "LBL_LAST_NAME",
                "photo": "LBL_PHOTO",
                "title": "LBL_TITLE",
                "phone_work": "LBL_WORK_PHONE",
                "department": "LBL_DEPARTMENT",
                "phone_mobile": "LBL_MOBILE_PHONE",
                "phone_other": "LBL_OTHER_PHONE", 
                "phone_fax": "LBL_FAX_PHONE",
                "phone_home": "LBL_HOME_PHONE",
                "messenger_type": "LBL_MESSENGER_TYPE",
                "messenger_id": "LBL_MESSENGER_ID",
                "address_street": "LBL_ADDRESS_STREET",
                "address_city": "LBL_ADDRESS_CITY",
                "address_state": "LBL_ADDRESS_STATE",
                "address_postalcode": "LBL_POSTAL_CODE",
                "address_country": "LBL_ADDRESS_COUNTRY",
                "description": "LBL_DESCRIPTION"
            };

            const labels = {};
            for (const fieldName of visibleFields) {
                // Try multiple translation strategies
                let translatedLabel = null;
                
                // 1. Try primary LBL_FIELDNAME pattern
                const primaryLblKey = `LBL_${fieldName.toUpperCase()}`;
                const primaryResult = await userLanguageUtils.translate(primaryLblKey, null);
                if (primaryResult && primaryResult !== primaryLblKey) {
                    translatedLabel = primaryResult;
                }
                
                // 2. Try fallback key if primary failed
                if (!translatedLabel) {
                    const fallbackKey = fieldLabelFallbacks[fieldName];
                    if (fallbackKey) {
                        const fallbackResult = await userLanguageUtils.translate(fallbackKey, null);
                        if (fallbackResult && fallbackResult !== fallbackKey) {
                            translatedLabel = fallbackResult;
                        }
                    }
                }
                
                // 3. Try direct field value from API (if it's a translation key)
                if (!translatedLabel) {
                    const fieldValue = editFields[fieldName];
                    if (fieldValue && fieldValue.trim() !== '' && fieldValue.startsWith('LBL_')) {
                        const directResult = await userLanguageUtils.translate(fieldValue, null);
                        if (directResult && directResult !== fieldValue) {
                            translatedLabel = directResult;
                        }
                    }
                }
                
                // 4. Final fallback - use formatted field name
                if (!translatedLabel) {
                    translatedLabel = fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
                
                labels[fieldName] = translatedLabel;
            }
            
            setFieldLabels(labels);
            return nameFieldsString;
        } catch (error) {
            console.warn('Error loading edit fields:', error);
            
            // Fallback to default fields (excluding hidden ones)
            const defaultFields = 'user_name,first_name,last_name,photo,title,phone_work,department,phone_mobile,phone_other,phone_fax,phone_home,messenger_type,messenger_id,address_street,address_city,address_state,address_postalcode,address_country,description';
            setNameFields(defaultFields);
            
            // Generate fallback field labels
            const fieldLabelFallbacks = {
                "user_name": "LBL_USER_NAME",
                "first_name": "LBL_FIRST_NAME",
                "last_name": "LBL_LAST_NAME",
                "photo": "LBL_PHOTO",
                "title": "LBL_TITLE",
                "phone_work": "LBL_WORK_PHONE",
                "department": "LBL_DEPARTMENT",
                "phone_mobile": "LBL_MOBILE_PHONE",
                "phone_other": "LBL_OTHER_PHONE",
                "phone_fax": "LBL_FAX_PHONE",
                "phone_home": "LBL_HOME_PHONE",
                "messenger_type": "LBL_MESSENGER_TYPE",
                "messenger_id": "LBL_MESSENGER_ID",
                "address_street": "LBL_ADDRESS_STREET",
                "address_city": "LBL_ADDRESS_CITY",
                "address_state": "LBL_ADDRESS_STATE",
                "address_postalcode": "LBL_POSTAL_CODE",
                "address_country": "LBL_ADDRESS_COUNTRY",
                "description": "LBL_DESCRIPTION"
            };

            const fallbackLabels = {};
            const fallbackFieldNames = defaultFields.split(',');
            for (const fieldName of fallbackFieldNames) {
                let translatedLabel = null;
                
                const primaryLblKey = `LBL_${fieldName.toUpperCase()}`;
                translatedLabel = await userLanguageUtils.translate(primaryLblKey, null);
                
                if (!translatedLabel) {
                    const fallbackKey = fieldLabelFallbacks[fieldName];
                    if (fallbackKey) {
                        translatedLabel = await userLanguageUtils.translate(fallbackKey, null);
                    }
                }
                
                if (!translatedLabel) {
                    translatedLabel = await userLanguageUtils.translateFieldName(fieldName);
                }
                
                fallbackLabels[fieldName] = translatedLabel;
            }
            setFieldLabels(fallbackLabels);
            
            return defaultFields;
        }
    };

    // Fetch profile data using the fields from edit fields configuration
    const fetchProfileData = async (nameFieldsString) => {
        try {
            // Use getUserProfileApi to get the actual data for the fields
            const response = await getUserProfileApi(nameFieldsString);
            const profileData = response?.data?.attributes || {};
            
            // Also fetch username since getUserProfileApi never returns user_name
            const usernameResponse = await getUsernameApi();
            const usernameData = usernameResponse || {};
            
            // Merge profile data with username data
            const completeProfileData = {
                ...profileData,
                ...usernameData
            };
            
            setProfileDetailData(completeProfileData);
            return completeProfileData;
        } catch (error) {
            console.warn('Error fetching profile data:', error);
            return {};
        }
    };

    // Initialize form data from profile data
    const initializeFormData = (profileData) => {
        // Use profile detail data if available, otherwise use passed profileData
        const dataToUse = Object.keys(profileDetailData).length > 0 ? profileDetailData : profileData;
        const initialData = {};
        const fieldNames = nameFields.split(',');
        
        for (const fieldName of fieldNames) {
            initialData[fieldName] = dataToUse[fieldName] || '';
        }
        
        setFormData(initialData);
    };

    // Update form field
    const updateField = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    // Validate form
    const validateForm = async () => {
        const errors = [];
        
        for (const fieldName of requiredFields) {
            if (!formData[fieldName] || formData[fieldName].trim() === '') {
                const fieldLabel = fieldLabels[fieldName] || fieldName;
                const translatedLabel = await userLanguageUtils.translateFieldName('ERR_MISSING_REQUIRED_FIELDS');
                errors.push(`${translatedLabel}: ${fieldLabel}`);
            }
        }
        
        return errors;
    };

    // Update profile
    const updateProfile = async () => {
        try {
            setUpdating(true);
            setError(null);
            setSuccess(false);

            // Validate form
            const validationErrors = await validateForm();
            if (validationErrors.length > 0) {
                setError(validationErrors.join('\n'));
                return false;
            }

            // Prepare update data (exclude photo from regular update)
            const updateData = {};
            for (const [fieldName, value] of Object.entries(formData)) {
                if (fieldName !== 'photo') {
                    updateData[fieldName] = value?.toString().trim() || '';
                }
            }

            const response = await updateUserProfileApi(updateData);
            setSuccess(true);
            
            // Auto clear success message after 3 seconds
            setTimeout(() => {
                setSuccess(false);
            }, 3000);

            return response;
        } catch (err) {
            setError(err.message || 'Không thể cập nhật thông tin');
            throw err;
        } finally {
            setUpdating(false);
        }
    };

    // Reset state
    const resetState = () => {
        setError(null);
        setSuccess(false);
        setUpdating(false);
    };

    // Clear error
    const clearError = () => {
        setError(null);
    };

    // Load fields on mount
    useEffect(() => {
        const loadFields = async () => {
            try {
                setLoading(true);
                const nameFieldsString = await loadEditFields();
                // After loading edit fields, fetch the actual profile data
                await fetchProfileData(nameFieldsString);
            } catch (err) {
            } finally {
                setLoading(false);
            }
        };
        
        loadFields();
    }, []);

    return {
        updating,
        error,
        success,
        loading,
        fieldLabels,
        nameFields,
        formData,
        profileDetailData,
        requiredFields,
        messengerOptions,
        updateProfile,
        resetState,
        clearError,
        initializeFormData,
        updateField,
        validateForm,
        fetchProfileData
    };
};
