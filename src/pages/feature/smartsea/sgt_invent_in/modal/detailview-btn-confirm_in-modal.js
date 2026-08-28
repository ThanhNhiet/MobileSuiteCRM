import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { detailViewBtnConfirmInProcess } from '../process/detailview-btn-confirm_in-process';

const ConfirmInModal = ({ visible, onClose, recordId, record, apiConfig, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [lineItems, setLineItems] = useState([]);
    const [statusDetail, setStatusDetail] = useState('in_full');
    
    useEffect(() => {
        if (visible && record?.lineitems_data) {
            try {
                let unescapedValue = record.lineitems_data
                    .replace(/&quot;/g, '"')
                    .replace(/&amp;/g, '&')
                    .replace(/&#039;/g, "'")
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>');
                
                const parsed = JSON.parse(unescapedValue);
                // Initialize actual_receive with qty if it's empty
                const initialItems = parsed.map(item => ({
                    ...item,
                    actual_receive: item.actual_receive || item.qty || '0'
                }));
                setLineItems(initialItems);
            } catch (e) {
                console.warn('Error parsing line items', e);
            }
        }
    }, [visible, record]);

    const handleActualReceiveChange = (index, value) => {
        const newItems = [...lineItems];
        newItems[index].actual_receive = value;
        setLineItems(newItems);
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const actual_receive_payload = lineItems.map(item => ({
                product_id: item.product_id,
                actual_receive: item.actual_receive
            }));

            const payload = {
                status_detail: statusDetail,
                actual_receive: actual_receive_payload
            };

            const response = await detailViewBtnConfirmInProcess({ recordId, apiConfig, payload });
            
            if (response && response.success) {
                Alert.alert("Thành công", response.message || "Xác nhận nhập kho thành công", [
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
            const errorMsg = error?.response?.data?.message || "Không thể gọi API xác nhận";
            Alert.alert("Lỗi", errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item, index }) => (
        <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>SL Cần Nhập: {item.qty}</Text>
            </View>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={String(item.actual_receive)}
                    onChangeText={(val) => handleActualReceiveChange(index, val)}
                    keyboardType="numeric"
                    placeholder="SL thực"
                />
            </View>
        </View>
    );

    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Xác nhận Thực Nhập</Text>
                        <TouchableOpacity onPress={onClose} disabled={loading}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.statusGroup}>
                        <Text style={styles.statusLabel}>Trạng thái chi tiết:</Text>
                        <View style={styles.radioRow}>
                            <TouchableOpacity 
                                style={[styles.radioBtn, statusDetail === 'in_full' && styles.radioBtnActive]} 
                                onPress={() => setStatusDetail('in_full')}>
                                <Text style={[styles.radioText, statusDetail === 'in_full' && styles.radioTextActive]}>Đúng/Đủ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.radioBtn, statusDetail === 'in_lack' && styles.radioBtnActive]} 
                                onPress={() => setStatusDetail('in_lack')}>
                                <Text style={[styles.radioText, statusDetail === 'in_lack' && styles.radioTextActive]}>Thiếu 1 phần</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.radioBtn, statusDetail === 'in_false' && styles.radioBtnActive]} 
                                onPress={() => setStatusDetail('in_false')}>
                                <Text style={[styles.radioText, statusDetail === 'in_false' && styles.radioTextActive]}>Không đúng/Trả lại</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <FlatList
                        data={lineItems}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => index.toString()}
                        style={styles.list}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />

                    <View style={styles.footer}>
                        <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onClose} disabled={loading}>
                            <Text style={styles.btnCancelText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.btnSubmit]} onPress={handleSubmit} disabled={loading}>
                            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnSubmitText}>Xác nhận</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 5
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827'
    },
    list: {
        padding: 16,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    itemInfo: {
        flex: 1,
        paddingRight: 10
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4
    },
    itemQty: {
        fontSize: 13,
        color: '#6b7280'
    },
    inputContainer: {
        width: 80
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 6,
        textAlign: 'center',
        fontSize: 15,
        color: '#111827'
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        justifyContent: 'flex-end',
        gap: 12
    },
    btn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center'
    },
    btnCancel: {
        backgroundColor: '#f3f4f6'
    },
    btnCancelText: {
        color: '#374151',
        fontWeight: '600'
    },
    btnSubmit: {
        backgroundColor: '#111827'
    },
    btnSubmitText: {
        color: '#fff',
        fontWeight: '600'
    },
    statusGroup: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8
    },
    radioRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap'
    },
    radioBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#fff'
    },
    radioBtnActive: {
        backgroundColor: '#eff6ff',
        borderColor: '#3b82f6'
    },
    radioText: {
        fontSize: 13,
        color: '#4b5563'
    },
    radioTextActive: {
        color: '#2563eb',
        fontWeight: '600'
    }
});

export default ConfirmInModal;
