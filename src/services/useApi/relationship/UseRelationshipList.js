import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { cacheManager } from '../../../utils/cacheViewManagement/CacheManager';
import { ModuleLanguageUtils } from '../../../utils/cacheViewManagement/ModuleLanguageUtils';
import ReadCacheView from '../../../utils/cacheViewManagement/ReadCacheView';
import { SystemLanguageUtils } from '../../../utils/cacheViewManagement/SystemLanguageUtils';
import WriteCacheView from '../../../utils/cacheViewManagement/WriteCacheView';
import { formatDateTimeBySelectedLanguage, initializeLocaleCache } from '../../../utils/format/FormatDateTime_Zones';
import {
    getRelationshipListViewFieldsApi,
    getRelationshipsDataApi
} from '../../api/relationship/RelationshipApi_New';

/**
 * Custom hook for relationship list functionality
 * Independent of old relationship files, follows ModuleApi patterns
 * @param {string} moduleName - Target module name for the relationship
 * @param {string} relatedLink - The relationship API link from relationships data
 */
export const useRelationshipList = (moduleName, relatedLink) => {
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
    
    // Search and filter states
    const [searchText, setSearchText] = useState('');
    const [timeFilter, setTimeFilter] = useState('');
    
    // Available filter options
    const [timeFilterOptions, setTimeFilterOptions] = useState([]);
    const [filtersInitialized, setFiltersInitialized] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    
    // Validation
    if (!moduleName) {
        throw new Error('moduleName is required for useRelationshipList hook');
    }
    
    if (!relatedLink) {
        throw new Error('relatedLink is required for useRelationshipList hook');
    }

    // Initialize field definitions and language settings
    const initializeFieldsAndLanguage = useCallback(async () => {
        try {
            // Initialize locale cache for accurate timezone formatting
            try {
                await initializeLocaleCache();
                console.log('Locale cache initialized successfully for relationship list');
            } catch (cacheError) {
                console.warn('Failed to initialize locale cache:', cacheError);
            }
            
            // Check if listviewdefs cache exists for the target module
            let fieldsData;
            const cachedFields = await ReadCacheView.getModuleField(moduleName, 'listviewdefs');
            
            if (!cachedFields) {
                // Fetch from API if no cache exists
                const fieldsResponse = await getRelationshipListViewFieldsApi(moduleName);
                
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
            
            // Get current language settings and use systemLanguageUtils for translations
            const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
            
            // Get language data like UseModule_List
            let languageData = await cacheManager.getModuleLanguage(moduleName, selectedLanguage);
            
            // Fallback check
            if (!languageData) {
                const languageExists = await cacheManager.checkModuleLanguageExists(moduleName, selectedLanguage);
                if (!languageExists) {
                    console.warn(`Language cache not found for ${moduleName} in ${selectedLanguage}`);
                }
            }
            
            // Extract mod_strings like UseModule_List
            let modStrings = null;
            if (languageData && languageData.data && languageData.data.mod_strings) {
                modStrings = languageData.data.mod_strings;
            }
            
            // Validate fields like UseModule_List
            if (!fieldsData || typeof fieldsData !== 'object' || Object.keys(fieldsData).length === 0) {
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
            
            // Process fields like UseModule_List - first 2 fields
            const allFieldEntries = Object.entries(fieldsData);
            const fieldEntries = allFieldEntries.filter(([key]) => key !== 'SET_COMPLETE').slice(0, 2);
            
            // Build nameFields like UseModule_List
            const fieldKeys = fieldEntries.map(([key]) => key.toLowerCase());
            const validFields = fieldKeys.filter(field =>
                field &&
                typeof field === 'string' &&
                field.trim() !== '' &&
                !field.includes(' ')
            );
            
            const nameFieldsString = validFields.join(',');
            let finalNameFields;
            if (!nameFieldsString || nameFieldsString.trim() === '') {
                finalNameFields = 'name,date_entered';
            } else {
                finalNameFields = nameFieldsString;
            }
            setNameFields(finalNameFields);
            
            // Build columns with module translations like UseModule_List
            const columnsData = fieldEntries.map(([fieldKey, fieldInfo]) => {
                let translatedLabel = fieldKey;
                const labelValue = fieldInfo?.label;
                
                if (modStrings) {
                    // Use API label
                    if (labelValue && typeof labelValue === 'string' && labelValue.trim() !== '') {
                        let translation = modStrings[labelValue];
                        
                        // Try alternative like UseModule_List
                        if (!translation) {
                            const listKey = labelValue.replace('LBL_', 'LBL_LIST_');
                            translation = modStrings[listKey];
                        }
                        
                        translatedLabel = translation || labelValue;
                    } else {
                        // Use standard pattern
                        const lblKey = `LBL_${fieldKey.toUpperCase()}`;
                        translatedLabel = modStrings[lblKey] || fieldKey;
                    }
                } else {
                    // Fallback when no modStrings
                    translatedLabel = labelValue || fieldKey;
                }
                
                return {
                    key: fieldKey,
                    label: translatedLabel,
                    type: fieldInfo?.type || 'text',
                    width: 120,
                    sortable: true
                };
            });
            
            setColumns(columnsData);
            
            // Initialize time filter options with system translations
            const timeFilterKeys = ['LBL_DROPDOWN_LIST_ALL', 'today', 'this_week', 'this_month', 'this_year'];
            let timeTranslations = {};
            try {
                timeTranslations = await systemLanguageUtils.translateKeys(timeFilterKeys);
            } catch (error) {
                console.warn('Time filter translation failed:', error);
            }
            
            const timeOptions = [
                { value: '', label: timeTranslations['LBL_DROPDOWN_LIST_ALL'] || 'Tất cả'},
                { value: 'today', label: timeTranslations['today'] || 'Hôm nay'},
                { value: 'this_week', label: timeTranslations['this_week'] || 'Tuần này'},
                { value: 'this_month', label: timeTranslations['this_month'] || 'Tháng này'},
                { value: 'this_year', label: timeTranslations['this_year'] || 'Năm này'}
            ];
            
            setTimeFilterOptions(timeOptions);
            setFiltersInitialized(true);
            
        } catch (error) {
            console.error(`useRelationshipList (${moduleName}): Error initializing fields and language:`, error);
            setError('Failed to initialize fields and language');
            
            // Set fallback columns to prevent rendering errors
            const fallbackColumns = [
                { key: 'NAME', label: 'Name', type: 'varchar', width: 120, sortable: true },
                { key: 'DATE_ENTERED', label: 'Date Created', type: 'datetime', width: 120, sortable: true }
            ];
            setColumns(fallbackColumns);
            setNameFields('name,date_entered');
        } finally {
            setIsInitializing(false);
        }
    }, [moduleName]);

    // Default fields for common modules
    const getDefaultFieldsForModule = (moduleName) => {
        switch (moduleName.toLowerCase()) {
            case 'accounts':
                return {
                    'name': 'LBL_NAME',
                    'phone': 'LBL_PHONE',
                    'email': 'LBL_EMAIL',
                    'date_entered': 'LBL_DATE_ENTERED'
                };
            case 'contacts':
                return {
                    'name': 'LBL_NAME',
                    'phone': 'LBL_PHONE',
                    'email': 'LBL_EMAIL',
                    'date_entered': 'LBL_DATE_ENTERED'
                };
            case 'notes':
                return {
                    'name': 'LBL_SUBJECT',
                    'description': 'LBL_DESCRIPTION',
                    'date_entered': 'LBL_DATE_ENTERED'
                };
            case 'tasks':
                return {
                    'name': 'LBL_SUBJECT',
                    'status': 'LBL_STATUS',
                    'priority': 'LBL_PRIORITY',
                    'date_due': 'LBL_DUE_DATE'
                };
            case 'meetings':
                return {
                    'name': 'LBL_SUBJECT',
                    'date_start': 'LBL_DATE_TIME',
                    'duration_hours': 'LBL_DURATION',
                    'status': 'LBL_STATUS'
                };
            case 'calls':
                return {
                    'name': 'LBL_SUBJECT',
                    'date_start': 'LBL_DATE_TIME',
                    'duration_hours': 'LBL_DURATION',
                    'status': 'LBL_STATUS'
                };
            default:
                return {
                    'name': 'LBL_NAME',
                    'description': 'LBL_DESCRIPTION',
                    'date_entered': 'LBL_DATE_ENTERED'
                };
        }
    };

    // Fetch relationship records
    const fetchRelationshipRecords = useCallback(async (page = 1, pageSize = 10, resetData = false) => {
        try {
            if (resetData) {
                setLoading(true);
            }
            
            setError(null);
            
            // Use the new API to fetch relationship data
            const response = await getRelationshipsDataApi(relatedLink, page, pageSize);
            
            if (response && response.data) {
                const recordsData = Array.isArray(response.data) ? response.data : [response.data];
                
                // Process records to extract attributes
                const processedRecords = recordsData.map(record => {
                    if (record.attributes) {
                        return {
                            id: record.id,
                            ...record.attributes
                        };
                    }
                    return record;
                });
                
                if (resetData || page === 1) {
                    setRecords(processedRecords);
                } else {
                    setRecords(prev => [...prev, ...processedRecords]);
                }
                
                // Update pagination info
                if (response.meta) {
                    const total = response.meta['total-records'] || response.meta.total || 0;
                    const totalPagesFromMeta = response.meta['total-pages'] || response.meta.total_pages;
                    const recordsPerPage = response.meta['records-on-this-page'] || response.meta.per_page || pageSize;
                    
                    let calculatedTotalPages;
                    if (totalPagesFromMeta) {
                        calculatedTotalPages = totalPagesFromMeta;
                    } else {
                        calculatedTotalPages = Math.ceil(total / recordsPerPage);
                    }
                    
                    setCurrentPage(page);
                    setTotalPages(calculatedTotalPages);
                    
                    setPagination({
                        hasNext: response.links && response.links.next,
                        hasPrev: response.links && response.links.prev,
                        nextLink: response.links ? response.links.next : null,
                        prevLink: response.links ? response.links.prev : null
                    });
                } else {
                    // Default pagination when meta is not available
                    setCurrentPage(page);
                    setTotalPages(page);
                    setPagination({
                        hasNext: processedRecords.length === pageSize,
                        hasPrev: page > 1,
                        nextLink: null,
                        prevLink: null
                    });
                }
            } else {
                setRecords([]);
                setCurrentPage(1);
                setTotalPages(1);
                setPagination({
                    hasNext: false,
                    hasPrev: false,
                    nextLink: null,
                    prevLink: null
                });
            }
        } catch (error) {
            console.error(`useRelationshipList (${moduleName}): Error fetching records:`, error);
            setError('Failed to fetch relationship records');
            setRecords([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [moduleName, relatedLink]);

    // Initialize hook
    useEffect(() => {
        initializeFieldsAndLanguage();
    }, [initializeFieldsAndLanguage]);

    // Fetch initial data when fields are ready (only once)
    useEffect(() => {
        if (filtersInitialized && !isInitializing) {
            fetchRelationshipRecords(1, 10, true);
        }
    }, [filtersInitialized, isInitializing]); // Removed fetchRelationshipRecords dependency

    // Handle search functionality
    const handleSearch = useCallback(async (searchTerm) => {
        setSearchText(searchTerm);
        
        if (!searchTerm.trim()) {
            // If search term is empty, fetch all records
            await fetchRelationshipRecords(1, 10, true);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            // For relationship search, we'll apply a simple filter on the current data
            // Since relationship APIs might not support direct search
            const filteredRecords = records.filter(record => {
                return Object.values(record).some(value => 
                    value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
            
            setRecords(filteredRecords);
            setCurrentPage(1);
            setTotalPages(1);
            
        } catch (error) {
            console.error(`useRelationshipList (${moduleName}): Error searching records:`, error);
            setError('Failed to search records');
        } finally {
            setLoading(false);
        }
    }, [moduleName, records, fetchRelationshipRecords]);

    // Handle refresh
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchRelationshipRecords(1, 10, true);
    }, [fetchRelationshipRecords]);

    // Handle load more
    const loadMore = useCallback(async () => {
        if (pagination.hasNext && !loading) {
            await fetchRelationshipRecords(currentPage + 1, 10, false);
        }
    }, [pagination.hasNext, loading, currentPage, fetchRelationshipRecords]);

    // Handle time filter
    const handleFilter = useCallback(async (filters = {}, timeFilterValue = '') => {
        setTimeFilter(timeFilterValue);
        
        if (!timeFilterValue) {
            // If no time filter, fetch all records
            await fetchRelationshipRecords(1, 10, true);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            // First, fetch all records to ensure we have the complete dataset
            const response = await getRelationshipsDataApi(relatedLink, 1, 100);
            let allRecords = [];
            
            if (response && response.data) {
                const recordsData = Array.isArray(response.data) ? response.data : [response.data];
                allRecords = recordsData.map(record => {
                    if (record.attributes) {
                        return {
                            id: record.id,
                            ...record.attributes
                        };
                    }
                    return record;
                });
            }
            
            // Apply time filter to all records
            const now = new Date();
            let startDate, endDate;
            
            switch (timeFilterValue) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                    break;
                case 'this_week':
                    const dayOfWeek = now.getDay();
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - dayOfWeek);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + 7);
                    break;
                case 'this_month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                    break;
                case 'this_year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear() + 1, 0, 1);
                    break;
                default:
                    await fetchRelationshipRecords(1, 10, true);
                    return;
            }
            
            // Filter records by date
            const filteredRecords = allRecords.filter(record => {
                const dateFields = ['date_entered', 'date_modified', 'date_start', 'date_due', 'created_date'];
                
                for (const dateField of dateFields) {
                    if (record[dateField]) {
                        const recordDate = new Date(record[dateField]);
                        if (recordDate >= startDate && recordDate < endDate) {
                            return true;
                        }
                    }
                }
                return false;
            });
            
            setRecords(filteredRecords);
            setCurrentPage(1);
            setTotalPages(1);
            
        } catch (error) {
            console.error(`useRelationshipList (${moduleName}): Error filtering records:`, error);
            setError('Failed to filter records');
        } finally {
            setLoading(false);
        }
    }, [moduleName, relatedLink]); // Removed records dependency

    // Clear search and filters
    const clearSearchAndFilters = useCallback(async () => {
        setSearchText('');
        setTimeFilter('');
        await fetchRelationshipRecords(1, 10, true);
    }, [fetchRelationshipRecords]);

    return {
        // Data
        records,
        columns,
        nameFields,
        
        // State
        loading,
        refreshing,
        error,
        
        // Pagination
        currentPage,
        totalPages,
        pagination,
        
        // Filters
        timeFilterOptions,
        filtersInitialized,
        searchText,
        timeFilter,
        
        // Actions
        handleSearch,
        handleRefresh,
        loadMore,
        handleFilter,
        clearSearchAndFilters,
        
        // Utility
        fetchRelationshipRecords,
        formatCellValue: (fieldKey, value) => {
            console.log('formatCellValue called with:', { fieldKey, value, type: typeof value });
            
            if (!value) return '';
            
            // Format dates - check all possible date field patterns
            const isDateField = fieldKey.toLowerCase().includes('date') || 
                              fieldKey.toLowerCase().includes('_entered') || 
                              fieldKey.toLowerCase().includes('_modified') || 
                              fieldKey.toLowerCase().includes('_due') || 
                              fieldKey.toLowerCase().includes('_start') || 
                              fieldKey.toLowerCase().includes('_end') ||
                              fieldKey === 'DATE_ENTERED' ||
                              fieldKey === 'date_entered';
                              
            console.log('Is date field?', isDateField, 'for field:', fieldKey);
            
            if (isDateField) {
                try {
                    // Convert to proper ISO format if needed
                    const isoString = value.includes('T') ? value : new Date(value).toISOString();
                    
                    // Use formatDateTimeBySelectedLanguage for date and time display
                    const formatted = formatDateTimeBySelectedLanguage(isoString);
                    console.log('DateTime formatted with timezone:', { original: value, isoString, formatted });
                    
                    // Return formatted result if valid, otherwise fallback
                    if (formatted && formatted.trim() && formatted !== value) {
                        return formatted;
                    }
                    
                    // Fallback to simple Vietnamese format if formatDateBySelectedLanguage fails
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        const day = date.getDate().toString().padStart(2, '0');
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const year = date.getFullYear();
                        const hours = date.getHours().toString().padStart(2, '0');
                        const minutes = date.getMinutes().toString().padStart(2, '0');
                        const fallback = `${day}/${month}/${year} ${hours}:${minutes}`;
                        console.log('Using fallback format:', fallback);
                        return fallback;
                    }
                    
                    return value;
                } catch (error) {
                    console.warn('Date format error:', error, 'for value:', value);
                    return value;
                }
            }
            
            return String(value);
        }
    };
};

export default useRelationshipList;