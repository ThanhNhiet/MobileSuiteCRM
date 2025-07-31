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
import { UserLanguageUtils } from '../../utils/cacheViewManagement/Users/UserLanguageUtils';

const ChangePasswordScreen = () => {
    const navigation = useNavigation();
    const userLanguageUtils = UserLanguageUtils.getInstance();
    
    // Custom hook để handle change password
    const { changing, error, success, changePassword, clearError } = useChangePassword();
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Translated labels
    const [labels, setLabels] = useState({
        success: 'Thành công',
        passwordSent: 'Mật khẩu đã được đổi',
        passwordSuccess: 'Đổi mật khẩu thành công!',
        processing: 'Đang xử lý...',
        updating: 'Đang cập nhật...',
        changePassword: 'Đổi mật khẩu',
        updatePassword: 'Cập nhật mật khẩu',
        import: 'Nhập',
        oldPassword: 'Mật khẩu hiện tại',
        newPassword: 'Mật khẩu mới',
        confirmPassword: 'Xác nhận mật khẩu',
        retypePassword: 'Xác nhận mật khẩu'
    });

    // Load translations
    useEffect(() => {
        const loadTranslations = async () => {
            try {
                const [
                    successLabel,
                    passwordSentLabel,
                    processingLabel,
                    updatingLabel,
                    changePasswordLabel,
                    updatePasswordLabel,
                    importLabel,
                    oldPasswordLabel,
                    newPasswordLabel,
                    confirmPasswordLabel
                ] = await Promise.all([
                    userLanguageUtils.translate('LBL_EMAIL_SUCCESS', 'Thành công'),
                    userLanguageUtils.translate('LBL_PASSWORD_SENT', 'Mật khẩu đã được đổi'),
                    userLanguageUtils.translate('LBL_PROCESSING_REQUEST', 'Đang xử lý...'),
                    userLanguageUtils.translate('LBL_PROCESSING_REQUEST', 'Đang cập nhật...'),
                    userLanguageUtils.translate('LBL_CHANGE_PASSWORD', 'Đổi mật khẩu'),
                    userLanguageUtils.translate('LBL_CHANGE_PASSWORD', 'Cập nhật mật khẩu'),
                    userLanguageUtils.translate('LBL_IMPORT', 'Nhập'),
                    userLanguageUtils.translate('LBL_OLD_PASSWORD', 'Mật khẩu hiện tại'),
                    userLanguageUtils.translate('LBL_NEW_PASSWORD', 'Mật khẩu mới'),
                    userLanguageUtils.translate('LBL_NEW_PASSWORD2', 'Xác nhận mật khẩu')
                ]);

                setLabels({
                    success: successLabel,
                    passwordSent: passwordSentLabel,
                    passwordSuccess: passwordSentLabel,
                    processing: processingLabel,
                    updating: updatingLabel,
                    changePassword: changePasswordLabel,
                    updatePassword: updatePasswordLabel,
                    import: importLabel,
                    oldPassword: oldPasswordLabel,
                    newPassword: newPasswordLabel,
                    confirmPassword: confirmPasswordLabel,
                    retypePassword: confirmPasswordLabel
                });
            } catch (error) {
                console.warn('Error loading change password translations:', error);
            }
        };

        loadTranslations();
    }, []);

    // Clear error khi người dùng thay đổi input
    useEffect(() => {
        if (error) {
            clearError();
        }
    }, [currentPassword, newPassword, confirmPassword]);

    const handleChangePassword = async () => {
        const success = await changePassword(currentPassword, newPassword, confirmPassword);
        
        if (success) {
            Alert.alert(labels.success, labels.passwordSent, [
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
                    placeholder={`${labels.import} ${label.toLowerCase()}`}
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
                    <Text style={styles.successText}>{labels.passwordSent}</Text>
                </View>
            )}

            {renderPasswordInput(labels.oldPassword, currentPassword, setCurrentPassword, showCurrent, setShowCurrent)}
            {renderPasswordInput(labels.newPassword, newPassword, setNewPassword, showNew, setShowNew)}
            {renderPasswordInput(labels.retypePassword, confirmPassword, setConfirmPassword, showConfirm, setShowConfirm)}

            <TouchableOpacity
                style={[styles.button, changing && styles.buttonDisabled]}
                onPress={handleChangePassword}
                disabled={changing}
            >
                <Text style={styles.buttonText}>
                    {changing ? labels.updating : labels.updatePassword}
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
