import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAlert } from '../../services/useApi/alert/UseAlert';
import { formatDateTime } from '../../utils/FormatDateTime';
import { SystemLanguageUtils } from '../../utils/SystemLanguageUtils';

const AlertModal = ({ visible, onClose }) => {
    // Translation state
    const [translations, setTranslations] = useState({});
    const systemLanguageUtils = SystemLanguageUtils.getInstance();

    // Load translations
    useEffect(() => {
        const initializeTranslations = async () => {
            try {
                const translationKeys = [
                    'LBL_NOTIFICATIONS',
                    'LBL_EMAIL_OK',
                    'LBL_EMAIL_ERROR_GENERAL_TITLE',
                    'LBL_EMAIL_SUCCESS',
                    'LBL_EMAIL_CANCEL',
                    'LBL_DELETE',
                    'LBL_EMAIL_LOADING',
                    'LBL_EMAIL_COMPOSE_NO_SUBJECT_LITERAL',
                    'LBL_EMAIL_FROM',
                    'LBL_EMAIL_DATE_SENT_BY_SENDER',
                    'LBL_EMAIL_MARK_READ',
                    'LBL_EMAIL_MENU_HELP_MARK_READ',
                    'LBL_DELETE_DASHBOARD1',
                    'noData',
                    'LBL_ID_FF_CLEAR',
                    'unread',
                    'Type',
                    'LBL_EMAIL_NOT_SENT',
                    'LBL_EMAIL_MENU_HELP_MARK_READ',
                    'LBL_LOADING_PAGE'
                ];

                const translated = await systemLanguageUtils.translateKeys(translationKeys);
                
                setTranslations({
                    title: translated.LBL_NOTIFICATIONS || 'Thông báo',
                    notReadYet: translated.unread || 'chưa đọc',
                    ok: translated.LBL_EMAIL_OK || 'OK',
                    error: translated.LBL_EMAIL_ERROR_GENERAL_TITLE || 'Lỗi',
                    success: translated.LBL_EMAIL_SUCCESS || 'Thành công',
                    cancel: translated.LBL_EMAIL_CANCEL || 'Hủy',
                    delete: translated.LBL_DELETE || 'Xóa',
                    loading: translated.LBL_EMAIL_LOADING || 'Đang tải thông báo...',
                    type: translated.Type || 'Loại',
                    creator: translated.LBL_EMAIL_FROM || 'Người tạo',
                    time: translated.LBL_EMAIL_DATE_SENT_BY_SENDER || 'Thời gian',
                    markReadError: translated.LBL_EMAIL_NOT_SENT || 'Không thể đánh dấu đã đọc',
                    markAllReadSuccess: translated.LBL_EMAIL_MENU_HELP_MARK_READ || 'Đã đánh dấu tất cả thông báo là đã đọc',
                    markAllReadError:  translated.LBL_EMAIL_NOT_SENT || 'Không thể đánh dấu tất cả đã đọc',
                    confirmDelete: translated.LBL_DELETE ||'Xác nhận xóa',
                    confirmDeleteMsg: translated.LBL_DELETE_DASHBOARD1 || 'Bạn có chắc chắn muốn xóa thông báo này không?',
                    deleteError: translated.LBL_EMAIL_NOT_SENT || 'Không thể xóa thông báo',
                    confirmDeleteAll:  translated.LBL_DELETE || 'Xác nhận xóa tất cả',
                    confirmDeleteAllMsg: translated.LBL_DELETE_DASHBOARD1 || 'Bạn có chắc chắn muốn xóa tất cả thông báo không? Hành động này không thể hoàn tác.',
                    deleteAll: translated.LBL_ID_FF_CLEAR || 'Xóa tất cả',
                    deleteAllSuccess: translated.LBL_DELETED || 'Đã xóa tất cả thông báo',
                    deleteAllError: translated.LBL_EMAIL_NOT_SENT ||'Không thể xóa tất cả thông báo',
                    markAllRead: translated.LBL_EMAIL_MENU_HELP_MARK_READ || 'Đánh dấu đã đọc tất cả',
                    noNotifications: translated.noData || 'Không có thông báo nào',
                    refreshPull: 'Pull to refresh...'
                });
            } catch (error) {
                console.error('Error loading Alert translations:', error);
                // Set fallback translations
                setTranslations({
                    title: 'Thông báo',
                    notReadYet: 'chưa đọc',
                    ok: 'OK',
                    error: 'Lỗi',
                    success: 'Thành công',
                    cancel: 'Hủy',
                    delete: 'Xóa',
                    loading: 'Đang tải thông báo...',
                    type: 'Loại',
                    creator: 'Người tạo',
                    time: 'Thời gian',
                    markReadError: 'Không thể đánh dấu đã đọc',
                    markAllReadSuccess: 'Đã đánh dấu tất cả thông báo là đã đọc',
                    markAllReadError: 'Không thể đánh dấu tất cả đã đọc',
                    confirmDelete: 'Xác nhận xóa',
                    confirmDeleteMsg: 'Bạn có chắc chắn muốn xóa thông báo này không?',
                    deleteError: 'Không thể xóa thông báo',
                    confirmDeleteAll: 'Xác nhận xóa tất cả',
                    confirmDeleteAllMsg: 'Bạn có chắc chắn muốn xóa tất cả thông báo không? Hành động này không thể hoàn tác.',
                    deleteAll: 'Xóa tất cả',
                    deleteAllSuccess: 'Đã xóa tất cả thông báo',
                    deleteAllError: 'Không thể xóa tất cả thông báo',
                    markAllRead: 'Đánh dấu đã đọc tất cả',
                    noNotifications: 'Không có thông báo nào',
                    refreshPull: 'Kéo để tải lại...'
                });
            }
        };

        initializeTranslations();
    }, []);

    // Sử dụng custom hook để quản lý alerts
    const {
        alerts,
        unreadCount,
        loading,
        refreshing,
        error,
        currentPage,
        totalPages,
        pagination,
        refreshAlerts,
        markAsRead,
        markAllAsRead,
        deleteAlert,
        deleteAllAlerts,
        goToNextPage,
        goToPrevPage
    } = useAlert();

    // Hàm xử lý khi nhấn vào một alert
    const handleAlertPress = async (alert) => {
        try {
            if (!alert.is_read) {
                await markAsRead(alert.id);
            }

            // Hiển thị thông tin chi tiết
            Alert.alert(
                alert.name,
                `${translations.type || 'Loại'}: ${alert.target_module}\n${translations.creator || 'Người tạo'}: ${alert.created_by_name}\n${translations.time || 'Thời gian'}: ${formatDateTime(alert.date_entered)}`,
                [{ text: translations.ok || 'OK' }]
            );
        } catch (err) {
            Alert.alert(translations.error || 'Lỗi', translations.markReadError || 'Không thể đánh dấu đã đọc');
        }
    };

    // Hàm xử lý đánh dấu tất cả đã đọc
    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            Alert.alert(translations.success || 'Thành công', translations.markAllReadSuccess || 'Đã đánh dấu tất cả thông báo là đã đọc');
        } catch (err) {
            Alert.alert(translations.error || 'Lỗi', translations.markAllReadError || 'Không thể đánh dấu tất cả đã đọc');
        }
    };

    // Hàm xử lý xóa một alert
    const handleDeleteAlert = async (alertId) => {
        Alert.alert(
            translations.confirmDelete || 'Xác nhận xóa',
            translations.confirmDeleteMsg || 'Bạn có chắc chắn muốn xóa thông báo này không?',
            [
                { text: translations.cancel || 'Hủy', style: 'cancel' },
                {
                    text: translations.delete || 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAlert(alertId);
                        } catch (err) {
                            Alert.alert(translations.error || 'Lỗi', translations.deleteError || 'Không thể xóa thông báo');
                        }
                    }
                }
            ]
        );
    };

    // Hàm xử lý xóa tất cả alerts
    const handleDeleteAllAlerts = async () => {
        Alert.alert(
            translations.confirmDeleteAll || 'Xác nhận xóa tất cả',
            translations.confirmDeleteAllMsg || 'Bạn có chắc chắn muốn xóa tất cả thông báo không? Hành động này không thể hoàn tác.',
            [
                { text: translations.cancel || 'Hủy', style: 'cancel' },
                {
                    text: translations.deleteAll || 'Xóa tất cả',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAllAlerts();
                            Alert.alert(translations.success || 'Thành công', translations.deleteAllSuccess || 'Đã xóa tất cả thông báo');
                        } catch (err) {
                            Alert.alert(translations.error || 'Lỗi', translations.deleteAllError || 'Không thể xóa tất cả thông báo');
                        }
                    }
                }
            ]
        );
    };

    // Render item cho FlatList
    const renderAlertItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                !item.is_read && styles.unreadNotification
            ]}
            onPress={() => handleAlertPress(item)}
        >
            <View style={styles.notificationHeader}>
                <View style={styles.senderInfo}>
                    <Text style={styles.senderName}>{item.created_by_name}</Text>
                    <View style={styles.moduleTag}>
                        <Text style={styles.moduleText}>{item.target_module}</Text>
                    </View>
                </View>
                <Text style={styles.time}>{formatDateTime(item.date_entered)}</Text>
            </View>

            <Text
                style={[
                    styles.notificationMessage,
                    !item.is_read && styles.unreadMessage
                ]}
                numberOfLines={2}
            >
                {item.name}
            </Text>

            {/* Nút xóa */}
            <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteAlert(item.id)}
            >
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    // Render empty state
    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>{translations.noNotifications || 'Không có thông báo nào'}</Text>
        </View>
    );

    // Render loading state
    if (loading && alerts.length === 0) {
        return (
            <Modal visible={visible} animationType="slide" transparent={true}>
                <View style={styles.overlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{translations.title || 'Thông báo'}</Text>
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#4B84FF" />
                            <Text style={styles.loadingText}>{translations.loading || 'Đang tải thông báo...'}</Text>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {translations.title || 'Thông báo'} {unreadCount > 0 && `(${unreadCount} ${translations.notReadYet || 'chưa đọc'})`}
                        </Text>

                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Error display */}
                    {error && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle-outline" size={20} color="#FF3B30" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Alerts list */}
                    <FlatList
                        data={alerts}
                        keyExtractor={(item) => item.id}
                        renderItem={renderAlertItem}
                        ListEmptyComponent={renderEmptyState}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={refreshAlerts}
                                colors={['#4B84FF']}
                                title={translations.refreshPull || "Kéo để tải lại..."}
                            />
                        }
                        style={styles.list}
                        showsVerticalScrollIndicator={false}
                    />

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <View style={styles.paginationContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.paginationButton,
                                    !pagination.hasPrev && styles.paginationButtonDisabled
                                ]}
                                onPress={goToPrevPage}
                                disabled={!pagination.hasPrev}
                            >
                                <Ionicons 
                                    name="chevron-back" 
                                    size={16} 
                                    color={!pagination.hasPrev ? '#ccc' : '#4B84FF'} 
                                />
                            </TouchableOpacity>
                            
                            <Text style={styles.paginationText}>
                                {currentPage}
                            </Text>
                            
                            <TouchableOpacity
                                style={[
                                    styles.paginationButton,
                                    !pagination.hasNext && styles.paginationButtonDisabled
                                ]}
                                onPress={goToNextPage}
                                disabled={!pagination.hasNext}
                            >
                                <Ionicons 
                                    name="chevron-forward" 
                                    size={16} 
                                    color={!pagination.hasNext ? '#ccc' : '#4B84FF'} 
                                />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.footerActions}>
                        {alerts.length > 0 && unreadCount > 0 && (
                            <TouchableOpacity
                                style={styles.markAllButton}
                                onPress={handleMarkAllAsRead}
                            >
                                <Text style={styles.markAllText}>{translations.markAllRead || 'Đánh dấu đã đọc tất cả'}</Text>
                            </TouchableOpacity>
                        )}
                        
                        {alerts.length > 0 && (
                            <TouchableOpacity
                                style={styles.deleteAllButton}
                                onPress={handleDeleteAllAlerts}
                            >
                                <Ionicons name="trash-outline" size={16} color="white" />
                                <Text style={styles.deleteAllText}>{translations.deleteAll || 'Xóa tất cả'}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: 'white',
        borderRadius: 15,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#f8f9fa',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    markAllButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#4B84FF',
        borderRadius: 6,
    },
    markAllText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    closeButton: {
        padding: 5,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 14,
        color: '#666',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 15,
        padding: 12,
        backgroundColor: '#FFE6E6',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#FF3B30',
    },
    errorText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#FF3B30',
    },
    list: {
        maxHeight: 400,
    },
    notificationItem: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        position: 'relative',
    },
    unreadNotification: {
        backgroundColor: '#F0F4FF',
        borderLeftWidth: 4,
        borderLeftColor: '#4B84FF',
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    senderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    senderName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    moduleTag: {
        backgroundColor: '#E8F3FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    moduleText: {
        fontSize: 10,
        color: '#4B84FF',
        fontWeight: '500',
    },
    time: {
        fontSize: 12,
        color: '#666',
    },
    notificationMessage: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
        marginTop: 4,
    },
    unreadMessage: {
        color: '#333',
        fontWeight: '500',
    },
    unreadDot: {
        position: 'absolute',
        top: 15,
        right: 15,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4B84FF',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 16,
        color: '#ccc',
        textAlign: 'center',
    },
    footerActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 12,
        marginTop: 10,
        marginBottom: 10,
    },
    deleteButton: {
        position: 'absolute',
        bottom: 10,
        right: 15,
        padding: 8,
        backgroundColor: '#FFF0F0',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#FFE6E6',
    },
    deleteAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#FF3B30',
        borderRadius: 6,
    },
    deleteAllText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fafafa',
        gap: 20,
    },
    paginationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F4FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8F3FF',
    },
    paginationButtonDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#e0e0e0',
    },
    paginationText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        minWidth: 30,
        textAlign: 'center',
    },
});

export default AlertModal;
