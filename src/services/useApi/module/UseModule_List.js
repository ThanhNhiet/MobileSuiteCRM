import { getUserIdFromToken } from '@/src/utils/DecodeToken';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { cacheManager } from '../../../utils/cacheViewManagement/CacheManager';
import { ModuleLanguageUtils } from '../../../utils/cacheViewManagement/ModuleLanguageUtils';
import ReadCacheView from '../../../utils/cacheViewManagement/ReadCacheView';
import { SystemLanguageUtils } from '../../../utils/cacheViewManagement/SystemLanguageUtils';
import WriteCacheView from '../../../utils/cacheViewManagement/WriteCacheView';
import { getUserRolesApi, getUserSecurityGroupsMember, getUserSecurityGroupsRelationsApi } from '../../api/external/ExternalApi';
import {
    buildDateFilter,
    getModuleListFieldsApi,
    getModuleRecordsApi,
    searchModuleByFilterApi,
    searchModuleByKeywordApi
} from '../../api/module/ModuleApi';

/**
 * Generic hook for module list functionality
 * Based on useNoteList but made generic with moduleName parameter
 */
export const useModule_List = (moduleName) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    
    // Language utils
    const systemLanguageUtils = SystemLanguageUtils.getInstance();
    const moduleLanguageUtils = ModuleLanguageUtils.getInstance();
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pagination, setPagination] = useState({
        hasNext: false,
        hasPrev: false,
        nextLink: null,
        prevLink: null
    });
    
    // Fields and language states
    const [columns, setColumns] = useState([]);
    const [nameFields, setNameFields] = useState('');
    
    // Search and filter states for API calls
    const [searchText, setSearchText] = useState('');
    const [additionalFilters, setAdditionalFilters] = useState({});
    const [timeFilter, setTimeFilter] = useState('');
    
    // Available filter options
    const [filterOptions, setFilterOptions] = useState({});
    const [timeFilterOptions, setTimeFilterOptions] = useState([]);
    const [filtersInitialized, setFiltersInitialized] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [initialRecordsLoaded, setInitialRecordsLoaded] = useState(false);


    // role
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


    // Validation
    if (!moduleName) {
        throw new Error('moduleName is required for useModule_List hook');
    }

    // Initialize field definitions and language settings
    const initializeFieldsAndLanguage = useCallback(async () => {
        try {
            // Check if listviewdefs cache exists
            let fieldsData;
            const cachedFields = await ReadCacheView.getModuleField(moduleName, 'listviewdefs');
            
            if (!cachedFields) {
                // Fetch from API if no cache exists
                const fieldsResponse = await getModuleListFieldsApi(moduleName);
                
                // Extract default_fields from response
                if (fieldsResponse && fieldsResponse.default_fields) {
                    fieldsData = fieldsResponse.default_fields;
                } else {
                    console.warn(`Unexpected API response structure for ${moduleName}`);
                    fieldsData = {};
                }
                
                // Cache the default_fields
                await WriteCacheView.saveModuleField(moduleName, 'listviewdefs', fieldsData);
            } else {
                // Use cached data
                fieldsData = cachedFields;
            }
            
            // Get current language settings
            const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
            let languageData = await cacheManager.getModuleLanguage(moduleName, selectedLanguage);
            
            // Fallback if language data is missing
            if (!languageData) {
                const languageExists = await cacheManager.checkModuleLanguageExists(moduleName, selectedLanguage);
                if (!languageExists) {
                    console.warn(`Language cache does not exist for ${moduleName}. Please login to fetch language data.`);
                }
            }
            
            // Extract mod_strings from language data
            let modStrings = null;
            if (languageData && languageData.data && languageData.data.mod_strings) {
                modStrings = languageData.data.mod_strings;
            }
            
            // Validate fieldsData or use defaults
            if (!fieldsData || typeof fieldsData !== 'object' || Object.keys(fieldsData).length === 0) {
                console.warn(`fieldsData is empty or invalid for ${moduleName}, using default structure`);
                fieldsData = {
                    "NAME": {
                        "label": "LBL_LIST_NAME",
                        "width": "40%",
                        "type": "varchar",
                        "link": true
                    },
                    "DATE_ENTERED": {
                        "label": "LBL_DATE_ENTERED",
                        "width": "10%",
                        "type": "datetime",
                        "link": false
                    }
                };
            }
            
            // Use only first 2 fields
            let fieldEntries;
            const allFieldEntries = Object.entries(fieldsData);
            if (moduleName === 'Calls') {
                // Skip first field
                fieldEntries = allFieldEntries.slice(1, 3);
            } else {
                fieldEntries = allFieldEntries.slice(0, 2);
            }
            
            // Build nameFields string from field definitions
            const fieldKeys = fieldEntries.map(([key]) => key.toLowerCase());
            
            // Filter out invalid fields
            const validFields = fieldKeys.filter(field =>
                field &&
                typeof field === 'string' &&
                field.trim() !== '' &&
                !field.includes(' ')
            );
            
            const nameFieldsString = validFields.join(',');
            
            // Set final nameFields with fallback
            let finalNameFields;
            if (!nameFieldsString || nameFieldsString.trim() === '') {
                console.warn(`nameFields is empty for ${moduleName}, using default fields`);
                finalNameFields = 'name,date_entered,assigned_user_id,created_by,description';
            } else {
                finalNameFields = nameFieldsString;
            }
            
            setNameFields(finalNameFields);
            
            // Build column definitions with translations
            const columnsData = fieldEntries.map(([fieldKey, fieldInfo]) => {
                let translatedLabel = fieldKey;
                const labelValue = fieldInfo?.label;
                
                if (modStrings) {
                    // Use label from API to find translation
                    if (labelValue && typeof labelValue === 'string' && labelValue.trim() !== '') {
                        let translation = modStrings[labelValue];
                        
                        // Try alternative pattern if not found
                        if (!translation) {
                            const listKey = labelValue.replace('LBL_', 'LBL_LIST_');
                            translation = modStrings[listKey];
                        }
                        
                        translatedLabel = translation || labelValue;
                    } else {
                        // Use standard LBL_ pattern if no label
                        const lblKey = `LBL_${fieldKey.toUpperCase()}`;
                        translatedLabel = modStrings[lblKey] || fieldKey;
                    }
                } else {
                    // Use ModuleLanguageUtils as fallback (sync call)
                    try {
                        const fallbackTranslation = moduleLanguageUtils.translate(
                            labelValue || `LBL_${fieldKey.toUpperCase()}`, 
                            fieldKey,
                            moduleName
                        );
                        translatedLabel = fallbackTranslation;
                    } catch (error) {
                        console.warn(`Translation fallback failed for ${fieldKey}:`, error);
                        translatedLabel = fieldKey;
                    }
                }
                
                return {
                    key: fieldKey.toLowerCase(),
                    label: translatedLabel,
                    width: fieldInfo?.width || '50%',
                    type: fieldInfo?.type || 'varchar',
                    link: fieldInfo?.link || false
                };
            });
            
            setColumns(columnsData);
            
        } catch (error) {
            console.error(`Error initializing fields and language for ${moduleName}:`, error);
            
            // Fallback to basic structure
            setNameFields('name,date_entered,assigned_user_id,created_by');
            setColumns([
                { key: 'name', label: 'Name', width: '70%', type: 'varchar', link: true },
                { key: 'date_entered', label: 'Date Created', width: '30%', type: 'datetime', link: false }
            ]);
        }
    }, [moduleName, moduleLanguageUtils]);

    // Initialize filter options
    const initializeFilters = useCallback(async () => {
        try {
            // Common time filter options
            const timeOptions = [
                { label: 'LBL_DROPDOWN_LIST_ALL', value: '' },
                { label: 'today', value: 'today' },
                { label: 'this_week', value: 'this_week' },
                { label: 'this_month', value: 'this_month' },
                { label: 'this_year', value: 'this_year' }
            ];
            
            // Translate time filter options
            const translatedTimeOptions = await Promise.all(
                timeOptions.map(async (option) => {
                    try {
                        const translatedLabel = await systemLanguageUtils.translate(
                            option.label
                        );
                        return { ...option, label: translatedLabel };
                    } catch (error) {
                        return option; // Use original if translation fails
                    }
                })
            );
            
            setTimeFilterOptions(translatedTimeOptions);
            setFiltersInitialized(true);
        } catch (error) {
            console.error(`Error initializing filters for ${moduleName}:`, error);
            setFiltersInitialized(true);
        }
    }, [moduleName, systemLanguageUtils]);

    // Fetch records from API
    const fetchRecords = useCallback(async (page = 1, isRefresh = false, searchMode = false, overrideTimeFilter = null, overrideSearchText = null) => {
        const activeTimeFilter = overrideTimeFilter !== null ? overrideTimeFilter : timeFilter;
        const activeSearchText = overrideSearchText !== null ? overrideSearchText : searchText;
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else if (!isRefresh && page === 1) {
                setLoading(true);
            }
            
            setError(null);
            
            let response;
            
            if (activeSearchText.trim() && searchMode) {
                // Use keyword search
                response = await searchModuleByKeywordApi(moduleName, activeSearchText.trim(), page);
            } else if (Object.keys(additionalFilters).length > 0 || activeTimeFilter) {
                // Use filter search
                const filters = { ...additionalFilters };
                
                // Add date filter if specified
                if (activeTimeFilter) {
                    const dateFilters = buildDateFilter(activeTimeFilter);
                    Object.assign(filters, dateFilters);
                }
                response = await searchModuleByFilterApi(moduleName, 10, page, nameFields, filters);
            } else {
                // Regular fetch
                response = await getModuleRecordsApi(moduleName, 10, page, nameFields);
            }
            
            if (response && response.data) {
                const newRecords = response.data.map(item => {
                    // Handle different API response formats
                    if (item.attributes) {
                        // Standard API format: {id, type, attributes}
                        return {
                            id: item.id,
                            type: item.type,
                            ...item.attributes
                        };
                    } else {
                        // Search API format: {id, name, date_entered, ...} (flat structure)
                        return {
                            id: item.id,
                            type: moduleName, // Use moduleName as type for search results
                            ...item
                        };
                    }
                });
                
                if (page === 1) {
                    setRecords(newRecords);
                } else {
                    setRecords(prev => [...prev, ...newRecords]);
                }
                
                // Update pagination info - handle different meta formats
                if (response.meta) {
                    const totalPages = response.meta['total-pages'] || response.meta.total_pages || response.pagination?.total_pages || 1;
                    setTotalPages(totalPages);
                    setCurrentPage(page);
                    
                    setPagination({
                        hasNext: page < totalPages,
                        hasPrev: page > 1,
                        nextLink: response.links?.next || null,
                        prevLink: response.links?.prev || null
                    });
                }
            } else {
                if (page === 1) {
                    setRecords([]);
                }
            }
            
            if (!initialRecordsLoaded) {
                setInitialRecordsLoaded(true);
            }
            
        } catch (err) {
            console.error(`Error fetching ${moduleName} records:`, err);
            setError(`Failed to load ${moduleName} records`);
            
            if (page === 1) {
                setRecords([]);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
            setIsInitializing(false);
        }
    }, [moduleName, nameFields, searchText, additionalFilters, timeFilter, initialRecordsLoaded]);

    // Search functionality
    const handleSearch = useCallback((query) => {
        setSearchText(query);
        setCurrentPage(1);
        // Pass query directly to fetchRecords instead of relying on state
        fetchRecords(1, false, true, null, query);
    }, [fetchRecords]);

    // Filter functionality
    const handleFilter = useCallback((filters, timeFilterValue) => {
        setAdditionalFilters(filters || {});
        setTimeFilter(timeFilterValue || '');
        setCurrentPage(1);
        // Pass timeFilterValue directly to fetchRecords instead of relying on state
        fetchRecords(1, false, false, timeFilterValue);
    }, [fetchRecords]);

    // Refresh functionality
    const handleRefresh = useCallback(() => {
        setCurrentPage(1);
        fetchRecords(1, true, searchText.trim() !== '');
    }, [fetchRecords, searchText]);

    // Load more (pagination)
    const loadMore = useCallback(() => {
        if (pagination.hasNext && !loading) {
            fetchRecords(currentPage + 1, false, searchText.trim() !== '');
        }
    }, [pagination.hasNext, loading, currentPage, fetchRecords, searchText]);

    // Clear search and filters
    const clearSearchAndFilters = useCallback(() => {
        setSearchText('');
        setAdditionalFilters({});
        setTimeFilter('');
        setCurrentPage(1);
        fetchRecords(1, false, false);
    }, [fetchRecords]);

    // Reset and re-initialize when moduleName changes
    useEffect(() => {
        // Reset all states when moduleName changes
        setRecords([]);
        setLoading(true);
        setError(null);
        setCurrentPage(1);
        setTotalPages(1);
        setColumns([]);
        setNameFields('');
        setSearchText('');
        setAdditionalFilters({});
        setTimeFilter('');
        setFilterOptions({});
        setTimeFilterOptions([]);
        setFiltersInitialized(false);
        setIsInitializing(true);
        setInitialRecordsLoaded(false);
        
        // Re-initialize everything for the new module
        const initialize = async () => {
            await Promise.all([
                initializeFieldsAndLanguage(),
                initializeFilters()
            ]);
        };
        
        initialize();
    }, [moduleName, initializeFieldsAndLanguage, initializeFilters]);

    // Fetch records after initialization
    useEffect(() => {
        if (filtersInitialized && nameFields && !initialRecordsLoaded) {
            fetchRecords(1);
        }
    }, [filtersInitialized, nameFields, initialRecordsLoaded, fetchRecords]);


        const [roleInfo, setRoleInfo] = useState({ roleName: '', listAccess: 'none' });
        const [editPerm, setEditPerm] = useState([]);
        const [viewPerm, setViewPerm] = useState([]);
        const [deletePerm, setDeletePerm] = useState([]);
        // lấy quyền truy cập của người dùng list
        useEffect(() => {
        if (!userRoles) return;
            const roleName = userRoles?.roleName?.toLowerCase?.() ?? '';
            const listPerm = (userRoles?.roles ?? []).find(a => (a?.name || a?.action_name) === 'list');
            setRoleInfo({ roleName, listPerm });
        }, [userRoles]);
        // lấy quyền truy cập của người dùng view
        useEffect(() => {
            if (!userRoles) return;
            const viewPerm = (userRoles?.roles ?? []).find(a => (a?.name || a?.action_name) === 'view');
            setRoleInfo(prev => ({ ...prev, viewPerm }));
        }, [userRoles]);
        // lấy quyền xoá
        useEffect(() => {
            if (!userRoles) return;
            const deletePerm = (userRoles?.roles ?? []).find(a => (a?.name || a?.action_name) === 'delete');
            setRoleInfo(prev => ({ ...prev, deletePerm }));
        }, [userRoles]);
        // lấy quyền sửa
        useEffect(() => {
            if (!userRoles) return;
            const editPerm = (userRoles?.roles ?? []).find(a => (a?.name || a?.action_name) === 'edit');
            setRoleInfo(prev => ({ ...prev, editPerm }));
        }, [userRoles]);

        // check quyền view
        useEffect(()=>{
            const checkViewPerm = async () => {
            try {
                if (!roleInfo.viewPerm && !records) return;
                const token = await AsyncStorage.getItem('token');
                const user_id = getUserIdFromToken(token);
                const viewName = roleInfo.viewPerm?.access_level_name?.toLowerCase?.() ?? '';
                let viewRole = [];
                switch (viewName) {
                    case 'all':
                        viewRole = records.map(record => {
                            return record.id
                        })
                        setViewPerm(viewRole);
                        break;
                    case 'unknown':
                        {
                        const data = await initializationSecurityGroupsRelationsApi(roleInfo.roleName);
                        if (!data){
                            console.warn(`No security groups found for role: ${roleInfo.roleName}`);
                            setViewPerm([]);
                        }
                        const list = await getUserSecurityGroupsMember(data);
                        // rỗng thì thoát sớm
                        if (!Array.isArray(list) || list.length === 0) {
                        console.warn('No members found for security groups:', data);
                        setViewPerm([]);
                        return;
                        }
                        // gom memberId và groupId từ tất cả group
                        const memberIdSet = new Set(
                        list.flatMap(g => (g?.members ?? []).map(m => m.id).filter(Boolean))
                        );
                        const groupIdSet = new Set(
                        list.map(g => g?.group_id ?? g?.id).filter(Boolean)
                        );
                        // lọc record: theo group của record hoặc theo người tạo/được giao thuộc nhóm
                        const filtered = (records ?? []).filter(r =>
                        // record có gán group trực tiếp
                        (r?.securitygroup_id && groupIdSet.has(r.securitygroup_id)) ||
                        (Array.isArray(r?.securitygroups) && r.securitygroups.some(id => groupIdSet.has(id))) ||
                        // hoặc do user trong nhóm tạo/giao
                        memberIdSet.has(r?.assigned_user_id) ||
                        memberIdSet.has(r?.created_by)
                        );
                        const uniqueIds = Array.from(
                        new Set(
                            (filtered ?? [])
                            .map(r => r?.id)      // nếu field khác là record_id thì đổi ở đây
                            .filter(Boolean)
                        )
                        );
                        setViewPerm(uniqueIds);
                        console.log('Filtered records by group:', uniqueIds);
                        break;
                     }
                    case 'owner':
                        viewRole = records.filter(record => {
                            return record.created_by === user_id || record.assigned_user_id === user_id;
                        });
                        setViewPerm(viewRole);
                        break;
                    case 'none':
                        setViewPerm([]);
                        break;
                    case 'default':
                        viewRole = records.map(record => {
                            return record.id
                        });
                        setViewPerm(viewRole);
                        break;
                    default:
                        setViewPerm([]);
                        break;
                }
            } catch (error) {
                    console.error('Error checking view permissions:', error);
                }
        }
        checkViewPerm();
        },[roleInfo.viewPerm,records]);

        // Lấy danh sách bản ghi theo quyền của người dùng
        useEffect(() => {
            const initializeRecordsRole = async () => {
            if (!roleInfo.roleName || !roleInfo.listPerm) return;
            const token = await AsyncStorage.getItem('token');
            const user_id = getUserIdFromToken(token);
            const nameRoleList = roleInfo.listPerm?.access_level_name?.toLowerCase?.() ?? '';
            switch (nameRoleList) {
                case 'all':
                    setRecordsRole(records);
                    break;
                case 'unknown':{
                    const data = await initializationSecurityGroupsRelationsApi(roleInfo.roleName);
                    if (!data){
                        console.warn(`No security groups found for role: ${roleInfo.roleName}`);
                        setRecordsRole([]);
                    }
                    const list = await getUserSecurityGroupsMember(data);

                        // rỗng thì thoát sớm
                        if (!Array.isArray(list) || list.length === 0) {
                        console.warn('No members found for security groups:', data);
                        setRecordsRole([]);
                        return;
                        }

                        // gom memberId và groupId từ tất cả group
                        const memberIdSet = new Set(
                        list.flatMap(g => (g?.members ?? []).map(m => m.id).filter(Boolean))
                        );
                        const groupIdSet = new Set(
                        list.map(g => g?.group_id ?? g?.id).filter(Boolean)
                        );

                        // lọc record: theo group của record hoặc theo người tạo/được giao thuộc nhóm
                        const filtered = (records ?? []).filter(r =>
                        // record có gán group trực tiếp
                        (r?.securitygroup_id && groupIdSet.has(r.securitygroup_id)) ||
                        (Array.isArray(r?.securitygroups) && r.securitygroups.some(id => groupIdSet.has(id))) ||
                        // hoặc do user trong nhóm tạo/giao
                        memberIdSet.has(r?.assigned_user_id) ||
                        memberIdSet.has(r?.created_by)
                        );

                        // dedupe theo record.id
                        const unique = Array.from(new Map(filtered.map(r => [r.id, r])).values());

                        // set đúng 1 lần
                        setRecordsRole(unique);

                    break;
                }
                case 'owner':
                    const ownerRecords = records.filter(record => {
                        return record.created_by === user_id || record.assigned_user_id === user_id;
                    });
                    setRecordsRole(ownerRecords);
                    break;
                case 'default':
                    setRecordsRole(records);
                    break;
                default:
                    setRecordsRole([]);
                    break;

            }
        };
        initializeRecordsRole();
    }, [roleInfo, records]);
    console.log('Role info updated:', recordsRole);
    console.log('View permissions updated:', viewPerm);
    return {
        // Data
        records,
        columns,
        recordsRole,
        viewPerm,
        
        // States
        loading,
        refreshing,
        error,
        isInitializing,
        
        // Pagination
        currentPage,
        totalPages,
        pagination,
        
        // Search and Filter
        searchText,
        timeFilter,
        timeFilterOptions,
        filtersInitialized,
        
        // Actions
        handleSearch,
        handleFilter,
        handleRefresh,
        loadMore,
        clearSearchAndFilters,
        
        // Metadata
        moduleName,
        nameFields
    };
};