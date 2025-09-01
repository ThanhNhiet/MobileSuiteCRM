import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import { useModule_List } from '../../services/useApi/module/UseModule_List';
import { SystemLanguageUtils } from '../../utils/cacheViewManagement/SystemLanguageUtils';
import { formatDateBySelectedLanguage } from '../../utils/format/FormatDateTime';

/**
 * Generic ModuleListScreen component
 * Receives moduleName via route params
 */
export default function ModuleListScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    
    // Get moduleName from route params
    const moduleName = route.params?.moduleName;
    
    // SystemLanguageUtils instance
    const systemLanguageUtils = SystemLanguageUtils.getInstance();
    
    // Translation states
    const [translations, setTranslations] = useState({
        mdName: moduleName,
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
    const [selectedTimeFilter, setSelectedTimeFilter] = useState('');
    const [showTimeDropdown, setShowTimeDropdown] = useState(false);

    // Validation
    if (!moduleName) {
        throw new Error('moduleName is required for ModuleListScreen');
    }

    // Sử dụng custom hook
    const {
        records,
        columns,
        recordsRole,
        viewPerm,
        timeFilterOptions,
        filtersInitialized,
        currentPage,
        totalPages,
        loading,
        refreshing,
        error,
        handleSearch: hookHandleSearch,
        handleRefresh,
        loadMore,
        handleFilter,
        clearSearchAndFilters
    } = useModule_List(moduleName);

    // Initialize translations
    useEffect(() => {
        const initializeTranslations = async () => {
            try {
                // Get all translations at once using SystemLanguageUtils
                const translated = await systemLanguageUtils.translateKeys([
                    `LBL_${moduleName.toUpperCase()}`,  // Module name
                    'LBL_SEARCH_BUTTON_LABEL',  // Tìm
                    'LBL_CREATE_BUTTON_LABEL',  // Tạo 
                    'LBL_EMAIL_LOADING',    // "Đang tải...
                    'UPLOAD_REQUEST_ERROR',   // Thử lại
                    'LBL_NO_DATA',  // "Không có dữ liệu"
                    'LBL_DROPDOWN_LIST_ALL',   // "Tất cả"
                    'LBL_IMPORT',   // "Nhập"
                    'LBL_SUBJECT',  // "Chủ đề"
                ]);
                
                setTranslations({
                    mdName: translated[`LBL_${moduleName.toUpperCase()}`] || moduleName,
                    searchPlaceholder: translated.LBL_IMPORT + ' ' + translated.LBL_SUBJECT || 'Nhập từ khóa tìm kiếm',
                    selectedTypeDefault: translated.LBL_DROPDOWN_LIST_ALL || 'Tất cả',
                    searchButton: translated.LBL_SEARCH_BUTTON_LABEL || 'Tìm',
                    addButton: translated.LBL_CREATE_BUTTON_LABEL || 'Thêm',
                    loading: translated.LBL_EMAIL_LOADING || 'Đang tải...',
                    tryAgain: translated.UPLOAD_REQUEST_ERROR || 'Thử lại',
                    pullToRefresh: 'Pull to refresh...',
                    noData: translated.LBL_NO_DATA || 'Không có dữ liệu'
                });
                
                setTranslationsLoaded(true);
            } catch (error) {
                console.error(`ModuleListScreen (${moduleName}): Error loading translations:`, error);
                setTranslationsLoaded(true);
            }
        };
        
        initializeTranslations();
    }, [moduleName, systemLanguageUtils]);

    // Update filter dropdown defaults when options are loaded
    useEffect(() => {
        if (filtersInitialized && timeFilterOptions.length > 0) {
            // Set default values for dropdown using the first option (which should be "All Time")
            setSelectedTimeFilter(timeFilterOptions[0]?.label || translations.selectedTypeDefault);
        } else if (!filtersInitialized) {
            // Reset to empty when not initialized
            setSelectedTimeFilter('');
        }
    }, [filtersInitialized, timeFilterOptions, translations.selectedTypeDefault]);

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
        
        // Format dates using formatDateBySelectedLanguage
        if (fieldKey.includes('date') || fieldKey.includes('_entered') || fieldKey.includes('_modified') || fieldKey.includes('_due') || fieldKey.includes('_start') || fieldKey.includes('_end')) {
            try {
                // Convert to ISO string if it's not already
                const isoString = value.includes('T') ? value : new Date(value).toISOString();
                return formatDateBySelectedLanguage(isoString);
            } catch {
                return value;
            }
        }
        
        return String(value);
    };

    // Wrapper function for search with filters (updated for API-based filtering)
    const searchRecords = (searchText, filters = {}) => {
        // Update search text first if provided
        if (searchText !== undefined) {
            hookHandleSearch(searchText);
        }
        
        // Then apply time filter
        if (filters.time_filter !== undefined) {
            handleFilter({}, filters.time_filter);
        }
    };

    // Options cho dropdown (mapping từ hook options)
    const timeOptions = [...(Array.isArray(timeFilterOptions) ? timeFilterOptions.map(opt => opt.label) : [])];

    // Tính danh sách trang hiển thị (tối đa 3 trang)
    const [startPage, setStartPage] = useState(1);
    const visiblePages = Array.from({ length: 3 }, (_, i) => startPage + i).filter(p => p <= totalPages);

    // Vô hiệu hóa khi ở đầu/cuối
    const isPrevDisabled = startPage === 1;
    const isNextDisabled = startPage + 2 >= totalPages;

    const handlePrev = () => {
        if (!isPrevDisabled && startPage > 1) {
            const newStart = startPage - 1;
            setStartPage(newStart);
            // Load new page via loadMore if needed
            loadMore();
        }
    };

    const handleNext = () => {
        if (!isNextDisabled && startPage + 2 < totalPages) {
            const newStart = startPage + 1;
            setStartPage(newStart);
            // Load new page via loadMore if needed
            loadMore();
        }
    };

    const handleSearchAction = () => {
        const filters = {};
        
        // Time filter - compare with the "Tất cả" option
        const allTimeOption = timeFilterOptions[0]?.label || 'Tất cả';
        if (selectedTimeFilter !== allTimeOption) {
            const timeFilter = timeFilterOptions.find(opt => opt.label === selectedTimeFilter);
            if (timeFilter) {
                filters.time_filter = timeFilter.value;
            }
        }
        
        searchRecords(searchText, filters);
        setStartPage(1); // Reset về trang 1 khi search
    };

    // Handler for when user selects a filter option - automatically trigger search
    const handleFilterSelect = (selectedLabel) => {
        setSelectedTimeFilter(selectedLabel);
        setShowTimeDropdown(false);
        
        // Automatically trigger search with the new filter
        const allTimeOption = timeFilterOptions[0]?.label || 'Tất cả';
        if (selectedLabel !== allTimeOption) {
            const timeFilter = timeFilterOptions.find(opt => opt.label === selectedLabel);
            if (timeFilter) {
                // Only apply time filter, keep current search text
                handleFilter({}, timeFilter.value);
            }
        } else {
            // Clear time filter but keep search text
            handleFilter({}, '');
        }
        
        setStartPage(1);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.tableRow} 
            onPress={() => {
                if (viewPerm.includes(item.id)) {
                    navigation.navigate('ModuleDetailScreen', { 
                        moduleName: moduleName,
                        recordId: item.id
                    });
                } else{
                    Alert.alert('Permission Denied', 'You do not have permission to view this record.');
                }
            }}
        >
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
                                    onPress={() => filtersInitialized && setShowTimeDropdown(true)}
                                    disabled={!filtersInitialized}
                                >
                                    <Text style={!filtersInitialized ? { color: '#ccc' } : {}}>
                                        {filtersInitialized ? (selectedTimeFilter || translations.selectedTypeDefault) : translations.selectedTypeDefault}
                                    </Text>
                                    <Text style={styles.dropdownArrow}>▼</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.searchButton} 
                                    onPress={handleSearchAction}
                                >
                                    <Text style={{ color: '#fff' }}>{translations.searchButton}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Add new "+" */}
                        <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                            <TouchableOpacity
                                onPress={() => {
                                    navigation.navigate('ModuleCreateScreen', { moduleName: moduleName });
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
                                onPress={handleRefresh}
                            >
                                <Text style={{ color: '#fff' }}>{translations.tryAgain}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Table Rows - Scrollable */}
                    {!loading && !error && (
                        <FlatList
                            data={recordsRole}
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
                                    onRefresh={handleRefresh}
                                    colors={['#4B84FF']}
                                    title={translations.pullToRefresh}
                                />
                            }
                            onEndReached={loadMore}
                            onEndReachedThreshold={0.1}
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
                                    if (num < startPage || num > startPage + 2) {
                                        setStartPage(Math.max(1, num - 1));
                                    }
                                    // Note: For full pagination support, you might need to extend the hook
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

                {/* Dropdown Modal - only show when filters are initialized */}
                {filtersInitialized && (
                    <DropdownSelect
                        options={timeOptions}
                        selectedValue={selectedTimeFilter}
                        onSelect={handleFilterSelect}
                        visible={showTimeDropdown}
                        onClose={() => setShowTimeDropdown(false)}
                    />
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