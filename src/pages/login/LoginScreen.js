import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useLogin } from '../../services/useApi/login/UseLogin';

export default function LoginScreen() {
    const [showPassword, setShowPassword] = useState(false);
    const { website, setWebsite, username, setUsername, password, setPassword, handleLogin } = useLogin();

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            {/* Status Bar */}
            <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />
            
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    {/* Logo Section */}
                    <View style={styles.logoContainer}>
                        <Image source={require("../../assets/images/logo-login.png")} style={styles.imageSize}/>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        {/* Website Link Input */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Link website"
                                placeholderTextColor="#999"
                                value={website}
                                onChangeText={setWebsite}
                                autoCapitalize="none"
                                keyboardType="url"
                            />
                        </View>

                        {/* Username Input */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Tên đăng nhập"
                                placeholderTextColor="#999"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Password Input with Eye Icon */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.input, styles.passwordInput]}
                                placeholder="Mật khẩu"
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowPassword(!showPassword)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-off" : "eye"}
                                    size={24}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.loginButtonText}>Đăng nhập</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100%',
    },
    logoContainer: {
        marginBottom: 40,
        alignItems: 'center',
    },
    formContainer: {
        width: '100%',
        alignItems: 'center',
    },
    imageSize: {
        width: 370,
        height: 110,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
        position: 'relative',
    },
    input: {
        backgroundColor: '#E0E0E0',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 15,
        fontSize: 16,
        color: '#333',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    passwordInput: {
        paddingRight: 55,
    },
    eyeIcon: {
        position: 'absolute',
        right: 20,
        top: '50%',
        transform: [{ translateY: -12 }],
        padding: 5,
    },
    loginButton: {
        backgroundColor: '#E85A4F',
        borderRadius: 25,
        paddingVertical: 15,
        paddingHorizontal: 50,
        marginTop: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
