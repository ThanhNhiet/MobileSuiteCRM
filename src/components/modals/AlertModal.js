import { Ionicons } from '@expo/vector-icons';
import React from 'react';
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

const AlertModal = ({ visible, onClose }) => {
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
        console.log(`Alert pressed: ${alert.id}`);
        try {
            if (!alert.is_read) {
                await markAsRead(alert.id);
            }

            // Hiển thị thông tin chi tiết
            Alert.alert(
                alert.name,
                `Loại: ${alert.target_module}\nNgười tạo: ${alert.created_by_name}\nThời gian: ${formatDateTime(alert.date_entered)}`,
                [{ text: 'OK' }]
            );
        } catch (err) {
            Alert.alert('Lỗi', 'Không thể đánh dấu đã đọc');
        }
    };

    // Hàm xử lý đánh dấu tất cả đã đọc
    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            Alert.alert('Thành công', 'Đã đánh dấu tất cả thông báo là đã đọc');
        } catch (err) {
            Alert.alert('Lỗi', 'Không thể đánh dấu tất cả đã đọc');
        }
    };

    // Hàm xử lý xóa một alert
    const handleDeleteAlert = async (alertId) => {
        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa thông báo này không?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAlert(alertId);
                        } catch (err) {
                            Alert.alert('Lỗi', 'Không thể xóa thông báo');
                        }
                    }
                }
            ]
        );
    };

    // Hàm xử lý xóa tất cả alerts
    const handleDeleteAllAlerts = async () => {
        Alert.alert(
            'Xác nhận xóa tất cả',
            'Bạn có chắc chắn muốn xóa tất cả thông báo không? Hành động này không thể hoàn tác.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa tất cả',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAllAlerts();
                            Alert.alert('Thành công', 'Đã xóa tất cả thông báo');
                        } catch (err) {
                            Alert.alert('Lỗi', 'Không thể xóa tất cả thông báo');
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
            <Text style={styles.emptyText}>Không có thông báo nào</Text>
        </View>
    );

    // Render loading state
    if (loading && alerts.length === 0) {
        return (
            <Modal visible={visible} animationType="slide" transparent={true}>
                <View style={styles.overlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Thông báo</Text>
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#4B84FF" />
                            <Text style={styles.loadingText}>Đang tải thông báo...</Text>
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
                            Thông báo {unreadCount > 0 && `(${unreadCount} chưa đọc)`}
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
                                title="Kéo để tải lại..."
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
                                <Text style={styles.markAllText}>Đánh dấu đã đọc tất cả</Text>
                            </TouchableOpacity>
                        )}
                        
                        {alerts.length > 0 && (
                            <TouchableOpacity
                                style={styles.deleteAllButton}
                                onPress={handleDeleteAllAlerts}
                            >
                                <Ionicons name="trash-outline" size={16} color="white" />
                                <Text style={styles.deleteAllText}>Xóa tất cả</Text>
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
