import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function UpdateProfileScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { profileData } = route.params;

    // Ref để giữ giá trị gốc không thay đổi giữa các render
    const initialProfile = useRef(profileData);

    // State cho các trường dữ liệu
    const [firstName, setFirstName] = useState(profileData.first_name || '');
    const [lastName, setLastName] = useState(profileData.last_name || '');
    const [description, setDescription] = useState(profileData.description || '');
    const [email1, setEmail1] = useState(profileData.email1 || '');
    const [phoneMobile, setPhoneMobile] = useState(profileData.phone_mobile || '');
    const [phoneWork, setPhoneWork] = useState(profileData.phone_work || '');
    const [phoneFax, setPhoneFax] = useState(profileData.phone_fax || '');
    const [addressStreet, setAddressStreet] = useState(profileData.address_street || '');


    const handleSave = () => {
        if (!firstName || !lastName || !email1) {
            Alert.alert('Thông báo', 'Họ, tên và email là bắt buộc.');
            return;
        }

        const isUnchanged =
            firstName === initialProfile.current.first_name &&
            lastName === initialProfile.current.last_name &&
            description === initialProfile.current.description &&
            email1 === initialProfile.current.email1 &&
            phoneMobile === initialProfile.current.phone_mobile &&
            phoneWork === initialProfile.current.phone_work &&
            phoneFax === initialProfile.current.phone_fax &&
            addressStreet === initialProfile.current.address_street;

        if (isUnchanged) {
            Alert.alert('Thông báo', 'Bạn chưa thay đổi thông tin nào.');
            return;
        }

        // TODO: Gửi dữ liệu lên server
        Alert.alert('Thành công', 'Thông tin đã được cập nhật.');
        navigation.goBack();
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
        <SafeAreaView style={styles.container}>
            <ScrollView>

                {renderInput('Họ', lastName, setLastName, 'person-outline')}
                {renderInput('Tên', firstName, setFirstName, 'person-circle-outline')}
                {renderInput('Mô tả', description, setDescription, 'document-text-outline', true)}
                {renderInput('Email', email1, setEmail1, 'mail-outline')}
                {renderInput('Điện thoại di động', phoneMobile, setPhoneMobile, 'call-outline')}
                {renderInput('Điện thoại cơ quan', phoneWork, setPhoneWork, 'business-outline')}
                {renderInput('Fax', phoneFax, setPhoneFax, 'print-outline')}
                {renderInput('Địa chỉ', addressStreet, setAddressStreet, 'location-outline', true)}

                <TouchableOpacity style={styles.button} onPress={handleSave}>
                    <Text style={styles.buttonText}>Lưu thay đổi</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 15,
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
        height: 48,
    },
    icon: {
        marginRight: 6,
    },
    input: {
        flex: 1,
        fontSize: 15,
    },
    button: {
        marginTop: 30,
        backgroundColor: '#007BFF',
        paddingVertical: 14,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
        fontSize: 16,
    },
});
