import TaskData from '@/src/services/useApi/task/TaskData';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { SystemLanguageUtils } from '../../utils/cacheViewManagement/SystemLanguageUtils';
const useTaskCreate = (editViews, requiredFields, getFieldValue, getFieldLabel, navigation, refreshTask) => {
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    
    // Tạo newTask từ editViews
    const initializeNewTask = () => {
        const initialData = {};
        if (editViews && Array.isArray(editViews)) {
            editViews.forEach(field => {
                // Khởi tạo các field với giá trị rỗng
                initialData[field.key] = '';
            });
        }
        return initialData;
    };
    
    const [newTask, setNewTask] = useState(initializeNewTask());
    
    // Function để cập nhật field
    const updateField = (fieldKey, value) => {
        setNewTask(prev => ({
            ...prev,
            [fieldKey]: value
        }));
        
        // Clear validation error when field is updated
        if (validationErrors[fieldKey]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldKey];
                return newErrors;
            });
        }
    };
    
    // Function để lấy giá trị field
    const getFieldValueLocal = (fieldKey) => {
        return newTask[fieldKey] || '';
    };
    
    // Function để lấy field error
    const getFieldErrorLocal = (fieldKey) => {
        return validationErrors[fieldKey] || null;
    };
   
    return {
        editViews,
        requiredFields,
        formData: newTask,
        loading,
        error: null,
        validationErrors,
        refreshTask,
        updateField,
        getFieldValue: getFieldValueLocal,
        getFieldLabel,
        getFieldError: getFieldErrorLocal,
        isFormValid: () => {
            // Find the main field for validation
            const nameField = requiredFields?.find(f => 
                f && f.key && typeof f.key === 'string' && (
                    f.key === 'name' || 
                    f.key === 'title' || 
                    f.key === 'subject' ||
                    f.key.toLowerCase().includes('name') ||
                    f.key.toLowerCase().includes('title')
                )
            );
            
            if (nameField) {
                return newTask[nameField.key] && newTask[nameField.key].trim() !== '';
            }
            
            // Fallback - check first field
            const firstField = requiredFields?.find(f => f && f.key && typeof f.key === 'string' && f.key !== 'id');
            if (firstField) {
                return newTask[firstField.key] && newTask[firstField.key].trim() !== '';
            }
            
            return false;
        },
        createTask: async () => {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    navigation.navigate('LoginScreen');
                    return { success: false };
                }
                
                const result = await TaskData.CreateTask(newTask, token);
                setLoading(false);
                return { success: true, data: result };
            } catch (error) {
                setLoading(false);
                console.error('Create task error:', error);
                return { success: false, error: error.message };
            }
        },
        resetForm: () => setNewTask(initializeNewTask()),
        shouldDisplayField: (key) => true,
    };
};

export default function TaskCreateScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { editViews, requiredFields, getFieldLabel: routeGetFieldLabel, getFieldValue: routeGetFieldValue, refreshTask: routeRefreshTask } = route.params || {};
  const [showParentTypeModal, setShowParentTypeModal] = useState(false);
    const [selectedParentType, setSelectedParentType] = useState('');
    const [getParentTypeLabel, setGetParentTypeLabel] = useState('');
     const systemLanguageUtils = new SystemLanguageUtils.getInstance();
       const [parentTypeOptions, setParentTypeOptions] = useState([]);
      useEffect(() => {
        const initialize = async () => {
          try {
             const [
                        accounts,
                        notes,
                        tasks,
                        meetings,
                    ] = await Promise.all([
                        systemLanguageUtils.translate('LBL_ACCOUNTS', 'Khách hàng'),
                        systemLanguageUtils.translate('LBL_NOTES', 'Ghi chú'),
                        systemLanguageUtils.translate('LBL_TASKS', 'Công việc'),
                        systemLanguageUtils.translate('LBL_MEETINGS', 'Cuộc họp'),
                    ]);
                    setParentTypeOptions([
                      { value: 'Accounts', label: accounts }, 
                      { value: 'Notes', label: notes },
                      { value: 'Tasks', label: tasks },
                      { value: 'Meetings', label: meetings }
                    ]);
    
          } catch (error) {
            console.error('Error initializing account update screen:', error);
          }
        }
        initialize();
      }, []);
      // Handle search modal select
  const handleParentTypeSelect = (option) => {
      setSelectedParentType(option.label); // Set label vào TextInput
      //setFieldValue('parent_type', option.value); // Nếu bạn đang lưu value
      if (!getFieldValue('parent_type')) {
      setGetParentTypeLabel(option.value);
      } else {
        setGetParentTypeLabel(getFieldLabel('parent_type'));
      }
      setShowParentTypeModal(false); // Đóng modal
  };
