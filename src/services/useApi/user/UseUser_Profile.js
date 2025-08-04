import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';
import { cacheManager } from '../../../utils/CacheManager';
import ReadCacheView from '../../../utils/cacheViewManagement/ReadCacheView';
import { UserLanguageUtils } from '../../../utils/cacheViewManagement/Users/UserLanguageUtils';
import WriteCacheView from '../../../utils/cacheViewManagement/WriteCacheView';
import {
    getLanguageApi,
    getSystemLanguageApi,
    getUserDetailFieldsApi,
    getUserProfileApi
} from '../../api/user/UserApi';

export const useUserProfile = () => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [fieldLabels, setFieldLabels] = useState({});
    const [nameFields, setNameFields] = useState('');

    const userLanguageUtils = UserLanguageUtils.getInstance();

    // Load or fetch detail fields configuration
    const loadDetailFields = async () => {
        try {
            // Try to get detail fields from cache
            let detailFields = await ReadCacheView.getModuleField('Users', 'detailviewdefs');
            
            if (!detailFields) {
                // Fetch from API and cache
                const response = await getUserDetailFieldsApi();
                detailFields = response;
                
                // Save to cache
                await WriteCacheView.saveModuleField('Users', 'detailviewdefs', detailFields);
            }

            // Extract field names for API request
            const fieldNames = Object.keys(detailFields);
            const nameFieldsString = fieldNames.join(',');
            setNameFields(nameFieldsString);

            // Generate field labels with fallback system
            const fieldLabelFallbacks = {
                "full_name": "LBL_NAME",
                "phone_work": "LBL_WORK_PHONE",
                "phone_mobile": "LBL_MOBILE_PHONE", 
                "phone_other": "LBL_OTHER_PHONE",
                "phone_fax": "LBL_FAX_PHONE",
                "phone_home": "LBL_HOME_PHONE",
                "user_name": "LBL_USER_NAME",
                "status": "LBL_STATUS",
                "title": "LBL_TITLE",
                "department": "LBL_DEPARTMENT",
                "reports_to_name": "LBL_REPORTS_TO_NAME",
                "photo": "LBL_PHOTO",
                "employee_status": "LBL_EMPLOYEE_STATUS",
                "show_on_employees": "LBL_SHOW_ON_EMPLOYEES",
                "messenger_type": "LBL_MESSENGER_TYPE",
                "messenger_id": "LBL_MESSENGER_ID",
                "address_street": "LBL_ADDRESS_STREET",
                "address_city": "LBL_ADDRESS_CITY",
                "address_state": "LBL_ADDRESS_STATE", 
                "address_country": "LBL_ADDRESS_COUNTRY",
                "address_postalcode": "LBL_POSTAL_CODE"
            };

            const labels = {};
            for (const fieldName of fieldNames) {
                const fieldValue = detailFields[fieldName];
                
                if (fieldValue && fieldValue.trim() !== '') {
                    // Field has value, translate directly
                    labels[fieldName] = await userLanguageUtils.translate(fieldValue, fieldValue);
                } else {
                    // Field empty, use fallback priority: LBL_FIELDNAME → fallback → formatFieldName
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
            console.warn('Error loading detail fields:', error);
            // Fallback to default fields
            const defaultFields = 'full_name,user_name,status,UserType,photo,employee_status,show_on_employees,title,phone_work,department,phone_mobile,reports_to_name,phone_other,phone_fax,phone_home,messenger_type,messenger_id,address_street,address_city,address_state,address_postalcode,address_country,description';
            setNameFields(defaultFields);
            
            // Generate fallback field labels
            const fieldLabelFallbacks = {
                "full_name": "LBL_NAME",
                "phone_work": "LBL_WORK_PHONE",
                "phone_mobile": "LBL_MOBILE_PHONE", 
                "phone_other": "LBL_OTHER_PHONE",
                "phone_fax": "LBL_FAX_PHONE",
                "phone_home": "LBL_HOME_PHONE",
                "user_name": "LBL_USER_NAME",
                "status": "LBL_STATUS",
                "title": "LBL_TITLE",
                "department": "LBL_DEPARTMENT",
                "reports_to_name": "LBL_REPORTS_TO_NAME",
                "photo": "LBL_PHOTO",
                "employee_status": "LBL_EMPLOYEE_STATUS",
                "show_on_employees": "LBL_SHOW_ON_EMPLOYEES",
                "messenger_type": "LBL_MESSENGER_TYPE",
                "messenger_id": "LBL_MESSENGER_ID",
                "address_street": "LBL_ADDRESS_STREET",
                "address_city": "LBL_ADDRESS_CITY",
                "address_state": "LBL_ADDRESS_STATE", 
                "address_country": "LBL_ADDRESS_COUNTRY",
                "address_postalcode": "LBL_POSTAL_CODE"
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

    // Function to refresh language cache
    const refreshLanguageCache = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
            const modules = ['Accounts', 'Meetings', 'Notes', 'Tasks', 'Users', 'Calendar'];
            
            // Delete all language cache files
            for (const module of modules) {
                const languageDir = `${FileSystem.documentDirectory}cache/${module}/language/`;
                const languageFilePath = `${languageDir}${savedLanguage}.json`;
                
                try {
                    const fileInfo = await FileSystem.getInfoAsync(languageFilePath);
                    if (fileInfo.exists) {
                        await FileSystem.deleteAsync(languageFilePath);
                        console.log(`Deleted language cache: ${languageFilePath}`);
                    }
                } catch (error) {
                    console.warn(`Error deleting language cache for ${module}:`, error);
                }
            }
            
            // Delete system language cache
            const systemLanguageDir = `${FileSystem.documentDirectory}cache/system/language/`;
            const systemLanguageFilePath = `${systemLanguageDir}${savedLanguage}.json`;
            
            try {
                const fileInfo = await FileSystem.getInfoAsync(systemLanguageFilePath);
                if (fileInfo.exists) {
                    await FileSystem.deleteAsync(systemLanguageFilePath);
                    console.log(`Deleted system language cache: ${systemLanguageFilePath}`);
                }
            } catch (error) {
                console.warn('Error deleting system language cache:', error);
            }
            
            // Fetch and save new language data
            try {
                // Fetch and cache system language
                const systemLangData = await getSystemLanguageApi(savedLanguage);
                await cacheManager.saveSystemLanguage(savedLanguage, systemLangData);
                console.log(`Refreshed system language: ${savedLanguage}`);
            } catch (error) {
                console.warn('Error refreshing system language:', error);
            }
            
            // Fetch and cache language for each module
            for (const module of modules) {
                try {
                    const languageData = await getLanguageApi(module, savedLanguage);
                    await cacheManager.saveModuleLanguage(module, savedLanguage, languageData);
                    console.log(`Refreshed language for module: ${module} (${savedLanguage})`);
                } catch (error) {
                    console.warn(`Error refreshing language for module ${module}:`, error);
                }
            }
            
            return true;
        } catch (error) {
            console.warn('Error refreshing language cache:', error);
            throw error;
        }
    };

    // Function to refresh field metadata cache
    const refreshFieldsCache = async () => {
        try {
            const modules = ['Accounts', 'Meetings', 'Notes', 'Tasks', 'Users', 'Calendar'];
            
            // Delete all field metadata cache files
            for (const module of modules) {
                const metadataDir = `${FileSystem.documentDirectory}cache/${module}/metadata/`;
                const fieldFiles = ['listviewdefs.json', 'detailviewdefs.json', 'editviewdefs.json', 'requiredfields.json'];
                
                for (const fileName of fieldFiles) {
                    const filePath = `${metadataDir}${fileName}`;
                    try {
                        const fileInfo = await FileSystem.getInfoAsync(filePath);
                        if (fileInfo.exists) {
                            await FileSystem.deleteAsync(filePath);
                            console.log(`Deleted field cache: ${filePath}`);
                        }
                    } catch (error) {
                        console.warn(`Error deleting field cache ${filePath}:`, error);
                    }
                }
            }
            
            console.log('Field metadata cache cleared successfully. Cache will be refreshed automatically when navigating to modules.');
            return true;
        } catch (error) {
            console.warn('Error refreshing fields cache:', error);
            throw error;
        }
    };

    // Function to fetch profile data
    const fetchProfile = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Load detail fields first
            const fieldsString = await loadDetailFields();

            // Then fetch profile data with the fields
            const response = await getUserProfileApi(fieldsString);
            setProfileData(response.data);
        } catch (err) {
            setError(err.message || 'Unable to load user information');
            console.warn('Fetch profile error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Function to refresh profile data
    const refreshProfile = () => {
        fetchProfile(true);
    };

    // Load profile data on component mount
    useEffect(() => {
        fetchProfile();
    }, []);

    return {
        profileData,
        loading,
        error,
        refreshing,
        refreshProfile,
        fetchProfile,
        fieldLabels,
        nameFields,
        refreshLanguageCache,
        refreshFieldsCache
    };
};
