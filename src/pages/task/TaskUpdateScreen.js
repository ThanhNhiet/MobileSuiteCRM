import TaskData from '@/src/services/useApi/task/TaskData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TopNavigationUpdate from '../../components/navigations/TopNavigationUpdate';
import { SystemLanguageUtils } from '../../utils/cacheViewManagement/SystemLanguageUtils';
const useTaskUpdate = (task, editViews, requiredFields, getFieldValue, getFieldLabel, navigation, refreshTask) => {
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [isDataChanged, setIsDataChanged] = useState(false);
    
    // State để lưu dữ liệu gốc và dữ liệu cập nhật
    const [originalTaskData, setOriginalTaskData] = useState({});
    const [updateTaskData, setUpdateTaskData] = useState({});
    
    // Khởi tạo dữ liệu task từ detailFields và getFieldValue
    const initializeTaskData = useCallback(() => {
        if (!Array.isArray(editViews)) return {};

        const initialData = {};
        editViews.forEach(field => {
            if (field && field.key && typeof field.key === 'string' && field.key !== 'id') {
                // Lấy giá trị từ task object trước, nếu không có thì dùng getFieldValue
                let value = '';
                if (task && task[field.key] !== undefined) {
                    value = task[field.key];
                } else if (getFieldValue) {
                    value = getFieldValue(field.key);
                }
                initialData[field.key] = value || '';
            }
        });
        
        return initialData;
    }, [editViews, getFieldValue, task]);
    
    // Effect để khởi tạo dữ liệu khi component mount
    useEffect(() => {
        if (editViews) {
            const initialData = initializeTaskData();
            setOriginalTaskData(initialData);
            setUpdateTaskData(initialData);
        }
    }, [editViews, initializeTaskData]);
    
    // Function để cập nhật field
    const updateField = useCallback((fieldKey, value) => {
        setUpdateTaskData(prev => {
            const newData = { ...prev, [fieldKey]: value };
            
            // Kiểm tra xem dữ liệu có thay đổi không
            const hasChanges = Object.keys(newData).some(key => 
                newData[key] !== originalTaskData[key]
            );
            setIsDataChanged(hasChanges);
            
            return newData;
        });
        
        // Clear validation error when field is updated
        if (validationErrors[fieldKey]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldKey];
                return newErrors;
            });
        }
    }, [originalTaskData, validationErrors]);
    
    // Function để lấy giá trị field hiện tại
    const getFieldValueLocal = useCallback((fieldKey) => {
        // Trả về giá trị từ updateTaskData, nếu không có thì trả về string rỗng
        const value = updateTaskData[fieldKey];
        if (value === null || value === undefined) {
            return '';
        }
        return String(value);
    }, [updateTaskData]);
    
    // Function để lấy field error
    const getFieldErrorLocal = useCallback((fieldKey) => {
        return validationErrors[fieldKey] || null;
    }, [validationErrors]);
    
    return {
        editViews,
        requiredFields,
        formData: updateTaskData,
        originalData: originalTaskData,
        loading,
        error: null,
        validationErrors,
        isDataChanged,
        refreshTask,
        updateField,
        getFieldValue: getFieldValueLocal,
        getFieldLabel,
        getFieldError: getFieldErrorLocal,
        isFormValid: () => {
            // Validate required fields - tìm field chính để validate
            const nameField = requiredFields?.find(f => 
                f && f.key && typeof f.key === 'string' && (
                    f.key === 'name' || 
                    f.key === 'title' || 
                    f.key === 'subject' ||
                    f.key.includes('name') ||
                    f.key.includes('title') ||
                    f.key.includes('subject')
                )
            );
            
            if (nameField) {
                return updateTaskData[nameField.key] && updateTaskData[nameField.key].trim() !== '';
            }
            
            // Fallback - check first non-id field
            const firstField = requiredFields?.find(f => f && f.key && typeof f.key === 'string' && f.key !== 'id');
            if (firstField) {
                return updateTaskData[firstField.key] && updateTaskData[firstField.key].trim() !== '';
            }
            
            return true; // Nếu không tìm thấy field nào, cho phép save
        },
        updateTask: async () => {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    navigation.navigate('LoginScreen');
                    return { success: false };
                }
                
                // Chỉ gửi các field đã được thay đổi thực sự so với dữ liệu gốc
                const fieldsToUpdate = {};
                
                // Danh sách các field system không nên update
                const systemFields = ['id', 'date_entered', 'date_modified', 'created_by', 'modified_user_id', 'deleted'];
                
                if (editViews && Array.isArray(editViews)) {
                    editViews.forEach(field => {
                        // Kiểm tra field và field.key an toàn hơn
                        if (field && field.key && typeof field.key === 'string' && !systemFields.includes(field.key)) {
                            const currentValue = updateTaskData[field.key];
                            const originalValue = originalTaskData[field.key];
                            
                            // Chỉ thêm field nếu giá trị đã thay đổi
                            // Normalize giá trị để so sánh (handle null, undefined, empty string)
                            const normalizedCurrent = currentValue || '';
                            const normalizedOriginal = originalValue || '';
                            
                            if (normalizedCurrent !== normalizedOriginal) {
                                fieldsToUpdate[field.key] = currentValue;
                            }
                        }
                    });
                }

                // Nếu không có field nào thay đổi, không cần gọi API
                if (Object.keys(fieldsToUpdate).length === 0) {
                    setLoading(false);
                    return { success: true, message: 'Không có thay đổi nào để cập nhật' };
                }

                const result = await TaskData.UpdateTask(task.id, fieldsToUpdate, token);
                setLoading(false);
                return { success: true, data: result };
            } catch (error) {
                setLoading(false);
                console.error('Update task error:', error);
                return { success: false, error: error.message };
            }
        },
        resetForm: () => {
            setUpdateTaskData(originalTaskData);
            setIsDataChanged(false);
        },
        shouldDisplayField: (key) => true,
    };
};

