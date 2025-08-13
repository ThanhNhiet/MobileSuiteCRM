import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import TopNavigationDetail from "../../components/navigations/TopNavigationDetail";
import { useModule_Detail } from "../../services/useApi/module/UseModule_Detail";
import RelationshipsData from "../../services/useApi/relationship/RelationshipData";
import { SystemLanguageUtils } from "../../utils/cacheViewManagement/SystemLanguageUtils";
import { getUserIdFromToken } from "../../utils/DecodeToken";
import { formatDateTimeBySelectedLanguage } from "../../utils/format/FormatDateTime";

const { width } = Dimensions.get('window');
const ITEM_W = (width - 8 * 2 - 4 * 2 * 4) / 4;

export default function ModuleDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { moduleName, recordId } = route.params || {};
    const [currentUserId, setCurrentUserId] = useState(null);
    const [relationships, setRelationships] = useState([]);
    const [getDataRelationship, setGetDataRelationship] = useState([]);

    // Check if navigation is available
    const isNavigationReady = navigation && typeof navigation.goBack === 'function';

    // SystemLanguageUtils instance
    const systemLanguageUtils = SystemLanguageUtils.getInstance();

    // Initialize LanguageUtils and translations
    const [translations, setTranslations] = useState({});

    // Initialize translations
    useEffect(() => {
        const initTranslations = async () => {
            try {
                // Get current user ID from token
                const token = await AsyncStorage.getItem('token');
                const userId = getUserIdFromToken(token);
                setCurrentUserId(userId);

                // Get all translations at once using SystemLanguageUtils
                const translatedLabels = await systemLanguageUtils.translateKeys([
                    'LBL_EMAIL_DETAILS',          // "Chi tiết"
                    'LBL_NOTES',                // "Ghi chú"
                    'LBL_EMAIL_LOADING',          // "Đang tải..."
                    'LBL_EMAIL_ERROR_GENERAL_TITLE', // "Một lỗi đã xảy ra"
                    'UPLOAD_REQUEST_ERROR',     // "Thử lại"
                    'LBL_EMAIL_FROM',             // "Từ" -> related prefix
                    'LBL_EDIT_BUTTON',            // "Sửa" -> update button
                    'LBL_DELETE_BUTTON',          // "Xóa" -> delete button
                    'LBL_DELETE',                 // "Xóa"
                    'LBL_EMAIL_CANCEL',           // "Hủy"
                    'LBL_EMAIL_SUCCESS',          // "Thành công"
                    'LBL_EMAIL_OK',               // "Ok"
                    'LBL_DELETED',                 // "Đã xóa",
                    'LBL_PROCESSING_REQUEST', // "Đang xử lý"
                    'LBL_EMAIL_DELETE_ERROR_DESC', // Không có quyền truy cập
                    'LBL_DELETE_DASHBOARD1', //"Bạn có chắc chắn muốn xóa"
                    'Bugs' //Lỗi
                ]);

                setTranslations({
                    mdName: translatedLabels.LBL_EMAIL_DETAILS + ' ' + (await systemLanguageUtils.translate(moduleName)),
                    loadingText: translatedLabels.LBL_EMAIL_LOADING,
                    errorTitle: translatedLabels.LBL_EMAIL_ERROR_GENERAL_TITLE,
                    retryText: translatedLabels.UPLOAD_REQUEST_ERROR ,
                    refreshPull: 'Pull to refresh...',
                    relatedPrefix: translatedLabels.LBL_EMAIL_FROM,
                    updateButton: translatedLabels.LBL_EDIT_BUTTON,
                    deleteButton: translatedLabels.LBL_DELETE_BUTTON,
                    deletingText: translatedLabels.LBL_PROCESSING_REQUEST,
                    noPermission: translatedLabels.LBL_EMAIL_DELETE_ERROR_DESC,
                    noDeletePermission: translatedLabels.LBL_EMAIL_DELETE_ERROR_DESC,
                    noEditPermission: translatedLabels.LBL_EMAIL_DELETE_ERROR_DESC,
                    confirmDelete: translatedLabels.LBL_DELETE,
                    confirmDeleteMsg: translatedLabels.LBL_DELETE_DASHBOARD1,
                    cancel: translatedLabels.LBL_EMAIL_CANCEL,
                    delete: translatedLabels.LBL_DELETE,
                    success: translatedLabels.LBL_EMAIL_SUCCESS,
                    deleteSuccess: translatedLabels.LBL_DELETED,
                    ok: translatedLabels.LBL_EMAIL_OK,
                    error: translatedLabels.Bugs,
                    copySuccess: 'Copy to clipboard',
                    copyError: translatedLabels.Bugs,
                    noValue: 'No value'
                });
            } catch (error) {
                console.error('ModuleDetailScreen: Error loading translations:', error);
            }
        };

        initTranslations();
    }, [moduleName]);

    // Sử dụng custom hook
    const {
        record,
        detailFields,
        loading,
        refreshing,
        error,
        deleting,
        refreshRecord,
        deleteRecord,
        getFieldValue,
        getFieldLabel,
        shouldDisplayField
    } = useModule_Detail(moduleName, recordId);

    // Fetch relationships
    useEffect(() => {
        const fetchRelationships = async () => {
            if (!record?.id) return;
            
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    navigation.navigate('LoginScreen');
                    return;
                }

                // Use specific API method based on module
                let response;
                switch (moduleName?.toLowerCase()) {
                    case 'accounts':
                        // Import AccountData dynamically if needed
                        const AccountData = require('../../services/useApi/account/AccountData').default;
                        response = await AccountData.getRelationships(token, record.id);
                        break;
                    default:
                        // Generic relationship fetching - you might need to implement this
                        response = { relationships: [] };
                        break;
                }
            
                // Kiểm tra và xử lý response
                if (response && response.relationships && Array.isArray(response.relationships)) {
                    setRelationships(response.relationships);
                } else if (response && Array.isArray(response)) {
                    setRelationships(response);
                } else {
                    console.log('⚠️ Invalid relationships format, using empty array');
                    setRelationships([]);
                }
            } catch (error) {
                console.error('Error fetching relationships:', error);
                setRelationships([]); // Set empty array on error
            }
        };
        
        fetchRelationships();
    }, [record?.id, moduleName]);

    useEffect(() => {
        // Xử lý khi relationships thay đổi
        if(!relationships) return;
        const relatedLinks = relationships.map( (item) => {
                return {
                    relatedLink: item.relatedLink,
                    moduleName : item.moduleName,
                };
        });
        // Xử lý relatedLinks ở đây nếu cần
        const fetchRelatedData = async () => {
            try{
                 const token = await AsyncStorage.getItem('token');
                if (!token) {
                    navigation.navigate('LoginScreen');
                    return;
                }
                const results = await RelationshipsData.getDataRelationship(token, relatedLinks);
                setGetDataRelationship(results);
            } catch (error) {
                console.error('Lỗi khi xử lý relationships:', error);
            }
        };
        fetchRelatedData();
    }, [relationships]);

    const padData = (raw, cols) => {
        const fullRows = Math.floor(raw.length / cols);
        let lastRowCount = raw.length - fullRows * cols;
        while (lastRowCount !== 0 && lastRowCount < cols) {
            raw.push({ id: `blank-${lastRowCount}`, empty: true });
            lastRowCount++;
        }
        return raw;
    };

    // trong component - với safety check
    const paddedData = useMemo(() => {
        // Đảm bảo relationships luôn là array trước khi spread
        const safeRelationships = Array.isArray(relationships) ? relationships : [];
        return padData([...safeRelationships], 3);
    }, [relationships]);

    const renderRelationshipItem = ({ item }) => {
        if (item.empty) {
            return <View style={styles.cardInvisible} />;
        }

        let checked = false;
        getDataRelationship.map((data) => {
            if (data.moduleName === item.displayName) {
                if (data.length > 0) {
                    checked = true;
                }
            }
        });

        return (
            <Pressable
                onPress={() => {
                    navigation.navigate('RelationshipListScreen_New', { 
                        relationship: item,
                        sourceModule: moduleName,
                        sourceRecordId: record?.id
                    });
                }}
                style={({ pressed }) => [
                    styles.card,
                    !checked && styles.cardNoData,       // màu khác nếu không có data
                    pressed && styles.cardPressed,       // hiệu ứng khi nhấn
                ]}
            >
                <Text style={styles.cardText}>
                    {item.moduleLabel}
                </Text>
            </Pressable>
        );
    };

    // Handle delete with confirmation
    const handleDelete = () => {
        if (!canEditRecord()) {
            Alert.alert(
                translations.noPermission || 'Không có quyền',
                translations.noDeletePermission || 'Bạn không có quyền xóa bản ghi này vì nó được giao cho người dùng khác.',
                [{ text: translations.ok || 'OK' }]
            );
            return;
        }

        Alert.alert(
            translations.confirmDelete || 'Xác nhận xóa',
            translations.confirmDeleteMsg || 'Bạn có chắc chắn muốn xóa bản ghi này không? Hành động này không thể hoàn tác.',
            [
                { text: translations.cancel || 'Hủy', style: 'cancel' },
                {
                    text: translations.delete || 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteRecord();
                        if (success) {
                            Alert.alert(
                                translations.success || 'Thành công',
                                translations.deleteSuccess || 'Đã xóa bản ghi thành công',
                                [{ 
                                    text: translations.ok || 'OK', 
                                    onPress: () => {
                                        if (isNavigationReady && navigation.canGoBack()) {
                                            navigation.goBack();
                                        }
                                    }
                                }]
                            );
                        }
                    }
                }
            ]
        );
    };

    // Check if user can edit this record
    const canEditRecord = () => {
        if (!record) return false;

        if (currentUserId !== record.created_by) {
            return false;
        }

        return true;
    };

    // Navigate to update screen
    const handleUpdate = () => {
        if (!canEditRecord()) {
            Alert.alert(
                translations.noPermission || 'Không có quyền',
                translations.noEditPermission || 'Bạn không có quyền chỉnh sửa bản ghi này vì nó được giao cho người dùng khác.',
                [{ text: translations.ok || 'OK' }]
            );
            return;
        }
        navigation.navigate('ModuleUpdateScreen', { 
            moduleName,
            recordData: record 
        });
    };

    // Format field value for display
    const formatFieldValue = (fieldKey, value) => {
        if (!value) return translations.noValue || 'Không có';

        switch (fieldKey) {
            case 'date_entered':
            case 'date_modified':
                return formatDateTimeBySelectedLanguage(value);
            case 'parent_type':
                const typeLabels = {
                    'Accounts': systemLanguageUtils.translate('LBL_ACCOUNTS'),
                    'Users': systemLanguageUtils.translate('LBL_USERS'),
                    'Tasks': systemLanguageUtils.translate('LBL_TASKS'),
                    'Meetings': systemLanguageUtils.translate('LBL_MEETINGS')
                };
                return typeLabels[value] || value;
            default:
                return value.toString();
        }
    };

    // Handle copy ID to clipboard
    const handleCopyId = async () => {
        if (record?.id) {
            try {
                await Clipboard.setStringAsync(record.id);
                Alert.alert(translations.success || 'Thành công', translations.copySuccess || 'ID đã được sao chép vào clipboard');
            } catch (err) {
                Alert.alert(translations.error || 'Lỗi', translations.copyError || 'Không thể sao chép ID');
                console.warn('Copy ID error:', err);
            }
        }
    };

    // Render field item - GIỐNG Y CHANG NoteDetailScreen
    const renderFieldItem = (field) => {
        const value = getFieldValue(field.key);

        if (!shouldDisplayField(field.key)) {
            return null;
        }

        // Special handling for ID field with copy button
        if (field.key === 'id') {
            return (
                <View key={field.key} style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <View style={styles.idContainer}>
                        <Text style={[styles.fieldValue, styles.idValue]}>
                            {formatFieldValue(field.key, value)}
                        </Text>
                        <TouchableOpacity
                            style={styles.copyButton}
                            onPress={handleCopyId}
                        >
                            <Ionicons name="copy-outline" size={16} color="#007AFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <View key={field.key} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Text style={styles.fieldValue}>
                    {formatFieldValue(field.key, value)}
                </Text>
            </View>
        );
    };

    // Loading state - GIỐNG Y CHANG NoteDetailScreen
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <TopNavigationDetail
                    moduleName={translations.mdName || `${moduleName || 'Module'}`}
                    navigation={navigation}
                />

                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4B84FF" />
                    <Text style={styles.loadingText}>{translations.loadingText || 'Đang tải chi tiết...'}</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state - GIỐNG Y CHANG NoteDetailScreen
    if (error && !record) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <TopNavigationDetail
                    moduleName={translations.mdName || `${moduleName || 'Module'}`}
                    navigation={navigation}
                    name="ModuleUpdateScreen"
                />

                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
                    <Text style={styles.errorTitle}>{translations.errorTitle || 'Không thể tải dữ liệu'}</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refreshRecord}>
                        <Text style={styles.retryButtonText}>{translations.retryText || 'Thử lại'}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <TopNavigationDetail
                    moduleName={translations.mdName || `${moduleName || 'Module'}`}
                    navigation={navigation}
                    name="ModuleUpdateScreen"
                />

                <ScrollView
                    style={styles.content}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refreshRecord}
                            colors={['#4B84FF']}
                            title={translations.refreshPull || 'Kéo để tải lại...'}
                        />
                    }
                >
                    {/* Error Display - GIỐNG Y CHANG NoteDetailScreen */}
                    {error && (
                        <View style={styles.warningContainer}>
                            <Ionicons name="warning-outline" size={20} color="#FF8C00" />
                            <Text style={styles.warningText}>{error}</Text>
                        </View>
                    )}

                    {/* Record Details - GIỐNG Y CHANG NoteDetailScreen */}
                    {record && (
                        <View style={styles.detailsContainer}>
                            <Text style={styles.recordTitle}>{record.name || record.subject || 'Untitled'}</Text>

                            {record.parent_name && record.parent_type && (
                                <TouchableOpacity style={styles.parentInfo}>
                                    <Ionicons name="link-outline" size={16} color="#666" />
                                    <Text style={styles.parentText}>
                                        {translations.relatedPrefix || 'Liên quan:'} {record.parent_name}
                                        ({formatFieldValue('parent_type', record.parent_type)})
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.fieldsContainer}>
                                {detailFields.map(field => renderFieldItem(field))}
                            </View>
                        </View>
                    )}

                    {/* ===== RELATIONSHIP ===== */}
                    {/* Section Header for Relationships */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Mối quan hệ</Text>
                    </View>

                    <View style={styles.infoCard}>
                        <FlatList
                            data={paddedData}
                            renderItem={renderRelationshipItem}
                            keyExtractor={(item) => item.id}
                            numColumns={3}
                            columnWrapperStyle={styles.row}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={false} // Disable nested scroll
                        />
                    </View>
                </ScrollView>

                {/* Action Buttons - GIỐNG Y CHANG NoteDetailScreen */}
                {record && (
                    <View style={styles.actionContainer}>
                        <TouchableOpacity
                            style={[
                                styles.updateButton,
                                (!canEditRecord() || deleting) && styles.disabledButton
                            ]}
                            onPress={handleUpdate}
                            disabled={deleting || !canEditRecord()}
                        >
                            <Ionicons
                                name="create-outline"
                                size={20}
                                color={(!canEditRecord() || deleting) ? "#999" : "#fff"}
                            />
                            <Text style={[
                                styles.updateButtonText,
                                (!canEditRecord() || deleting) && styles.disabledButtonText
                            ]}>
                                {translations.updateButton || 'Cập nhật'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.deleteButton,
                                deleting && styles.deletingButton,
                                !canEditRecord() && styles.disabledButton
                            ]}
                            onPress={handleDelete}
                            disabled={deleting || !canEditRecord()}
                        >
                            {deleting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons
                                    name="trash-outline"
                                    size={20}
                                    color={!canEditRecord() ? "#999" : "#fff"}
                                />
                            )}
                            <Text style={[
                                styles.deleteButtonText,
                                !canEditRecord() && styles.disabledButtonText
                            ]}>
                                {deleting ? (translations.deletingText || 'Đang xóa...') : (translations.deleteButton || 'Xóa')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

// STYLES Y CHANG NoteDetailScreen + AccountDetailScreen
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    /* Header mini cho section - TỪ AccountDetailScreen */
    sectionHeader: {
        marginTop: 6, 
        marginBottom: 6, 
        paddingHorizontal: 0 // Remove padding để align với content
    },
    sectionTitle: { 
        fontSize: 16, 
        fontWeight: '600', 
        color: '#4B84FF' 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    errorTitle: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF3B30',
        textAlign: 'center',
    },
    errorText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#4B84FF',
        borderRadius: 6,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#FF8C00',
    },
    warningText: {
        flex: 1,
        marginLeft: 8,
        color: '#FF8C00',
        fontSize: 14,
    },
    detailsContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    recordTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        lineHeight: 26,
    },
    parentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#4B84FF',
    },
    parentText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#4B84FF',
        fontWeight: '500',
    },
    fieldsContainer: {
        gap: 15,
    },
    fieldContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 12,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 6,
    },
    fieldValue: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
    actionContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        gap: 10,
    },
    updateButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4B84FF',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    updateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF3B30',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    deletingButton: {
        backgroundColor: '#FF6B6B',
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        backgroundColor: '#ccc',
        opacity: 0.6,
    },
    disabledButtonText: {
        color: '#999',
    },
    // ID field with copy button styles - TỪ NoteDetailScreen
    idContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
    },
    idValue: {
        flex: 1,
        marginRight: 8,
    },
    copyButton: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: '#f0f8ff',
        borderWidth: 1,
        borderColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 32,
        minHeight: 32,
    },
    // Relationship styles Y CHANG AccountDetailScreen
    /* Thẻ thông tin */
    infoCard: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
        minHeight: 120,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    cardInvisible: {
        width: ITEM_W,
        marginHorizontal: 2,
        marginVertical: 8,
        backgroundColor: 'transparent',
    },
    card: {
        backgroundColor: '#2196F3',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: ITEM_W,
        minHeight: 85,
        maxHeight: 110,
        margin: 12,
    },
    cardNoData: {
        backgroundColor: '#B0BEC5', // màu xám cho module không có dữ liệu
    },
    cardPressed: {
        opacity: 0.7,
    },
    cardText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
        textAlign: 'center',
        flexWrap: 'wrap',
        lineHeight: 16,
        numberOfLines: 3,
    },
});
