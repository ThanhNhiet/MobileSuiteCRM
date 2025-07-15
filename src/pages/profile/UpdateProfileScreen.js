import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
    Alert,
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
    const { profileData } = route.params;

    // Custom hook để handle update profile
    const { updating, error, success, updateProfile, clearError } = useUpdateProfile();

    // Ref để giữ giá trị gốc không thay đổi giữa các render
    const initialProfile = useRef(profileData);

    // State cho các trường dữ liệu
    const [fullName, setFullName] = useState(profileData.full_name || '');
    const [description, setDescription] = useState(profileData.description || '');
    const [email1, setEmail1] = useState(profileData.email1 || '');
    const [phoneMobile, setPhoneMobile] = useState(profileData.phone_mobile || '');
    const [phoneWork, setPhoneWork] = useState(profileData.phone_work || '');
    const [addressStreet, setAddressStreet] = useState(profileData.address_street || '');
    const [addressCity, setAddressCity] = useState(profileData.address_city || '');
    const [addressCountry, setAddressCountry] = useState(profileData.address_country || '');

    const handleSave = async () => {
        // Clear error trước khi validate
        clearError();

        if (!fullName || !email1) {
            Alert.alert('Thông báo', 'Họ tên và email là bắt buộc.');
            return;
        }

        const isUnchanged =
            fullName === initialProfile.current.full_name &&
            description === initialProfile.current.description &&
            email1 === initialProfile.current.email1 &&
            phoneMobile === initialProfile.current.phone_mobile &&
            phoneWork === initialProfile.current.phone_work &&
            addressStreet === initialProfile.current.address_street &&
            addressCity === initialProfile.current.address_city &&
            addressCountry === initialProfile.current.address_country;

        if (isUnchanged) {
            Alert.alert('Thông báo', 'Bạn chưa thay đổi thông tin nào.');
            return;
        }

        try {
            // Chuẩn bị dữ liệu cập nhật
            const updateData = {
                full_name: fullName.trim(),
                description: description.trim(),
                email1: email1.trim(),
                phone_mobile: phoneMobile.trim(),
                phone_work: phoneWork.trim(),
                address_street: addressStreet.trim(),
                address_city: addressCity.trim(),
                address_country: addressCountry.trim()
            };

            await updateProfile(updateData);

            Alert.alert('Thành công', 'Thông tin đã được cập nhật.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (err) {
            // Error đã được handle trong hook
            console.log('Update profile error handled by hook');
        }
    };

    const renderInput = (label, value, setValue, icon, multiline = false) => (
        <View style={styles.inputContainer}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.inputWrapper, multiline && { height: 100, alignItems: 'flex-start' }]}>
                <Ionicons name={icon} size={20} color="gray" style={styles.icon} />
                <TextInput
                    style={[styles.input, multiline && { height: '100%', textAlignVertical: 'top' }]}
                    value={value}
                    onChangeText={setValue}
                    placeholder={`Nhập ${label.toLowerCase()}`}
                    multiline={multiline}
                />
            </View>
        </View>
    );

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
                            <Text style={styles.successText}>Cập nhật thành công!</Text>
                        </View>
                    )}

                    {renderInput('Họ và tên', fullName, setFullName, 'person-outline')}
                    {renderInput('Mô tả', description, setDescription, 'document-text-outline', true)}
                    {renderInput('Email', email1, setEmail1, 'mail-outline')}
                    {renderInput('Điện thoại di động', phoneMobile, setPhoneMobile, 'call-outline')}
                    {renderInput('Điện thoại cơ quan', phoneWork, setPhoneWork, 'business-outline')}
                    {renderInput('Địa chỉ', addressStreet, setAddressStreet, 'location-outline')}
                    {renderInput('Thành phố', addressCity, setAddressCity, 'business-outline')}
                    {renderInput('Quốc gia', addressCountry, setAddressCountry, 'flag-outline')}

                    <TouchableOpacity
                        style={[styles.button, updating && styles.buttonDisabled]}
                        onPress={handleSave}
                        disabled={updating}
                    >
                        <Text style={styles.buttonText}>
                            {updating ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.footer}></View>
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
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
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
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
});
