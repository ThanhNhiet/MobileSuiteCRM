import AccountData from '@/src/services/useApi/account/AccountData';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from "react";
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
import { formatDateTime } from "../../utils/FormatDateTime";

const useAccountDetail = (account, detailFields, getFieldValue, getFieldLabel, navigation, refreshAccount) => {
    const [deleting, setDeleting] = useState(false);
    const [data, setData] = useState(account);

    // Function để update account data
    const updateAccountData = (updatedData) => {
        console.log('🔄 AccountDetailScreen: Updating account data with:', updatedData);
        setData(updatedData);
        console.log('✅ AccountDetailScreen: Account data updated successfully');
    };

    const deleteAccount = async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            navigation.navigate('LoginScreen');
            return false;
        }

        try {
            setDeleting(true);
            const result = await AccountData.DeleteAccount(account.id, token);
            setDeleting(false);
            return result;
        } catch (error) {
            console.error('Lỗi khi xoá:', error);
            setDeleting(false);
            return false;
        }
    };

    return {
        account: data || account,
        detailFields,
        loading: false,
        refreshing: false,
        error: null,
        deleting,
        refreshAccount,
        updateAccountData, // Expose function để update data
        deleteAccount,
        getFieldValue: getFieldValue || ((item, key) => item[key]),
        getFieldLabel: getFieldLabel || ((key) => key),
        shouldDisplayField: (key) => true,
    };
};

const { width } = Dimensions.get('window');
const ITEM_W = (width - 8 * 2 - 4 * 2 * 4) / 4;

