import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Clipboard,
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import QRScanner from '../../../utils/feature/qr-scanner/QRScanner';

const { width, height } = Dimensions.get('window');

const QRScannerScreen = ({ navigation }) => {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [isActive, setIsActive] = useState(true);
    
    const scannerRef = useRef(null);
    const qrScannerUtil = QRScanner.getInstance();

    // Handle screen focus - activate/deactivate scanner
    useFocusEffect(
        React.useCallback(() => {
            setIsActive(true);
            setScanned(false);
            
            return () => {
                setIsActive(false);
            };
        }, [])
    );

    // Handle QR code scan
    const handleQRCodeRead = (e) => {
        if (!isActive || scanned) return;

        setScanned(true);
        
        // Process QR data using utility
        qrScannerUtil.processQRData(
            e.data,
            (processedData) => {
                setQrData(processedData);
                setModalVisible(true);
            },
            (error) => {
                Alert.alert('Scan Error', error, [
                    { text: 'OK', onPress: () => setScanned(false) }
                ]);
            }
        );
    };

    // Toggle flashlight
    const toggleFlash = () => {
        setFlashOn(!flashOn);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // Close modal and reset scanner
    const closeModal = () => {
        setModalVisible(false);
        setQrData(null);
        setScanned(false);
    };

    // Copy QR data to clipboard
    const copyToClipboard = async () => {
        if (qrData?.rawData) {
            await Clipboard.setString(qrData.rawData);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Copied', 'QR code content copied to clipboard');
        }
    };

    // Execute action based on QR type
    const executeAction = async () => {
        if (qrData?.actionable) {
            await qrScannerUtil.executeAction(qrData);
        }
    };

    // Go back to previous screen
    const goBack = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={goBack}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>QR Code Scanner</Text>
                <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
                    <Ionicons 
                        name={flashOn ? "flash" : "flash-off"} 
                        size={24} 
                        color="white" 
                    />
                </TouchableOpacity>
            </View>

            {/* QR Scanner */}
            <View style={styles.scannerContainer}>
                <QRCodeScanner
                    ref={scannerRef}
                    onRead={handleQRCodeRead}
                    flashMode={flashOn ? 'torch' : 'off'}
                    showMarker={true}
                    checkAndroid6Permissions={true}
                    cameraStyle={styles.camera}
                    markerStyle={styles.marker}
                    topViewStyle={styles.topView}
                    bottomViewStyle={styles.bottomView}
                    reactivate={!scanned && isActive}
                    reactivateTimeout={1000}
                />
                
                {/* Scanning overlay */}
                <View style={styles.overlay}>
                    {/* Top overlay */}
                    <View style={styles.overlayTop} />
                    
                    {/* Middle section with scanner frame */}
                    <View style={styles.overlayMiddle}>
                        <View style={styles.overlaySide} />
                        <View style={styles.scannerFrame}>
                            <View style={styles.scannerCorners}>
                                {/* Corner indicators */}
                                <View style={[styles.corner, styles.topLeft]} />
                                <View style={[styles.corner, styles.topRight]} />
                                <View style={[styles.corner, styles.bottomLeft]} />
                                <View style={[styles.corner, styles.bottomRight]} />
                            </View>
                        </View>
                        <View style={styles.overlaySide} />
                    </View>
                    
                    {/* Bottom overlay */}
                    <View style={styles.overlayBottom}>
                        <Text style={styles.instructionText}>
                            Align QR code within the frame to scan
                        </Text>
                    </View>
                </View>
            </View>

            {/* QR Data Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>QR Code Scanned</Text>
                            <TouchableOpacity onPress={closeModal}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Content */}
                        <ScrollView style={styles.modalContent}>
                            {qrData && (
                                <View>
                                    {/* QR Type */}
                                    <View style={styles.qrTypeContainer}>
                                        <Ionicons 
                                            name={getIconForType(qrData.type)} 
                                            size={24} 
                                            color="#4B84FF" 
                                        />
                                        <Text style={styles.qrType}>
                                            {qrData.type.toUpperCase()}
                                        </Text>
                                    </View>

                                    {/* Display Text */}
                                    <Text style={styles.qrDisplayText}>
                                        {qrData.displayText}
                                    </Text>

                                    {/* Raw Data */}
                                    <View style={styles.rawDataContainer}>
                                        <Text style={styles.rawDataLabel}>Raw Data:</Text>
                                        <Text style={styles.rawDataText}>
                                            {qrData.rawData}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        {/* Modal Actions */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.copyButton} 
                                onPress={copyToClipboard}
                            >
                                <Ionicons name="copy-outline" size={20} color="white" />
                                <Text style={styles.copyButtonText}>Copy</Text>
                            </TouchableOpacity>

                            {qrData?.actionable && (
                                <TouchableOpacity 
                                    style={styles.actionButton} 
                                    onPress={executeAction}
                                >
                                    <Text style={styles.actionButtonText}>
                                        {qrData.actionLabel}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity 
                                style={styles.scanAgainButton} 
                                onPress={closeModal}
                            >
                                <Text style={styles.scanAgainButtonText}>Scan Again</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// Helper function to get icon for QR type
const getIconForType = (type) => {
    switch (type) {
        case 'url': return 'globe-outline';
        case 'email': return 'mail-outline';
        case 'phone': return 'call-outline';
        case 'sms': return 'chatbubble-outline';
        case 'wifi': return 'wifi-outline';
        case 'location': return 'location-outline';
        case 'json': return 'code-outline';
        default: return 'document-text-outline';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    flashButton: {
        padding: 5,
    },
    scannerContainer: {
        flex: 1,
        position: 'relative',
    },
    camera: {
        height: height,
        width: width,
    },
    marker: {
        borderColor: '#4B84FF',
        borderRadius: 10,
    },
    topView: {
        flex: 0,
        backgroundColor: 'transparent',
    },
    bottomView: {
        flex: 0,
        backgroundColor: 'transparent',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },
    overlayTop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    overlayMiddle: {
        flexDirection: 'row',
        height: 250,
    },
    overlaySide: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    scannerFrame: {
        width: 250,
        height: 250,
        position: 'relative',
    },
    scannerCorners: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#4B84FF',
        borderWidth: 3,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    overlayBottom: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 50,
    },
    instructionText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: 'white',
        width: width * 0.9,
        maxHeight: height * 0.8,
        borderRadius: 20,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    modalContent: {
        padding: 20,
        maxHeight: height * 0.5,
    },
    qrTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    qrType: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4B84FF',
        marginLeft: 8,
    },
    qrDisplayText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#333',
        marginBottom: 20,
        lineHeight: 24,
    },
    rawDataContainer: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 10,
    },
    rawDataLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 8,
    },
    rawDataText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    modalActions: {
        flexDirection: 'row',
        padding: 20,
        gap: 10,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6c757d',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        gap: 5,
    },
    copyButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#4B84FF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    scanAgainButton: {
        backgroundColor: '#28a745',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    scanAgainButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default QRScannerScreen;