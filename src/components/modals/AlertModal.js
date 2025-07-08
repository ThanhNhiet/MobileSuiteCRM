import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const AlertModal = ({ visible, onClose }) => {
    const [notificationList, setNotificationList] = useState([
        {
            id: '1',
            sender: 'Admin',
            time: '05/07/2025 13:30',
            message: 'Gặp gỡ khách hàng John đã được phân công.',
            isHighlighted: true,
        },
        {
            id: '2',
            sender: 'Admin',
            time: '05/07/2025 10:00',
            message: 'Gặp gỡ Như Huỳnh tại phòng kế toán.',
            isHighlighted: false,
        },
        {
            id: '3',
            sender: 'System',
            time: '04/07/2025 16:45',
            message: 'Báo cáo hàng tháng đã được tạo thành công.',
            isHighlighted: false,
        },
        {
            id: '4',
            sender: 'Manager',
            time: '04/07/2025 14:20',
            message: 'Cuộc họp team vào lúc 15:00 ngày mai.',
            isHighlighted: false,
        },
        {
            id: '5',
            sender: 'HR',
            time: '03/07/2025 09:15',
            message: 'Thông báo nghỉ lễ Quốc khánh 02/09.',
            isHighlighted: false,
        },
    ]);

    const handleDeleteSingle = (itemId) => {
        Alert.alert(
            "Xác nhận xóa",
            "Xóa thông báo này?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: () => {
                        setNotificationList(prev => prev.filter(item => item.id !== itemId));
                    }
                }
            ]
        );
    };

    const handleDeleteAll = () => {
        Alert.alert(
            "Xác nhận xóa tất cả",
            "Xóa hết tất cả thông báo?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa tất cả",
                    style: "destructive",
                    onPress: () => {
                        setNotificationList([]);
                    }
                }
            ]
        );
    };

    const renderNotificationItem = ({ item }) => (
        <View style={[styles.notificationItem, item.isHighlighted && styles.highlightedItem]}>
            {/* Dấu x nhỏ ở góc trên bên phải */}
            <TouchableOpacity
                style={styles.deleteXButton}
                onPress={() => handleDeleteSingle(item.id)}
            >
                <Ionicons name="close" size={16} color="#FF4444" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                    <Text style={styles.senderText}>{item.sender}</Text>
                    <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <Text style={styles.messageText}>{item.message}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal
            animationType="fade"
            transparent
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.backgroundOverlay}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={30} color="black" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={notificationList}
                        renderItem={renderNotificationItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAll}>
                            <Text style={styles.deleteButtonText}>Xóa tất cả</Text>
                            <Ionicons name="trash" size={20} color="white" />
                        </TouchableOpacity>
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
    backgroundOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContainer: {
        width: '85%',
        height: '70%',
        backgroundColor: 'white',
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    closeButton: {
        padding: 5,
    },
    listContent: {
        padding: 15,
    },
    notificationItem: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginBottom: 10,
        position: 'relative',
    },
    highlightedItem: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3',
    },
    deleteXButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 1,
        padding: 4,
    },
    notificationContent: {
        paddingRight: 20,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    senderText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333',
    },
    timeText: {
        fontSize: 12,
        color: '#666',
    },
    messageText: {
        fontSize: 14,
        color: '#444',
    },
    footer: {
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: '#FF4444',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
});

export default AlertModal;
