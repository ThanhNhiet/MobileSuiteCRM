import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';
import { UserLanguageUtils } from '../../../utils/cacheViewManagement/Users/UserLanguageUtils';
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
        { label: 'Không chọn', value: '' },
        { label: 'Yahho!', value: 'Yahho!' },
        { label: 'AOL', value: 'AOL' },
        { label: 'MSN', value: 'MSN' }
    ];

    // Load or fetch edit fields configuration
    const loadEditFields = async () => {
        try {
            const editFieldsPath = `${FileSystem.documentDirectory}cache/Users/metadata/editviewdefs.json`;
            const fileInfo = await FileSystem.getInfoAsync(editFieldsPath);
            
            let editFields;
            if (!fileInfo.exists) {
                // Fetch from API and cache
                const response = await getUserEditFieldsApi();
                editFields = response;
                
                const dirPath = `${FileSystem.documentDirectory}cache/Users/metadata/`;
                const dirInfo = await FileSystem.getInfoAsync(dirPath);
                if (!dirInfo.exists) {
                    await FileSystem.makeDirectoryAsync(dirPath, { intermediateDirectories: true });
                }
                
                await FileSystem.writeAsStringAsync(editFieldsPath, JSON.stringify(editFields));
            } else {
                // Read from cache
                const fileContent = await FileSystem.readAsStringAsync(editFieldsPath);
                editFields = JSON.parse(fileContent);
            }

            // Filter out hidden fields
            const visibleFields = Object.keys(editFields).filter(fieldName => 
                !hiddenFields.includes(fieldName)
            );
            
            const nameFieldsString = visibleFields.join(',');
            setNameFields(nameFieldsString);

            // Generate field labels with fallback system
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
                const fieldValue = editFields[fieldName];
                
                if (fieldValue && fieldValue.trim() !== '') {
                    // Field has value, translate directly
                    labels[fieldName] = await userLanguageUtils.translate(fieldValue, fieldValue);
                } else {
                    // Field empty, use fallback priority
                    let translatedLabel = null;
                    
                    const primaryLblKey = `LBL_${fieldName.toUpperCase()}`;
                    const primaryResult = await userLanguageUtils.translate(primaryLblKey, null);
                    
                    if (primaryResult && primaryResult !== primaryLblKey) {
                        translatedLabel = primaryResult;
                    }
                    
                    if (!translatedLabel) {
                        const fallbackKey = fieldLabelFallbacks[fieldName];
                        if (fallbackKey) {
                            const fallbackResult = await userLanguageUtils.translate(fallbackKey, null);
                            if (fallbackResult && fallbackResult !== fallbackKey) {
                                translatedLabel = fallbackResult;
                            }
                        }
                    }
                    
                    if (!translatedLabel) {
                        translatedLabel = await userLanguageUtils.translateFieldName(fieldName);
                    }
                    
                    labels[fieldName] = translatedLabel;
                }
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
