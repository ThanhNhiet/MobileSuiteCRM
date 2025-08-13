import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import TopNavigationUpdate from "../../components/navigations/TopNavigationUpdate";
import { useModuleUpdate } from "../../services/useApi/module/UseModule_Update";
import { SystemLanguageUtils } from "../../utils/cacheViewManagement/SystemLanguageUtils";

export default function ModuleUpdateScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { moduleName, recordId, record } = route.params || {};

    // Check if navigation is available
    const isNavigationReady = navigation && typeof navigation.goBack === 'function';

    // SystemLanguageUtils instance
    const systemLanguageUtils = SystemLanguageUtils.getInstance();

    // State for translations
    const [translations, setTranslations] = useState({});

    // Use custom hook for module update
    const {
        formData,
        formFields,
        loading,
        saving,
        error,
        updateField,
        saveRecord,
        resetForm
    } = useModuleUpdate(moduleName, recordId, record);

    // Initialize translations
    useEffect(() => {
        const initTranslations = async () => {
            try {
                const translatedLabels = await systemLanguageUtils.translateKeys([
                    'LBL_SAVE',
                    'LBL_CANCEL',
                    'LBL_LOADING',
                    'LBL_SAVING',
                    'LBL_ERROR_GENERAL_TITLE',
                    'LBL_SUCCESS',
                    'LBL_UPDATED_SUCCESSFULLY',
                    'LBL_OK'
                ]);

                setTranslations(translatedLabels);
            } catch (error) {
                console.error('Error loading translations:', error);
            }
        };

        initTranslations();
    }, []);

    // Handle save
    const handleSave = async () => {
        const success = await saveRecord();
        if (success) {
            Alert.alert(
                translations.LBL_SUCCESS || 'Thành công',
                translations.LBL_UPDATED_SUCCESSFULLY || 'Cập nhật thành công',
                [
                    {
                        text: translations.LBL_OK || 'OK',
                        onPress: () => {
                            if (isNavigationReady) {
                                navigation.goBack();
                            }
                        }
                    }
                ]
            );
        }
    };

    // Handle cancel
    const handleCancel = () => {
        if (isNavigationReady) {
            navigation.goBack();
        }
    };

    // Render form field
    const renderFormField = (field) => {
        const value = formData[field.key] || '';
        
        return (
            <View key={field.key} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <TextInput
                    style={[
                        styles.fieldInput,
                        field.type === 'textarea' && styles.textareaInput
                    ]}
                    value={value}
                    onChangeText={(text) => updateField(field.key, text)}
                    placeholder={`Nhập ${field.label.toLowerCase()}...`}
                    multiline={field.type === 'textarea'}
                    numberOfLines={field.type === 'textarea' ? 4 : 1}
                    keyboardType={field.type === 'email' ? 'email-address' : 'default'}
                    autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
                />
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaProvider>
                <SafeAreaView style={styles.container}>
                    <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                    <TopNavigationUpdate 
                        title={translations.LBL_LOADING || 'Đang tải...'}
                        onBackPress={handleCancel}
                        onSavePress={handleSave}
                        showSave={false}
                    />
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>
                            {translations.LBL_LOADING || 'Đang tải...'}
                        </Text>
                    </View>
                </SafeAreaView>
            </SafeAreaProvider>
        );
    }

    if (error) {
        return (
            <SafeAreaProvider>
                <SafeAreaView style={styles.container}>
                    <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                    <TopNavigationUpdate 
                        title={translations.LBL_ERROR_GENERAL_TITLE || 'Lỗi'}
                        onBackPress={handleCancel}
                        onSavePress={handleSave}
                        showSave={false}
                    />
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={resetForm}
                        >
                            <Text style={styles.retryButtonText}>Thử lại</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                <TopNavigationUpdate 
                    title={`Sửa ${moduleName}`}
                    onBackPress={handleCancel}
                    onSavePress={handleSave}
                    showSave={true}
                    saveDisabled={saving}
                    saveText={saving ? (translations.LBL_SAVING || 'Đang lưu...') : (translations.LBL_SAVE || 'Lưu')}
                />

                <KeyboardAvoidingView 
                    style={styles.keyboardAvoid}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.formContainer}>
                            {formFields.map(field => renderFormField(field))}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancel}
                        disabled={saving}
                    >
                        <Text style={styles.cancelButtonText}>
                            {translations.LBL_CANCEL || 'Hủy'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.savingButton]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <Ionicons 
                            name={saving ? "hourglass-outline" : "checkmark-outline"} 
                            size={20} 
                            color={saving ? "#999" : "#fff"} 
                        />
                        <Text style={[styles.saveButtonText, saving && styles.savingButtonText]}>
                            {saving ? (translations.LBL_SAVING || 'Đang lưu...') : (translations.LBL_SAVE || 'Lưu')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
        marginVertical: 20,
        lineHeight: 24,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    formContainer: {
        backgroundColor: 'white',
        margin: 16,
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    fieldInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#fff',
    },
    textareaInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    actionContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
    },
    cancelButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        paddingVertical: 12,
        borderRadius: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    cancelButtonText: {
        color: '#495057',
        fontSize: 16,
        fontWeight: 'bold',
    },
    saveButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        borderRadius: 8,
        marginLeft: 8,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    savingButton: {
        backgroundColor: '#ccc',
    },
    savingButtonText: {
        color: '#999',
    },
});