import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useChangePassword } from '../../services/useApi/user/UseUser_ChangePswd';

const ChangePasswordScreen = () => {
    const navigation = useNavigation();
    
    // Custom hook để handle change password
    const { changing, error, success, changePassword, clearError } = useChangePassword();
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Clear error khi người dùng thay đổi input
    useEffect(() => {
        if (error) {
            clearError();
        }
    }, [currentPassword, newPassword, confirmPassword]);

    const handleChangePassword = async () => {
        const success = await changePassword(currentPassword, newPassword, confirmPassword);
        
        if (success) {
            Alert.alert('Thành công', 'Mật khẩu đã được đổi.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        }
        // Lỗi đã được handle trong hook và hiển thị trong UI
    };

    const renderPasswordInput = ( label,value,setValue,show,setShow) => (
        <View style={styles.inputContainer}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.passwordWrapper}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={text => setValue(text)}
                    secureTextEntry={!show}
                    placeholder={`Nhập ${label.toLowerCase()}`}
                />
                <TouchableOpacity onPress={() => setShow(!show)}>
                    <Ionicons name={show ? 'eye-off' : 'eye'} size={24} color="gray" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
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
                    <Text style={styles.successText}>Đổi mật khẩu thành công!</Text>
                </View>
            )}

            {renderPasswordInput('Mật khẩu hiện tại', currentPassword, setCurrentPassword, showCurrent, setShowCurrent)}
            {renderPasswordInput('Mật khẩu mới', newPassword, setNewPassword, showNew, setShowNew)}
            {renderPasswordInput('Xác nhận mật khẩu', confirmPassword, setConfirmPassword, showConfirm, setShowConfirm)}

            <TouchableOpacity
                style={[styles.button, changing && styles.buttonDisabled]}
                onPress={handleChangePassword}
                disabled={changing}
            >
                <Text style={styles.buttonText}>
                    {changing ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f9fa',
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
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: 'white',
    },
    input: {
        flex: 1,
        height: 48,
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
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
});
