//import { useNavigation } from '@react-navigation/native';
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
import { useNoteCreate } from '../../services/useApi/note/UseNote_Create';
import { languageUtils } from '../../utils/LanguageUtils';
export default function NoteCreateScreen({ navigation }) {

  // Initialize translations
  const [translations, setTranslations] = useState({});

  // Initialize translations
  useEffect(() => {
    const initializeTranslations = async () => {
      await languageUtils.loadLanguageData('Notes');
      
      // Get all translations at once
      const translatedLabels = await languageUtils.translateKeys([
        'LBL_MODULE_NAME',
        'LBL_CREATE_MODULE',
        'LBL_LOADING_CREATE',
        'LBL_CREATE_SUCCESS',
        'MSG_CREATE_SUCCESS',
        'LBL_ERROR',
        'MSG_CREATE_ERROR',
        'LBL_OK',
        'LBL_CREATE_BUTTON',
        'LBL_CHECK_BUTTON',
        'LBL_CHECK_PLACEHOLDER',
        'LBL_SELECT_PLACEHOLDER',
        'LBL_ACCOUNTS',
        'LBL_USERS',
        'LBL_TASKS',
        'LBL_MEETINGS'
      ], 'Notes');

      setTranslations({
        mdName: translatedLabels.LBL_MODULE_NAME,
        createModule: translatedLabels.LBL_CREATE_MODULE,
        loadingText: translatedLabels.LBL_LOADING_CREATE,
        successTitle: translatedLabels.LBL_CREATE_SUCCESS,
        successMessage: translatedLabels.MSG_CREATE_SUCCESS,
        errorTitle: translatedLabels.LBL_ERROR,
        errorMessage: translatedLabels.MSG_CREATE_ERROR,
        ok: translatedLabels.LBL_OK,
        createButton: translatedLabels.LBL_CREATE_BUTTON,
        checkButton: translatedLabels.LBL_CHECK_BUTTON,
        checkPlaceholder: translatedLabels.LBL_CHECK_PLACEHOLDER,
        selectPlaceholder: translatedLabels.LBL_SELECT_PLACEHOLDER,
        accounts: translatedLabels.LBL_ACCOUNTS,
        users: translatedLabels.LBL_USERS,
        tasks: translatedLabels.LBL_TASKS,
        meetings: translatedLabels.LBL_MEETINGS
      });
    };

    initializeTranslations();
  }, []);

  // Sử dụng custom hook
  const {
    formData,
    createFields,
    loading,
    error,
    validationErrors,
    updateField,
    createNote,
    resetForm,
    getFieldValue,
    getFieldLabel,
    getFieldError,
    isFormValid,
    hasParentNameField,
    checkParentName,
    clearParentRelationship
  } = useNoteCreate();

  // Local loading states
  const [saving, setSaving] = useState(false);
  const [checkingParent, setCheckingParent] = useState(false);

  // Modal state for parent_type selection
  const [showParentTypeModal, setShowParentTypeModal] = useState(false);

  // Fixed parent type options
  const parentTypeOptions = [
    { value: 'Accounts', label: translations.accounts || 'Khách hàng' },
    { value: 'Users', label: translations.users || 'Người dùng' },
    { value: 'Tasks', label: translations.tasks || 'Công việc' },
    { value: 'Meetings', label: translations.meetings || 'Cuộc họp' }
  ];

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await createNote();
      if (result.success) {
        Alert.alert(
          translations.successTitle || 'Thành công',
          translations.successMessage || 'Tạo ghi chú thành công!',
          [
            {
              text: translations.ok || 'OK',
              onPress: () => {
                resetForm();
                navigation.navigate('NoteListScreen');
              }
            }
          ]
        );
      }
    } catch (err) {
      Alert.alert(translations.errorTitle || 'Lỗi', err.message || (translations.errorMessage || 'Không thể tạo ghi chú'));
    } finally {
      setSaving(false);
    }
  };

  // Handle parent type selection
  const handleParentTypeSelect = async (value) => {
    await updateField('parent_type', value);
    setShowParentTypeModal(false);
  };

  // Get parent type label for display
  const getParentTypeLabel = () => {
    const selectedOption = parentTypeOptions.find(opt => opt.value === getFieldValue('parent_type'));
    return selectedOption ? selectedOption.label : (translations.selectPlaceholder || '--------');
  };

  // Handle check parent ID
  const handleCheckParentId = async () => {
    try {
      setCheckingParent(true);
      await checkParentName();
    } catch (err) {
      console.warn('Check parent error:', err);
    } finally {
      setCheckingParent(false);
    }
  };

  // Show loading state for initialization
  if (loading && createFields.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
        <TopNavigationCreate
          moduleName={translations.createModule || "Tạo Ghi chú"}
          navigation={navigation}
          name="NoteListScreen"
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
        <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
        {/* Thanh điều hướng */}
        <TopNavigationCreate
          moduleName={translations.createModule || "Tạo Ghi chú"}
          navigation={navigation}
          name="NoteListScreen"
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
            {createFields.map((field) => {
              const fieldError = getFieldError(field.key);
              const fieldValue = getFieldValue(field.key);

              // Skip parent_name field - use logic cũ với parent_type modal và parent_id input
              if (field.key === 'parent_name') {
                return null;
              }

              // Handle parent_type as modal combobox
              if (field.key === 'parent_type') {
                return (
                  <View key={field.key} style={styles.row}>
                    <Text style={styles.label}>
                      {field.label.replace(' *', '')}
                      {field.label.includes(' *') && <Text style={styles.requiredAsterisk}> *</Text>}
                    </Text>
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

              // Special handling for parent_id field with check button
              if (field.key === 'parent_id') {
                return (
                  <View key={field.key}>
                    <View style={styles.row}>
                      <Text style={styles.label}>
                        {field.label.replace(' *', '')}
                        {field.label.includes(' *') && <Text style={styles.requiredAsterisk}> *</Text>}
                      </Text>
                      <View style={[styles.valueBox, fieldError && styles.errorInput]}>
                        <TextInput
                          style={[styles.value]}
                          value={fieldValue}
                          onChangeText={async (value) => await updateField(field.key, value)}
                          autoCapitalize="none"
                          returnKeyType="done"
                        />
                      </View>
                      {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                    </View>

                    {/* Check button as label and result field below */}
                    <View style={styles.row}>
                      <View style={styles.checkLabelContainer}>
                        <TouchableOpacity
                          style={[styles.checkButton, checkingParent && styles.disabledButton]}
                          onPress={handleCheckParentId}
                          disabled={checkingParent}
                        >
                          {checkingParent ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.checkButtonText}>{translations.checkButton || 'Check'}</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                      {(getFieldValue('parent_name') || getFieldValue('parent_check_error')) ? (
                        getFieldValue('parent_name') ? (
                          <View style={[styles.valueBox, styles.successBox]}>
                            <Text style={[styles.value, styles.successFieldText]}>
                              ✓ {getFieldValue('parent_name')}
                            </Text>
                          </View>
                        ) : (
                          <View style={[styles.valueBox, styles.errorBox]}>
                            <Text style={[styles.value, styles.errorFieldText]}>
                              ✗ {getFieldValue('parent_check_error')}
                            </Text>
                          </View>
                        )
                      ) : (
                        <View style={[styles.valueBox, styles.placeholderBox]}>
                          <Text style={[styles.value, styles.placeholderText]}>
                            {translations.checkPlaceholder || 'Nhấn Check để kiểm tra'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              }

              // Regular field rendering

              return (
                <View key={field.key} style={styles.row}>
                  <Text style={styles.label}>
                    {field.label.replace(' *', '')}
                    {field.label.includes(' *') && <Text style={styles.requiredAsterisk}> *</Text>}
                  </Text>
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
            })}

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
                  <Text style={styles.saveButtonText}>{translations.createButton || 'Tạo ghi chú'}</Text>
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
            <TouchableOpacity
              style={styles.modalContainer}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
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
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d8d8d8', // nền xám nhạt
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

  /* NHÃN */
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

  /* Ô HỒNG */
  valueBox: {
    backgroundColor: '#e07c7c',     // hồng nhạt
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    width: '90%',
    alignSelf: 'center',
    justifyContent: 'center',

    // bóng nhẹ (Android sẽ dùng elevation, iOS dùng shadow…)
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },

  /* CHỮ TRONG Ô HỒNG */
  value: {
    fontSize: 16,
    color: '#000',
  },

  // New styles for enhanced functionality
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
    marginHorizontal: 20,
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
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 280,
    maxWidth: 320,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  modalCancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#6c757d',
  },
  modalCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  placeholderText: {
    color: '#999',
  },
  // Parent check styles
  checkLabelContainer: {
    paddingHorizontal: 20,
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  checkButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  successBox: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  placeholderBox: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
  },
  successFieldText: {
    color: '#155724',
  },
  errorFieldText: {
    color: '#721c24',
  },
});