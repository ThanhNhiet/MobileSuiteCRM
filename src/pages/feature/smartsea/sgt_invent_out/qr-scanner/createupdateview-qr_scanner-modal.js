import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mergeScannedProduct } from './createupdateview-qr_scanner-process';
import QRScannerScreen from './QRScannerScreen';
import { systemLanguageUtils } from '../../../../../utils/cacheViewManagement/SystemLanguageUtils';

export default function QRScannerModal({ 
    visible, 
    onClose, 
    onSave, 
    initialLineItems = [], 
    warehouseId 
}) {
    const [lineItems, setLineItems] = useState([]);
    const [scannerVisible, setScannerVisible] = useState(false);
    const [uomTranslations, setUomTranslations] = useState({});
    
    // Quantity Dialog State
    const [qtyDialogVisible, setQtyDialogVisible] = useState(false);
    const [scannedProduct, setScannedProduct] = useState(null);
    const [inputQty, setInputQty] = useState('1');

    // Sync when modal opens and load translations
    useEffect(() => {
        if (visible) {
            setLineItems(Array.isArray(initialLineItems) ? [...initialLineItems] : []);
            
            // Load UOM translations
            const loadTranslations = async () => {
                const langData = await systemLanguageUtils.loadLanguageData();
                if (langData?.appListStrings?.sgt_uom_list) {
                    setUomTranslations(langData.appListStrings.sgt_uom_list);
                }
            };
            loadTranslations();
        }
    }, [visible, initialLineItems]);

    // Handle successfully scanned product
    const handleScanSuccess = (productData) => {
        setScannerVisible(false); // Close camera
        setScannedProduct(productData);
        setInputQty('1'); // Default qty
        
        // Slight delay to allow camera modal to close before opening qty dialog
        setTimeout(() => {
            setQtyDialogVisible(true);
        }, 500);
    };

    // Handle confirming quantity
    const handleConfirmQty = () => {
        if (!scannedProduct) return;
        
        const qty = parseFloat(inputQty);
        if (isNaN(qty) || qty <= 0) {
            Alert.alert('Lỗi', 'Vui lòng nhập số lượng hợp lệ!');
            return;
        }
        
        // Kiểm tra số lượng tồn kho (nếu có yêu cầu chặn)
        const inventoryQty = parseFloat(scannedProduct.inventory_qty || scannedProduct.qty_cansell || 0);
        if (qty > inventoryQty) {
            Alert.alert('Cảnh báo', `Số lượng tồn kho chỉ còn ${inventoryQty}, bạn không thể xuất vượt quá số lượng này!`);
            return;
        }

        const updatedItems = mergeScannedProduct(lineItems, scannedProduct, qty);
        setLineItems(updatedItems);
        setQtyDialogVisible(false);
        setScannedProduct(null);
    };

    // Hàm xóa 1 item
    const handleDeleteItem = (indexToRemove) => {
        const newItems = lineItems.filter((_, index) => index !== indexToRemove);
        const reindexedItems = newItems.map((item, index) => ({
            ...item,
            no: index + 1
        }));
        setLineItems(reindexedItems);
    };

    // Render 1 dòng line item
    const renderItem = ({ item, index }) => {
        const uomText = uomTranslations[item.uom] || item.uom || '';
        
        return (
            <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>{index + 1}. {item.name}</Text>
                    <Text style={styles.itemCode}>Mã: {item.code_name || 'N/A'} - ĐVT: {uomText}</Text>
                    <Text style={styles.itemPrice}>Available: {item.inventory_qty}</Text>
                </View>
                <View style={styles.itemActions}>
                    <View style={styles.itemQtyContainer}>
                        <Text style={styles.itemQtyLabel}>SL</Text>
                        <Text style={styles.itemQtyValue}>{item.qty}</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.deleteBtn} 
                        onPress={() => handleDeleteItem(index)}
                    >
                        <Ionicons name="trash-outline" size={24} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Sản Phẩm Đã Quét</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {/* List */}
                    <View style={styles.listContainer}>
                        {lineItems.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="barcode-outline" size={50} color="#ccc" />
                                <Text style={styles.emptyText}>Chưa có sản phẩm nào.</Text>
                                <Text style={styles.emptySubText}>Bấm Quét mã để thêm sản phẩm</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={lineItems}
                                keyExtractor={(item, index) => (item.product_id || index).toString() + index}
                                renderItem={renderItem}
                                ItemSeparatorComponent={() => <View style={styles.separator} />}
                            />
                        )}
                    </View>

                    {/* Footer Buttons */}
                    <View style={styles.footer}>
                        <TouchableOpacity 
                            style={styles.scanButton} 
                            onPress={() => {
                                if (!warehouseId) {
                                    Alert.alert('Thông báo', 'Vui lòng chọn Kho xuất ở màn hình trước khi quét mã.');
                                    return;
                                }
                                setScannerVisible(true);
                            }}
                        >
                            <Ionicons name="qr-code-outline" size={20} color="#fff" style={{marginRight: 8}}/>
                            <Text style={styles.scanButtonText}>Quét mã</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.saveButton} 
                            onPress={() => {
                                onSave(lineItems);
                                onClose();
                            }}
                        >
                            <Ionicons name="save-outline" size={20} color="#fff" style={{marginRight: 8}}/>
                            <Text style={styles.saveButtonText}>Lưu & Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Camera Screen Modal */}
            <QRScannerScreen 
                visible={scannerVisible} 
                onClose={() => setScannerVisible(false)}
                onScanSuccess={handleScanSuccess}
                warehouseId={warehouseId}
            />

            {/* Quantity Input Dialog */}
            <Modal visible={qtyDialogVisible} transparent={true} animationType="fade">
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.dialogBackground}
                >
                    <View style={styles.dialogContainer}>
                        <Text style={styles.dialogTitle}>Nhập số lượng xuất</Text>
                        
                        {scannedProduct && (
                            <View style={styles.dialogProductInfo}>
                                <Text style={styles.dialogProductName}>{scannedProduct.name}</Text>
                                <Text style={styles.dialogProductSub}>Mã: {scannedProduct.part_number || scannedProduct.code_name}</Text>
                                <Text style={styles.dialogProductSub}>Tồn kho: {scannedProduct.qty_cansell || scannedProduct.inventory_qty}</Text>
                            </View>
                        )}

                        <TextInput
                            style={styles.dialogInput}
                            keyboardType="numeric"
                            value={inputQty}
                            onChangeText={setInputQty}
                            selectTextOnFocus
                            autoFocus
                        />

                        <View style={styles.dialogButtons}>
                            <TouchableOpacity 
                                style={[styles.dialogBtn, styles.dialogCancelBtn]} 
                                onPress={() => setQtyDialogVisible(false)}
                            >
                                <Text style={styles.dialogCancelText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.dialogBtn, styles.dialogConfirmBtn]} 
                                onPress={handleConfirmQty}
                            >
                                <Text style={styles.dialogConfirmText}>Xác nhận</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#f5f5f5',
        height: '85%',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    closeBtn: { padding: 5 },
    listContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: { marginTop: 10, fontSize: 16, color: '#666', fontWeight: 'bold' },
    emptySubText: { marginTop: 5, fontSize: 14, color: '#999' },
    separator: { height: 1, backgroundColor: '#f0f0f0' },
    itemRow: {
        flexDirection: 'row',
        padding: 15,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    itemInfo: { flex: 1, paddingRight: 10 },
    itemName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
    itemCode: { fontSize: 13, color: '#666', marginBottom: 2 },
    itemPrice: { fontSize: 13, color: '#888' },
    itemActions: { flexDirection: 'row', alignItems: 'center' },
    deleteBtn: { padding: 8, marginLeft: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fee2e2', borderRadius: 8 },
    itemQtyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e6f7ff',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#91d5ff',
    },
    itemQtyLabel: { fontSize: 11, color: '#0050b3', marginBottom: 2 },
    itemQtyValue: { fontSize: 16, fontWeight: 'bold', color: '#0050b3' },
    footer: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    scanButton: {
        flex: 1,
        backgroundColor: '#1890ff',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 14,
        borderRadius: 8,
        marginRight: 10,
    },
    scanButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    saveButton: {
        flex: 1,
        backgroundColor: '#52c41a',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 14,
        borderRadius: 8,
    },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    
    // Dialog styles
    dialogBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dialogContainer: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
    },
    dialogTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#333' },
    dialogProductInfo: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 15 },
    dialogProductName: { fontSize: 15, fontWeight: '600', color: '#1890ff', marginBottom: 4 },
    dialogProductSub: { fontSize: 13, color: '#666', marginTop: 2 },
    dialogInput: {
        borderWidth: 1,
        borderColor: '#d9d9d9',
        borderRadius: 8,
        padding: 12,
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
        backgroundColor: '#fafafa',
    },
    dialogButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    dialogBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
    dialogCancelBtn: { backgroundColor: '#f5f5f5', marginRight: 10 },
    dialogConfirmBtn: { backgroundColor: '#1890ff' },
    dialogCancelText: { color: '#666', fontWeight: '600', fontSize: 16 },
    dialogConfirmText: { color: '#fff', fontWeight: '600', fontSize: 16 }
});
