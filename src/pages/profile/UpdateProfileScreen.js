import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useUpdateProfile } from '../../services/useApi/user/UseUser_UpdateProfile';

export default function UpdateProfileScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { profileData, avatarUrl } = route.params;

    const {
        updating,
        error,
        success,
        loading,
        fieldLabels,
        nameFields,
        formData,
        profileDetailData,
        requiredFields,
        messengerOptions,
        updateProfile,
        clearError,
        initializeFormData,
        updateField
    } = useUpdateProfile();

    const [messengerModalVisible, setMessengerModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    // Initialize form data when hook is ready
    useEffect(() => {
        if (!loading && nameFields) {
            // Use profileDetailData if available (fetched from API), otherwise use profileData from navigation params
            const dataToUse = Object.keys(profileDetailData).length > 0 ? profileDetailData : profileData;
            initializeFormData(dataToUse);
        }
    }, [loading, nameFields, profileData, profileDetailData]);

    // Get field sections for dynamic rendering
    const getFieldSections = () => {
        if (!nameFields) return { general: [], phone: [], address: [], messenger: [] };
        
        const fieldNames = nameFields.split(',');
        const sections = {
            general: [],
            phone: [],
            address: [],
            messenger: []
        };

        for (const fieldName of fieldNames) {
            if (fieldName === 'photo') continue; // Photo handled separately
            
            if (fieldName.startsWith('phone_')) {
                sections.phone.push(fieldName);
            } else if (fieldName.startsWith('address_')) {
                sections.address.push(fieldName);
            } else if (fieldName.startsWith('messenger_')) {
                sections.messenger.push(fieldName);
            } else {
                sections.general.push(fieldName);
            }
        }

        return sections;
    };

    const handleSave = async () => {
        clearError();
        
        try {
            // Show different message if uploading a photo
            const isUploadingPhoto = selectedImage && selectedImage !== avatarUrl;
            // const loadingMessage = isUploadingPhoto ? 
            //     'Updating profile and uploading photo...' : 
            //     'Updating profile...';
                
            // if (isUploadingPhoto) {
            //     Alert.alert('Uploading', loadingMessage);
            // }
            
            const result = await updateProfile();
            if (result) {
                const successMessage = isUploadingPhoto ? 
                    'Profile information and photo have been updated.' : 
                    'Profile information has been updated.';
                    
                Alert.alert('Success', successMessage, [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (err) {
            // Error handled by hook
        }
    };

    const handleImagePicker = () => {
        Alert.alert(
            'Select Image',
            'Where would you like to select the image from?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Library', onPress: () => pickImage('library') },
                { text: 'Camera', onPress: () => pickImage('camera') }
            ]
        );
    };

    const pickImage = async (source) => {
        try {
            let result;
            if (source === 'camera') {
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.8,
                });
            } else {
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.8,
                });
            }

            if (!result.canceled && result.assets[0]) {
                setSelectedImage(result.assets[0].uri);
                updateField('photo', result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Unable to select image');
        }
    };

    const renderPhotoSection = () => (
        <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>Avatar</Text>
            <TouchableOpacity 
                style={styles.photoContainer} 
                onPress={handleImagePicker}
                disabled={updating}
            >
                {updating && selectedImage ? (
                    <View style={[styles.photoPlaceholder, styles.uploadingContainer]}>
                        <ActivityIndicator size="large" color="#007BFF" />
                        <Text style={styles.uploadingText}>Uploading...</Text>
                    </View>
                ) : selectedImage || avatarUrl ? (
                    <Image
                        source={{ uri: selectedImage || avatarUrl }}
                        style={styles.photo}
                    />
                ) : (
                    <View style={styles.photoPlaceholder}>
                        <Ionicons name="camera-outline" size={40} color="#999" />
                        <Text style={styles.photoPlaceholderText}>Select Image</Text>
                    </View>
                )}
                {!updating && (
                    <View style={styles.photoOverlay}>
                        <Ionicons name="camera-outline" size={20} color="white" />
                    </View>
                )}
            </TouchableOpacity>
            {selectedImage && selectedImage !== profileData.photo && (
                <Text style={styles.photoHint}>New photo will be uploaded when saving</Text>
            )}
        </View>
    );

    const renderInput = (fieldName) => {
        const label = fieldLabels[fieldName] || fieldName;
        const value = formData[fieldName] || '';
        const isRequired = requiredFields.includes(fieldName);
        
        let icon = 'document-text-outline';
        let multiline = false;
        let keyboardType = 'default';

        // Set appropriate icons and input types
        if (fieldName.includes('phone')) {
            icon = 'call-outline';
            keyboardType = 'phone-pad';
        } else if (fieldName.includes('email')) {
            icon = 'mail-outline';
            keyboardType = 'email-address';
        } else if (fieldName.includes('address')) {
            icon = 'location-outline';
        } else if (fieldName === 'description') {
            icon = 'document-text-outline';
            multiline = true;
        } else if (fieldName === 'user_name') {
            icon = 'person-outline';
        } else if (fieldName.includes('name')) {
            icon = 'person-outline';
        } else if (fieldName === 'title') {
            icon = 'briefcase-outline';
        } else if (fieldName === 'department') {
            icon = 'business-outline';
        }

        return (
            <View key={fieldName} style={styles.inputContainer}>
                <Text style={[styles.label, isRequired && styles.requiredLabel]}>
                    {label} {isRequired && <Text style={styles.asterisk}>*</Text>}
                </Text>
                <View style={[styles.inputWrapper, multiline && { height: 100, alignItems: 'flex-start' }]}>
                    <Ionicons name={icon} size={20} color="gray" style={styles.icon} />
                    <TextInput
                        style={[styles.input, multiline && { height: '100%', textAlignVertical: 'top' }]}
                        value={value}
                        onChangeText={(text) => updateField(fieldName, text)}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        multiline={multiline}
                        keyboardType={keyboardType}
                    />
                </View>
            </View>
        );
    };

    const renderMessengerInput = (fieldName) => {
        if (fieldName !== 'messenger_type') return renderInput(fieldName);

        const label = fieldLabels[fieldName] || fieldName;
        const value = formData[fieldName] || '';
        const selectedOption = messengerOptions.find(opt => opt.value === value);

        return (
            <View key={fieldName} style={styles.inputContainer}>
                <Text style={styles.label}>{label}</Text>
                <TouchableOpacity
                    style={styles.inputWrapper}
                    onPress={() => setMessengerModalVisible(true)}
                >
                    <Ionicons name="chatbox-outline" size={20} color="gray" style={styles.icon} />
                    <Text style={[styles.input, { color: value ? '#333' : '#999' }]}>
                        {selectedOption?.label || 'Select Messenger Type'}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={20} color="gray" />
                </TouchableOpacity>
            </View>
        );
    };

    const renderSection = (title, fields, isMessenger = false) => {
        if (fields.length === 0) return null;

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {fields.map(fieldName => 
                    isMessenger ? renderMessengerInput(fieldName) : renderInput(fieldName)
                )}
            </View>
        );
    };

    const MessengerModal = () => (
        <Modal
            animationType="slide"
            transparent={true}     
            visible={messengerModalVisible}
            onRequestClose={() => setMessengerModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Messenger Type</Text>
                        <TouchableOpacity onPress={() => setMessengerModalVisible(false)}>
                            <Ionicons name="close-outline" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView>
                        {messengerOptions.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.modalOption,
                                    formData.messenger_type === option.value && styles.selectedOption
                                ]}
                                onPress={() => {
                                    updateField('messenger_type', option.value);
                                    setMessengerModalVisible(false);
                                }}
                            >
                                <Text style={[
                                    styles.modalOptionText,
                                    formData.messenger_type === option.value && styles.selectedOptionText
                                ]}>
                                    {option.label}
                                </Text>
                                {formData.messenger_type === option.value && (
                                    <Ionicons name="checkmark-outline" size={20} color="#007BFF" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <SafeAreaProvider>
                <SafeAreaView style={styles.container}>
                    <View style={styles.loadingContainer}>
                        <Text>Loading...</Text>
                    </View>
                </SafeAreaView>
            </SafeAreaProvider>
        );
    }

    const sections = getFieldSections();

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                    {/* Error Display */}
                    {error && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle-outline" size={20} color="#FF3B30" />
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity onPress={clearError}>
                                <Ionicons name="close-outline" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Success Display */}
                    {success && (
                        <View style={styles.successContainer}>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" />
                            <Text style={styles.successText}>Update successful!</Text>
                        </View>
                    )}

                    {/* Photo Section */}
                    {renderPhotoSection()}

                    {/* Dynamic Sections */}
                    {renderSection('General Information', sections.general)}
                    {renderSection('Contact Information', sections.phone)}
                    {renderSection('Address', sections.address)}
                    {renderSection('Messenger', sections.messenger, true)}

                    <TouchableOpacity
                        style={[styles.button, updating && styles.buttonDisabled]}
                        onPress={handleSave}
                        disabled={updating}
                    >
                        <Text style={styles.buttonText}>
                            {updating ? 
                                (selectedImage && selectedImage !== avatarUrl ? 'Uploading Photo...' : 'Updating...') 
                                : 'Save Changes'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.footer}></View>
                </ScrollView>

                <MessengerModal />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFE6E6',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#FF3B30',
    },
    errorText: {
        flex: 1,
        color: '#FF3B30',
        marginLeft: 10,
        fontSize: 14,
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F7E6',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#34C759',
    },
    successText: {
        flex: 1,
        color: '#34C759',
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '600',
    },
    photoSection: {
        marginBottom: 30,
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    photoContainer: {
        position: 'relative',
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    photo: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    photoPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPlaceholderText: {
        marginTop: 8,
        fontSize: 12,
        color: '#999',
    },
    photoOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#007BFF',
        width: 35,
        height: 35,
        borderRadius: 17.5,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    uploadingContainer: {
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
    },
    uploadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#007BFF',
        fontWeight: '600',
    },
    photoHint: {
        marginTop: 8,
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    section: {
        marginBottom: 25,
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    requiredLabel: {
        color: '#333',
    },
    asterisk: {
        color: '#FF3B30',
        fontSize: 16,
    },
    inputWrapper: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
        height: 48,
        backgroundColor: 'white',
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    button: {
        marginTop: 30,
        backgroundColor: '#007BFF',
        paddingVertical: 15,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
        elevation: 0,
        shadowOpacity: 0,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
        fontSize: 16,
    },
    footer: {
        marginTop: 50
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        width: '85%',
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    selectedOption: {
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
    },
    modalOptionText: {
        fontSize: 16,
        color: '#333',
    },
    selectedOptionText: {
        color: '#007BFF',
        fontWeight: '600',
    },
});