export default function AccountDetailScreen() {
    const mdName = 'Khách hàng';
    const navigation = useNavigation();
    const route = useRoute();
    const {account: routeAccount, detailFields: routeDetailFields, getFieldValue: routeGetFieldValue, getFieldLabel: routeGetFieldLabel, refreshAccount: routeRefreshAccount} = route.params;
    const [relationships, setRelationships] = React.useState([]);
    
    // Giả lập dữ liệu mối quan hệ
    useEffect(() => {
        const fetchRelationships = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    navigation.navigate('LoginScreen');
                    return;
                }
                const response = await AccountData.getRelationships(token, routeAccount.id);
                
                
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
                console.error('Lỗi lấy mối quan hệ:', error);
                setRelationships([]); // Set empty array on error
            }
        };
        fetchRelationships();
    }, []);


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
        return padData([...safeRelationships], 4);
    }, [relationships]);

    const renderItem = ({ item }) => {
        if (item.empty) {
            return <View style={styles.cardInvisible} />;
        }

        return (
            <Pressable
                onPress={() => {navigation.navigate('RelationshipListScreen', { relationship: item }); }}
                style={({ pressed }) => [
                    styles.card,
                    pressed && styles.cardPressed,   // thêm nền khi nhấn
                ]}
            >
                <Text style={styles.cardText}>
                    {item.displayName || item.moduleLabel || item.moduleName || item.name}
                </Text>
            </Pressable>
        );
    };

    // Sử dụng custom hook
    const {
    account,
    loading,
    refreshing,
    detailFields,
    deleting,
    error,
    refreshAccount,
    updateAccountData,
    deleteAccount,
    getFieldValue,
    getFieldLabel,
    shouldDisplayField
} = useAccountDetail(routeAccount, routeDetailFields, routeGetFieldValue, routeGetFieldLabel, navigation, routeRefreshAccount);


    // Handle delete with confirmation
   const handleDelete = () => {
    if (!canEditAccount()) {
        Alert.alert(
            'Không thể xóa',
            'Bạn không có quyền xóa khách hàng này.',
            [{ text: 'OK' }]
        );
        return;
    }

    Alert.alert(
        'Xác nhận xóa',
        'Bạn có chắc chắn muốn xóa khách hàng này không? Hành động này không thể hoàn tác.',
        [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    const success = await deleteAccount();
                    if (success) {
                         if (typeof refreshAccount === 'function') {
                            refreshAccount();
                            }
                        Alert.alert(
                            'Thành công',
                            'Đã xóa khách hàng thành công',
                            [{ text: 'OK', onPress: () => navigation.goBack() }]
                        );
                    } else {
                        Alert.alert(
                            'Thất bại',
                            'Không thể xóa khách hàng, vui lòng thử lại.',
                            [{ text: 'OK' }]
                        );
                    }
                }
            }
        ]
    );
};

    // Check if user can edit this account
    const canEditAccount = () => {
        if (!account) return false;
        
        // If assigned_user_name is different from created_by_name, disable editing
        if (account.assigned_user_name && account.created_by_name && 
            account.assigned_user_name !== account.created_by_name) {
            return false;
        }
        
        return true;
    };


    // Navigate to update screen
    const handleUpdate = () => {
        if (!canEditAccount()) {
            Alert.alert(
                'Không thể chỉnh sửa',
                'Bạn không có quyền chỉnh sửa khách hàng này.',
                [{ text: 'OK' }]
            );
            return;
        }
        navigation.navigate('AccountUpdateScreen', { 
            routeAccount: account, // Truyền updated account thay vì routeAccount
            routeDetailFields, 
            routeGetFieldValue, 
            routeGetFieldLabel,
            refreshAccount: updateAccountData // Truyền update function
           
        });
    };

    // Format field value for display
    const formatFieldValue = (fieldKey, value) => {
        if (!value) return 'Không có';

        switch (fieldKey) {
            case 'date_entered':
            case 'date_modified':
                return formatDateTime(value);
            case 'website':
                return value.startsWith('http') ? value : `https://${value}`;
            default:
                return value.toString();
        }
    };

    // Render field item
    const renderFieldItem = (field) => {
        const value = getFieldValue(account, field.key);

        if (!shouldDisplayField(field.key)) {
            return null;
        }

        return (
            <View key={field.key} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{getFieldLabel(field.key)}:</Text>
                <Text style={styles.fieldValue}>
                    {formatFieldValue(field.key, value)}
                </Text>
            </View>
        );
    };

    // Loading state
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <TopNavigationDetail
                    moduleName={mdName}
                    navigation={navigation}
                    name="AccountUpdateScreen"
                />

                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4B84FF" />
                    <Text style={styles.loadingText}>Đang tải chi tiết khách hàng...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (error && !account) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <TopNavigationDetail
                    moduleName={mdName}
                    navigation={navigation}
                    name="AccountUpdateScreen"
                />

                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
                    <Text style={styles.errorTitle}>Không thể tải khách hàng</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refreshAccount}>
                        <Text style={styles.retryButtonText}>Thử lại</Text>
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
                    moduleName={mdName}
                    navigation={navigation}
                    name="AccountUpdateScreen"
                />

                <ScrollView
                    style={styles.content}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refreshAccount}
                            colors={['#4B84FF']}
                            title="Kéo để tải lại..."
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

                    {/* Account Details */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Thông tin chính</Text>
                    </View>
                    {account && (
                        <View style={styles.detailsContainer}>
                            <Text style={styles.accountTitle}>{account.name}</Text>

                            {account.email1 && (
                                <View style={styles.contactInfo}>
                                    <Ionicons name="mail-outline" size={16} color="#666" />
                                    <Text style={styles.contactText}>
                                        Email: {account.email1}
                                    </Text>
                                </View>
                            )}

                            {account.phone_office && (
                                <View style={styles.contactInfo}>
                                    <Ionicons name="call-outline" size={16} color="#666" />
                                    <Text style={styles.contactText}>
                                        Điện thoại: {account.phone_office}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.fieldsContainer}>
                                {detailFields.map(field => renderFieldItem(field))}
                            </View>
                        </View>
                    )}

                    {/* ===== Box 2: Mối quan hệ ===== */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Mối quan hệ</Text>
                    </View>

                    <View style={styles.infoCard}>
                        <FlatList
                            data={paddedData}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            numColumns={4}
                            columnWrapperStyle={styles.row}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={false}
                        />
                    </View>
                </ScrollView>

                {/* Action Buttons */}
                {account && (
                    <View style={styles.actionContainer}>
                        <TouchableOpacity
                            style={styles.updateButton}
                            onPress={handleUpdate}
                            disabled={deleting}
                        >
                            <Ionicons name="create-outline" size={20} color="#fff" />
                            <Text style={styles.updateButtonText}>Cập nhật</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.deleteButton, deleting && styles.deletingButton]}
                            onPress={handleDelete}
                            disabled={deleting || !canEditAccount()}
                        >
                            {deleting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="trash-outline" size={20} color="#fff" />
                            )}
                            <Text style={styles.deleteButtonText}>
                                {deleting ? 'Đang xóa...' : 'Xóa'}
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

    /* Header mini cho section */
    sectionHeader: {marginTop: 6, marginBottom: 6, paddingHorizontal: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#4B84FF' },

    content: {
        flex: 1,
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
    accountTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        lineHeight: 26,
    },
    contactInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#4B84FF',
    },
    contactText: {
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
        paddingHorizontal: 10,
        paddingVertical: 10,
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

     /* Thẻ thông tin */
    infoCard: {
        paddingVertical: 5,
        paddingHorizontal: 5,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
        height: 220
    },
    row: {
        paddingHorizontal: 8,
        justifyContent: 'flex-start',
    },
    card: {
        width: ITEM_W,
        marginHorizontal: 2,
        marginVertical: 8,
        aspectRatio: 1,
        borderRadius: 8,
        backgroundColor: '#ececec',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardInvisible: {
        width: ITEM_W,
        marginHorizontal: 2,
        marginVertical: 8,
        backgroundColor: 'transparent',
    },
    cardPressed: {
        backgroundColor: "blue",
    },
    cardText: {
        fontSize: 13,
        color: 'black',
    },
});
