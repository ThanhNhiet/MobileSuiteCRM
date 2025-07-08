import { Ionicons } from '@expo/vector-icons';
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

const ChangePasswordScreen = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [passwordError, setPasswordError] = useState('');
    const [confirmError, setConfirmError] = useState('');

    useEffect(() => {
        // Kiểm tra độ dài mật khẩu mới
        if (newPassword.length > 0 && newPassword.length < 8) {
            setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự');
        } else {
            setPasswordError('');
        }

        // Kiểm tra khớp mật khẩu xác nhận
        if (confirmPassword.length > 0 && confirmPassword !== newPassword) {
            setConfirmError('Xác nhận mật khẩu không khớp');
        } else {
            setConfirmError('');
        }
    }, [newPassword, confirmPassword]);

    const handleChangePassword = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin.');
            return;
        }

        if (passwordError || confirmError) {
            Alert.alert('Lỗi', 'Vui lòng kiểm tra lại thông tin.');
            return;
        }

        // TODO: Gửi yêu cầu đổi mật khẩu lên server
        Alert.alert('Thành công', 'Mật khẩu đã được đổi.');
    };

    const renderPasswordInput = ( label,value,setValue,show,setShow,errorMsg,isNewPasswordField = false) => (
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
            {errorMsg !== '' && (
                <Text style={styles.errorText}>{errorMsg}</Text>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>

            {renderPasswordInput('Mật khẩu hiện tại', currentPassword, setCurrentPassword, showCurrent, setShowCurrent, '')}
            {renderPasswordInput('Mật khẩu mới', newPassword, setNewPassword, showNew, setShowNew, passwordError)}
            {renderPasswordInput('Xác nhận mật khẩu', confirmPassword, setConfirmPassword, showConfirm, setShowConfirm, confirmError)}

            <TouchableOpacity
                style={[styles.button, (passwordError || confirmError) && styles.buttonDisabled]}
                onPress={handleChangePassword}
                disabled={!!passwordError || !!confirmError}
            >
                <Text style={styles.buttonText}>Đổi mật khẩu</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginVertical: 20,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        marginBottom: 6,
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    input: {
        flex: 1,
        height: 48,
    },
    errorText: {
        color: 'red',
        fontSize: 13,
        marginTop: 4,
    },
    button: {
        marginTop: 25,
        backgroundColor: '#007BFF',
        paddingVertical: 14,
        borderRadius: 8,
    },
    buttonDisabled: {
        backgroundColor: '#aaa',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
});
