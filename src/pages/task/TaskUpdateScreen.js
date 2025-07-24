import TaskData from '@/src/services/useApi/task/TaskData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TopNavigationUpdate from '../../components/navigations/TopNavigationUpdate';

const useTaskUpdate = (taskId, detailFields, getFieldValue, getFieldLabel, navigation, refreshTask) => {
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [isDataChanged, setIsDataChanged] = useState(false);
    
    // State để lưu dữ liệu gốc và dữ liệu cập nhật
    const [originalTaskData, setOriginalTaskData] = useState({});
    const [updateTaskData, setUpdateTaskData] = useState({});
    
    // Khởi tạo dữ liệu task từ detailFields và getFieldValue
    const initializeTaskData = useCallback(() => {
        if (!detailFields || !Array.isArray(detailFields) || !getFieldValue) return {};
        
        const initialData = {};
        detailFields.forEach(field => {
            if (field.key && field.key !== 'id') {
                const value = getFieldValue(field.key);
                initialData[field.key] = value || '';
            }
        });
        
        return initialData;
    }, [detailFields, getFieldValue]);
    
    // Effect để khởi tạo dữ liệu khi component mount
    useEffect(() => {
        if (detailFields && getFieldValue) {
            const initialData = initializeTaskData();
            setOriginalTaskData(initialData);
            setUpdateTaskData(initialData);
        }
    }, [detailFields, getFieldValue, initializeTaskData]);
    
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
        return updateTaskData[fieldKey] || '';
    }, [updateTaskData]);
    
    // Function để lấy field error
    const getFieldErrorLocal = useCallback((fieldKey) => {
        return validationErrors[fieldKey] || null;
    }, [validationErrors]);
    
    return {
        detailFields,
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
            const nameField = detailFields?.find(f => 
                f.key === 'name' || 
                f.key === 'title' || 
                f.key === 'subject' ||
                f.key.toLowerCase().includes('name') ||
                f.key.toLowerCase().includes('title') ||
                f.key.toLowerCase().includes('subject')
            );
            
            if (nameField) {
                return updateTaskData[nameField.key] && updateTaskData[nameField.key].trim() !== '';
            }
            
            // Fallback - check first non-id field
            const firstField = detailFields?.find(f => f.key !== 'id');
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
                
                if (detailFields && Array.isArray(detailFields)) {
                    detailFields.forEach(field => {
                        // Bỏ qua system fields
                        if (!systemFields.includes(field.key)) {
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

                console.log('📤 Fields to update:', fieldsToUpdate);
                
                // Nếu không có field nào thay đổi, không cần gọi API
                if (Object.keys(fieldsToUpdate).length === 0) {
                    setLoading(false);
                    return { success: true, message: 'Không có thay đổi nào để cập nhật' };
                }
                
                const result = await TaskData.UpdateTask(taskId, fieldsToUpdate, token);
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
  const { 
    taskId, 
    detailFields, 
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
  } = useTaskUpdate(taskId, detailFields, routeGetFieldValue, routeGetFieldLabel, navigation, routeRefreshTask);

  // Local loading state for save button
  const [saving, setSaving] = useState(false);

  // Date picker states
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [currentDateField, setCurrentDateField] = useState(null);

  // Date picker functions
  const showDatePicker = (fieldKey) => {
    setCurrentDateField(fieldKey);
    setDatePickerVisibility(true);
  };
  
  const hideDatePicker = () => {
    setDatePickerVisibility(false);
    setCurrentDateField(null);
  };

  const handleConfirm = (selectedDate) => {
    if (currentDateField && selectedDate) {
      // Format date to ISO 8601 format with local timezone
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const hours = String(selectedDate.getHours()).padStart(2, '0');
      const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
      const seconds = String(selectedDate.getSeconds()).padStart(2, '0');
      
      // Get timezone offset
      const timezoneOffset = selectedDate.getTimezoneOffset();
      const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
      const offsetMinutes = Math.abs(timezoneOffset) % 60;
      const offsetSign = timezoneOffset <= 0 ? '+' : '-';
      const timezone = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
      
      const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezone}`;
      
      console.log('📅 Date selected for field:', currentDateField);
      console.log('📅 Formatted date:', formattedDate);
      
      updateField(currentDateField, formattedDate);
    }
    hideDatePicker();
  };

  // Function to check if field is date type
  const isDateField = (fieldKey) => {
    return fieldKey && (
      fieldKey.toLowerCase().includes('date') ||
      fieldKey.toLowerCase().includes('time') ||
      fieldKey === 'date_start' ||
      fieldKey === 'date_end' ||
      fieldKey === 'date_due' ||
      fieldKey === 'date_entered' ||
      fieldKey === 'date_modified'
    );
  };

  // Function to format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return dateString;
    }
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
  if (!detailFields || detailFields.length === 0) {
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
            {detailFields
              .filter(field => field.key !== 'id')
              .map((field) => {
                const fieldError = getFieldError(field.key);
                const fieldValue = getFieldValue(field.key);
                const isDate = isDateField(field.key);

                return (
                  <View key={field.key} style={styles.row}>
                    <Text style={styles.label}>{field.label}</Text>
                    
                    {isDate ? (
                      // Date picker field
                      <Pressable
                        style={[styles.valueBox, fieldError && styles.errorInput]}
                        onPress={() => showDatePicker(field.key)}
                      >
                        <Text style={[styles.value, !fieldValue && styles.placeholderText]}>
                          {fieldValue ? formatDateForDisplay(fieldValue) : `Chọn ${field.label.toLowerCase()}`}
                        </Text>
                      </Pressable>
                    ) : (
                      // Regular text input
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
                    )}
                    
                    {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                  </View>
                );
              })}

            {/* Date Time Picker Modal */}
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="datetime"
              onConfirm={handleConfirm}
              onCancel={hideDatePicker}
              date={currentDateField ? (getFieldValue(currentDateField) ? new Date(getFieldValue(currentDateField)) : new Date()) : new Date()}
            />

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {/* Reset Button */}
              {isDataChanged && (
                <TouchableOpacity
                  style={[styles.resetButton]}
                  onPress={() => {
                    Alert.alert(
                      'Xác nhận',
                      'Bạn có chắc chắn muốn khôi phục dữ liệu gốc?',
                      [
                        { text: 'Hủy', style: 'cancel' },
                        { text: 'Khôi phục', onPress: resetForm }
                      ]
                    );
                  }}
                >
                  <Text style={styles.resetButtonText}>Khôi phục</Text>
                </TouchableOpacity>
              )}

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
  resetButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});
