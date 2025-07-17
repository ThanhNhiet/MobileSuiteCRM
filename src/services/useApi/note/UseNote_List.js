import { useCallback, useEffect, useState } from 'react';
import {
    getNoteListFieldsApi,
    getNotesApi,
    getNotesLanguageApi
} from '../../api/note/NoteApi';

export const useNoteList = () => {
    const [notes, setNotes] = useState([]);
    const [allNotes, setAllNotes] = useState([]); // Store all notes for client-side filtering
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    
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
    const parentTypeOptions = [
        { value: '', label: 'Tất cả' },
        { value: 'Accounts', label: 'Khách hàng' },
        { value: 'Users', label: 'Người dùng' },
        { value: 'Tasks', label: 'Công việc' },
        { value: 'Meetings', label: 'Cuộc họp' }
    ];
    
    const timeFilterOptions = [
        { value: 'all', label: 'Tất cả' },
        { value: 'today', label: 'Hôm nay' },
        { value: 'this_week', label: 'Tuần này' },
        { value: 'this_month', label: 'Tháng này' }
    ];

    // Initialize fields and language
    const initializeFieldsAndLanguage = useCallback(async () => {
        try {
            // Get default fields for list view
            const fieldsResponse = await getNoteListFieldsApi();
            const defaultFields = fieldsResponse.default_fields;
            
            // Create nameFields string (include parent_type, parent_name for filtering)
            const fieldKeys = Object.keys(defaultFields).map(key => key.toLowerCase());
            const requiredFields = [...fieldKeys, 'parent_type', 'parent_name'];
            const nameFieldsString = requiredFields.join(',');
            setNameFields(nameFieldsString);
            
            // Get language data
            const languageResponse = await getNotesLanguageApi();
            const modStrings = languageResponse.data.mod_strings;
            
            // Create columns with Vietnamese labels
            const columnsData = Object.entries(defaultFields).map(([fieldKey, fieldInfo]) => {
                const labelKey = fieldInfo.label;
                const vietnameseLabel = modStrings[labelKey] || fieldKey;
                
                return {
                    key: fieldKey.toLowerCase(),
                    label: vietnameseLabel,
                    width: fieldInfo.width,
                    type: fieldInfo.type
                };
            });
            
            setColumns(columnsData);
        } catch (err) {
            console.warn('Initialize fields and language error:', err);
            setError('Không thể tải cấu hình hiển thị');
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
            const response = await getNotesApi(1000, 1, nameFields);
            
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
            const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách ghi chú';
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

    // Initialize on component mount
    useEffect(() => {
        initializeFieldsAndLanguage();
    }, [initializeFieldsAndLanguage]);

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
