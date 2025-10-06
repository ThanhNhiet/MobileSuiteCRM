import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
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
import { getCurrencyNameApi } from "../../services/api/module/ModuleApi";
import { useModule_Detail } from "../../services/useApi/module/UseModule_Detail";
import { useModule_PDF } from "../../services/useApi/module/UseModule_PDF";
import { SystemLanguageUtils } from "../../utils/cacheViewManagement/SystemLanguageUtils";
import { getUserIdFromToken } from "../../utils/DecodeToken";
import { formatCurrency } from "../../utils/format/FormatCurrencies";
import { formatDateTimeBySelectedLanguage } from "../../utils/format/FormatDateTime_Zones";

// Component to handle async field value formatting
const FormattedFieldValue = ({ fieldKey, value, translations, systemLanguageUtils, fieldType }) => {
    const [formattedValue, setFormattedValue] = useState(value);

    useEffect(() => {
        const formatValue = async () => {
            if (!value) {
                setFormattedValue(translations.noValue || 'Không có');
                return;
            }

            // Handle currency type fields first
            if (fieldType === 'currency') {
                try {
                    const numericValue = parseFloat(value);
                    if (isNaN(numericValue)) {
                        setFormattedValue(value.toString());
                    } else {
                        const formatted = await formatCurrency(numericValue);
                        setFormattedValue(formatted);
                    }
                } catch (error) {
                    console.warn('Error formatting currency field:', error);
                    setFormattedValue(value.toString());
                }
                return;
            }

            switch (fieldKey) {
                case 'date_entered':
                case 'date_modified':
                    setFormattedValue(formatDateTimeBySelectedLanguage(value));
                    break;
                case 'date_start':
                    setFormattedValue(formatDateTimeBySelectedLanguage(value));
                    break;
                case 'date_end':
                    setFormattedValue(formatDateTimeBySelectedLanguage(value));
                    break;
                case 'date_due':
                    setFormattedValue(formatDateTimeBySelectedLanguage(value));
                    break;
                case 'parent_type':
                case 'annual_revenue':
                    try {
                        const numericValue = parseFloat(value);
                        if (isNaN(numericValue)) {
                            setFormattedValue(value.toString());
                        } else {
                            const formatted = await formatCurrency(numericValue);
                            setFormattedValue(formatted);
                        }
                    } catch (error) {
                        console.warn('Error formatting annual_revenue:', error);
                        setFormattedValue(value.toString());
                    }
                    break;
                default:
                    setFormattedValue(value.toString());
                    break;
            }
        };

        formatValue();
    }, [fieldKey, value, translations, systemLanguageUtils]);

    return formattedValue;
};

const { width } = Dimensions.get('window');
const ITEM_W = (width - 8 * 2 - 4 * 2 * 4) / 4;

