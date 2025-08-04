import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { cacheManager } from '../../../utils/CacheManager';
import { SystemLanguageUtils } from '../../../utils/SystemLanguageUtils';
import ReadCacheView from '../../../utils/cacheViewManagement/ReadCacheView';
import WriteCacheView from '../../../utils/cacheViewManagement/WriteCacheView';
import {
    getNoteListFieldsApi,
    getNotesApi
} from '../../api/note/NoteApi';

export const useNoteList = () => {
    const [notes, setNotes] = useState([]);
    const [allNotes, setAllNotes] = useState([]); // Store all notes for client-side filtering
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
    
    // Filter states
    const [searchText, setSearchText] = useState('');
    const [parentTypeFilter, setParentTypeFilter] = useState('');
    const [timeFilter, setTimeFilter] = useState('all');
    
    // Available filter options
    const [parentTypeOptions, setParentTypeOptions] = useState([]);
    const [timeFilterOptions, setTimeFilterOptions] = useState([]);
    const [filtersInitialized, setFiltersInitialized] = useState(false);

    // Initialize fields and language
    const initializeFieldsAndLanguage = useCallback(async () => {
        try {
            // 1. Kiểm tra cache listviewdefs.json có tồn tại không
            let fieldsData;
            const cachedFields = await ReadCacheView.getModuleField('Notes', 'listviewdefs');
            
            if (!cachedFields) {
                // Nếu chưa có cache, fetch từ API
                const fieldsResponse = await getNoteListFieldsApi();
                
                // Kiểm tra cấu trúc response và lấy default_fields
                if (fieldsResponse && fieldsResponse.default_fields) {
                    fieldsData = fieldsResponse.default_fields;
                } else {
                    console.warn('Unexpected API response structure');
                    fieldsData = {};
                }
                
                // Lưu vào cache (chỉ lưu default_fields)
                await WriteCacheView.saveModuleField('Notes', 'listviewdefs', fieldsData);
            } else {
                // Nếu có cache, sử dụng cache
                fieldsData = cachedFields;
            }
            
            // 2. Lấy ngôn ngữ hiện tại
            const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
            let languageData = await cacheManager.getModuleLanguage('Notes', selectedLanguage);
            
            // Nếu không có language data, thử fetch lại
            if (!languageData) {
                const languageExists = await cacheManager.checkModuleLanguageExists('Notes', selectedLanguage);
                if (!languageExists) {
                    console.warn('Language cache does not exist. Please login to fetch language data.');
                }
            }
            
            // Lấy mod_strings từ cấu trúc language data
            let modStrings = null;
            if (languageData && languageData.data && languageData.data.mod_strings) {
                modStrings = languageData.data.mod_strings;
            }
            
            // Kiểm tra fieldsData có hợp lệ không
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
            
            // Chỉ lấy 2 field đầu tiên
            const fieldEntries = Object.entries(fieldsData).slice(0, 2);
            
            // 3. Tạo nameFields string từ fieldsData (chỉ 2 field đầu tiên)
            const fieldKeys = fieldEntries.map(([key]) => key.toLowerCase());
            const requiredFields = [...fieldKeys, 'parent_type', 'parent_name'];
            
            // Lọc bỏ các trường rỗng hoặc invalid
            const validFields = requiredFields.filter(field => 
                field && 
                typeof field === 'string' && 
                field.trim() !== '' &&
                !field.includes(' ') // Không chứa khoảng trắng
            );
            
            const nameFieldsString = validFields.join(',');
            
            // Kiểm tra nameFields có hợp lệ không
            if (!nameFieldsString || nameFieldsString.trim() === '') {
                console.warn('nameFields is empty, using default fields');
                setNameFields('name,date_entered,parent_type,parent_name,description');
            } else {
                setNameFields(nameFieldsString);
            }
            
            // 4. Tạo columns với bản dịch (chỉ 2 field đầu tiên)
            const columnsData = fieldEntries.map(([fieldKey, fieldInfo]) => {
                let vietnameseLabel = fieldKey; // Default fallback
                const labelValue = fieldInfo?.label;
                
                if (modStrings) {
                    // Kiểm tra labelValue có tồn tại và là string
                    if (labelValue && typeof labelValue === 'string' && labelValue.trim() !== '') {
                        // Sử dụng label từ API để tìm trong modStrings
                        let translation = modStrings[labelValue];
                        
                        // Nếu không tìm thấy, thử tìm với các pattern khác
                        if (!translation) {
                            // Thử tìm với LBL_LIST_ prefix
                            const listKey = labelValue.replace('LBL_', 'LBL_LIST_');
                            translation = modStrings[listKey];
                        }
                        
                        vietnameseLabel = translation || labelValue;
                    } else {
                        // Nếu không có label, áp dụng phương pháp cũ: chuyển thành định dạng LBL_FIELD
                        const lblKey = `LBL_${fieldKey.toUpperCase()}`;
                        let translation = modStrings[lblKey];
                        
                        // Thử các pattern khác nếu không tìm thấy
                        if (!translation) {
                            const listKey = `LBL_LIST_${fieldKey.toUpperCase()}`;
                            translation = modStrings[listKey];
                        }
                        
                        vietnameseLabel = translation || fieldKey;
                    }
                } else {
                    // Nếu không có dữ liệu ngôn ngữ, sử dụng labelValue hoặc fieldKey
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
            
        } catch (err) {
            console.warn('Initialize fields and language error:', err);
            const errorMsg = await systemLanguageUtils.translate('ERR_AJAX_LOAD_FAILURE') || 'Không thể tải cấu hình hiển thị';
            setError(errorMsg);
        }
    }, []);

    // Apply time filter to date
    const applyTimeFilter = useCallback((notes, timeFilter) => {
        if (timeFilter === 'all') return notes;
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        return notes.filter(note => {
            const noteDate = new Date(note.date_entered);
            
            switch (timeFilter) {
                case 'today':
                    return noteDate >= today;
                case 'this_week':
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    return noteDate >= weekStart;
                case 'this_month':
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    return noteDate >= monthStart;
                default:
                    return true;
            }
        });
    }, []);

    // Client-side search function
    const filterNotesBySearch = useCallback((notes, searchTerm) => {
        if (!searchTerm.trim()) return notes;
        
        const lowercaseSearch = searchTerm.toLowerCase();
        return notes.filter(note => {
            return (
                note.name?.toLowerCase().includes(lowercaseSearch) ||
                note.parent_name?.toLowerCase().includes(lowercaseSearch) ||
                note.description?.toLowerCase().includes(lowercaseSearch)
            );
        });
    }, []);

    // Apply all filters to notes
    const applyAllFilters = useCallback((notes) => {
        let filteredNotes = [...notes];
        
        // Apply search filter
        filteredNotes = filterNotesBySearch(filteredNotes, searchText);
        
        // Apply parent type filter
        if (parentTypeFilter) {
            filteredNotes = filteredNotes.filter(note => note.parent_type === parentTypeFilter);
        }
        
        // Apply time filter
        filteredNotes = applyTimeFilter(filteredNotes, timeFilter);
        
        return filteredNotes;
    }, [searchText, parentTypeFilter, timeFilter, filterNotesBySearch, applyTimeFilter]);

    // Client-side pagination
    const applyPagination = useCallback((notes, pageNumber, pageSize = 10) => {
        const startIndex = (pageNumber - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedNotes = notes.slice(startIndex, endIndex);
        
        const totalPages = Math.ceil(notes.length / pageSize);
        const hasNext = pageNumber < totalPages;
        const hasPrev = pageNumber > 1;
        
        return {
            notes: paginatedNotes,
            totalPages,
            hasNext,
            hasPrev
        };
    }, []);

    // Load all notes from API (only when needed)
    const loadAllNotes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Load all notes by requesting a large page size
            const response = await getNotesApi(10, 1, nameFields);
            
            // Process notes data
            const processedNotes = response.data.map(note => ({
                id: note.id,
                name: note.attributes.name,
                date_entered: note.attributes.date_entered,
                parent_type: note.attributes.parent_type,
                parent_name: note.attributes.parent_name,
                description: note.attributes.description,
                // Add other fields as needed
                ...note.attributes
            }));
            
            setAllNotes(processedNotes);
        
        } catch (err) {
            const fallbackError = await systemLanguageUtils.translate('ERR_AJAX_LOAD_FAILURE') || 'Không thể tải danh sách ghi chú';
            const errorMessage = err.response?.data?.message || err.message || fallbackError;
            setError(errorMessage);
            console.warn('Load all notes error:', err);
        } finally {
            setLoading(false);
        }
    }, [nameFields]);

    // Apply filters and pagination to display notes
    const updateDisplayedNotes = useCallback((pageNumber = currentPage) => {
        if (allNotes.length === 0) return;
        
        // Apply all filters
        const filteredNotes = applyAllFilters(allNotes);
        
        // Apply pagination
        const paginationResult = applyPagination(filteredNotes, pageNumber);
        
        // Update state
        setNotes(paginationResult.notes);
        setCurrentPage(pageNumber);
        setTotalPages(paginationResult.totalPages);
        setPagination({
            hasNext: paginationResult.hasNext,
            hasPrev: paginationResult.hasPrev,
            nextLink: paginationResult.hasNext ? 'next' : null,
            prevLink: paginationResult.hasPrev ? 'prev' : null
        });
    }, [allNotes, currentPage, applyAllFilters, applyPagination]);

    // Fetch notes with filters (now uses client-side filtering)
    const fetchNotes = useCallback(async (isRefresh = false, pageNumber = 1) => {
        if (!nameFields) return; // Wait for fields to be initialized
        
        if (isRefresh) {
            setRefreshing(true);
            // Reload all notes from API
            await loadAllNotes();
            setRefreshing(false);
        }
        
        // Update displayed notes with current filters and pagination
        updateDisplayedNotes(pageNumber);
    }, [nameFields, loadAllNotes, updateDisplayedNotes]);

    // Pagination functions
    const goToPage = useCallback((pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            updateDisplayedNotes(pageNumber);
        }
    }, [updateDisplayedNotes, totalPages]);

    const goToNextPage = useCallback(() => {
        if (pagination.hasNext && currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    }, [goToPage, currentPage, totalPages, pagination.hasNext]);

    const goToPrevPage = useCallback(() => {
        if (pagination.hasPrev && currentPage > 1) {
            goToPage(currentPage - 1);
        }
    }, [goToPage, currentPage, pagination.hasPrev]);

    // Filter functions (now trigger display update instead of API call)
    const handleSearch = useCallback((text) => {
        setSearchText(text);
        setCurrentPage(1); // Reset to first page
        // Trigger display update will happen via useEffect
    }, []);

    const handleParentTypeFilter = useCallback((parentType) => {
        setParentTypeFilter(parentType);
        setCurrentPage(1); // Reset to first page
        // Trigger display update will happen via useEffect
    }, []);

    const handleTimeFilter = useCallback((timeOption) => {
        setTimeFilter(timeOption);
        setCurrentPage(1); // Reset to first page
        // Trigger display update will happen via useEffect
    }, []);

    const clearFilters = useCallback(() => {
        setSearchText('');
        setParentTypeFilter('');
        setTimeFilter('all');
        setCurrentPage(1);
        // Trigger display update will happen via useEffect
    }, []);

    // Refresh function
    const refreshNotes = useCallback(() => {
        fetchNotes(true, currentPage);
    }, [fetchNotes, currentPage]);

    // Initialize on component mount - including language data and filter options
    useEffect(() => {
        const initializeData = async () => {
            try {
                // Initialize field definitions and language data
                await initializeFieldsAndLanguage();
                
                // Get all filter translations at once
                const filterTranslations = await systemLanguageUtils.translateKeys([
                    'all',  // "Tất cả"
                    'LBL_ACCOUNTS', // "Khách hàng"
                    'LBL_CONTACTS', // "Liên hệ"
                    'LBL_TASKS', // "Công việc"
                    'LBL_MEETINGS', // "Hội họp" -> tương đương meetings
                    'LBL_DROPDOWN_LIST_ALL', // "Tất cả"
                    'today',    // "Hôm nay"
                    'this_week', // "Tuần này"
                    'this_month' // "Tháng này"
                ]);
                
                // Set parent type options with translations
                setParentTypeOptions([
                    { value: 'all', label: filterTranslations.all || 'Tất cả' },
                    { value: 'Accounts', label: filterTranslations.LBL_ACCOUNTS || 'Khách hàng' },
                    { value: 'Contacts', label: filterTranslations.LBL_CONTACTS || 'Liên hệ' },
                    { value: 'Tasks', label: filterTranslations.LBL_TASKS || 'Công việc' },
                    { value: 'Meetings', label: filterTranslations.LBL_MEETINGS || 'Hội họp' }
                ]);
                
                // Set time filter options with translations
                setTimeFilterOptions([
                    { value: 'all', label: filterTranslations.LBL_DROPDOWN_LIST_ALL || 'Tất cả' },
                    { value: 'today', label: filterTranslations.today || 'Hôm nay' },
                    { value: 'this_week', label: filterTranslations.this_week || 'Tuần này' },
                    { value: 'this_month', label: filterTranslations.this_month || 'Tháng này' }
                ]);
                
                setFiltersInitialized(true);
            } catch (error) {
                console.error('UseNote_List: Error initializing filters:', error);
                // Set fallback options
                setParentTypeOptions([
                    { value: '', label: 'Tất cả' },
                    { value: 'Accounts', label: 'Khách hàng' },
                    { value: 'Contacts', label: 'Liên hệ' },
                    { value: 'Tasks', label: 'Công việc' },
                    { value: 'Meetings', label: 'Cuộc họp' }
                ]);
                
                setTimeFilterOptions([
                    { value: 'all', label: 'Tất cả' },
                    { value: 'today', label: 'Hôm nay' },
                    { value: 'this_week', label: 'Tuần này' },
                    { value: 'this_month', label: 'Tháng này' }
                ]);
                
                setFiltersInitialized(true);
            }
        };
        
        initializeData();
    }, []); // Remove dependency to avoid infinite loop

    // Load all notes when fields are ready
    useEffect(() => {
        if (nameFields && allNotes.length === 0) {
            loadAllNotes();
        }
    }, [nameFields, allNotes.length, loadAllNotes]);

    // Update displayed notes when filters change
    useEffect(() => {
        if (allNotes.length > 0) {
            updateDisplayedNotes(1); // Always start from page 1 when filters change
        }
    }, [searchText, parentTypeFilter, timeFilter, allNotes, updateDisplayedNotes]);

    return {
        // Data
        notes,
        columns,
        loading,
        refreshing,
        error,
        
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
        refreshNotes,
        goToPage,
        goToNextPage,
        goToPrevPage,
        handleSearch,
        handleParentTypeFilter,
        handleTimeFilter,
        clearFilters
    };
};
