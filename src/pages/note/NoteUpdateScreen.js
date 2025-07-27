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

export default function NoteUpdateScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { noteData } = route.params || {};

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
    getParentTypeOptions
  } = useNoteUpdate(noteData);

  // Local loading state for save button
  const [saving, setSaving] = useState(false);
  
  // Loading state for parent check
  const [checkingParent, setCheckingParent] = useState(false);
  
  // Modal state for parent_type selection
  const [showParentTypeModal, setShowParentTypeModal] = useState(false);
  
  // Parent type options with translations
  const [parentTypeOptions, setParentTypeOptions] = useState([]);
  
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
          'Thành công',
          'Cập nhật ghi chú thành công!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật ghi chú');
    } finally {
      setSaving(false);
    }
  };

  // Handle back with changes check
  const handleBack = () => {
    if (hasChanges()) {
      Alert.alert(
        'Xác nhận',
        'Bạn có thay đổi chưa lưu. Bạn có muốn thoát không?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Thoát', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
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
    return selectedOption ? selectedOption.label : '--------';
  };

  // Handle check parent ID
  const handleCheckParentId = async () => {
    setCheckingParent(true);
    await checkParentName();
    setCheckingParent(false);
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
          moduleName="Cập nhật Ghi chú"
          navigation={navigation}
          name="NoteListScreen"
          onBack={handleBack}
        />
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 16, color: '#666' }}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Thanh điều hướng */}
        <TopNavigationUpdate
          moduleName="Cập nhật Ghi chú"
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

              // Skip parent_name field - use logic cũ với parent_type modal và parent_id input
              if (field.key === 'parent_name') {
                return null;
              }

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

              // Special handling for parent_id field with check button
              if (field.key === 'parent_id') {
                return (
                  <View key={field.key}>
                    <View style={styles.row}>
                      {renderFieldLabel(field.key)}
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
                            <Text style={styles.checkButtonText}>Check</Text>
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
                            Nhấn Check để kiểm tra
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              }

              // Change parent_id display
              const displayLabel = field.key === 'parent_id' ? 'Parent ID' : field.label;

              return (
                <View key={field.key} style={styles.row}>
                  {field.key === 'parent_id' ? (
                    <Text style={styles.label}>{displayLabel}</Text>
                  ) : (
                    renderFieldLabel(field.key)
                  )}
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
                  <Ionicons name="save-outline" size={24} color="#fff" />
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