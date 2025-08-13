import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { cacheManager } from '../../../utils/cacheViewManagement/CacheManager';
import ReadCacheView from '../../../utils/cacheViewManagement/ReadCacheView';
import { SystemLanguageUtils } from '../../../utils/cacheViewManagement/SystemLanguageUtils';
import WriteCacheView from '../../../utils/cacheViewManagement/WriteCacheView';
import { deleteModuleRecordApi, getModuleDetailApi, getModuleDetailFieldsApi, getParentId_typeByModuleIdApi } from '../../api/module/ModuleApi';

export const useModule_Detail = (moduleName, recordId) => {
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [relationships, setRelationships] = useState([]);
    
    // SystemLanguageUtils instance
    const systemLanguageUtils = SystemLanguageUtils.getInstance();
    
    // Fields and labels
    const [detailFields, setDetailFields] = useState([]);
    const [nameFields, setNameFields] = useState('');

    // Initialize fields and language for detail view
    const initializeDetailFields = useCallback(async () => {
        try {
            let fieldsData;
            const cachedFields = await ReadCacheView.getModuleField(moduleName, 'detailviewdefs');
            
            if (!cachedFields) {
                const fieldsResponse = await getModuleDetailFieldsApi(moduleName);
                fieldsData = fieldsResponse;
                
                await WriteCacheView.saveModuleField(moduleName, 'detailviewdefs', fieldsData);
            } else {
                fieldsData = cachedFields;
            }

            // Get selected language
            const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
            let languageData = await cacheManager.getModuleLanguage(moduleName, selectedLanguage);

            // If languageData is not found
            if (!languageData) {
                const languageExists = await cacheManager.checkModuleLanguageExists(moduleName, selectedLanguage);
                if (!languageExists) {
                    // Language cache missing - user needs to login to fetch data
                }
            }
            
            let modStrings = null;
            let appStrings = null;
            if (languageData && languageData.data) {
                modStrings = languageData.data.mod_strings;
                appStrings = languageData.data.app_strings;
            }
            
            const findTranslation = (key) => {
                if (modStrings && modStrings[key]) {
                    return modStrings[key];
                }
                if (appStrings && appStrings[key]) {
                    return appStrings[key];
                }
                return null;
            };
            
            if (!fieldsData || typeof fieldsData !== 'object' || Object.keys(fieldsData).length === 0) {
                fieldsData = getDefaultFieldsForModule(moduleName);
            }
            
            const fieldKeys = Object.keys(fieldsData);
            const nameFieldsString = fieldKeys.join(',');
            setNameFields(nameFieldsString);
            
            const detailFieldsData = Object.entries(fieldsData).map(([fieldKey, labelValue]) => {
                let vietnameseLabel = labelValue || fieldKey;
                
                if ((modStrings || appStrings) && labelValue && typeof labelValue === 'string' && labelValue.trim() !== '') {
                    const translation = findTranslation(labelValue);
                    if (translation) {
                        vietnameseLabel = translation;
                    }
                }
                
                return {
                    key: fieldKey,
                    label: vietnameseLabel,
                    type: 'text',
                    required: false
                };
            });
            
            const idLabel = findTranslation('LBL_ID') || 'ID';
            detailFieldsData.unshift({
                key: 'id',
                label: idLabel,
                type: 'text',
                required: false
            });
            
            setDetailFields(detailFieldsData);
            
        } catch (err) {
            console.warn('Initialize detail fields error:', err);
            const errorMsg = await systemLanguageUtils.translate('ERR_AJAX_LOAD_FAILURE') || 'Không thể tải cấu hình chi tiết';
            setError(errorMsg);
        }
    }, [moduleName]);

    // Get default fields for different modules
    const getDefaultFieldsForModule = (module) => {
        const defaultFields = {
            'Notes': {
                "name": "LBL_NOTE_SUBJECT",
                "parent_name": "LBL_RELATED_TO", 
                "date_entered": "LBL_DATE_ENTERED",
                "date_modified": "LBL_DATE_MODIFIED",
                "created_by_name": "LBL_CREATED_BY",
                "modified_by_name": "LBL_MODIFIED_BY",
                "assigned_user_name": "LBL_LIST_ASSIGNED_TO_NAME",
                "description": "LBL_DESCRIPTION"
            },
            'Tasks': {
                "name": "LBL_SUBJECT",
                "status": "LBL_STATUS",
                "priority": "LBL_PRIORITY",
                "date_due": "LBL_DUE_DATE",
                "date_entered": "LBL_DATE_ENTERED",
                "date_modified": "LBL_DATE_MODIFIED",
                "created_by_name": "LBL_CREATED_BY",
                "assigned_user_name": "LBL_LIST_ASSIGNED_TO_NAME",
                "description": "LBL_DESCRIPTION"
            },
            'Meetings': {
                "name": "LBL_SUBJECT",
                "status": "LBL_STATUS",
                "date_start": "LBL_DATE_TIME",
                "duration_hours": "LBL_DURATION",
                "location": "LBL_LOCATION",
                "date_entered": "LBL_DATE_ENTERED",
                "created_by_name": "LBL_CREATED_BY",
                "assigned_user_name": "LBL_LIST_ASSIGNED_TO_NAME",
                "description": "LBL_DESCRIPTION"
            },
            'Accounts': {
                "name": "LBL_NAME",
                "account_type": "LBL_TYPE",
                "industry": "LBL_INDUSTRY",
                "phone_office": "LBL_PHONE_OFFICE",
                "email1": "LBL_EMAIL_ADDRESS",
                "billing_address_city": "LBL_CITY",
                "date_entered": "LBL_DATE_ENTERED",
                "assigned_user_name": "LBL_LIST_ASSIGNED_TO_NAME",
                "description": "LBL_DESCRIPTION"
            },
            'Contacts': {
                "first_name": "LBL_FIRST_NAME",
                "last_name": "LBL_LAST_NAME",
                "title": "LBL_TITLE",
                "phone_work": "LBL_OFFICE_PHONE",
                "email1": "LBL_EMAIL_ADDRESS",
                "account_name": "LBL_ACCOUNT_NAME",
                "date_entered": "LBL_DATE_ENTERED",
                "assigned_user_name": "LBL_LIST_ASSIGNED_TO_NAME"
            },
            'Opportunities': {
                "name": "LBL_OPPORTUNITY_NAME",
                "account_name": "LBL_ACCOUNT_NAME",
                "sales_stage": "LBL_SALES_STAGE",
                "amount": "LBL_AMOUNT",
                "date_closed": "LBL_DATE_CLOSED",
                "probability": "LBL_PROBABILITY",
                "date_entered": "LBL_DATE_ENTERED",
                "assigned_user_name": "LBL_LIST_ASSIGNED_TO_NAME",
                "description": "LBL_DESCRIPTION"
            },
            'Leads': {
                "first_name": "LBL_FIRST_NAME",
                "last_name": "LBL_LAST_NAME",
                "title": "LBL_TITLE",
                "account_name": "LBL_ACCOUNT_NAME",
                "phone_work": "LBL_OFFICE_PHONE",
                "email1": "LBL_EMAIL_ADDRESS",
                "status": "LBL_STATUS",
                "date_entered": "LBL_DATE_ENTERED",
                "assigned_user_name": "LBL_LIST_ASSIGNED_TO_NAME"
            },
            'Cases': {
                "name": "LBL_SUBJECT",
                "case_number": "LBL_CASE_NUMBER",
                "account_name": "LBL_ACCOUNT_NAME",
                "status": "LBL_STATUS",
                "priority": "LBL_PRIORITY",
                "date_entered": "LBL_DATE_ENTERED",
                "assigned_user_name": "LBL_LIST_ASSIGNED_TO_NAME",
                "description": "LBL_DESCRIPTION"
            }
        };

        return defaultFields[module] || {
            "name": "LBL_NAME",
            "date_entered": "LBL_DATE_ENTERED",
            "date_modified": "LBL_DATE_MODIFIED",
            "created_by_name": "LBL_CREATED_BY",
            "assigned_user_name": "LBL_LIST_ASSIGNED_TO_NAME",
            "description": "LBL_DESCRIPTION"
        };
    };

    // Process relationships
    const processRelationships = (relationshipsData) => {
        if (!relationshipsData || typeof relationshipsData !== 'object') {
            return [];
        }

        const processedRelationships = [];
        
        // Map relationship data to display format
        Object.keys(relationshipsData).forEach((relationshipKey, index) => {
            const relationshipInfo = relationshipsData[relationshipKey];
            
            if (relationshipInfo && relationshipInfo.links && relationshipInfo.links.related) {
                processedRelationships.push({
                    id: `relationship_${index}`,
                    moduleName: relationshipKey,
                    displayName: relationshipKey,
                    moduleLabel: getModuleDisplayName(relationshipKey),
                    relatedLink: relationshipInfo.links.related,
                    count: 0 // Will be populated by RelationshipsData
                });
            }
        });

        return processedRelationships;
    };

    // Get display name for module - VIETNAMESE LABELS
    const getModuleDisplayName = (moduleName) => {
        const moduleLabels = {
            'Tasks': 'Nhiệm vụ',
            'Meetings': 'Cuộc họp', 
            'Notes': 'Ghi chú',
            'Contacts': 'Liên hệ',
            'Accounts': 'Khách hàng',
            'Opportunities': 'Cơ hội',
            'Leads': 'Tiềm năng',
            'Cases': 'Vụ việc',
            'Bugs': 'Lỗi',
            'Calls': 'Cuộc gọi',
            'Emails': 'Email',
            'Documents': 'Tài liệu',
            'Campaigns': 'Chiến dịch',
            'Project': 'Dự án',
            'AOS_Quotes': 'Báo giá',
            'AOS_Invoices': 'Hóa đơn',
            'AOS_Contracts': 'Hợp đồng',
            'ProspectLists': 'Danh sách tiềm năng',
            'Users': 'Người dùng',
            'SecurityGroups': 'Nhóm bảo mật',
            'EmailAddress': 'Địa chỉ Email',
            'CampaignLog': 'Lịch sử chiến dịch'
        };
        return moduleLabels[moduleName] || moduleName;
    };

    // Fetch record detail
    const fetchRecord = useCallback(async (isRefresh = false) => {
        if (!recordId || !nameFields || !moduleName) return;
        
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Get record detail with relationships
            const response = await getModuleDetailApi(moduleName, recordId, nameFields);

            //Get parent_id and parent_type
            const parentInfo = await getParentId_typeByModuleIdApi(moduleName, recordId);

            // Process record data
            const recordData = {
                id: response.data.id,
                type: response.data.type,
                parent_id: parentInfo.parent_id || null,
                parent_type: parentInfo.parent_type || null,
                ...response.data.attributes
            };
            
            setRecord(recordData);

            // Process relationships from response
            if (response.data.relationships) {
                const processedRelationships = processRelationships(response.data.relationships);
                setRelationships(processedRelationships);
            } else {
                setRelationships([]);
            }
            
        } catch (err) {
            const fallbackError = await systemLanguageUtils.translate('ERR_AJAX_LOAD_FAILURE') || 'Không thể tải chi tiết bản ghi';
            const errorMessage = err.response?.data?.message || err.message || fallbackError;
            setError(errorMessage);
            console.warn('Fetch record detail error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [recordId, nameFields, moduleName]);

    // Delete record
    const deleteRecord = useCallback(async () => {
        if (!recordId || !moduleName) return false;
        
        try {
            setDeleting(true);
            setError(null);
            
            await deleteModuleRecordApi(moduleName, recordId);
            
            return true;
        } catch (err) {
            const fallbackError = await systemLanguageUtils.translate('ERR_AJAX_LOAD_FAILURE') || 'Không thể xóa bản ghi';
            const errorMessage = err.response?.data?.message || err.message || fallbackError;
            setError(errorMessage);
            console.warn('Delete record error:', err);
            return false;
        } finally {
            setDeleting(false);
        }
    }, [recordId, moduleName]);

    // Refresh function
    const refreshRecord = useCallback(() => {
        fetchRecord(true);
    }, [fetchRecord]);

    // Get field value for display
    const getFieldValue = useCallback((fieldKey) => {
        if (!record) return '';
        return record[fieldKey] || '';
    }, [record]);

    // Get field label
    const getFieldLabel = useCallback((fieldKey) => {
        const field = detailFields.find(f => f.key === fieldKey);
        return field ? field.label : fieldKey;
    }, [detailFields]);

    // Check if field should be displayed
    const shouldDisplayField = useCallback((fieldKey) => {
        const value = getFieldValue(fieldKey);
        
        // Hide certain system fields
        const hiddenFields = [
            'id_c', 'deleted', 'SecurityGroups', 
            'created_by_link', 'modified_user_link', 'assigned_user_link'
        ];
        
        if (hiddenFields.includes(fieldKey)) return false;
        
        // Hide empty fields except for required ones
        const field = detailFields.find(f => f.key === fieldKey);
        return value || (field && field.required);
    }, [getFieldValue, detailFields]);

    // Initialize on component mount
    useEffect(() => {
        if (moduleName) {
            initializeDetailFields();
        }
    }, [initializeDetailFields, moduleName]);

    // Fetch record when fields are ready
    useEffect(() => {
        if (nameFields && recordId && moduleName) {
            fetchRecord(false);
        }
    }, [nameFields, recordId, moduleName, fetchRecord]);

    return {
        // Data
        record,
        detailFields,
        relationships,
        loading,
        refreshing,
        error,
        deleting,
        
        // Actions
        fetchRecord,
        refreshRecord,
        deleteRecord,
        
        // Helpers
        getFieldValue,
        getFieldLabel,
        shouldDisplayField
    };
};
