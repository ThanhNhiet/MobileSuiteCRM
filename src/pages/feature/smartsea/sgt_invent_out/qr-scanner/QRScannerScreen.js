import React, { useState, useRef, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { searchProductByBarcode } from './api';

export default function QRScannerScreen({ visible, onClose, onScanSuccess, warehouseId }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    // Reset state when modal becomes visible
    useEffect(() => {
        if (visible) {
            setScanned(false);
            setLoading(false);
            setErrorMsg(null);
        }
    }, [visible]);

    if (!visible) return null;

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <Modal visible={visible} transparent={false} animationType="slide">
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>Ứng dụng cần quyền truy cập Camera để quét mã vạch.</Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Cấp quyền Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelButtonText}>Đóng</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    const handleBarCodeScanned = async ({ type, data }) => {
        if (scanned || loading) return;
        setScanned(true);
        setLoading(true);
        setErrorMsg(null);

        try {
            const cleanData = data ? String(data).trim() : '';
            const productData = await searchProductByBarcode(cleanData, warehouseId);

            onScanSuccess(productData); // Trả về data cho Modal chính
        } catch (error) {
            setErrorMsg(error.toString());
            // Cho phép quét lại sau 2 giây nếu lỗi
            setTimeout(() => {
                if (visible) {
                    setScanned(false);
                    setLoading(false);
                }
            }, 2000);
        }
    };

    return (
        <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
            <SafeAreaProvider>
                <SafeAreaView style={styles.container}>
                    <StatusBar barStyle="light-content" backgroundColor="#000" />

                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={onClose}>
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Quét Mã Sản Phẩm</Text>
                        <TouchableOpacity style={styles.flashButton} onPress={() => setFlashOn(!flashOn)}>
                            <Ionicons name={flashOn ? "flash" : "flash-off"} size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Camera */}
                    <View style={styles.cameraContainer}>
                        <CameraView
                            style={StyleSheet.absoluteFillObject}
                            facing="back"
                            enableTorch={flashOn}
                            barcodeScannerSettings={{
                                barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39'],
                            }}
                            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        />

                        {/* Overlay */}
                        <View style={styles.overlay}>
                            <View style={styles.overlayTop} />
                            <View style={styles.overlayMiddle}>
                                <View style={styles.overlaySide} />
                                <View style={styles.scannerFrame}>
                                    <View style={[styles.corner, styles.topLeft]} />
                                    <View style={[styles.corner, styles.topRight]} />
                                    <View style={[styles.corner, styles.bottomLeft]} />
                                    <View style={[styles.corner, styles.bottomRight]} />
                                </View>
                                <View style={styles.overlaySide} />
                            </View>
                            <View style={styles.overlayBottom}>
                                <Text style={styles.instructionText}>
                                    Đưa mã vạch vào khung hình để quét
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Loading / Error Feedback */}
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#ffffff" />
                            <Text style={styles.loadingText}>Đang tìm sản phẩm...</Text>
                        </View>
                    )}
                    {errorMsg && (
                        <View style={styles.errorOverlay}>
                            <Text style={styles.errorText}>{errorMsg}</Text>
                        </View>
                    )}
                </SafeAreaView>
            </SafeAreaProvider>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: { padding: 5 },
    flashButton: { padding: 5 },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', width: '100%' },
    overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', width: '100%', alignItems: 'center', paddingTop: 20 },
    overlayMiddle: { flexDirection: 'row', height: 250 },
    overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    scannerFrame: {
        width: 250,
        height: 250,
        backgroundColor: 'transparent',
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#00FF00',
    },
    topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
    topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
    bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
    instructionText: {
        color: '#fff',
        fontSize: 14,
        marginTop: 20,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff'
    },
    permissionText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    permissionButton: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
    },
    permissionButtonText: { color: '#fff', fontWeight: 'bold' },
    cancelButton: {
        padding: 12,
    },
    cancelButtonText: { color: '#FF3B30' },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
        fontSize: 16,
    },
    errorOverlay: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 59, 48, 0.9)',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        zIndex: 20,
    },
    errorText: { color: '#fff', fontWeight: 'bold' }
});