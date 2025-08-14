import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TopNavigationCreate from '../../components/navigations/TopNavigationCreate';
import { useModule_Create } from '../../services/useApi/module/UseModule_Create';
import { SystemLanguageUtils } from '../../utils/cacheViewManagement/SystemLanguageUtils';

export default function ModuleCreateScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    
    // Get moduleName from route params
    const { moduleName } = route.params || {};
    
    // Validation
    if (!moduleName) {
        throw new Error('moduleName is required for ModuleCreateScreen');
    }

    // SystemLanguageUtils instance
    const systemLanguageUtils = SystemLanguageUtils.getInstance();

    // Initialize translations
    const [translations, setTranslations] = useState({});

    // Modal states
    const [showParentTypeModal, setShowParentTypeModal] = useState(false);
    const [parentTypeOptions, setParentTypeOptions] = useState([]);

    // Local loading states
    const [saving, setSaving] = useState(false);

    // Initialize translations
    useEffect(() => {
        const initializeTranslations = async () => {
            try {
                // Get all translations at once using SystemLanguageUtils
                const translatedLabels = await systemLanguageUtils.translateKeys([
                    `LBL_${moduleName.toUpperCase()}`,
                    'LBL_CREATE_BUTTON_LABEL',
                    'LBL_EMAIL_LOADING', 
                    'LBL_EMAIL_SUCCESS',
                    'LBL_ALT_INFO',
                    'UPLOAD_REQUEST_ERROR',
                    'Alerts',
                    'LBL_OK',
                    'LBL_SEARCH',
                    'LBL_ID_FF_SELECT',
                    'LBL_ACCOUNTS',
                    'LBL_USERS',
                    'LBL_TASKS',
                    'LBL_MEETINGS',
                    'LBL_CHECK_TO_VERIFY',
                    'LBL_CANCEL',
                    'LBL_SAVE',
                    'LBL_SELECT_BUTTON_LABEL',
                    'LBL_EMAIL_CANCEL'
                ]);

                setTranslations({
                    mdName: translatedLabels[`LBL_${moduleName.toUpperCase()}`] || moduleName,
                    createModule: translatedLabels.LBL_CREATE_BUTTON_LABEL + ' ' + (translatedLabels[`LBL_${moduleName.toUpperCase()}`] || moduleName),
                    loadingText: translatedLabels.LBL_EMAIL_LOADING || 'Đang tải...',
                    successTitle: translatedLabels.LBL_ALT_INFO || 'Thông tin',
                    successMessage: translatedLabels.LBL_EMAIL_SUCCESS || `Tạo ${moduleName} thành công!`,
                    errorTitle: translatedLabels.Alerts || 'Lỗi',
                    errorMessage: translatedLabels.UPLOAD_REQUEST_ERROR || `Không thể tạo ${moduleName}`,
                    ok: translatedLabels.LBL_OK || 'OK',
                    createButton: translatedLabels.LBL_CREATE_BUTTON_LABEL || 'Tạo',
                    checkButton: translatedLabels.LBL_SEARCH || 'Tìm',
                    checkPlaceholder: '',
                    selectPlaceholder: translatedLabels.LBL_ID_FF_SELECT || '--------',
                    accounts: translatedLabels.LBL_ACCOUNTS || 'Tài khoản',
                    users: translatedLabels.LBL_USERS || 'Người dùng',
                    tasks: translatedLabels.LBL_TASKS || 'Nhiệm vụ',
                    meetings: translatedLabels.LBL_MEETINGS || 'Cuộc họp',
                    checkToVerify: '',
                    notification: translatedLabels.LBL_ALT_INFO || 'Thông báo'
                });
            } catch (error) {
                console.error(`ModuleCreateScreen (${moduleName}): Error loading translations:`, error);
                // Set fallback translations
                setTranslations({
                    mdName: moduleName,
                    createModule: `Tạo ${moduleName}`,
                    loadingText: 'Đang tải...',
                    successTitle: 'Thành công',
                    successMessage: `Tạo ${moduleName} thành công!`,
                    errorTitle: 'Lỗi',
                    errorMessage: `Không thể tạo ${moduleName}`,
                    ok: 'OK',
                    createButton: 'Tạo',
                    checkButton: 'Check',
                    checkPlaceholder: 'Nhập để kiểm tra',
                    selectPlaceholder: '--------',
                    accounts: 'Khách hàng',
                    users: 'Người dùng',
                    tasks: 'Nhiệm vụ',
                    meetings: 'Cuộc họp',
                    checkToVerify: '',
                    notification: 'Thông báo'
                });
            }
        };

        initializeTranslations();
    }, [moduleName]);

    // Use the custom hook
    const {
        formData,
        createFields,
        loading,
        error,
        validationErrors,
        updateField,
        createRecord,
        resetForm,
        getFieldValue,
        getFieldLabel,
        getFieldError,
        isFormValid,
        hasParentNameField,
        getParentTypeOptions
    } = useModule_Create(moduleName);

    // Load parent type options when component mounts
    useEffect(() => {
        const loadParentTypeOptions = async () => {
            if (hasParentNameField()) {
                try {
                    const options = await getParentTypeOptions();
                    setParentTypeOptions(options);
                } catch (error) {
                    console.warn('Error loading parent type options:', error);
                }
            }
        };

        loadParentTypeOptions();
    }, [hasParentNameField, getParentTypeOptions]);

    // Handle parent type selection
    const handleParentTypeSelect = async (value) => {
        await updateField('parent_type', value);
        // Clear parent_name and parent_id when parent_type changes
        await updateField('parent_name', '');
        await updateField('parent_id', '');
        setShowParentTypeModal(false);
    };

    // Get parent type label for display
    const getParentTypeLabel = () => {
        const selectedOption = parentTypeOptions.find(opt => opt.value === getFieldValue('parent_type'));
        return selectedOption ? selectedOption.label : (translations.selectPlaceholder || '--------');
    };

    // Handle search modal item selection
    const handleSearchModalSelect = async (selectedItem) => {
        await updateField('parent_name', selectedItem.name);
        await updateField('parent_id', selectedItem.id); // Store the parent ID
    };

    // Handle assigned user selection
    const handleAssignedUserSelect = async (selectedItem) => {
        await updateField('assigned_user_name', selectedItem.name);
        await updateField('assigned_user_id', selectedItem.id); // Store the assigned user ID
    };

    // Handle save
    const handleSave = async () => {
        try {
            setSaving(true);
            const result = await createRecord();
            if (result.success) {
                Alert.alert(
                    translations.successTitle || 'Thành công',
                    translations.successMessage || `Tạo ${moduleName} thành công!`,
                    [
                        {
                            text: translations.ok || 'OK',
                            onPress: () => {
                                resetForm();
                                navigation.navigate('ModuleListScreen', { moduleName: moduleName });
                            }
                        }
                    ]
                );
            }
        } catch (err) {
            Alert.alert(translations.errorTitle || 'Lỗi', err.message || (translations.errorMessage || `Không thể tạo ${moduleName}`));
        } finally {
            setSaving(false);
        }
    };

    // Render field label with required indicator
    const renderFieldLabel = (fieldKey) => {
        const label = getFieldLabel(fieldKey);
        return (
            <Text style={styles.label}>
                {label.replace(' *', '')}
                {label.includes(' *') && <Text style={styles.requiredAsterisk}> *</Text>}
            </Text>
        );
    };

    // Render form fields
    const renderFormFields = () => {
        return createFields.map((field) => {
            const fieldError = getFieldError(field.key);
            const fieldValue = getFieldValue(field.key);

            // Handle parent_type as modal combobox
            if (field.key === 'parent_type') {
                return (
                    <View key={field.key} style={styles.row}>
                        {renderFieldLabel(field.key)}
                        <TouchableOpacity
                            style={[styles.valueBox, fieldError && styles.errorInput]}
                            onPress={() => setShowParentTypeModal(true)}
                        >
                            <Text style={[styles.value, !fieldValue && styles.placeholderText]}>
                                {getParentTypeLabel()}
                            </Text>
                        </TouchableOpacity>
                        {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                    </View>
                );
            }

            // Handle parent_name as search modal
            if (field.key === 'parent_name') {
                return (
                    <View key={field.key} style={styles.row}>
                        {renderFieldLabel(field.key)}
                        <TouchableOpacity
                            style={[
                                styles.valueBox, 
                                fieldError && styles.errorInput,
                                !getFieldValue('parent_type') && styles.disabledValueBox
                            ]}
                            onPress={() => {
                                if (getFieldValue('parent_type')) {
                                    navigation.navigate('SearchModulesScreen', {
                                        parentType: getFieldValue('parent_type'),
                                        title: getParentTypeLabel(),
                                        onSelect: handleSearchModalSelect
                                    });
                                } else {
                                    Alert.alert(
                                        translations.notification || 'Thông báo',
                                        'Vui lòng chọn loại cấp trên trước'
                                    );
                                }
                            }}
                            disabled={!getFieldValue('parent_type')}
                        >
                            <Text style={[
                                styles.value, 
                                !fieldValue && styles.placeholderText,
                                !getFieldValue('parent_type') && styles.disabledText
                            ]}>
                                {fieldValue || (translations.selectPlaceholder || '--------')}
                            </Text>
                        </TouchableOpacity>
                        {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                    </View>
                );
            }

            // Handle assigned_user_name as search modal for Users
            if (field.key === 'assigned_user_name') {
                return (
                    <View key={field.key} style={styles.row}>
                        {renderFieldLabel(field.key)}
                        <TouchableOpacity
                            style={[styles.valueBox, fieldError && styles.errorInput]}
                            onPress={() => {
                                navigation.navigate('SearchModulesScreen', {
                                    parentType: 'Users',
                                    title: translations.users || 'Người dùng',
                                    onSelect: handleAssignedUserSelect
                                });
                            }}
                        >
                            <Text style={[styles.value, !fieldValue && styles.placeholderText]}>
                                {fieldValue || (translations.selectPlaceholder || '--------')}
                            </Text>
                        </TouchableOpacity>
                        {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                    </View>
                );
            }

            // Default handling for all other fields (TextInput)
            return (
                <View key={field.key} style={styles.row}>
                    {renderFieldLabel(field.key)}
                    <View style={[styles.valueBox, fieldError && styles.errorInput]}>
                        <TextInput
                            style={[
                                styles.value,
                                field.key === 'description' && styles.multilineInput
                            ]}
                            value={fieldValue}
                            onChangeText={async (value) => await updateField(field.key, value)}
                            autoCapitalize="none"
                            returnKeyType={field.key === 'description' ? 'default' : 'done'}
                            multiline={field.key === 'description'}
                            numberOfLines={field.key === 'description' ? 4 : 1}
                            textAlignVertical={field.key === 'description' ? 'top' : 'center'}
                        />
                    </View>
                    {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                </View>
            );
        });
    };

    // Show loading state for initialization
    if (loading && createFields.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#d8d8d8" />
                <TopNavigationCreate
                    moduleName={translations.createModule || `Tạo ${moduleName}`}
                    navigation={navigation}
                    name="ModuleListScreen"
                />
                <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={{ marginTop: 16, color: '#666' }}>{translations.loadingText || 'Đang tải...'}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#d8d8d8" />
                
                <TopNavigationCreate 
                    moduleName={translations.createModule || `Tạo ${moduleName}`}
                    navigation={navigation}
                    name="ModuleListScreen"
                />

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Show error if any */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Form các trường */}
                        {renderFormFields()}

                        {/* Save Button */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    (!isFormValid() || saving) && styles.disabledButton
                                ]}
                                onPress={handleSave}
                                disabled={!isFormValid() || saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>{translations.createButton || `Tạo ${moduleName}`}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Parent Type Modal */}
                <Modal
                    visible={showParentTypeModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowParentTypeModal(false)}
                >
                    <TouchableOpacity 
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowParentTypeModal(false)}
                    >
                        <View style={styles.modalContainer}>
                            <ScrollView 
                                style={styles.modalScrollView}
                                contentContainerStyle={styles.modalScrollContent}
                                showsVerticalScrollIndicator={true}
                            >
                                {parentTypeOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={styles.modalOption}
                                        onPress={() => handleParentTypeSelect(option.value)}
                                    >
                                        <Text style={styles.modalOptionText}>{option.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#d8d8d8',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 10,
        minHeight: '80%',
    },
    row: {
        marginBottom: 20,
    },

    label: {
        fontSize: 16,
        color: '#000',
        marginBottom: 6,
        fontWeight: 'bold',
        paddingHorizontal: 20,
    },
    requiredAsterisk: {
        color: '#f44336',
        fontSize: 16,
        fontWeight: 'bold',
    },

    valueBox: {
        backgroundColor: '#e4a0a0ff',
        borderRadius: 6,
        paddingVertical: 12,
        paddingHorizontal: 14,
        width: '90%',
        alignSelf: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
    },

    disabledValueBox: {
        backgroundColor: '#f5f5f5',
        opacity: 0.6,
    },
    disabledText: {
        color: '#999',
    },

    value: {
        fontSize: 16,
        color: '#000',
    },

    errorContainer: {
        backgroundColor: '#ffebee',
        padding: 12,
        marginBottom: 20,
        borderRadius: 6,
        borderLeftWidth: 4,
        borderLeftColor: '#f44336',
        marginHorizontal: 10,
    },
    errorText: {
        color: '#c62828',
        fontSize: 14,
    },
    errorInput: {
        backgroundColor: '#ffcccb',
        borderWidth: 1,
        borderColor: '#f44336',
    },
    fieldError: {
        color: '#c62828',
        fontSize: 12,
        marginTop: 4,
        paddingHorizontal: 20,
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    buttonContainer: {
        paddingVertical: 20,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#ccc',
        elevation: 0,
        shadowOpacity: 0,
    },
    // Modal styles for parent type selection
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '100%',
        maxWidth: 350,
        maxHeight: '80%',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        flex: 1,
    },
    modalCloseButton: {
        padding: 5,
    },
    modalCloseText: {
        fontSize: 18,
        color: '#666',
        fontWeight: 'bold',
    },
    modalScrollView: {
        maxHeight: 400,
    },
    modalScrollContent: {
        paddingVertical: 10,
    },
    modalOption: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    modalCancelButton: {
        backgroundColor: '#6c757d',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    placeholderText: {
        color: '#999',
    },
});
