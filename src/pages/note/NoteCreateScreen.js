//import { useNavigation } from '@react-navigation/native';
import { NoteLanguageUtils } from '@/src/utils/cacheViewManagement/Notes/NoteLanguageUtils';
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
import { SystemLanguageUtils } from '../../utils/cacheViewManagement/SystemLanguageUtils';

export default function NoteCreateScreen({ navigation }) {
  // LanguageUtils instance
  const systemLanguageUtils = SystemLanguageUtils.getInstance();
  const noteLanguageUtils = NoteLanguageUtils.getInstance();

  // Initialize translations
  const [translations, setTranslations] = useState({});

  // Initialize translations
  useEffect(() => {
    const initializeTranslations = async () => {
      try {
        // Get all translations at once using SystemLanguageUtils
        const translatedLabels = await systemLanguageUtils.translateKeys([
          'Notes',
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
          'LBL_PARENT_ID_LABEL',
          'LBL_NOTIFICATION'
        ]);
        
        const translatedLabels_notes = await noteLanguageUtils.translateKeys([
          'LBL_PARENT_ID'
        ]);

        setTranslations({
          mdName: translatedLabels.Notes || 'Ghi chú',
          createModule: translatedLabels.LBL_CREATE_BUTTON_LABEL + ' ' + translatedLabels.Notes || 'Tạo Ghi chú',
          loadingText: translatedLabels.LBL_EMAIL_LOADING || 'Đang tải...',
          successTitle: translatedLabels.LBL_ALT_INFO || 'Thông tin',
          successMessage: translatedLabels.LBL_EMAIL_SUCCESS || 'Tạo ghi chú thành công!',
          errorTitle: translatedLabels.Alerts || 'Lỗi',
          errorMessage: translatedLabels.UPLOAD_REQUEST_ERROR || 'Không thể tạo ghi chú',
          ok: translatedLabels.LBL_OK,
          createButton: translatedLabels.LBL_CREATE_BUTTON_LABEL,
          checkButton: translatedLabels.LBL_SEARCH || 'Tìm',
          checkPlaceholder: '',
          selectPlaceholder: translatedLabels.LBL_ID_FF_SELECT || 'Chọn',
          accounts: translatedLabels.LBL_ACCOUNTS,
          users: translatedLabels.LBL_USERS,
          tasks: translatedLabels.LBL_TASKS,
          meetings: translatedLabels.LBL_MEETINGS,
          checkToVerify: '',
          parentIdLabel: translatedLabels_notes.LBL_PARENT_ID || 'ID Cha',
          notification: translatedLabels.LBL_NOTIFICATION || 'Thông báo'
        });
      } catch (error) {
        console.warn('Translation initialization error:', error);
        // Set fallback translations
        setTranslations({
          mdName: 'Ghi chú',
          createModule: 'Tạo Ghi chú',
          loadingText: 'Đang tải...',
          successTitle: 'Thành công',
          successMessage: 'Tạo ghi chú thành công!',
          errorTitle: 'Lỗi',
          errorMessage: 'Không thể tạo ghi chú',
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
          parentIdLabel: 'ID Cha',
          notification: 'Thông báo'
        });
      }
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
    getParentTypeOptions
  } = useNoteCreate();

  // Local loading states
  const [saving, setSaving] = useState(false);

  // Modal state for parent_type selection
  const [showParentTypeModal, setShowParentTypeModal] = useState(false);

  // Parent type options with translations
  const [parentTypeOptions, setParentTypeOptions] = useState([]);

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

  // Load parent type options
  useEffect(() => {
    const loadParentTypeOptions = async () => {
      const options = await getParentTypeOptions();
      setParentTypeOptions(options);
    };
    loadParentTypeOptions();
  }, [getParentTypeOptions]);

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

              // Handle parent_name as search modal
              if (field.key === 'parent_name') {
                return (
                  <View key={field.key} style={styles.row}>
                    <Text style={styles.label}>
                      {field.label.replace(' *', '')}
                      {field.label.includes(' *') && <Text style={styles.requiredAsterisk}> *</Text>}
                    </Text>
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
                    <Text style={styles.label}>
                      {field.label.replace(' *', '')}
                      {field.label.includes(' *') && <Text style={styles.requiredAsterisk}> *</Text>}
                    </Text>
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

  disabledValueBox: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  disabledText: {
    color: '#999',
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
});