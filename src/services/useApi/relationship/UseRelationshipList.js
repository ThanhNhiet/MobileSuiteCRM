import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { ModuleLanguageUtils } from '../../../utils/cacheViewManagement/ModuleLanguageUtils';
import ReadCacheView from '../../../utils/cacheViewManagement/ReadCacheView';
import { SystemLanguageUtils } from '../../../utils/cacheViewManagement/SystemLanguageUtils';
import WriteCacheView from '../../../utils/cacheViewManagement/WriteCacheView';
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
            
            // Process fields data to create columns with proper translations
            if (!fieldsData || typeof fieldsData !== 'object' || Object.keys(fieldsData).length === 0) {
                fieldsData = getDefaultFieldsForModule(moduleName);
            }
            
            const fieldKeys = Object.keys(fieldsData);
            const nameFieldsString = fieldKeys.join(',');
            setNameFields(nameFieldsString);
            
            // Create columns array with translations using systemLanguageUtils
            const columnsData = Object.entries(fieldsData).map(([fieldKey, labelValue]) => {
                let vietnameseLabel = labelValue || fieldKey;
                
                // Use systemLanguageUtils to translate label
                if (labelValue && typeof labelValue === 'string' && labelValue.trim() !== '') {
                    const translation = systemLanguageUtils.translate(labelValue);
                    if (translation && translation !== labelValue) {
                        vietnameseLabel = translation;
                    }
                }
                
                return {
                    key: fieldKey,
                    label: vietnameseLabel,
                    type: 'text',
                    width: 120,
                    sortable: true
                };
            });
            
            setColumns(columnsData);
            
            // Initialize time filter options with translations using systemLanguageUtils
            const timeOptions = [
                { value: '', label: systemLanguageUtils.translate('LBL_DROPDOWN_LIST_ALL')},
                { value: 'today', label: systemLanguageUtils.translate('today')},
                { value: 'this_week', label: systemLanguageUtils.translate('this_week')},
                { value: 'this_month', label: systemLanguageUtils.translate('this_month')},
                { value: 'this_year', label: systemLanguageUtils.translate('this_year')}
            ];
            
            setTimeFilterOptions(timeOptions);
            setFiltersInitialized(true);
            
        } catch (error) {
            console.error(`useRelationshipList (${moduleName}): Error initializing fields and language:`, error);
            setError('Failed to initialize fields and language');
            
            // Set fallback columns to prevent rendering errors
            const fallbackColumns = [
                { key: 'name', label: 'Name', type: 'text', width: 120, sortable: true },
                { key: 'date_entered', label: 'Date Created', type: 'datetime', width: 120, sortable: true }
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
        fetchRelationshipRecords
    };
};

export default useRelationshipList;