const handleSearchModalSelect = async (selectedItem) => {
     updateField('parent_name', selectedItem.name);
     // updateField('parent_id', selectedItem.id); // Store the parent ID
  };
  // Sử dụng custom hook
  const {
    formData,
    loading,
    error,
    updateField,
    createTask,
    refreshTask,
    resetForm,
    getFieldValue,
    getFieldLabel,
    getFieldError,
    isFormValid
  } = useTaskCreate(editViews, requiredFields, routeGetFieldValue, routeGetFieldLabel, navigation, routeRefreshTask);

  // Local loading state for save button
  const [saving, setSaving] = useState(false);

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await createTask();
      if (result.success) {
        Alert.alert(
          'Thành công',
          'Tạo công việc thành công!',
          [
            {
              text: 'OK',
              onPress: () => {
                resetForm();
                if(typeof refreshTask === 'function') {
                  refreshTask();
                }
                navigation.navigate('TaskListScreen');
              }
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', result?.error || 'Không thể tạo công việc');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo công việc');
    } finally {
      setSaving(false);
    }
  };

  // Show loading state for initialization
  if (!editViews || editViews.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
        <TopNavigationCreate
          moduleName="Tạo công việc"
          navigation={navigation}
          name="TaskListScreen"
        />
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 16, color: '#666' }}>Đang tải...</Text>
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
          moduleName="Tạo công việc"
          navigation={navigation}
          name="TaskListScreen"
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
            {editViews
              .filter(field => field && field.key && typeof field.key === 'string' && field.key !== 'id')
              .map((field) => {
                const fieldError = getFieldError(field.key);
                const fieldValue = getFieldValue(field.key);
                let checkRequired = false;
                
                // Sửa lỗi kiểm tra requiredFields
                if (requiredFields && Array.isArray(requiredFields)) {
                    requiredFields.forEach((requiredField) => {
                        if (requiredField && requiredField.field === field.key) {
                            checkRequired = true;
                        }
                    });
                }
                 if (field.key === 'date_start' || field.key === 'date_end') {
                return null;
              }
              if (field.key === 'parent_name') {
                              return (
                                <>
                                  <View key={field.key} style={styles.row}>
                                    <Text style={styles.label}>Parent Type</Text>
                                    <TouchableOpacity
                                      style={[styles.valueBox, fieldError && styles.errorInput]}
                                      onPress={() => setShowParentTypeModal(true)}
                                    >
                                      <Text style={[styles.value, !selectedParentType && styles.placeholderText]}>
                                        {selectedParentType || getFieldValue('parent_type') || '--------'}
                                      </Text>
                                    </TouchableOpacity>
                                    {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                                  </View>

                                  <View  style={styles.row}>
                                    <Text style={styles.label}>{field.label}</Text>
                                    <TouchableOpacity
                                      style={[
                                        styles.valueBox,
                                        fieldError && styles.errorInput,
                                        !selectedParentType && styles.disabledValueBox
                                      ]}
                                      onPress={() => {
                                        if (selectedParentType) {
                                          navigation.navigate('SearchModulesScreen', {
                                            parentType:getParentTypeLabel,
                                            title: selectedParentType,
                                            onSelect: handleSearchModalSelect
                                          });
                                        } else {
                                          Alert.alert(
                                            'Thông báo',
                                            'Vui lòng chọn loại cấp trên trước'
                                          );
                                        }
                                      }}
                                      disabled={!selectedParentType}
                                    >
                                      <Text style={[
                                        styles.value,
                                        !fieldValue && styles.placeholderText,
                                        !selectedParentType && styles.disabledText
                                      ]}>
                                        {fieldValue || '--------'}
                                      </Text>
                                    </TouchableOpacity>
                                    {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                                  </View>
                                </>
                              );
                            }

                return (
                  <View key={field.key} style={styles.row}>
                    <Text style={styles.label}>{field.label}{checkRequired ? ' (*)' : ''}</Text>
                    <View style={[styles.valueBox, fieldError && styles.errorInput]}>
                      <TextInput
                        style={[
                          styles.value,
                          field.key === 'description' && styles.multilineInput
                        ]}
                        value={fieldValue}
                        onChangeText={(value) => updateField(field.key, value)}
                        placeholder={`Nhập ${field.label.toLowerCase()}`}
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
                  <Text style={styles.saveButtonText}>Tạo công việc</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        {/* Modal cho Parent Type */}
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
                        onPress={() => handleParentTypeSelect(option)}
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
    backgroundColor: '#f5f7fa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  row: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  valueBox: {
    backgroundColor: '#e1e5e9',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  value: {
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: 'transparent',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  errorInput: {
    borderColor: '#dc2626',
    borderWidth: 1,
  },
  fieldError: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  buttonContainer: {
    marginTop: 30,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
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