export default function ModuleDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { moduleName, recordId } = route.params || {};
    

    const [currentUserId, setCurrentUserId] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [currencyNames, setCurrencyNames] = useState({}); // Cache for currency names
    const [formattedCurrencyValues, setFormattedCurrencyValues] = useState({}); // Cache for formatted currency values
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
                    'LBL_EMAIL_DETAILS',
                    'LBL_NOTES',
                    'LBL_EMAIL_LOADING',
                    'LBL_EMAIL_ERROR_GENERAL_TITLE',
                    'UPLOAD_REQUEST_ERROR',
                    'LBL_EMAIL_FROM',
                    'LBL_EDIT_BUTTON',
                    'LBL_DELETE_BUTTON',
                    'LBL_DELETE',
                    'LBL_EMAIL_CANCEL',
                    'LBL_EMAIL_SUCCESS',
                    'LBL_EMAIL_OK',
                    'LBL_DELETED',
                    'LBL_PROCESSING_REQUEST',
                    'LBL_EMAIL_DELETE_ERROR_DESC',
                    'LBL_DELETE_DASHBOARD1',
                    'Bugs'
                ]);

                setTranslations({
                    mdName: translatedLabels.LBL_EMAIL_DETAILS + ' ' + (await systemLanguageUtils.translate(moduleName)),
                    loadingText: translatedLabels.LBL_EMAIL_LOADING,
                    errorTitle: translatedLabels.LBL_EMAIL_ERROR_GENERAL_TITLE,
                    retryText: translatedLabels.UPLOAD_REQUEST_ERROR,
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

    const {
        record,
        deletePerm,
        editPerm,
        detailFields,
        relationships, // relationships had been processed
        loading,
        refreshing,
        error,
        deleting,
        haveParent,
        refreshRecord,
        deleteRecord,
        getFieldValue,
        getFieldLabel,
        shouldDisplayField,
        fileMeta,
        relaFor,
    } = useModule_Detail(moduleName, recordId);
    const [lang, setLang] = useState(null);
    useEffect(() => {
        const fetchLanguage = async () => {
            try {
                const lang = await AsyncStorage.getItem("selectedLanguage");
                console.log("Selected language:", lang);
                setLang(lang);
            }
            catch (error) {
                console.error("Error fetching selected language:", error);
            }
        };
        fetchLanguage();
      }, []);
    
    // Load currency names and format currency values when record changes
    useEffect(() => {
        const loadCurrencyData = async () => {
            if (!record || !detailFields) return;
            
            const currencyUpdates = {};
            const formatUpdates = {};
            
            for (const field of detailFields) {
                const value = getFieldValue(field.key);
                
                // Handle currency_id fields
                if (field.key.includes('currency_id') && value) {
                    const name = await getCurrencyName(value);
                    if (name) {
                        currencyUpdates[field.key] = name;
                    }
                }
                
                // Handle currency type fields
                if (field.type === 'currency' && value) {
                    const formatted = await formatCurrencyValue(value);
                    if (formatted) {
                        formatUpdates[field.key] = formatted;
                    }
                }
            }
            
            if (Object.keys(currencyUpdates).length > 0) {
                setCurrencyNames(prev => ({ ...prev, ...currencyUpdates }));
            }
            
            if (Object.keys(formatUpdates).length > 0) {
                setFormattedCurrencyValues(prev => ({ ...prev, ...formatUpdates }));
            }
        };
        
        loadCurrencyData();
    }, [record, detailFields]);
    // PDF Export hook
    const modules = ['AOS_Quotes','AOS_Invoices','AOS_Contracts'];
    let isQuotes = false;
    if (modules.includes(moduleName)) {
        isQuotes = true;
    }
    //const isQuotes = moduleName === "AOS_Quotes" ;
    const isRecord = record && Object.keys(record).length > 0;
    const { onExport, exporting} = useModule_PDF({ quoteId: isQuotes ? recordId : null, record: isRecord ? record : null, detailFields, getFieldValue, lang ,moduleName});

    const padData = (raw, cols) => {
        const fullRows = Math.floor(raw.length / cols);
        let lastRowCount = raw.length - fullRows * cols;
        while (lastRowCount !== 0 && lastRowCount < cols) {
            raw.push({ id: `blank-${lastRowCount}`, empty: true });
            lastRowCount++;
        }
        return raw;
    };

    const paddedData = useMemo(() => {
        const safeRelationships = Array.isArray(relationships) ? relationships : [];
        return padData([...safeRelationships], 3);
    }, [relationships]);

    const renderRelationshipItem = ({ item }) => {
        if (item.empty) {
            return <View style={styles.cardInvisible} />;
        }

        const hasData = item.count && item.count > 0;

        return (
            <Pressable
                onPress={() => {
                    navigation.navigate('RelationshipListScreen_New', {
                        relationship: item,
                        sourceModule: moduleName,
                        sourceRecordId: record?.id,
                        relaFor: relaFor || null,
                    });
                }}
                style={({ pressed }) => [
                    styles.card,
                    !hasData && styles.cardNoData,
                    pressed && styles.cardPressed,
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
        // if (!canEditRecord()) {
        //     Alert.alert(
        //         translations.noPermission || 'Không có quyền',
        //         translations.noDeletePermission || 'Bạn không có quyền xóa bản ghi này vì nó được giao cho người dùng khác.',
        //         [{ text: translations.ok || 'OK' }]
        //     );
        //     return;
        // }
        if (deletePerm) {
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
                                                navigation.navigate('ModuleListScreen', { moduleName: moduleName });
                                            }
                                        }
                                    }]
                                );
                            }
                        }
                    }
                ]
            );
        } else {
            Alert.alert(
                translations.noPermission || 'Không có quyền',
                translations.noDeletePermission || 'Bạn không có quyền xóa bản ghi này vì nó được giao cho người dùng khác.',
                [{ text: translations.ok || 'OK' }]
            );
            return;
        }
    };

    // Check if user can edit this record - ROLE_CHECK
    const canEditRecord = () => {
        if (!record) return false;

        // if (currentUserId !== record.created_by) {
        //     return false;
        // }

        return true;
    };

    // Navigate to update screen
    const handleUpdate = () => {
        // if (!canEditRecord()) {
        //     Alert.alert(
        //         translations.noPermission || 'Không có quyền',
        //         translations.noEditPermission || 'Bạn không có quyền chỉnh sửa bản ghi này vì nó được giao cho người dùng khác.',
        //         [{ text: translations.ok || 'OK' }]
        //     );
        //     return;
        // }
        if (editPerm) {
            navigation.navigate('ModuleUpdateScreen', {
                moduleName,
                recordData: record,
                haveParent
            });
        } else {
            Alert.alert(
                translations.noPermission || 'Không có quyền',
                translations.noEditPermission || 'Bạn không có quyền chỉnh sửa bản ghi này vì nó được giao cho người dùng khác.',
                [{ text: translations.ok || 'OK' }]
            );
        }
    };

    // Format field value for display
    const formatFieldValue = (fieldKey, value, fieldType = null) => {
        if (!value) return translations.noValue || 'Không có';

        // Handle currency_id fields
        if (fieldKey.includes('currency_id')) {
            return currencyNames[value] || (value === '-99' ? 'Dollar' : value.toString());
        }
        
        // Handle currency type fields
        if (fieldType === 'currency') {
            return formattedCurrencyValues[fieldKey] || value.toString();
        }

        switch (fieldKey) {
            case 'date_entered':
            case 'date_modified':
                return formatDateTimeBySelectedLanguage(value);
            case 'date_start':
                return formatDateTimeBySelectedLanguage(value);
            case 'date_end':
                return formatDateTimeBySelectedLanguage(value);
            case 'date_due':
                return formatDateTimeBySelectedLanguage(value);
            case 'parent_type':
            case 'annual_revenue':
                // For async formatting, use FormattedFieldValue component
                return null; // This will be handled by component
            default:
                return value.toString();
        }
    };

    // Handle copy ID to clipboard
    // const handleCopyId = async () => {
    //     if (record?.id) {
    //         try {
    //             await Clipboard.setStringAsync(record.id);
    //             Alert.alert(translations.success || 'Thành công', translations.copySuccess || 'ID đã được sao chép vào clipboard');
    //         } catch (err) {
    //             Alert.alert(translations.error || 'Lỗi', translations.copyError || 'Không thể sao chép ID');
    //             console.warn('Copy ID error:', err);
    //         }
    //     }
    // };

    // Get currency name by ID with special handling for -99 (Dollar)
    const getCurrencyName = async (currencyId) => {
        if (!currencyId) return '';
        
        // Special case: -99 is Dollar
        if (currencyId === '-99' || currencyId === -99) {
            return 'Dollar';
        }

        // Check cache first
        if (currencyNames[currencyId]) {
            return currencyNames[currencyId];
        }

        try {
            const name = await getCurrencyNameApi(currencyId);
            // Cache the result
            setCurrencyNames(prev => ({ ...prev, [currencyId]: name }));
            return name;
        } catch (error) {
            console.error('Error getting currency name:', error);
            return currencyId; // Fallback to ID if name fetch fails
        }
    };

    // Format currency value for display
    const formatCurrencyValue = async (value) => {
        if (!value || isNaN(parseFloat(value))) return value;

        try {
            const numericValue = parseFloat(value);
            const formatted = await formatCurrency(numericValue);
            return formatted;
        } catch (error) {
            console.error('Error formatting currency:', error);
            return value;
        }
    };
    const onView = async () => {
    // Ảnh: xem trong app
    //const fileMeta = await getLinkFile(moduleName,fileName);
    if (fileMeta?.is_image && fileMeta?.link) {
      setShowPreview(true);
      return;
    }
    // Không phải ảnh: mở preview_url nếu có, fallback mở file_url/download_url
    const openUrl = fileMeta.link || fileMeta.downloadLink || fileMeta.downloadLinkNative;
    if (openUrl) {
      await WebBrowser.openBrowserAsync(openUrl);
    } else {
      Alert.alert("Không có URL để xem.");
    }
  };
  const onDownload = async () => {
    try {
      const url = fileMeta.downloadLink;
      if (!url) return Alert.alert("Không có URL tải.");
      // đặt tên file khi lưu
      let name = getFieldValue('filename') || 'file';
      if (!/\.[a-z0-9]+$/i.test(name)) {
        const ext = extFromMime(fileMeta.mime);
        name = ext ? `${name}.${ext}` : `${name}.bin`;
      }
      const dest = FileSystem.documentDirectory + name;
      const { uri } = await FileSystem.downloadAsync(url, dest);

      // Mở share sheet
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Đã tải xong", uri);
      }
    } catch (e) {
      Alert.alert("Lỗi tải file", String(e?.message || e));
    }
  };

    // Render field item
    const renderFieldItem = async (field) => {
        const value = getFieldValue(field.key);

        if (!shouldDisplayField(field.key)) {
            return null;
        }

        // Special handling for ID field with copy button
        if (field.key === 'id') {
            return null; // hide ID field
        }
        if (field.key === 'filename' || field.key === 'product_image') {
            return (
            <>
                <View key={field.key} style={styles.fieldContainer}>
                    {/* <Text style={styles.fieldValue}>
                            {formatFieldValue(field.key, value)}
                    </Text> */}
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity onPress={() => onView()} style={styles?.btnPrimary || styles.btnPrimary}>
                            <Text style={styles?.btnPrimaryText || styles.btnPrimaryText}>Xem</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onDownload} style={styles?.btnGhost || styles.btnGhost}>
                            <Text style={styles?.btnGhostText || styles.btnGhostText}>Tải</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <Modal visible={showPreview} transparent animationType="fade" onRequestClose={() => setShowPreview(false)}>
                    <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        {fileMeta?.link ? (
                        <Image source={{ uri: fileMeta.link }} style={styles.previewImage} />
                        ) : (
                        <Text>Không có ảnh để hiển thị.</Text>
                        )}
                        <TouchableOpacity onPress={() => setShowPreview(false)} style={[styles.btnPrimary, { marginTop: 12 }]}>
                        <Text style={styles.btnPrimaryText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                    </View>
                </Modal>
            </>
            );
        }

        return (
            <View key={field.key} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{field.label}</Text>

                {(field.key === 'annual_revenue' || field.type === 'currency') ? (
                <Text style={styles.fieldValue}>
                    <FormattedFieldValue
                    fieldKey={field.key}
                    value={value}
                    translations={translations}
                    systemLanguageUtils={systemLanguageUtils}
                    fieldType={field.type}
                    />
                </Text>
                ) : (
                <Text style={styles.fieldValue}>
                    {formatFieldValue(field.key, value, field.type)}
                </Text>
                )}
            </View>
            );
    };

    // Loading state 
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

    // Error state 
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
                    {/* Error Display */}
                    {error && (
                        <View style={styles.warningContainer}>
                            <Ionicons name="warning-outline" size={20} color="#FF8C00" />
                            <Text style={styles.warningText}>{error}</Text>
                        </View>
                    )}

                    {/* Record Details */}
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
                   {/* PDF */}
                    {modules.includes(moduleName) && (
                    <View>
                        <TouchableOpacity
                        style={styles.updateButton}
                        onPress={onExport}
                        disabled={exporting}  // ngăn bấm khi đang xử lý
                        >
                        <Text>{exporting ? "Đang xuất..." : "Export PDF"}</Text>
                        </TouchableOpacity>
                    </View>
                    )}

                    {/* ===== RELATIONSHIP ===== */}
                    {/* Section Header for Relationships */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Relationships</Text>
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

                {/* Action Buttons */}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionHeader: {
        marginTop: 6,
        marginBottom: 6,
        paddingHorizontal: 0
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
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: 4,
    },
    fieldLabel: {
        fontWeight: 'bold',
        color: '#444',
        fontSize: 14,
        minWidth: 110,          // giữ label có độ rộng đều
        marginRight: 15,         // khoảng cách nhỏ giữa label và value
    },
    fieldValue: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        flexWrap: 'wrap',
    },

    // fieldContainer: {
    //     borderBottomWidth: 1,
    //     borderBottomColor: '#f0f0f0',
    //     paddingBottom: 12,
    // },
    // fieldLabel: {
    //     fontSize: 14,
    //     fontWeight: '600',
    //     color: '#666',
    //     marginBottom: 6,
    // },
    // fieldValue: {
    //     fontSize: 16,
    //     color: '#333',
    //     lineHeight: 22,
    // },
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
    card: {
        backgroundColor: '#2196F3',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',

        // Kích thước cố định
        width: ITEM_W,
        height: 100,

        // Khoảng cách giữa các ô
        marginHorizontal: 8,
        marginVertical: 10,

        // Đổ bóng nhẹ
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    cardNoData: {
        backgroundColor: '#B0BEC5',
    },
    cardPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.97 }],
    },
    cardText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 16,
        paddingHorizontal: 4,
    },
    cardInvisible: {
        backgroundColor: 'transparent',
        width: ITEM_W,
        height: 100,
        marginHorizontal: 8,
        marginVertical: 10,
    },
    btnPrimary: { backgroundColor: "#111827", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
    btnPrimaryText: { color: "#fff", fontWeight: "700" },
    btnGhost: { borderWidth: 1, borderColor: "#111827", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
    btnGhostText: { color: "#111827", fontWeight: "700" },
    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 16 },
    modalCard: { width: "100%", backgroundColor: "white", borderRadius: 12, padding: 12, alignItems: "center" },
    previewImage: { width: "100%", height: 360, resizeMode: "contain", borderRadius: 8 },
    fileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    },
    btnPrimary: {
    backgroundColor: "#111827",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    },
    btnPrimaryText: { color: "#fff", fontWeight: "700" },
    btnGhost: {
    borderWidth: 1,
    borderColor: "#111827",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    },
    btnGhostText: { color: "#111827", fontWeight: "700" },
    modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    },
    modalCard: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    },
    previewImage: {
    width: "100%",
    height: 360,
    resizeMode: "contain",
    borderRadius: 8,
    },

});