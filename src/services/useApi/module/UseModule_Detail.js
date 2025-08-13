import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { cacheManager } from '../../../utils/cacheViewManagement/CacheManager';
import ReadCacheView from '../../../utils/cacheViewManagement/ReadCacheView';
import { SystemLanguageUtils } from '../../../utils/cacheViewManagement/SystemLanguageUtils';
import WriteCacheView from '../../../utils/cacheViewManagement/WriteCacheView';
import { deleteModuleRecordApi, getModuleDetailApi, getModuleDetailFieldsApi } from '../../api/module/ModuleApi';

export const useModule_Detail = (moduleName, recordId) => {
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [relationships, setRelationships] = useState([]);
    
    // SystemLanguageUtils instance
    const systemLanguageUtils = SystemLanguageUtils.getInstance();
    
    // Fields and labels - GIỐNG UseNote_Detail
    const [detailFields, setDetailFields] = useState([]);
    const [nameFields, setNameFields] = useState('');

    // Initialize fields and language for detail view - LOGIC GIỐNG UseNote_Detail
    const initializeDetailFields = useCallback(async () => {
        try {
            // 1. Kiểm tra cache detailviewdefs.json có tồn tại không
            let fieldsData;
            const cachedFields = await ReadCacheView.getModuleField(moduleName, 'detailviewdefs');
            
            if (!cachedFields) {
                // Nếu chưa có cache, fetch từ API
                const fieldsResponse = await getModuleDetailFieldsApi(moduleName);
                fieldsData = fieldsResponse;
                
                // Lưu vào cache
                await WriteCacheView.saveModuleField(moduleName, 'detailviewdefs', fieldsData);
            } else {
                // Nếu có cache, sử dụng cache
                fieldsData = cachedFields;
            }
            
            // 2. Lấy ngôn ngữ hiện tại
            const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
            let languageData = await cacheManager.getModuleLanguage(moduleName, selectedLanguage);
            
            // Nếu không có language data, thử fetch lại
            if (!languageData) {
                const languageExists = await cacheManager.checkModuleLanguageExists(moduleName, selectedLanguage);
                if (!languageExists) {
                    // Language cache missing - user needs to login to fetch data
                }
            }
            
            // Lấy mod_strings và app_strings từ cấu trúc language data
            let modStrings = null;
            let appStrings = null;
            if (languageData && languageData.data) {
                modStrings = languageData.data.mod_strings;
                appStrings = languageData.data.app_strings;
            }
            
            // Helper function để tìm translation với fallback pattern
            const findTranslation = (key) => {
                if (modStrings && modStrings[key]) {
                    return modStrings[key];
                }
                if (appStrings && appStrings[key]) {
                    return appStrings[key];
                }
                return null;
            };
            
            // Kiểm tra fieldsData có hợp lệ không
            if (!fieldsData || typeof fieldsData !== 'object' || Object.keys(fieldsData).length === 0) {
                // Using default fields structure với key có trong language file
                // GENERIC DEFAULT FIELDS cho nhiều module
                fieldsData = getDefaultFieldsForModule(moduleName);
            }
            
            // 3. Tạo nameFields string từ fieldsData
            const fieldKeys = Object.keys(fieldsData);
            const nameFieldsString = fieldKeys.join(',');
            setNameFields(nameFieldsString);
            
            // 4. Tạo detailFields với bản dịch chính xác từ value
            const detailFieldsData = Object.entries(fieldsData).map(([fieldKey, labelValue]) => {
                let vietnameseLabel = labelValue || fieldKey; // Sử dụng labelValue làm default
                
                if ((modStrings || appStrings) && labelValue && typeof labelValue === 'string' && labelValue.trim() !== '') {
                    // CHỈ sử dụng labelValue từ detailviewdefs để tìm translation
                    const translation = findTranslation(labelValue);
                    if (translation) {
                        vietnameseLabel = translation;
                    }
                    // Không có fallback pattern - chỉ dùng chính xác labelValue
                }
                
                return {
                    key: fieldKey,
                    label: vietnameseLabel,
                    type: 'text', // Default type, có thể mở rộng sau
                    required: false // Default required, có thể mở rộng sau
                };
            });
            
            // Thêm id vào detailFields với translation phù hợp
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

    // Get default fields for different modules - LINH HOẠT CHO NHIỀU MODULE
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

    // Process relationships từ response mẫu - GIỐNG AccountDetailScreen
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

    // Fetch record detail - LOGIC GIỐNG UseNote_Detail
    const fetchRecord = useCallback(async (isRefresh = false) => {
        if (!recordId || !nameFields || !moduleName) return;
        
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Get record detail with relationships - SỬ DỤNG getModuleDetailApi
            const response = await getModuleDetailApi(moduleName, recordId, nameFields);
            
            // Process record data
            const recordData = {
                id: response.data.id,
                type: response.data.type,
                ...response.data.attributes
            };
            
            setRecord(recordData);

            // Process relationships from response - XỬ LÝ RELATIONSHIPS TỪ RESPONSE MẪU
            if (response.data.relationships) {
                const processedRelationships = processRelationships(response.data.relationships);
                setRelationships(processedRelationships);
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

    // Delete record - LOGIC GIỐNG UseNote_Detail
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

    // Get field value for display - GIỐNG UseNote_Detail
    const getFieldValue = useCallback((fieldKey) => {
        if (!record) return '';
        return record[fieldKey] || '';
    }, [record]);

    // Get field label - GIỐNG UseNote_Detail
    const getFieldLabel = useCallback((fieldKey) => {
        const field = detailFields.find(f => f.key === fieldKey);
        return field ? field.label : fieldKey;
    }, [detailFields]);

    // Check if field should be displayed - GIỐNG UseNote_Detail
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
