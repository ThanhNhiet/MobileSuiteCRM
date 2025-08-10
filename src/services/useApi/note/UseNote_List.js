import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { cacheManager } from '../../../utils/cacheViewManagement/CacheManager';
import ReadCacheView from '../../../utils/cacheViewManagement/ReadCacheView';
import { SystemLanguageUtils } from '../../../utils/cacheViewManagement/SystemLanguageUtils';
import WriteCacheView from '../../../utils/cacheViewManagement/WriteCacheView';
import { getUserIdFromToken } from '../../../utils/DecodeToken';
import {
    getNoteListFieldsApi,
    getNotesApi,
    searchByFilterApi,
    searchByKeywordApi
} from '../../api/note/NoteApi';

export const useNoteList = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    
    // SystemLanguageUtils instance
    const systemLanguageUtils = SystemLanguageUtils.getInstance();
    
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
    const [parentTypeFilter, setParentTypeFilter] = useState('');
    const [timeFilter, setTimeFilter] = useState('');
    
    // Available filter options
    const [parentTypeOptions, setParentTypeOptions] = useState([]);
    const [timeFilterOptions, setTimeFilterOptions] = useState([]);
    const [filtersInitialized, setFiltersInitialized] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [initialNotesLoaded, setInitialNotesLoaded] = useState(false);

    // Initialize field definitions and language settings
    const initializeFieldsAndLanguage = useCallback(async () => {
        try {
            // Check if listviewdefs cache exists
            let fieldsData;
            const cachedFields = await ReadCacheView.getModuleField('Notes', 'listviewdefs');
            
            if (!cachedFields) {
                // Fetch from API if no cache exists
                const fieldsResponse = await getNoteListFieldsApi();
                
                // Extract default_fields from response
                if (fieldsResponse && fieldsResponse.default_fields) {
                    fieldsData = fieldsResponse.default_fields;
                } else {
                    console.warn('Unexpected API response structure');
                    fieldsData = {};
                }
                
                // Cache the default_fields
                await WriteCacheView.saveModuleField('Notes', 'listviewdefs', fieldsData);
            } else {
                // Use cached data
                fieldsData = cachedFields;
            }
            
            // Get current language settings
            const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
            let languageData = await cacheManager.getModuleLanguage('Notes', selectedLanguage);
            
            // Fallback if language data is missing
            if (!languageData) {
                const languageExists = await cacheManager.checkModuleLanguageExists('Notes', selectedLanguage);
                if (!languageExists) {
                    console.warn('Language cache does not exist. Please login to fetch language data.');
                }
            }
            
            // Extract mod_strings from language data
            let modStrings = null;
            if (languageData && languageData.data && languageData.data.mod_strings) {
                modStrings = languageData.data.mod_strings;
            }
            
            // Validate fieldsData or use defaults
            if (!fieldsData || typeof fieldsData !== 'object' || Object.keys(fieldsData).length === 0) {
                console.warn('fieldsData is empty or invalid, using default structure');
                fieldsData = {
                    "NAME": {
                        "label": "LBL_LIST_SUBJECT",
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
            const fieldEntries = Object.entries(fieldsData).slice(0, 2);
            
            // Build nameFields string from field definitions
            const fieldKeys = fieldEntries.map(([key]) => key.toLowerCase());
            const requiredFields = [...fieldKeys, 'parent_type', 'parent_name'];
            
            // Filter out invalid fields
            const validFields = requiredFields.filter(field => 
                field && 
                typeof field === 'string' && 
                field.trim() !== '' &&
                !field.includes(' ')
            );
            
            const nameFieldsString = validFields.join(',');
            
            // Set final nameFields with fallback
            let finalNameFields;
            if (!nameFieldsString || nameFieldsString.trim() === '') {
                console.warn('nameFields is empty, using default fields');
                finalNameFields = 'name,date_entered,parent_type,parent_name,description';
            } else {
                finalNameFields = nameFieldsString;
            }
            
            setNameFields(finalNameFields);
            
            // Build column definitions with translations
            const columnsData = fieldEntries.map(([fieldKey, fieldInfo]) => {
                let vietnameseLabel = fieldKey;
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
                        
                        vietnameseLabel = translation || labelValue;
                    } else {
                        // Use standard LBL_ pattern if no label
                        const lblKey = `LBL_${fieldKey.toUpperCase()}`;
                        let translation = modStrings[lblKey];
                        
                        // Try list pattern
                        if (!translation) {
                            const listKey = `LBL_LIST_${fieldKey.toUpperCase()}`;
                            translation = modStrings[listKey];
                        }
                        
                        vietnameseLabel = translation || fieldKey;
                    }
                } else {
                    // Fallback without language data
                    vietnameseLabel = (labelValue && typeof labelValue === 'string') ? labelValue : fieldKey;
                }
                
                return {
                    key: fieldKey.toLowerCase(),
                    label: vietnameseLabel,
                    width: fieldInfo?.width || '150px',
                    type: fieldInfo?.type || 'text',
                    link: fieldInfo?.link || false
                };
            });
            
            setColumns(columnsData);
            
            return finalNameFields;
            
        } catch (err) {
            console.warn('Initialize fields and language error:', err);
            const errorMsg = await systemLanguageUtils.translate('ERR_AJAX_LOAD_FAILURE') || 'Không thể tải cấu hình hiển thị';
            setError(errorMsg);
            
            return 'name,date_entered,parent_type,parent_name,description';
        }
    }, []);

    // Search notes by keyword using custom API
    const searchNotes = async (keyword = '', page = 1) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await searchByKeywordApi(keyword, page);
            
            if (response && response.data) {
                // Filter notes by current user permissions
                const token = await AsyncStorage.getItem('token');
                const userId = getUserIdFromToken(token);
                const filteredNotes = response.data.filter(note =>
                    note.created_by === userId || note.assigned_user_id === userId
                );

                const processedNotes = filteredNotes.map(note => ({
                    id: note.id,
                    name: note.name,
                    date_entered: note.date_entered,
                    parent_type: note.parent_type,
                    description: note.description,
                    created_by: note.created_by,
                    assigned_user_id: note.assigned_user_id
                }));
                
                setNotes(processedNotes);
                
                // Handle pagination metadata
                if (response.meta) {
                    const totalPages = response.meta['total-pages'] || 1;
                    
                    setCurrentPage(page);
                    setTotalPages(totalPages);
                    setPagination({
                        hasNext: page < totalPages,
                        hasPrev: page > 1,
                        nextLink: page < totalPages ? `page=${page + 1}` : null,
                        prevLink: page > 1 ? `page=${page - 1}` : null
                    });
                } else {
                    // Fallback pagination
                    setCurrentPage(page);
                    setTotalPages(1);
                    setPagination({
                        hasNext: false,
                        hasPrev: false,
                        nextLink: null,
                        prevLink: null
                    });
                }
            }
        } catch (err) {
            console.error('Error searching notes:', err);
            setError(err.message || 'Đã xảy ra lỗi khi tìm kiếm');
        } finally {
            setLoading(false);
        }
    };
    
    // Filter notes by parent type and date criteria
    const filterNotes = async (filters = {}, page = 1) => {
        try {
            setLoading(true);
            setError(null);
            
            // Ensure nameFields is available with fallback
            const fieldsToUse = nameFields || 'name,date_entered,parent_type,parent_name,description,assigned_user_name,created_by_name';
            
            const response = await searchByFilterApi(10, page, fieldsToUse, filters.parent_type, filters.date_filter);
            
            if (response && response.data) {
                // Process API response structure
                const processedNotes = response.data.map(note => ({
                    id: note.id,
                    name: note.attributes.name,
                    date_entered: note.attributes.date_entered,
                    parent_type: note.attributes.parent_type,
                    parent_name: note.attributes.parent_name,
                    description: note.attributes.description,
                    assigned_user_name: note.attributes.assigned_user_name,
                    created_by_name: note.attributes.created_by_name,
                    ...note.attributes
                }));
                
                setNotes(processedNotes);
                
                // Handle pagination metadata
                if (response.meta) {
                    const totalPages = response.meta['total-pages'] || 1;
                    
                    setCurrentPage(page);
                    setTotalPages(totalPages);
                    setPagination({
                        hasNext: page < totalPages,
                        hasPrev: page > 1,
                        nextLink: page < totalPages ? `page=${page + 1}` : null,
                        prevLink: page > 1 ? `page=${page - 1}` : null
                    });
                } else {
                    // Fallback pagination
                    setCurrentPage(page);
                    setTotalPages(1);
                    setPagination({
                        hasNext: false,
                        hasPrev: false,
                        nextLink: null,
                        prevLink: null
                    });
                }
            }
        } catch (err) {
            console.error('Error filtering notes:', err);
            setError(err.message || 'Đã xảy ra lỗi khi lọc dữ liệu');
        } finally {
            setLoading(false);
        }
    };
    
    // Combined search and filter
    const applySearchAndFilter = async (page = 1) => {
        // Build filter object
        const filters = {};
        if (parentTypeFilter) {
            filters.parent_type = parentTypeFilter;
        }
        if (timeFilter) {
            filters.date_filter = timeFilter;
        }
        
        // If there's search text, use search API
        if (searchText.trim()) {
            await searchNotes(searchText.trim(), page);
        } else if (Object.keys(filters).length > 0) {
            // If there are filters but no search text, use filter API
            await filterNotes(filters, page);
        } else {
            // If no search text and no filters, use regular fetch
            await fetchNotes(page, true);
        }
    };

    // Regular fetch notes from API
    const fetchNotes = async (page = 1, resetData = false) => {
        try {
            setLoading(resetData ? true : false);
            setError(null);
            
            // Ensure nameFields is available, use default if not
            const fieldsToUse = nameFields;
            
            const response = await getNotesApi(10, page, fieldsToUse);
            
            if (response && response.data) {
                // Handle getNotesApi response structure (same format as shown in user's example)
                const processedNotes = response.data.map(note => ({
                    id: note.id,
                    name: note.attributes.name,
                    date_entered: note.attributes.date_entered,
                    parent_type: note.attributes.parent_type,
                    parent_name: note.attributes.parent_name,
                    description: note.attributes.description,
                    assigned_user_name: note.attributes.assigned_user_name,
                    created_by_name: note.attributes.created_by_name,
                    ...note.attributes
                }));
                
                setNotes(processedNotes);
                
                // Handle pagination from meta
                if (response.meta) {
                    const totalPages = response.meta['total-pages'] || 1;
                    const recordsOnPage = response.meta['records-on-this-page'] || 0;
                    
                    setCurrentPage(page);
                    setTotalPages(totalPages);
                    setPagination({
                        hasNext: page < totalPages,
                        hasPrev: page > 1,
                        nextLink: page < totalPages ? `page=${page + 1}` : null,
                        prevLink: page > 1 ? `page=${page - 1}` : null
                    });
                } else {
                    // Fallback pagination if meta is not available
                    setCurrentPage(page);
                    setTotalPages(1);
                    setPagination({
                        hasNext: false,
                        hasPrev: false,
                        nextLink: null,
                        prevLink: null
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching notes:', err);
            setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch notes with specific nameFields (for initialization)
    const fetchNotesWithFields = async (page = 1, resetData = false, nameFieldsToUse) => {
        try {
            setLoading(resetData ? true : false);
            setError(null);
            
            const fieldsToUse = nameFieldsToUse || 'name,date_entered,parent_type,parent_name,description,assigned_user_name,created_by_name';
            
            const response = await getNotesApi(10, page, fieldsToUse);
            
            if (response && response.data) {
                // Handle getNotesApi response structure (same format as shown in user's example)
                const processedNotes = response.data.map(note => ({
                    id: note.id,
                    name: note.attributes.name,
                    date_entered: note.attributes.date_entered,
                    parent_type: note.attributes.parent_type,
                    parent_name: note.attributes.parent_name,
                    description: note.attributes.description,
                    assigned_user_name: note.attributes.assigned_user_name,
                    created_by_name: note.attributes.created_by_name,
                    ...note.attributes
                }));
                
                setNotes(processedNotes);
                
                // Handle pagination from meta
                if (response.meta) {
                    const totalPages = response.meta['total-pages'] || 1;
                    const recordsOnPage = response.meta['records-on-this-page'] || 0;
                    
                    setCurrentPage(page);
                    setTotalPages(totalPages);
                    setPagination({
                        hasNext: page < totalPages,
                        hasPrev: page > 1,
                        nextLink: page < totalPages ? `page=${page + 1}` : null,
                        prevLink: page > 1 ? `page=${page - 1}` : null
                    });
                } else {
                    // Fallback pagination if meta is not available
                    setCurrentPage(page);
                    setTotalPages(1);
                    setPagination({
                        hasNext: false,
                        hasPrev: false,
                        nextLink: null,
                        prevLink: null
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching notes with fields:', err);
            setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Initialize filter options
    const initializeFilterOptions = async () => {
        try {
            // Time filter options
            const timeOptions = [
                { value: '', label: await systemLanguageUtils.translate('LBL_DROPDOWN_LIST_ALL') || 'Tất cả' },
                { value: 'today', label: await systemLanguageUtils.translate('LBL_TODAY') || 'Hôm nay' },
                { value: 'this_week', label: await systemLanguageUtils.translate('LBL_THIS_WEEK') || 'Tuần này' },
                { value: 'this_month', label: await systemLanguageUtils.translate('LBL_THIS_MONTH') || 'Tháng này' },
                { value: 'this_year', label: await systemLanguageUtils.translate('LBL_THIS_YEAR') || 'Năm này' }
            ];
            setTimeFilterOptions(timeOptions);
            
            // Parent type options
            setParentTypeOptions([
                { value: '', label: await systemLanguageUtils.translate('LBL_DROPDOWN_LIST_ALL') || 'Tất cả' },
                { value: 'Accounts', label: await systemLanguageUtils.translate('LBL_ACCOUNTS') || 'Khách hàng' },
                { value: 'Contacts', label: await systemLanguageUtils.translate('LBL_CONTACTS') || 'Liên hệ' },
                { value: 'Tasks', label: await systemLanguageUtils.translate('LBL_TASKS') || 'Công việc' },
                { value: 'Meetings', label: await systemLanguageUtils.translate('LBL_MEETINGS') || 'Hội họp' }
            ]);
            
            setFiltersInitialized(true);
        } catch (err) {
            console.warn('Error initializing filter options:', err);
            // Set fallback options
            setParentTypeOptions([
                { value: '', label: 'Tất cả' },
                { value: 'Accounts', label: 'Khách hàng' },
                { value: 'Contacts', label: 'Liên hệ' },
                { value: 'Tasks', label: 'Công việc' },
                { value: 'Meetings', label: 'Hội họp' }
            ]);
            
            setTimeFilterOptions([
                { value: '', label: 'Tất cả' },
                { value: 'today', label: 'Hôm nay' },
                { value: 'this_week', label: 'Tuần này' },
                { value: 'this_month', label: 'Tháng này' },
                { value: 'this_year', label: 'Năm này' }
            ]);
            setFiltersInitialized(true);
        }
    };

    // Load more notes for pagination
    const loadMoreNotes = async () => {
        if (pagination.hasNext && !loading) {
            await applySearchAndFilter(currentPage + 1);
        }
    };

    // Navigate to specific page
    const goToPage = async (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages && pageNumber !== currentPage) {
            await applySearchAndFilter(pageNumber);
        }
    };

    // Refresh notes from first page
    const refreshNotes = async () => {
        setRefreshing(true);
        setCurrentPage(1);
        // Always use fetchNotes (getNotesApi) for refresh, not search/filter
        await fetchNotes(1, true);
        setRefreshing(false);
    };

    // Update search text and trigger search
    // Update search text and reset pagination
    const handleSearch = (text) => {
        setSearchText(text);
        setCurrentPage(1);
    };

    // Update parent type filter and reset pagination
    const handleParentTypeFilter = (parentType) => {
        setParentTypeFilter(parentType);
        setCurrentPage(1);
    };

    // Update time filter and reset pagination
    const handleTimeFilter = (timeFilterValue) => {
        setTimeFilter(timeFilterValue);
        setCurrentPage(1);
    };

    // Clear all filters and reset to base state
    const clearFilters = () => {
        setSearchText('');
        setParentTypeFilter('');
        setTimeFilter('');
        setCurrentPage(1);
        setInitialNotesLoaded(false); // Reset to allow reload of base notes
    };

    // Initialize on component mount
    useEffect(() => {
        const initializeData = async () => {
            try {
                setIsInitializing(true);
                
                // Initialize field definitions and language data
                const initialNameFields = await initializeFieldsAndLanguage();
                await initializeFilterOptions();
                
                // Load initial notes - only if no search/filter is active
                if (!searchText && !parentTypeFilter && !timeFilter) {
                    // Use the nameFields directly from initialization to avoid state delay
                    await fetchNotesWithFields(1, true, initialNameFields);
                    setInitialNotesLoaded(true);
                }
            } catch (error) {
                console.error('UseNote_List: Error initializing:', error);
                setError('Không thể khởi tạo dữ liệu');
            } finally {
                setIsInitializing(false);
            }
        };
        
        initializeData();
    }, []);

    // Apply search and filter when filters change
    useEffect(() => {
        // Only run after initialization is complete and filters are initialized
        if (!isInitializing && filtersInitialized) {
            if (searchText || parentTypeFilter || timeFilter) {
                // If there are active filters or search, apply them
                const delayedSearch = setTimeout(() => {
                    applySearchAndFilter(1);
                }, 300); // Debounce search
                
                return () => clearTimeout(delayedSearch);
            } else if (!initialNotesLoaded) {
                // If no filters are active and initial notes not loaded yet, load regular notes
                const delayedFetch = setTimeout(() => {
                    fetchNotes(1, true);
                    setInitialNotesLoaded(true);
                }, 300);
                
                return () => clearTimeout(delayedFetch);
            }
        }
    }, [searchText, parentTypeFilter, timeFilter, filtersInitialized, isInitializing, initialNotesLoaded]);

    return {
        // Data
        notes,
        columns,
        loading,
        refreshing,
        error,
        isInitializing,
        
        // Pagination
        currentPage,
        totalPages,
        pagination,
        
        // Filters
        searchText,
        parentTypeFilter,
        timeFilter,
        parentTypeOptions,
        timeFilterOptions,
        filtersInitialized,
        
        // Actions
        fetchNotes,
        searchNotes,
        filterNotes,
        applySearchAndFilter,
        refreshNotes,
        loadMoreNotes,
        goToPage,
        handleSearch,
        handleParentTypeFilter,
        handleTimeFilter,
        clearFilters,
        initializeFieldsAndLanguage
    };
};