export default function TaskUpdateScreen() {
  const navigation = useNavigation();
  const route = useRoute();
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
  const { 
    task, 
    editViews,
    requiredFields,
    getFieldLabel: routeGetFieldLabel, 
    getFieldValue: routeGetFieldValue, 
    refreshTask: routeRefreshTask,
    refreshTaskList // Thêm callback để refresh TaskListScreen
  } = route.params || {};
 

  // Sử dụng custom hook
  const {
    formData,
    originalData,
    loading,
    error,
    isDataChanged,
    updateField,
    updateTask,
    refreshTask,
    resetForm,
    getFieldValue,
    getFieldLabel,
    getFieldError,
    isFormValid
  } = useTaskUpdate(task, editViews, requiredFields, routeGetFieldValue, routeGetFieldLabel, navigation, routeRefreshTask);

  // Local loading state for save button
  const [saving, setSaving] = useState(false);
  const [showParentTypeModal, setShowParentTypeModal] = useState(false);
  const [selectedParentType, setSelectedParentType] = useState('');
  const [getParentTypeLabel, setGetParentTypeLabel] = useState('');

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
  

  // Handle save
  const handleSave = async () => {
    if (!isDataChanged) {
      Alert.alert('Thông báo', 'Không có thay đổi nào để lưu');
      return;
    }

    try {
      setSaving(true);
      const result = await updateTask();
      if (result.success) {
        const message = result.message || 'Cập nhật công việc thành công!';
        Alert.alert(
          'Thành công',
          message,
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh dữ liệu ở TaskDetailScreen với updated data
                if (typeof refreshTask === 'function') {
                  refreshTask(result.data || formData);
                }
                
                // Refresh dữ liệu ở TaskListScreen
                if (typeof refreshTaskList === 'function') {
                  refreshTaskList();
                }
                
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', result?.error || 'Không thể cập nhật công việc');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật công việc');
    } finally {
      setSaving(false);
    }
  };

  // Show loading state for initialization
  if (!editViews || editViews.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
        <TopNavigationUpdate
          moduleName="Cập nhật công việc"
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
        <TopNavigationUpdate
          moduleName="Cập nhật công việc"
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
              .filter((field) => field && typeof field.key === 'string' && field.key !== 'id')
              .map((field) => {
                const fieldError = getFieldError(field.key);
                const fieldValue = getFieldValue(field.key);
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

                      <View style={styles.row}>
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
                    <Text style={styles.label}>{field.label}</Text>
                    
                    <View style={[styles.valueBox, fieldError && styles.errorInput]}>
                      <TextInput
                        style={[
                          styles.value,
                          field.key === 'description' && styles.multilineInput
                        ]}
                        value={fieldValue ? String(fieldValue) : ''}
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

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!isFormValid() || saving || !isDataChanged) && styles.disabledButton
                ]}
                onPress={handleSave}
                disabled={!isFormValid() || saving || !isDataChanged}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isDataChanged ? 'Cập nhật' : 'Không có thay đổi'}
                  </Text>
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

// Styles
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
  placeholderText: {
    color: '#666',
    fontStyle: 'italic',
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
    gap: 12,
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
