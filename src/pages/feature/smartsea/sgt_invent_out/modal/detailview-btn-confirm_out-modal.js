import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { detailViewBtnConfirmOutProcess } from '../process/detailview-btn-confirm_out-process';
import { Ionicons } from '@expo/vector-icons';

export default function ConfirmOutModal({ visible, onClose, recordId, apiConfig, onSuccess }) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const response = await detailViewBtnConfirmOutProcess({ recordId, apiConfig });
            
            if (response && response.success) {
                Alert.alert("Thành công", response.message || "Xuất kho thành công", [
                    {
                        text: "OK",
                        onPress: () => {
                            if (onSuccess) onSuccess();
                        }
                    }
                ]);
            } else {
                Alert.alert("Lỗi", response?.message || "Có lỗi xảy ra");
            }
        } catch (error) {
            const errorMsg = error?.response?.data?.message || "Không thể gọi API xuất kho";
            Alert.alert("Lỗi", errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Xác nhận Xuất kho</Text>
                        <TouchableOpacity onPress={onClose} disabled={loading}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.content}>
                        <Text style={styles.messageText}>
                            Bạn có chắc chắn muốn thực hiện xuất kho phiếu này không? Hành động này không thể hoàn tác.
                        </Text>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onClose} disabled={loading}>
                            <Text style={styles.btnCancelText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={handleConfirm} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.btnConfirmText}>Xác nhận</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827'
    },
    content: {
        marginBottom: 25
    },
    messageText: {
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 24,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12
    },
    btn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
        justifyContent: 'center'
    },
    btnCancel: {
        backgroundColor: '#F3F4F6',
    },
    btnCancelText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 15
    },
    btnConfirm: {
        backgroundColor: '#4B84FF',
    },
    btnConfirmText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15
    }
});
