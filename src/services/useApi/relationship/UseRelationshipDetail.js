import { getUserIdFromToken } from '@/src/utils/DecodeToken';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { cacheManager } from '../../../utils/cacheViewManagement/CacheManager';
import ReadCacheView from '../../../utils/cacheViewManagement/ReadCacheView';
import { SystemLanguageUtils } from '../../../utils/cacheViewManagement/SystemLanguageUtils';
import WriteCacheView from '../../../utils/cacheViewManagement/WriteCacheView';
import { formatCurrency } from '../../../utils/format/FormatCurrencies';
import { getUserRolesApi, getUserSecurityGroupsMember, getUserSecurityGroupsRelationsApi } from '../../api/external/ExternalApi';
import { deleteModuleRecordApi, getLinkFileModuleApi, getModuleDetailApi, getModuleDetailFieldsApi, getParentId_typeByModuleIdApi } from '../../api/module/ModuleApi';
export const useRelationshipDetail = (moduleName, recordId) => {
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [relationships, setRelationships] = useState([]);
    const [haveParent, setHaveParent] = useState(false);

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
            
            // Special handling for duration field - same as UseModule_Detail
            let finalFieldKeys = [...fieldKeys];
            if (fieldKeys.includes('duration')) {
                // Add duration_hours and duration_minutes to fetch them from API
                finalFieldKeys.push('duration_hours', 'duration_minutes');
            }
            
            const nameFieldsString = finalFieldKeys.join(',');
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
                "duration": "LBL_DURATION",
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
                "annual_revenue": "LBL_ANNUAL_REVENUE",
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
            
            // Apply duration processing
            const processedRecordData = processDurationField(recordData);
            
            setRecord(processedRecordData);
            if(parentInfo.parent_id && parentInfo.parent_type) {
                setHaveParent(true);
            }

            // Process relationships from response
            if (response.data.relationships) {
                const systemModules = ['AOS_Line_Item_Groups', 'AOS_Products_Quotes'];

                let processedRelationships = processRelationships(response.data.relationships);
                processedRelationships = processedRelationships.filter(r => r.moduleName !== 'Users');

                if (moduleName === 'AOS_Quotes') {
                    processedRelationships = processedRelationships.filter(r => !systemModules.includes(r.moduleName));
                }
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

    // Process duration field by combining duration_hours and duration_minutes - same as UseModule_Detail
    const processDurationField = (recordData) => {
        if (recordData && recordData.duration_hours !== undefined && recordData.duration_minutes !== undefined) {
            const hours = recordData.duration_hours || 0;
            const minutes = recordData.duration_minutes || 0;
            recordData.duration = `${hours}:${String(minutes).padStart(2, '0')}`;
        }
        return recordData;
    };
    
    // Get duration field value for display
    const getDurationValue = useCallback((fieldKey) => {
        if (fieldKey === 'duration' && record && record.duration) {
            return record.duration;
        }
        return getFieldValue(fieldKey);
    }, [record, getFieldValue]);

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
        
        // Hide duration component fields (duration_hours, duration_minutes) as they are combined into duration
        if (fieldKey === 'duration_hours' || fieldKey === 'duration_minutes') {
            return false;
        }
        
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

    // Format field value based on field type
    const formatFieldValue = useCallback(async (fieldKey, value) => {
        if (!value || value === '' || value === null || value === undefined) {
            return '';
        }

        switch (fieldKey) {
            case 'annual_revenue':
                try {
                    const numericValue = parseFloat(value);
                    if (isNaN(numericValue)) {
                        return value;
                    }
                    return await formatCurrency(numericValue);
                } catch (error) {
                    console.warn('Error formatting annual_revenue:', error);
                    return value;
                }
            default:
                return value;
        }
    }, []);
    //role
        const [userRoles, setUserRoles] = useState([]);
        const [recordsRole, setRecordsRole] = useState([]);
        const nameRole = ['delete','list','edit','create','view'];
    
        const initializeUserRoles = useCallback(async () => {
            try {
                const data = await getUserRolesApi();
                if (!data || !data.roles) {
                    console.warn('No roles found, using default options');
                    setUserRoles([{ label: 'No Role', value: 'no_role' }]);
                } 
                const roles = data.roles[0] || [];
                const roleOptions = {
                    roleName: roles.role_name,
                    roles: roles.actions.filter(role => {
                        return role.category === moduleName && nameRole.includes(role.name);
                    })
                };
                setUserRoles(roleOptions);
            } catch (error) {
                console.error('Error initializing user roles:', error);
            }
        }, [moduleName]);
        const initializationSecurityGroupsRelationsApi = async (name) => {
            try {
               const data = await getUserSecurityGroupsRelationsApi(name);
                    if (!data) {
                        console.warn(`No security groups found for role: ${name}`);
                        return [];
                    }
                    return data;
            } catch (error) {
                console.error('Error initializing security groups relations:', error);
            }
        };
        useEffect(() => {
            initializeUserRoles();
        }, [moduleName]);

        const [roleInfo, setRoleInfo] = useState({ roleName: '', listAccess: 'none' });
        const [editPerm, setEditPerm] = useState(false);
        const [deletePerm, setDeletePerm] = useState(false);
        //const { groups, roles, actions, roleInfoGroup } = useModule_Role(moduleName);
        // lấy quyền xoá
        useEffect(() => {
            if (!userRoles) return;
            const roleName = userRoles?.roleName?.toLowerCase?.() ?? '';
            const deletePerm = (userRoles?.roles ?? []).find(a => (a?.name || a?.action_name) === 'delete');
            setRoleInfo(({ roleName, deletePerm }));
        }, [userRoles]);
        // lấy quyền sửa
        useEffect(() => {
            if (!userRoles) return;
            const editPerm = (userRoles?.roles ?? []).find(a => (a?.name || a?.action_name) === 'edit');
            setRoleInfo(prev => ({ ...prev, editPerm }));
        }, [userRoles]);
        // helpers.ts
            const getUserIdSafe = async () => {
            const token = await AsyncStorage.getItem('token');
            return getUserIdFromToken(token);
            };

            const getRecordFieldSafe = (record) => {
            // Một số API đặt data trong attributes
            const r = (record && typeof record === 'object') ? (record.attributes ?? record) : {};
            return {
                created_by: r?.created_by ?? r?.created_by_id,
                assigned_user_id: r?.assigned_user_id ?? r?.owner_id,
            };
            };

            const buildMemberIdSet = (groupsList = []) => {
            return new Set(
                groupsList.flatMap(g => (g?.members ?? [])
                .map(m => m?.id)
                .filter(Boolean)
                )
            );
            };

            const fetchGroupMemberIdSet = async (roleName) => {
            const data = await initializationSecurityGroupsRelationsApi(roleName);
            if (!data) {
                console.warn(`No security groups found for role: ${roleName}`);
                return new Set();
            }
            const list = await getUserSecurityGroupsMember(data);
            if (!Array.isArray(list) || list.length === 0) {
                console.warn('No members found for security groups:', data);
                return new Set();
            }
            return buildMemberIdSet(list);
            };

            // ---- Hàm chung kiểm tra quyền theo kiểu (delete/edit) ----
            const checkPermGeneric = async ({
            permInfo,      // roleInfo.deletePerm hoặc roleInfo.editPerm
            roleName,      // roleInfo.roleName
            record,
            setter,        // setDeletePerm hoặc setEditPerm
            myUserId,      // user_id của bạn
            }) => {
            // Nếu thiếu permInfo hoặc thiếu record -> không đủ dữ kiện, return
            if (!permInfo || !record) return;

            const level = permInfo?.access_level_name?.toLowerCase?.() ?? '';
            const { created_by, assigned_user_id } = getRecordFieldSafe(record);

            switch (level) {
                case 'all':
                setter(true);
                return;

                case 'owner':
                setter(!!(myUserId && (created_by === myUserId || assigned_user_id === myUserId)));
                return;

                case 'unknown': {
                // Diễn giải: cho phép nếu chủ sở hữu (created_by/assigned_user_id)
                // thuộc một Security Group mà role này được phép thao tác
                const memberIdSet = await fetchGroupMemberIdSet(roleName);
                if (memberIdSet.size === 0) {
                    setter(false);
                    return;
                }
                const can = memberIdSet.has(assigned_user_id) || memberIdSet.has(created_by);
                setter(!!can);             // KHÔNG đảo ngược!
                return;
                }

                case 'default':
                setter(true);
                return;

                case 'none':
                setter(false);
                return;

                default:
                setter(false);
                return;
            }
            };
            // component.jsx
        useEffect(() => {
        let alive = true;
        (async () => {
            try {
            // Nếu thiếu deletePerm hoặc record -> không kiểm tra
            if (!roleInfo?.deletePerm || !record) return;
            const user_id = await getUserIdSafe();
            if (!alive) return;
                await checkPermGeneric({
                permInfo: roleInfo.deletePerm,
                roleName: roleInfo.roleName,
                record,
                setter: (v) => alive && typeof setDeletePerm === 'function' && setDeletePerm(!!v),
                myUserId: user_id,
            });          
            } catch (e) {
            console.error('Error checking delete permissions:', e);
            }
        })();
        return () => { alive = false; };
        // Chỉ phụ thuộc thứ thật sự cần
        }, [roleInfo?.deletePerm, roleInfo?.roleName, record?.id]);

        useEffect(() => {
        let alive = true;
        (async () => {
            try {
            if (!roleInfo?.editPerm || !record) return;
            const user_id = await getUserIdSafe();
            if (!alive) return;
                await checkPermGeneric({
                permInfo: roleInfo.editPerm,
                roleName: roleInfo.roleName,
                record,
                setter: (v) => alive && typeof setEditPerm === 'function' && setEditPerm(!!v),
                myUserId: user_id,
            });
            } catch (e) {
            console.error('Error checking edit permissions:', e);
            }
        })();
        return () => { alive = false; };
        }, [roleInfo?.editPerm, roleInfo?.roleName, record?.id]);

        // get link file
        const [fileMeta, setFileMeta] = useState(null); // metadata of the file to preview
        const fileName = getFieldValue('filename');
        useEffect(() => {
            const getLinkFile = async () => {
                
                if(!moduleName || !fileName) return '';
                try {
                    const data = await getLinkFileModuleApi(moduleName,fileName);
                    if (!data || !data.success){
                        console.warn(`No link file found for module: ${moduleName} and file: ${fileName}`);
                        return '';
                    }
                const link = {
                    link: data.native_url,
                    downloadLink : data.download_url,
                    downloadLinkNative : data.download_url_native,
                    mime_type: data.mime_type,
                    is_image: data.is_image,
                }
                setFileMeta(link);

            } catch (error) {
                console.warn("Get Link File error:", error);
                return '';
            }
        };
        getLinkFile();
    }, [moduleName,fileName]);
    // relationships change
    const [relaFor, setRelaFor] = useState(null);

    useEffect(() => {
        const fetchRelaFor = async () => {
            try {
                if(!moduleName || !recordId){
                    setRelaFor(null);
                    return;
                }
                const rela = {
                    moduleName: moduleName,
                    recordId: recordId
                };
                setRelaFor(rela);
            } catch (error) {
            console.warn('Set relaFor error:', error);
            }
        };        
        fetchRelaFor();
    },[moduleName, recordId]);


    return {
        // Data
        record,
        deletePerm,
        editPerm,
        detailFields,
        relationships,
        loading,
        refreshing,
        error,
        deleting,
        haveParent,
        relaFor,
        
        // Actions
        fetchRecord,
        refreshRecord,
        deleteRecord,
        
        // Helpers
        getFieldValue,
        getFieldLabel,
        shouldDisplayField,
        formatFieldValue,
        getDurationValue,

        //get link file
        fileMeta,
    };
};
