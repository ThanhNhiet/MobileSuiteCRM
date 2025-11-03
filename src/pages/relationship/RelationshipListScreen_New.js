import { useNavigation, useRoute } from '@react-navigation/native';
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

import { AppTheme } from '@/src/configs/ThemeConfig';
import BottomNavigation from '../../components/navigations/BottomNavigation';
import TopNavigationRelationship from '../../components/navigations/TopNavigationRelationship';
import { useRelationshipList } from '../../services/useApi/relationship/UseRelationshipList';
import { SystemLanguageUtils } from '../../utils/cacheViewManagement/SystemLanguageUtils';

/**
 * RelationshipListScreen_New component
 * Independent of old relationship files, follows ModuleListScreen patterns
 * Receives relationship data via route params
 */
export default function RelationshipListScreen_New() {
    const navigation = useNavigation();
    const route = useRoute();
    
    // Get relationship data from route params (passed from ModuleDetailScreen renderRelationshipItem)
    const { 
        relationship,           // relationship object with moduleName, displayName, relatedLink, etc.
        sourceModule,           // source/parent module name  
        sourceRecordId,         // source/parent record ID
        parentModule,           // alternative parent module name (for backward compatibility)
        parentId,              // alternative parent record ID (for backward compatibility)
        parentRecord,          // parent record data (optional)
        relaFor
    } = route.params;
    
    // Extract moduleName and relatedLink from relationship
    const moduleName = relationship?.moduleName;
    const relatedLink = relationship?.relatedLink;
    const displayName = relationship?.displayName || relationship?.moduleLabel || moduleName;
    
    // Use sourceModule/sourceRecordId if available, otherwise fall back to parentModule/parentId
    const actualParentModule = sourceModule || parentModule;
    const actualParentId = sourceRecordId || parentId;
    
    // SystemLanguageUtils instance
    const systemLanguageUtils = SystemLanguageUtils.getInstance();
    
    // Translation states
    const [translations, setTranslations] = useState({
        mdName: displayName,
        searchPlaceholder: 'Enter search keywords',
        selectedTypeDefault: 'All',
        searchButton: 'Search',
        addButton: 'Add',
        loading: 'Loading...',
        tryAgain: 'Try Again',
        pullToRefresh: 'Pull to refresh...',
        noData: 'No data available',
        createNew: 'Create new'
    });
    
    const [translationsLoaded, setTranslationsLoaded] = useState(false);

    // State cho search và filter
    const [searchText, setSearchText] = useState('');
    const [selectedTimeFilter, setSelectedTimeFilter] = useState('');
    const [showTimeDropdown, setShowTimeDropdown] = useState(false);

    // Validation
    if (!moduleName || !relatedLink) {
        throw new Error('moduleName and relatedLink are required for RelationshipListScreen_New');
    }

    // Sử dụng custom hook
    const {
        records,
        columns,
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
        clearSearchAndFilters,
        formatCellValue
    } = useRelationshipList(moduleName, relatedLink);

    // Initialize translations
    useEffect(() => {
        const initializeTranslations = async () => {
            try {
                // Get all translations at once using SystemLanguageUtils
                const translated = await systemLanguageUtils.translateKeys([
                    `LBL_${moduleName.toUpperCase()}`,
                    'LBL_SEARCH_BUTTON_LABEL',
                    'LBL_CREATE_BUTTON_LABEL',
                    'LBL_EMAIL_LOADING',
                    'UPLOAD_REQUEST_ERROR',
                    'LBL_NO_DATA',
                    'LBL_DROPDOWN_LIST_ALL',
                    'LBL_IMPORT',
                    'LBL_SUBJECT',
                ]);
                

                
                setTranslations({
                    mdName: translated[`LBL_${moduleName.toUpperCase()}`] || displayName,
                    searchPlaceholder: `${translated.LBL_IMPORT || 'Enter'} keywords`,
                    selectedTypeDefault: translated.LBL_DROPDOWN_LIST_ALL || 'All',
                    searchButton: translated.LBL_SEARCH_BUTTON_LABEL || 'Search',
                    addButton: translated.LBL_CREATE_BUTTON_LABEL || 'Add',
                    loading: translated.LBL_EMAIL_LOADING || 'Loading...',
                    tryAgain: 'Try Again',
                    pullToRefresh: 'Pull to refresh...',
                    noData: translated.LBL_NO_DATA || 'No data available',
                    createNew: 'Create new'
                });
                
                setTranslationsLoaded(true);
            } catch (error) {
                console.error(`RelationshipListScreen_New (${moduleName}): Error loading translations:`, error);
                setTranslationsLoaded(true);
            }
        };
        
        initializeTranslations();
    }, [moduleName, systemLanguageUtils, displayName]);

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

    // formatCellValue is now provided by the hook

    // Wrapper function for search with filters
    const searchRecords = (searchText, filters = {}) => {
        // If there's a time filter, use handleFilter directly
        if (filters.time_filter !== undefined) {
            handleFilter({}, filters.time_filter);
        } else {
            // Otherwise use search
            hookHandleSearch(searchText);
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
        
        // Find selected time filter value
        const selectedTimeOption = timeFilterOptions.find(opt => opt.label === selectedTimeFilter);
        if (selectedTimeOption && selectedTimeOption.value) {
            filters.time_filter = selectedTimeOption.value;
        }
        
        searchRecords(searchText, filters);
    };

    // Handle time filter selection - filter immediately
    const handleTimeFilterSelect = (selectedOption) => {
        setSelectedTimeFilter(selectedOption);
        
        // Find selected time filter value and apply filter immediately
        const selectedTimeOption = timeFilterOptions.find(opt => opt.label === selectedOption);
        const filters = {};
        
        if (selectedTimeOption && selectedTimeOption.value) {
            filters.time_filter = selectedTimeOption.value;
        }
        
        // Apply filter immediately without waiting for search button
        searchRecords(searchText, filters);
    };

    const handlePageClick = (pageNumber) => {
        if (pageNumber !== currentPage) {
            setStartPage(Math.max(1, pageNumber - 1));
            // Load specific page - implement if needed
            // For now, we'll use the existing pagination
        }
    };

    // Navigation to create screen
    const navigateToCreateScreen = () => {
        const targetScreen = 'RelationshipCreateScreen_New';
        
        try {
            navigation.navigate(targetScreen, {
                moduleName,
                parentModule: actualParentModule,
                parentId: actualParentId,
                parentRecord,
                relationship,
                relaFor,
                relatedLink,
                refreshCallback: handleRefresh
            });
        } catch (error) {
            console.warn(`Navigation to ${targetScreen} failed:`, error);
            // Fallback to generic create if specific screen doesn't exist
            navigation.navigate('RelationshipCreateScreen_New', {
                moduleName,
                parentModule: actualParentModule,
                parentId: actualParentId,
                parentRecord,
                relationship,
                relaFor,
                relatedLink,
                refreshCallback: handleRefresh
            });
        }
    };

    // Navigation to detail screen
    const navigateToDetailScreen = (record) => {
        navigation.navigate('RelationshipDetailScreen_New', {
            moduleName,
            recordId: record.id,
            relatedLink,
        });
    };

    // Render individual record item with alternating colors like ModuleListScreen
    const renderItem = ({ item, index }) => {
        // Get field value function
        const getFieldValue = (item, fieldKey) => {
            // Try multiple key variations
            const possibleKeys = [
                fieldKey,
                fieldKey.toLowerCase(),
                fieldKey.toUpperCase(),
                fieldKey.replace(/_/g, ''),
                fieldKey.toLowerCase().replace(/_/g, ''),
                fieldKey.toUpperCase().replace(/_/g, '')
            ];
            
            for (const key of possibleKeys) {
                if (item[key] !== undefined && item[key] !== null && item[key] !== '') {
                    return item[key];
                }
            }
            return '';
        };
            
        return (
            <TouchableOpacity
                style={[styles.tableRow, index % 2 === 1 && styles.tableRowEven]}
                onPress={() => navigateToDetailScreen(item)}
            >
                {columns.map((column, columnIndex) => {
                    const rawValue = getFieldValue(item, column.key);
                    const formattedValue = formatCellValue ? formatCellValue(column.key, rawValue) : rawValue;
                    console.log('Rendering cell:', { columnKey: column.key, rawValue, formattedValue });
                    return (
                        <Text key={columnIndex} style={styles.cell}>
                            {formattedValue || '-'}
                        </Text>
                    );
                })}
            </TouchableOpacity>
        );
    };

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
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />

                <TopNavigationRelationship
                    moduleName={translations.mdName}
                    navigation={navigation}
                />

                <View style={styles.content}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        {/* Search Form */}
                        <View style={{ flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                            <View style={styles.searchBar}>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder={translations.searchPlaceholder}
                                    value={searchText}
                                    onChangeText={setSearchText}
                                    placeholderTextColor="#999"
                                />
                            </View>
                            <View style={styles.searchFormOptions}>
                                <TouchableOpacity
                                    style={styles.select}
                                    onPress={() => setShowTimeDropdown(true)}
                                >
                                    <Text>{selectedTimeFilter || translations.selectedTypeDefault}</Text>
                                    <Text style={styles.dropdownArrow}>▼</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.searchButton} onPress={handleSearchAction}>
                                    <Text style={{ color: '#fff' }}>{translations.searchButton}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Add new "+" button */}
                        <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                            <TouchableOpacity
                                onPress={navigateToCreateScreen}
                                style={styles.addNewBtn}
                            >
                                <Text style={styles.plusText}>+</Text>
                            </TouchableOpacity>
                            <Text>{translations.addButton}</Text>
                        </View>
                    </View>

                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        {loading && !translationsLoaded ? (
                            <Text style={styles.headerCell}>{translations.loading}</Text>
                        ) : !Array.isArray(columns) || columns.length === 0 ? (
                            <Text style={styles.headerCell}>Loading columns...</Text>
                        ) : (
                            columns
                                .filter(column => column && column.key && column.key !== 'id')
                                .slice(0, 3)
                                .map((column, index) => (
                                    <Text key={index} style={styles.headerCell}>
                                        {(column.label && typeof column.label === 'string') ? column.label : column.key}
                                    </Text>
                                ))
                        )}
                    </View>

                    {/* Table Rows - Scrollable */}
                    {loading && !refreshing ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={AppTheme.colors.loadingIcon} />
                            <Text>{translations.loading}</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>Error: {error}</Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={handleRefresh}
                            >
                                <Text style={styles.retryText}>{translations.tryAgain}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={records || []}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            style={styles.list}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={handleRefresh}
                                    colors={[AppTheme.colors.loadingIcon]}
                                    title={translations.pullToRefresh}
                                />
                            }
                            onEndReached={loadMore}
                            onEndReachedThreshold={0.1}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text>{translations.noData}</Text>
                                    <Text>Module: {moduleName}</Text>
                                    <Text>Records: {records?.length || 0}</Text>
                                </View>
                            }
                        />
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
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
                                    onPress={() => handlePageClick(num)}
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
                    )}
                </View>

                <BottomNavigation navigation={navigation} />

                {/* Dropdown Modal */}
                <DropdownSelect
                    options={timeOptions}
                    selectedValue={selectedTimeFilter}
                    onSelect={handleTimeFilterSelect}
                    visible={showTimeDropdown}
                    onClose={() => setShowTimeDropdown(false)}
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppTheme.colors.backgroundContainer
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
        borderRadius: 4,
        borderColor: '#ddd',
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
        borderColor: '#ddd',
    },
    dropdownArrow: {
        fontSize: 10,
        marginLeft: 5,
        color: '#666',
    },
    searchButton: {
        backgroundColor: AppTheme.colors.btnSecondary,
        padding: 6,
        paddingHorizontal: 16,
        borderRadius: 4,
    },
    addNewBtn: {
        width: 60,
        height: 60,
        backgroundColor: AppTheme.colors.btnSecondary,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
    },
    plusText: {
        color: '#fff',
        fontSize: 40,
        lineHeight: 27,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: AppTheme.colors.navBG,
        padding: 8,
        borderRadius: 4,
    },
    headerCell: {
        flex: 1,
        fontWeight: 'bold',
        color: AppTheme.colors.navText,
    },
    tableRow: {
        flexDirection: 'row',
        padding: 11,
        backgroundColor: '#F3F0EF',
        borderBottomWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
    },
    tableRowEven: {
        backgroundColor: AppTheme.colors.primaryColor1SupperLight,
    },
    cell: { 
        flex: 1,
        color: '#333',
    },
    list: {
        flexGrow: 0,
        maxHeight: 500,
    },
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
        backgroundColor: '#fff',
    },
    activePage: {
        backgroundColor: AppTheme.colors.btnSecondary,
        borderColor: AppTheme.colors.btnSecondary,
    },
    disabledBtn: {
        borderColor: '#eee',
        backgroundColor: '#f9f9f9',
    },
    // Loading and Error states
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        color: '#e74c3c',
        textAlign: 'center',
        marginBottom: 10,
    },
    retryButton: {
        backgroundColor: AppTheme.colors.btnSecondary,
        padding: 10,
        borderRadius: 4,
    },
    retryText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
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
        minWidth: 150,
        maxHeight: 250,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        borderRadius: 4,
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectedItem: {
        backgroundColor: AppTheme.colors.primaryColor2,
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
    },
    selectedText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
