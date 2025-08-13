import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import TopNavigation from "../../components/navigations/TopNavigation";
import { useRelationshipList } from "../../services/useApi/relationship/UseRelationshipList";
import { SystemLanguageUtils } from "../../utils/cacheViewManagement/SystemLanguageUtils";
import { formatDateTimeBySelectedLanguage } from "../../utils/format/FormatDateTime";

export default function RelationshipListScreen_New() {
    const navigation = useNavigation();
    const route = useRoute();
    const { 
        moduleName, 
        recordId, 
        relationshipType, 
        relationshipName 
    } = route.params || {};

    // Check if navigation is available
    const isNavigationReady = navigation && typeof navigation.goBack === 'function';

    // SystemLanguageUtils instance
    const systemLanguageUtils = SystemLanguageUtils.getInstance();

    // State for translations and search
    const [translations, setTranslations] = useState({});
    const [searchText, setSearchText] = useState('');

    // Use custom hook for relationship list
    const {
        relationships,
        loading,
        refreshing,
        error,
        hasMore,
        refreshList,
        loadMore,
        searchRelationships
    } = useRelationshipList(moduleName, recordId, relationshipType);

    // Initialize translations
    useEffect(() => {
        const initTranslations = async () => {
            try {
                const translatedLabels = await systemLanguageUtils.translateKeys([
                    'LBL_SEARCH',
                    'LBL_NO_DATA',
                    'LBL_LOADING',
                    'LBL_ERROR_GENERAL_TITLE',
                    'LBL_RETRY',
                    'LBL_LOAD_MORE'
                ]);

                setTranslations(translatedLabels);
            } catch (error) {
                console.error('Error loading translations:', error);
            }
        };

        initTranslations();
    }, []);

    // Handle search
    const handleSearch = (text) => {
        setSearchText(text);
        searchRelationships(text);
    };

    // Handle item press - navigate to detail screen
    const handleItemPress = (item) => {
        if (!isNavigationReady) {
            console.warn('Navigation not ready');
            return;
        }
        
        navigation.navigate('ModuleDetailScreen', {
            moduleName: relationshipType,
            recordId: item.id
        });
    };

    // Render relationship item
    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => handleItemPress(item)}
        >
            <View style={styles.itemContent}>
                <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle} numberOfLines={2}>
                        {item.name || item.title || item.subject || `${relationshipType} #${item.id}`}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
                
                {item.description && (
                    <Text style={styles.itemDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}
                
                <View style={styles.itemFooter}>
                    {item.created_date && (
                        <Text style={styles.itemDate}>
                            {formatDateTimeBySelectedLanguage(item.created_date)}
                        </Text>
                    )}
                    {item.status && (
                        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                            <Text style={[styles.statusText, getStatusTextStyle(item.status)]}>
                                {item.status}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    // Get status badge style
    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
            case 'completed':
                return { backgroundColor: '#d4edda' };
            case 'inactive':
            case 'cancelled':
                return { backgroundColor: '#f8d7da' };
            case 'pending':
                return { backgroundColor: '#fff3cd' };
            default:
                return { backgroundColor: '#e2e3e5' };
        }
    };

    // Get status text style
    const getStatusTextStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
            case 'completed':
                return { color: '#155724' };
            case 'inactive':
            case 'cancelled':
                return { color: '#721c24' };
            case 'pending':
                return { color: '#856404' };
            default:
                return { color: '#495057' };
        }
    };

    // Render empty state
    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>
                {translations.LBL_NO_DATA || 'Không có dữ liệu'}
            </Text>
            <Text style={styles.emptySubtitle}>
                Không tìm thấy {relationshipName || relationshipType} nào
            </Text>
        </View>
    );

    // Render error state
    const renderErrorState = () => (
        <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
                style={styles.retryButton}
                onPress={refreshList}
            >
                <Text style={styles.retryButtonText}>
                    {translations.LBL_RETRY || 'Thử lại'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    // Render footer (load more)
    const renderFooter = () => {
        if (!hasMore) return null;
        
        return (
            <View style={styles.footerContainer}>
                <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={loadMore}
                >
                    <Text style={styles.loadMoreText}>
                        {translations.LBL_LOAD_MORE || 'Tải thêm'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading && relationships.length === 0) {
        return (
            <SafeAreaProvider>
                <SafeAreaView style={styles.container}>
                    <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                    <TopNavigation 
                        title={relationshipName || relationshipType || 'Relationships'}
                        onBackPress={() => {
                            if (isNavigationReady) {
                                navigation.goBack();
                            }
                        }}
                    />
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>
                            {translations.LBL_LOADING || 'Đang tải...'}
                        </Text>
                    </View>
                </SafeAreaView>
            </SafeAreaProvider>
        );
    }

    if (error && relationships.length === 0) {
        return (
            <SafeAreaProvider>
                <SafeAreaView style={styles.container}>
                    <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                    <TopNavigation 
                        title={relationshipName || relationshipType || 'Relationships'}
                        onBackPress={() => {
                            if (isNavigationReady) {
                                navigation.goBack();
                            }
                        }}
                    />
                    {renderErrorState()}
                </SafeAreaView>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                <TopNavigation 
                    title={relationshipName || relationshipType || 'Relationships'}
                    onBackPress={() => {
                        if (isNavigationReady) {
                            navigation.goBack();
                        }
                    }}
                />

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={translations.LBL_SEARCH || 'Tìm kiếm...'}
                            value={searchText}
                            onChangeText={handleSearch}
                            returnKeyType="search"
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity
                                onPress={() => handleSearch('')}
                                style={styles.clearButton}
                            >
                                <Ionicons name="close-circle" size={20} color="#666" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* List */}
                <FlatList
                    data={relationships}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refreshList}
                            colors={['#007AFF']}
                        />
                    }
                    ListEmptyComponent={renderEmptyState}
                    ListFooterComponent={renderFooter}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={relationships.length === 0 ? styles.emptyListContainer : null}
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
        marginVertical: 20,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    searchContainer: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        padding: 4,
    },
    itemContainer: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    itemContent: {
        padding: 16,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    itemTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginRight: 8,
    },
    itemDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemDate: {
        fontSize: 12,
        color: '#999',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    emptyListContainer: {
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    footerContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    loadMoreButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    loadMoreText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});