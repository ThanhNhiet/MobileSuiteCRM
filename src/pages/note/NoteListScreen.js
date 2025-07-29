import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';


import BottomNavigation from '../../components/navigations/BottomNavigation';
import TopNavigation from '../../components/navigations/TopNavigation';
import { useNoteList } from '../../services/useApi/note/UseNote_List';
import { SystemLanguageUtils } from '../../utils/SystemLanguageUtils';

export default function NoteListScreen() {
    const navigation = useNavigation();
    
    // SystemLanguageUtils instance
    const systemLanguageUtils = SystemLanguageUtils.getInstance();
    
    // Translation states
    const [translations, setTranslations] = useState({
        mdName: 'Ghi chú',
        searchPlaceholder: 'Nhập từ khóa tìm kiếm',
        selectedTypeDefault: 'Tất cả',
        searchButton: 'Tìm',
        addButton: 'Thêm',
        loading: 'Đang tải...',
        tryAgain: 'Thử lại',
        pullToRefresh: 'Kéo để tải lại...',
        noData: 'Không có dữ liệu'
    });
    
    const [translationsLoaded, setTranslationsLoaded] = useState(false);

    // State cho search và filter
    const [searchText, setSearchText] = useState('');
    const [selectedType1, setSelectedType1] = useState('');
    const [selectedType2, setSelectedType2] = useState('');
    const [showDropdown1, setShowDropdown1] = useState(false);
    const [showDropdown2, setShowDropdown2] = useState(false);

    // Sử dụng custom hook
    const {
        notes,
        columns,
        parentTypeOptions,
        timeFilterOptions,
        filtersInitialized,
        currentPage,
        totalPages,
        loading,
        refreshing,
        error,
        handleSearch: hookHandleSearch,
        refreshNotes,
        goToPage,
        handleParentTypeFilter,
        handleTimeFilter
    } = useNoteList();

    // Initialize translations
    useEffect(() => {
        const initializeTranslations = async () => {
            try {
                // Get all translations at once using SystemLanguageUtils
                const translated = await systemLanguageUtils.translateKeys([
                    'LBL_NOTES',  // Ghi chú
                    'LBL_SEARCH_BUTTON_LABEL',  // Tìm
                    'LBL_CREATE_BUTTON_LABEL',  // Tạo 
                    'LBL_EMAIL_LOADING',    // "Đang tải...
                    'UPLOAD_REQUEST_ERROR',   // Thử lại
                    'LBL_NO_DATA',  // "Không có dữ liệu"
                    'LBL_DROPDOWN_LIST_ALL',   // "Tất cả"
                    'LBL_IMPORT',   // "Nhập"
                    'LBL_SUBJECT',  // "Chủ đề"
                    'Prospects' // "Đối tượng"
                ]);
                
                setTranslations({
                    mdName: translated.LBL_NOTES || 'Ghi chú',
                    searchPlaceholder: translated.LBL_IMPORT + ' ' + translated.LBL_SUBJECT || 'Nhập từ khóa tìm kiếm',
                    selectedTypeDefault: translated.LBL_DROPDOWN_LIST_ALL || 'Tất cả',
                    searchButton: translated.LBL_SEARCH_BUTTON_LABEL || 'Tìm',
                    addButton: translated.LBL_CREATE_BUTTON_LABEL || 'Thêm',
                    loading: translated.LBL_EMAIL_LOADING || 'Đang tải...',
                    tryAgain: translated.UPLOAD_REQUEST_ERROR || 'Thử lại',
                    pullToRefresh: 'Kéo để tải lại...',
                    noData: translated.LBL_NO_DATA || 'Không có dữ liệu'
                });
                
                setTranslationsLoaded(true);
            } catch (error) {
                console.error('NoteListScreen: Error loading translations:', error);
                setTranslationsLoaded(true);
            }
        };
        
        initializeTranslations();
    }, []);

    // Update filter dropdown defaults when options are loaded
    useEffect(() => {
        if (filtersInitialized && parentTypeOptions.length > 0 && timeFilterOptions.length > 0) {
            // Set default values for dropdowns using the first option (which should be "Tất cả")
            setSelectedType1(parentTypeOptions[0]?.label || 'Tất cả');
            setSelectedType2(timeFilterOptions[0]?.label || 'Tất cả');
        }
    }, [filtersInitialized, parentTypeOptions, timeFilterOptions]);

    // Utility functions for data display
    const getFieldValue = (item, fieldKey) => {
        return item[fieldKey] || '';
    };

    const getColumnLabel = (fieldKey) => {
        const column = columns.find(col => col.key === fieldKey);
        return column ? column.label : fieldKey;
    };

    const formatCellValue = (fieldKey, value) => {
        if (!value) return '';
        
        // Format dates
        if (fieldKey.includes('date') || fieldKey.includes('_entered') || fieldKey.includes('_modified')) {
            try {
                const date = new Date(value);
                return date.toLocaleDateString('vi-VN');
            } catch {
                return value;
            }
        }
        
        // Format parent_type to Vietnamese
        if (fieldKey === 'parent_type') {
            const parentTypeOption = parentTypeOptions.find(opt => opt.value === value);
            return parentTypeOption ? parentTypeOption.label : value;
        }
        
        return String(value);
    };

    // Wrapper functions for pagination
    const loadPage = (pageNumber) => {
        goToPage(pageNumber);
    };

    // Wrapper function for search with filters
    const searchNotes = (searchText, filters = {}) => {
        // Apply search text
        hookHandleSearch(searchText || '');
        
        // Apply parent type filter
        if (filters.parent_type) {
            handleParentTypeFilter(filters.parent_type);
        } else {
            handleParentTypeFilter(''); // Clear filter
        }
        
        // Apply time filter  
        if (filters.time_filter) {
            handleTimeFilter(filters.time_filter);
        } else {
            handleTimeFilter('all'); // Clear filter
        }
    };

    // Options cho dropdown (mapping từ hook options)
    const typeOptions1 = [...(Array.isArray(parentTypeOptions) ? parentTypeOptions.map(opt => opt.label) : [])];
    const typeOptions2 = [...(Array.isArray(timeFilterOptions) ? timeFilterOptions.map(opt => opt.label) : [])];

    // Tính danh sách trang hiển thị (tối đa 3 trang)
    const [startPage, setStartPage] = useState(1);
    const visiblePages = Array.from({ length: 3 }, (_, i) => startPage + i).filter(p => p <= totalPages);

    // Vô hiệu hóa khi ở đầu/cuối
    const isPrevDisabled = startPage === 1;
    const isNextDisabled = startPage + 2 >= totalPages;

    const handlePrev = () => {
        if (!isPrevDisabled) {
            const newStart = startPage - 1;
            setStartPage(newStart);
            loadPage(newStart);
        }
    };

    const handleNext = () => {
        if (!isNextDisabled) {
            const newStart = startPage + 1;
            setStartPage(newStart);
            loadPage(newStart);
        }
    };

    const handleSearch = () => {
        const filters = {};
        
        // Parent type filter - compare with the "Tất cả" option
        const allParentOption = parentTypeOptions[0]?.label || 'Tất cả';
        if (selectedType1 !== allParentOption) {
            const parentType = parentTypeOptions.find(opt => opt.label === selectedType1);
            if (parentType) {
                filters.parent_type = parentType.value;
            }
        }
        
        // Time filter - compare with the "Tất cả" option
        const allTimeOption = timeFilterOptions[0]?.label || 'Tất cả';
        if (selectedType2 !== allTimeOption) {
            const timeFilter = timeFilterOptions.find(opt => opt.label === selectedType2);
            if (timeFilter) {
                filters.time_filter = timeFilter.value;
            }
        }
        
        searchNotes(searchText, filters);
        setStartPage(1); // Reset về trang 1 khi search
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.tableRow} onPress={() => {navigation.navigate('NoteDetailScreen', { noteId: item.id })}}>
            {columns.map((column, index) => (
                <Text key={index} style={styles.cell}>
                    {formatCellValue(column.key, getFieldValue(item, column.key))}
                </Text>
            ))}
        </TouchableOpacity>
    );

    // Component Dropdown
    const DropdownSelect = ({ options, selectedValue, onSelect, visible, onClose }) => (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={styles.modalOverlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <View style={styles.dropdownContainer}>
                    {options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dropdownItem,
                                option === selectedValue && styles.selectedItem
                            ]}
                            onPress={() => {
                                onSelect(option);
                                onClose();
                            }}
                        >
                            <Text style={[
                                styles.dropdownText,
                                option === selectedValue && styles.selectedText
                            ]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
            <SafeAreaProvider>
                <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />
                
                <TopNavigation moduleName={translations.mdName} navigation={navigation}/>

                <View style={styles.content}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between'}}>
                        {/* Search Form */}
                        <View style={{ flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                            <View style={styles.searchBar}>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder={translations.searchPlaceholder}
                                    value={searchText}
                                    onChangeText={setSearchText}
                                />
                            </View>
                            <View style={styles.searchFormOptions}>
                                <TouchableOpacity 
                                    style={styles.select} 
                                    onPress={() => filtersInitialized && setShowDropdown1(true)}
                                    disabled={!filtersInitialized}
                                >
                                    <Text style={!filtersInitialized ? { color: '#ccc' } : {}}>
                                        {filtersInitialized ? selectedType1 : 'Đang tải...'}
                                    </Text>
                                    <Text style={styles.dropdownArrow}>▼</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.select} 
                                    onPress={() => filtersInitialized && setShowDropdown2(true)}
                                    disabled={!filtersInitialized}
                                >
                                    <Text style={!filtersInitialized ? { color: '#ccc' } : {}}>
                                        {filtersInitialized ? selectedType2 : 'Đang tải...'}
                                    </Text>
                                    <Text style={styles.dropdownArrow}>▼</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.searchButton, !filtersInitialized && { backgroundColor: '#ccc' }]} 
                                    onPress={handleSearch}
                                    disabled={!filtersInitialized}
                                >
                                    <Text style={{ color: '#fff' }}>{translations.searchButton}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Add new "+" */}
                        <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                            <TouchableOpacity
                                onPress={() => {
                                    navigation.navigate('NoteCreateScreen');
                                }}
                                style={[styles.addNewBtn]}
                            >
                                <Text style={styles.plusText}>+</Text>
                            </TouchableOpacity>
                            <Text>{translations.addButton}</Text>
                        </View>
                    </View>


                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        {columns.map((column, index) => (
                            <Text key={index} style={styles.headerCell}>
                                {column.label}
                            </Text>
                        ))}
                    </View>

                    {/* Loading State */}
                    {loading && (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#4B84FF" />
                            <Text style={{ marginTop: 10, color: '#666' }}>{translations.loading}</Text>
                        </View>
                    )}

                    {/* Error State */}
                    {error && (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: '#FF3B30', marginBottom: 10 }}>{error}</Text>
                            <TouchableOpacity 
                                style={styles.searchButton} 
                                onPress={refreshNotes}
                            >
                                <Text style={{ color: '#fff' }}>{translations.tryAgain}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Table Rows - Scrollable */}
                    {!loading && !error && (
                        <FlatList
                            data={notes}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            style={styles.list}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={() => (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ color: '#666', fontSize: 16 }}>{translations.noData}</Text>
                                </View>
                            )}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={refreshNotes}
                                    colors={['#4B84FF']}
                                    title={translations.pullToRefresh}
                                />
                            }
                        />
                    )}

                    <View style={styles.pagination}>
                        {/* Prev */}
                        <TouchableOpacity
                            onPress={handlePrev}
                            style={[styles.pageBtn, isPrevDisabled && styles.disabledBtn]}
                            disabled={isPrevDisabled}
                        >
                            <Text style={isPrevDisabled ? { color: '#aaa' } : {}}>{'<'}</Text>
                        </TouchableOpacity>

                        {/* Page numbers */}
                        {visiblePages.map((num) => (
                            <TouchableOpacity
                                key={num}
                                onPress={() => {
                                    loadPage(num);
                                    if (num < startPage || num > startPage + 2) {
                                        setStartPage(Math.max(1, num - 1));
                                    }
                                }}
                                style={[styles.pageBtn, num === currentPage && styles.activePage]}
                            >
                                <Text style={num === currentPage ? { color: '#fff' } : {}}>{num}</Text>
                            </TouchableOpacity>
                        ))}

                        {/* Next */}
                        <TouchableOpacity
                            onPress={handleNext}
                            style={[styles.pageBtn, isNextDisabled && styles.disabledBtn]}
                            disabled={isNextDisabled}
                        >
                            <Text style={isNextDisabled ? { color: '#aaa' } : {}}>{'>'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                <BottomNavigation navigation={navigation}/>

                {/* Dropdown Modals - only show when filters are initialized */}
                {filtersInitialized && (
                    <>
                        <DropdownSelect
                            options={typeOptions1}
                            selectedValue={selectedType1}
                            onSelect={setSelectedType1}
                            visible={showDropdown1}
                            onClose={() => setShowDropdown1(false)}
                        />
                        <DropdownSelect
                            options={typeOptions2}
                            selectedValue={selectedType2}
                            onSelect={setSelectedType2}
                            visible={showDropdown2}
                            onClose={() => setShowDropdown2(false)}
                        />
                    </>
                )}
            </SafeAreaProvider>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },

    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 10,
        minHeight: '80%',
    },
    searchBar: {
        height: 35,
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
        alignItems: 'center',
    },
    searchFormOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    input: {
        borderWidth: 1,
        padding: 6,
        flex: 1,
        minWidth: '80%',
        backgroundColor: '#fff',
    },
    select: {
        borderWidth: 1,
        padding: 6,
        backgroundColor: '#eee',
        minWidth: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 4,
    },
    dropdownArrow: {
        fontSize: 10,
        marginLeft: 5,
        color: '#666',
    },
    searchButton: {
        backgroundColor: '#4B84FF',
        padding: 6,
        paddingHorizontal: 16,
        borderRadius: 4,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#C9B4AB',
        padding: 8,
    },
    headerCell: {
        flex: 1,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 11,
        backgroundColor: '#F3F0EF',
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    cell: { flex: 1 },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center', 
        paddingVertical: 10,
        gap: 6,
    },
    pageBtn: {
        padding: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        minWidth: 32,
        alignItems: 'center',
    },
    activePage: {
        backgroundColor: '#4B84FF',
        borderColor: '#4B84FF',
    },
    disabledBtn: {
        borderColor: '#eee',
        backgroundColor: '#f9f9f9',
    },
    addNewBtn: {
        width: 60,
        height: 60,
        backgroundColor: '#4B84FF',
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
    },
    plusText: {
        color: '#fff',
        fontSize: 40,
        lineHeight: 27, // Đảm bảo chữ "+" nằm giữa
    },
    list: {
        flexGrow: 0, // Đảm bảo không chiếm toàn bộ không gian
        maxHeight: 500, // Chiều cao list
    },
    // Dropdown styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownContainer: {
        backgroundColor: 'white',
        minWidth: 200,
        maxHeight: 'auto',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        }
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectedItem: {
        backgroundColor: '#4B84FF',
    },
    dropdownText: {
        fontSize: 16,
        alignSelf: 'center',
        color: '#333',
    },
    selectedText: {
        color: 'white',
        fontWeight: 'bold',
    },
});