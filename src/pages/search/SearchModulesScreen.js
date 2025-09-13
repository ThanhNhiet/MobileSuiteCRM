import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { searchModulesApi } from '../../services/api/external/ExternalApi';
import { SystemLanguageUtils } from '../../utils/cacheViewManagement/SystemLanguageUtils';
import { formatDateBySelectedLanguage } from '../../utils/format/FormatDateTime_Zones';

const SearchModulesScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { parentType, title, onSelect } = route.params || {};
    // SystemLanguageUtils instance
    const systemLanguageUtils = SystemLanguageUtils.getInstance();

    // States
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasSearched, setHasSearched] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Define columns - fixed for all types
    const [columns, setColumns] = useState([
        { key: 'name', label: 'Tên', flex: 3 },
        { key: 'date_entered', label: 'Ngày tạo', flex: 2 },
        { key: 'id', label: 'ID', flex: 3}
    ]);

    // Translations
    const [translations, setTranslations] = useState({
        search: 'Tìm',
        searchPlaceholder: 'Nhập từ khóa tìm kiếm...',
        loading: 'Đang tải...',
        noData: 'Không có dữ liệu',
        loadMore: 'Tải thêm',
        close: 'Đóng'
    });

    // Initialize translations
    useEffect(() => {
        const initializeTranslations = async () => {
            try {
                const translated = await systemLanguageUtils.translateKeys([
                    'LBL_SEARCH_BUTTON_LABEL',
                    'LBL_IMPORT',
                    'LBL_SUBJECT',
                    'LBL_EMAIL_LOADING',
                    'LBL_NO_DATA',
                    'LBL_LOAD_MORE',
                    'LBL_CLOSE',
                    'LBL_LIST_NAME',
                    'LBL_DATE_ENTERED'
                ]);

                setTranslations({
                    search: translated.LBL_SEARCH_BUTTON_LABEL || 'Tìm',
                    searchPlaceholder: `${translated.LBL_IMPORT || 'Nhập'} ${translated.LBL_SUBJECT || 'từ khóa'}...`,
                    loading: translated.LBL_EMAIL_LOADING || 'Đang tải...',
                    noData: translated.LBL_NO_DATA || 'Không có dữ liệu',
                    loadMore: translated.LBL_LOAD_MORE || 'Tải thêm',
                    close: translated.LBL_CLOSE || 'Đóng'
                });

                // Update columns with translations
                setColumns([
                    { key: 'name', label: translated.LBL_LIST_NAME || 'Tên', flex: 3 },
                    { key: 'date_entered', label: translated.LBL_DATE_ENTERED || 'Ngày tạo', flex: 2 },
                    { key: 'id', label: 'ID', flex: 2 }
                ]);
            } catch (error) {
                console.warn('Translation initialization error:', error);
            }
        };

        initializeTranslations();
    }, []);

    // Handle search
    const handleSearch = useCallback(async (page = 1, isLoadMore = false) => {
        if (!searchText || typeof searchText !== 'string' || !searchText.trim() || !parentType) {
            return;
        }

        try {
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
                setData([]);
                setCurrentPage(1);
            }

            const response = await searchModulesApi(parentType, searchText.trim(), page);

            if (response && response.data) {
                const rawData = response.data || [];
                // Filter out null/undefined items and validate data
                const newData = rawData.filter(item => {
                    if (!item || item === null || item === undefined) {
                        console.warn('Filtered out null/undefined item:', item);
                        return false;
                    }
                    return true;
                });
                
                if (isLoadMore) {
                    setData(prevData => [...prevData, ...newData]);
                } else {
                    setData(newData);
                }

                // Use correct response structure
                const totalPages = response.pagination?.total_pages || 1;
                const currentPageFromResponse = response.pagination?.current_page || page;
                
                setTotalPages(totalPages);
                setCurrentPage(currentPageFromResponse);
                setHasSearched(true);
            }
        } catch (error) {
            console.warn('Search error:', error);
            if (!isLoadMore) {
                setData([]);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [searchText, parentType]);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        if (hasSearched && searchText && typeof searchText === 'string' && searchText.trim()) {
            setRefreshing(true);
            handleSearch(1, false);
            setTimeout(() => setRefreshing(false), 500);
        }
    }, [hasSearched, searchText, handleSearch]);

    // Handle load more
    const handleLoadMore = useCallback(() => {
        if (currentPage < totalPages && !loadingMore && !loading) {
            handleSearch(currentPage + 1, true);
        }
    }, [currentPage, totalPages, loadingMore, loading, handleSearch]);

    // Handle item select
    const handleItemSelect = (item) => {
        if (!item || item === null || item === undefined) {
            console.warn('Invalid item selected:', item);
            return;
        }
        
        if (onSelect) {
            // Special handling for Users module - use user_name instead of name
            let itemName = '';
            if (parentType === 'Users') {
                itemName = item.user_name !== null && item.user_name !== undefined ? String(item.user_name) : '';
            } else {
                itemName = item.name !== null && item.name !== undefined ? String(item.name) : '';
            }
            
            const itemId = item.id !== null && item.id !== undefined ? String(item.id) : '';
            
            onSelect({
                id: itemId,
                name: itemName
            });
        }
        
        // Safe navigation check
        if (navigation && typeof navigation.goBack === 'function') {
            navigation.goBack();
        } else {
            console.warn('Navigation not available or goBack method missing');
        }
    };

    // Format field value for display
    const formatFieldValue = (key, value) => {
        if (!value || value === null || value === undefined) return '';
        
        switch (key) {
            case 'date_entered':
                try {
                    // Additional validation for date string
                    if (typeof value !== 'string' || value.trim() === '') {
                        return '';
                    }
                    // Check if it's a valid date string format
                    const dateTest = new Date(value);
                    if (isNaN(dateTest.getTime())) {
                        return value; // Return original value if not a valid date
                    }
                    return formatDateBySelectedLanguage(value);
                } catch (error) {
                    console.warn('Date formatting error:', error, 'Value:', value);
                    return value || ''; // Return original value or empty string
                }
            default:
                return String(value);
        }
    };

    // Get field value from item
    const getFieldValue = (item, key) => {
        if (!item || item === null || item === undefined) return '';
        
        // Special handling for Users module - use user_name instead of name
        if (key === 'name' && parentType === 'Users') {
            const userNameValue = item.user_name;
            return userNameValue !== null && userNameValue !== undefined ? String(userNameValue) : '';
        }
        
        const value = item[key];
        return value !== null && value !== undefined ? String(value) : '';
    };

    // Render item as table row
    const renderItem = ({ item }) => {
        if (!item || item === null || item === undefined) {
            console.warn('Null item in renderItem:', item);
            return null;
        }
        
        return (
            <TouchableOpacity
                style={styles.tableRow}
                onPress={() => handleItemSelect(item)}
                activeOpacity={0.7}
            >
                {columns.map((column, index) => (
                    <Text key={index} style={[styles.cell, { flex: column.flex || 1 }]} numberOfLines={2}>
                        {formatFieldValue(column.key, getFieldValue(item, column.key))}
                    </Text>
                ))}
                <View style={styles.selectIcon}>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </View>
            </TouchableOpacity>
        );
    };

    // Render footer
    const renderFooter = () => {
        if (loadingMore) {
            return (
                <View style={styles.footerLoading}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.loadingText}>{translations.loadMore}...</Text>
                </View>
            );
        }

        if (currentPage < totalPages) {
            return (
                <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={handleLoadMore}
                >
                    <Text style={styles.loadMoreText}>{translations.loadMore}</Text>
                </TouchableOpacity>
            );
        }

        return null;
    };

    // Render content
    const renderContent = () => {
        if (loading && !loadingMore) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4B84FF" />
                    <Text style={styles.loadingText}>{translations.loading}...</Text>
                </View>
            );
        } else if (hasSearched) {
            return (
                <View style={styles.tableContainer}>
                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        {columns.map((column, index) => (
                            <Text key={index} style={[styles.headerCell, { flex: column.flex || 1 }]}>
                                {column.label}
                            </Text>
                        ))}
                        <View style={styles.headerIcon}>
                            <Text style={styles.headerCell}> </Text>
                        </View>
                    </View>

                    {/* Table Rows */}
                    {data && Array.isArray(data) && data.length > 0 ? (
                        <FlatList
                            data={data}
                            renderItem={renderItem}
                            keyExtractor={(item) => item && item.id ? String(item.id) : Math.random().toString()}
                            showsVerticalScrollIndicator={true}
                            style={styles.list}
                            ListFooterComponent={renderFooter}
                            onEndReached={handleLoadMore}
                            onEndReachedThreshold={0.1}
                            removeClippedSubviews={false}
                            initialNumToRender={10}
                            maxToRenderPerBatch={10}
                            windowSize={10}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={handleRefresh}
                                    colors={['#4B84FF']}
                                    title="Pull to refresh..."
                                />
                            }
                        />
                    ) : (
                        <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>{translations.noData}</Text>
                        </View>
                    )}
                </View>
            );
        } else {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Nhập từ khóa để tìm kiếm</Text>
                </View>
            );
        }
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{title || 'Tìm kiếm'}</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Search Section */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder={translations.searchPlaceholder}
                            value={searchText}
                            onChangeText={setSearchText}
                            onSubmitEditing={() => handleSearch()}
                            returnKeyType="search"
                            autoCapitalize="none"
                            autoFocus={true}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.searchButton, loading && styles.disabledButton]}
                        onPress={() => handleSearch()}
                        disabled={loading || !searchText || typeof searchText !== 'string' || !searchText.trim()}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.searchButtonText}>
                                {translations.search}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Results */}
                <View style={styles.resultsContainer}>
                    {renderContent()}
                </View>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#4B84FF',
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        flex: 1,
    },
    placeholder: {
        width: 32,
    },
    searchContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    searchInputContainer: {
        flex: 1,
        marginRight: 12,
    },
    searchInput: {
        height: 44,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    searchButton: {
        backgroundColor: '#4B84FF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resultsContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: '#fff',
    },
    noDataText: {
        fontSize: 16,
        color: '#999',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
    tableContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#C9B4AB',
        padding: 12,
    },
    headerCell: {
        fontWeight: 'bold',
        fontSize: 16,
        paddingHorizontal: 8,
    },
    headerIcon: {
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: {
        flex: 1,
    },
    tableRow: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#F3F0EF',
        borderBottomWidth: 1,
        borderColor: '#ddd',
        minHeight: 60,
        alignItems: 'center',
    },
    cell: {
        paddingHorizontal: 8,
        fontSize: 16,
        textAlignVertical: 'center',
    },
    selectIcon: {
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerLoading: {
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: '#F3F0EF',
    },
    loadMoreButton: {
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    loadMoreText: {
        fontSize: 16,
        color: '#4B84FF',
        fontWeight: '500',
    },
});

export default SearchModulesScreen;
