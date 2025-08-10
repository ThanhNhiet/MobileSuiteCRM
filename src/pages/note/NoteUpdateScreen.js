import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TopNavigationUpdate from '../../components/navigations/TopNavigationUpdate';
import { useNoteUpdate } from '../../services/useApi/note/UseNote_Update';
import { NoteLanguageUtils } from '../../utils/cacheViewManagement/Notes/NoteLanguageUtils';
import { SystemLanguageUtils } from '../../utils/cacheViewManagement/SystemLanguageUtils';

export default function NoteUpdateScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { noteData } = route.params || {};

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
          'LBL_EDIT_BUTTON_LABEL',
          'Notes',
          'LBL_EMAIL_LOADING',
          'LBL_EMAIL_SUCCESS',
          'LBL_UPDATE',
          'LBL_EMAIL_ERROR_DESC',
          'MSG_UPDATE_ERROR',
          'LBL_OK',
          'LBL_SAVE_CHANGES_BUTTON_TITLE',
          'LBL_CLOSE_ACTIVITY_HEADER',
          'NTC_REMOVE_CONFIRMATION',
          'LBL_CANCEL',
          'LBL_CONFIRM_DISREGARD_EMAIL_TITLE',
          'Alerts',
          'MSG_NO_RELATIONSHIP',
          'LBL_CONFIRM_DELETE_RELATION',
          'MSG_CONFIRM_DELETE_RELATION',
          'LBL_EMAIL_IE_DELETE_SUCCESSFUL',
          'UPLOAD_REQUEST_ERROR',
          'LBL_DELETE_RELATION',
          'LBL_CLEAR_BUTTON_LABEL',
          'LBL_SEARCH',
          'LBL_CHECK_PLACEHOLDER',
          'LBL_SELECT_PLACEHOLDER',
          'LBL_CHECK_TO_VERIFY',
          'LBL_PARENT_ID_LABEL',
          'LBL_ALT_INFO',
          'LBL_EMAIL_LOADING',
          'LBL_LOADING_PAGE',
          'WARN_UNSAVED_CHANGES',
          'LBL_DELETE'
        ]);

        const translatedLabels_notes = await noteLanguageUtils.translateKeys([
          'LBL_PARENT_ID'
        ]);

        setTranslations({
          mdName: translatedLabels.Notes || 'Sửa Ghi chú',
          updateModule: translatedLabels.LBL_EDIT_BUTTON_LABEL + ' ' + translatedLabels.Notes || 'Cập nhật Ghi chú',
          loadingText: translatedLabels.LBL_EMAIL_LOADING || 'Đang tải...',
          successTitle: translatedLabels.LBL_EMAIL_SUCCESS || 'Thành công',
          successMessage: translatedLabels.LBL_UPDATE + ' ' + translatedLabels.LBL_EMAIL_SUCCESS || 'Cập nhật ghi chú thành công!',
          errorTitle: translatedLabels.LBL_EMAIL_ERROR_DESC || 'Lỗi',
          errorMessage: translatedLabels.UPLOAD_REQUEST_ERROR || 'Không thể cập nhật ghi chú',
          ok: translatedLabels.LBL_OK,
          saveButton: translatedLabels.LBL_SAVE_CHANGES_BUTTON_TITLE || 'Lưu',
          confirmTitle: translatedLabels.LBL_CLOSE_ACTIVITY_HEADER || 'Xác nhận',
          unsavedChanges: translatedLabels.WARN_UNSAVED_CHANGES || 'Bạn có thay đổi chưa lưu. Bạn có muốn thoát không?',
          cancel: translatedLabels.LBL_CANCEL || 'Hủy',
          exit: translatedLabels.LBL_CONFIRM_DISREGARD_EMAIL_TITLE || 'Thoát',
          notification: translatedLabels.Alerts || 'Thông báo',
          noRelationship: translatedLabels.MSG_NO_RELATIONSHIP,
          confirmDeleteRelation: translatedLabels.LBL_DELETE || 'Xóa mối quan hệ',
          confirmDeleteRelationMsg: translatedLabels.NTC_REMOVE_CONFIRMATION || 'Bạn có chắc chắn muốn xóa mối quan hệ parent này?',
          success: translatedLabels.LBL_EMAIL_SUCCESS || 'Thành công',
          deleteRelationSuccess: translatedLabels.LBL_EMAIL_IE_DELETE_SUCCESSFUL || 'Đã xóa mối quan hệ thành công',
          deleteRelationError: translatedLabels.UPLOAD_REQUEST_ERROR || 'Không thể xóa mối quan hệ',
          deleteRelation: translatedLabels.LBL_DELETE + ' Relationship (Mối quan hệ)' || 'Xóa mối quan hệ',
          clearButton: translatedLabels.LBL_CLEAR_BUTTON_LABEL || 'Xóa',
          checkButton: translatedLabels.LBL_SEARCH || 'Tìm',
          checkPlaceholder: '',
          selectPlaceholder: translatedLabels.LBL_ID_FF_SELECT || 'Chọn',
          checkToVerify: '',
          parentIdLabel: translatedLabels_notes.LBL_PARENT_ID || 'ID Cha',
          removeConfirmation: translatedLabels.NTC_REMOVE_CONFIRMATION || 'Bạn có chắc bạn muốn loại bỏ mối quan hệ này? Chỉ có các mối quan hệ sẽ được gỡ bỏ. Hồ sơ sẽ không bị xóa.',
          altInfo: translatedLabels.LBL_ALT_INFO || 'Thông tin',
          emailLoading: translatedLabels.LBL_EMAIL_LOADING || 'Đang tải...',
          uploadRequestError: translatedLabels.UPLOAD_REQUEST_ERROR || 'Lỗi đã xảy ra. Xin vui lòng làm tươi lại trang và thử lại.',
          loadingPage: translatedLabels.LBL_LOADING_PAGE || 'Đang tải trang, xin chờ...'
        });
      } catch (error) {
        console.warn('Translation initialization error:', error);
        // Set fallback translations
        setTranslations({
          mdName: 'Ghi chú',
          updateModule: 'Cập nhật Ghi chú',
          loadingText: 'Đang tải...',
          successTitle: 'Thành công',
          successMessage: 'Cập nhật ghi chú thành công!',
          errorTitle: 'Lỗi',
          errorMessage: 'Không thể cập nhật ghi chú',
          ok: 'OK',
          saveButton: 'Lưu',
          confirmTitle: 'Xác nhận',
          unsavedChanges: 'Bạn có thay đổi chưa lưu. Bạn có muốn thoát không?',
          cancel: 'Hủy',
          exit: 'Thoát',
          notification: 'Thông báo',
          noRelationship: 'Không có mối quan hệ nào để xóa',
          confirmDeleteRelation: 'Xác nhận xóa',
          confirmDeleteRelationMsg: 'Bạn có chắc chắn muốn xóa mối quan hệ parent này?',
          success: 'Thành công',
          deleteRelationSuccess: 'Đã xóa mối quan hệ thành công',
          deleteRelationError: 'Không thể xóa mối quan hệ',
          deleteRelation: 'Xóa mối quan hệ',
          clearButton: 'Xóa',
          checkButton: 'Check',
          checkPlaceholder: 'Nhập để kiểm tra',
          selectPlaceholder: '--------',
          checkToVerify: '',
          parentIdLabel: 'ID Cha',
          removeConfirmation: 'Bạn có chắc bạn muốn loại bỏ mối quan hệ này? Chỉ có các mối quan hệ sẽ được gỡ bỏ. Hồ sơ sẽ không bị xóa.',
          altInfo: 'Thông tin',
          emailLoading: 'Đang tải...',
          uploadRequestError: 'Lỗi đã xảy ra. Xin vui lòng làm tươi lại trang và thử lại.',
          loadingPage: 'Đang tải trang, xin chờ...'
        });
      }
    };

    initializeTranslations();
  }, []);

  // Sử dụng custom hook
  const {
    formData,
    updateFields,
    loading,
    error,
    validationErrors,
    updateField,
    updateNote,
    getFieldValue,
    getFieldLabel,
    getStyledFieldLabel,
    getFieldError,
    isFormValid,
    hasChanges,
    hasParentNameField,
    checkParentName,
    getParentTypeOptions,
    handleDeleteRelationship
  } = useNoteUpdate(noteData);

  // Local loading state for save button
  const [saving, setSaving] = useState(false);

  // Modal state for parent_type selection
  const [showParentTypeModal, setShowParentTypeModal] = useState(false);

  // Parent type options with translations
  const [parentTypeOptions, setParentTypeOptions] = useState([]);

  // Handle search modal item selection
  const handleSearchModalSelect = async (selectedItem) => {
    updateField('parent_name', selectedItem.name);
    updateField('parent_id', selectedItem.id); // Store the parent ID
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
      const result = await updateNote();
      if (result.success) {
        Alert.alert(
          translations.successTitle || 'Thành công',
          translations.successMessage || 'Cập nhật ghi chú thành công!',
          [
            {
              text: translations.ok || 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (err) {
      Alert.alert(translations.errorTitle || 'Lỗi', err.message || (translations.errorMessage || 'Không thể cập nhật ghi chú'));
    } finally {
      setSaving(false);
    }
  };

  // Handle back with changes check
  const handleBack = () => {
    if (hasChanges()) {
      Alert.alert(
        translations.confirmTitle || 'Xác nhận',
        translations.unsavedChanges || 'Bạn có thay đổi chưa lưu. Bạn có muốn thoát không?',
        [
          { text: translations.cancel || 'Hủy', style: 'cancel' },
          { text: translations.exit || 'Thoát', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
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

  const handleDeleteParentRelationship = async () => {
    const currentParentType = getFieldValue('parent_type');

    // Check if there's a relationship to delete
    if (!currentParentType) {
      Alert.alert(translations.notification || 'Thông báo', translations.noRelationship || 'Không có mối quan hệ nào để xóa');
      return;
    }

    Alert.alert(
      translations.confirmDeleteRelation || 'Xác nhận xóa',
      translations.confirmDeleteRelationMsg || 'Bạn có chắc chắn muốn xóa mối quan hệ parent này?',
      [
        { text: translations.cancel || 'Hủy', style: 'cancel' },
        {
          text: translations.clearButton || 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await handleDeleteRelationship();
              if (result.success) {
                Alert.alert(translations.success || 'Thành công', result.message || (translations.deleteRelationSuccess || 'Đã xóa mối quan hệ thành công'));
              } else {
                Alert.alert(translations.errorTitle || 'Lỗi', result.error || (translations.deleteRelationError || 'Không thể xóa mối quan hệ'));
              }
            } catch (err) {
              Alert.alert(translations.errorTitle || 'Lỗi', err.message || (translations.deleteRelationError || 'Không thể xóa mối quan hệ'));
            }
          }
        }
      ]
    );
  };

  // Render field label with red asterisk for required fields
  const renderFieldLabel = (fieldKey) => {
    const labelData = getStyledFieldLabel(fieldKey);

    if (typeof labelData === 'string') {
      return <Text style={styles.label}>{labelData}</Text>;
    }

    if (labelData.required) {
      return (
        <Text style={styles.label}>
          {labelData.text}
          <Text style={styles.requiredAsterisk}> *</Text>
        </Text>
      );
    }

    return <Text style={styles.label}>{labelData.text}</Text>;
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNavigationUpdate
          moduleName={translations.updateModule || "Cập nhật Ghi chú"}
          navigation={navigation}
          name="NoteListScreen"
          onBack={handleBack}
        />
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 16, color: '#666' }}>{translations.loadingText || 'Đang tải...'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Thanh điều hướng */}
        <TopNavigationUpdate
          moduleName={translations.updateModule || "Cập nhật Ghi chú"}
          navigation={navigation}
          name="NoteListScreen"
          onBack={handleBack}
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Show error if any */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Form các trường */}
            {updateFields.map((field) => {
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

              // Default handling for all other fields
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
                  <Text style={styles.deleteButtonText}>
                    {translations.saveButton || 'Lưu'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Delete Relationship Button - Only show if parent name field exists */}
            {hasParentNameField() && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    saving && styles.disabledButton
                  ]}
                  onPress={handleDeleteParentRelationship}
                  disabled={saving}
                >
                  <Ionicons name="unlink-outline" size={24} color="#fff" />
                  <Text style={styles.deleteButtonText}>{translations.deleteRelation}</Text>
                </TouchableOpacity>
              </View>
            )}
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

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d8d8d8',
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
    fontWeight: 'bold',
  },
  readOnlyBox: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  readOnlyText: {
    color: '#666',
    fontStyle: 'italic',
  },
  checkLabelContainer: {
    paddingHorizontal: 20,
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  checkButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  placeholderBox: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  successBox: {
    backgroundColor: '#d4edda',
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  successFieldText: {
    color: '#155724',
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorFieldText: {
    color: '#721c24',
    fontWeight: '500',
  },
  valueBox: {
    backgroundColor: '#e07c7c',
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
  // New styles for enhanced functionality
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    margin: 20,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
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
    paddingHorizontal: 20,
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
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  placeholderText: {
    color: '#999',
  },
});