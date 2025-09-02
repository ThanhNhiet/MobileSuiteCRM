import { getUserIdFromToken } from '@/src/utils/DecodeToken';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
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
            // if (moduleName === 'Calls' || moduleName === 'Meetings' || moduleName === 'Tasks') {
            //     // Skip first field because that response that modules don't have set_complete
            //     fieldEntries = allFieldEntries.slice(1, 3);
            // } else {
            //     fieldEntries = allFieldEntries.slice(0, 2);
            // }
            //remove set_complete field
            fieldEntries = allFieldEntries.filter(([key]) => key !== 'SET_COMPLETE').slice(0, 2);

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
        const [viewPerm, setViewPerm] = useState([]);
       // const { groups, roles, actions, roleInfoGroup } = useModule_Role(moduleName);
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

        
       // ===== xu ly role =====
        const normalizeRecord = (rec) => (rec?.attributes ?? rec ?? {});

        const getOwnersAndId = (rec) => {
        const r = normalizeRecord(rec);
        return {
            id: r?.id ?? r?.record_id,
            created_by: r?.created_by ?? r?.created_by_id,
            assigned_user_id: r?.assigned_user_id ?? r?.owner_id,
            securitygroup_id: r?.securitygroup_id,
            securitygroups: Array.isArray(r?.securitygroups) ? r.securitygroups : [],
        };
        };

        const buildSetsFromGroups = (list = []) => ({
        memberIdSet: new Set(
            list.flatMap(g => (g?.members ?? []).map(m => m?.id).filter(Boolean))
        ),
        groupIdSet: new Set(
            list.map(g => g?.group_id ?? g?.id).filter(Boolean)
        ),
        });

        const filterRecordsByGroupOrOwner = (records = [], memberIdSet, groupIdSet) => {
        return records.filter(rec => {
            const { created_by, assigned_user_id, securitygroup_id, securitygroups } = getOwnersAndId(rec);
            return (
            (!!securitygroup_id && groupIdSet.has(securitygroup_id)) ||
            securitygroups.some(id => groupIdSet.has(id)) ||
            memberIdSet.has(assigned_user_id) ||
            memberIdSet.has(created_by)
            );
        });
        };

        const uniqueIds = (records = []) =>
        Array.from(new Set(records.map(r => getOwnersAndId(r).id).filter(Boolean)));

        const uniqueRecordsById = (records = []) =>
        Array.from(new Map(records.map(r => [getOwnersAndId(r).id, r])).values())
            .filter(r => !!getOwnersAndId(r).id);

        const getUserIdSafe = async () => {
        const token = await AsyncStorage.getItem('token');
        return getUserIdFromToken(token);
        };

        // Đánh giá record theo 1 quyền (list/view): trả về MẢNG RECORD
        const evaluateRecordsByPerm = async ({ permInfo, roleName, records }) => {
        if (!permInfo || !Array.isArray(records) || records.length === 0) return [];

        const level = permInfo?.access_level_name?.toLowerCase?.() ?? '';
        console.log('Evaluating records for level:', level, 'with role:', roleName);
        switch (level) {
            case 'all':
            case 'default':
            return uniqueRecordsById(records);

            case 'owner': {
            const userId = await getUserIdSafe();
            const ownerRecords = records.filter(r => {
                const { created_by, assigned_user_id } = getOwnersAndId(r);
                return created_by === userId || assigned_user_id === userId;
            });
            return uniqueRecordsById(ownerRecords);
            }

            case 'unknown': {
            const data = await initializationSecurityGroupsRelationsApi(roleName);
            if (!data) return [];
            const list = await getUserSecurityGroupsMember(data);
            if (!Array.isArray(list) || list.length === 0) return [];

            const { memberIdSet, groupIdSet } = buildSetsFromGroups(list);
            const filtered = filterRecordsByGroupOrOwner(records, memberIdSet, groupIdSet);
            return uniqueRecordsById(filtered);
            }

            case 'none':
            default:
            return [];
        }
        };

        // ===== LIST: records theo quyền listPerm (TRẢ VỀ RECORD) =====
        const listSeqRef = useRef(0);
        useEffect(() => {
        let alive = true;
        const seq = ++listSeqRef.current;

        (async () => {
            try {
             const allowed = await evaluateRecordsByPerm({
                permInfo: roleInfo?.listPerm,
                roleName: roleInfo?.roleName,
                records,
            });
            if (!alive || seq !== listSeqRef.current) return;
            setRecordsRole(allowed); // <-- MẢNG RECORD
            } catch (e) {
            console.error('initializeRecordsRole error:', e);
            if (alive && seq === listSeqRef.current) setRecordsRole([]);
            }
        })();

        return () => { alive = false; };
        }, [roleInfo?.roleName, roleInfo?.listPerm, records]);

        // ===== VIEW: ID được xem theo viewPerm (TRẢ VỀ ID) =====
        const viewSeqRef = useRef(0);
        useEffect(() => {
        let alive = true;
        const seq = ++viewSeqRef.current;

        (async () => {
            try {
             const allowed = await evaluateRecordsByPerm({
                permInfo: roleInfo?.viewPerm,
                roleName: roleInfo?.roleName,
                records,
            });
            const ids = uniqueIds(allowed); // <-- MẢNG ID
            if (!alive || seq !== viewSeqRef.current) return;
            setViewPerm(ids);
            } catch (e) {
            console.error('Error checking view permissions:', e);
            if (alive && seq === viewSeqRef.current) setViewPerm([]);
            }
        })();

        return () => { alive = false; };
        }, [roleInfo?.roleName, roleInfo?.viewPerm, records]);

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