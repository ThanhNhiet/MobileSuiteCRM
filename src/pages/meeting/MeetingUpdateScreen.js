import MeetingData from '@/src/services/useApi/meeting/MeetingData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
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
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TopNavigationUpdate from '../../components/navigations/TopNavigationUpdate';

const useMeetingUpdate = (meeting, detailFields, routeGetFieldValue, routeGetFieldLabel, navigation, refreshMeeting) => {
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    
    // Tạo updateMeeting từ meeting và detailFields
    const initializeUpdateMeeting = useCallback(() => {
        const initialData = {};
        if (meeting && typeof meeting === 'object') {
            // Copy dữ liệu từ meeting
            Object.keys(meeting).forEach(key => {
                initialData[key] = meeting[key] || '';
            });
        }
        if (detailFields && Array.isArray(detailFields)) {
            detailFields.forEach(field => {
                // Đảm bảo tất cả fields có giá trị
                if (!(field.key in initialData)) {
                    initialData[field.key] = '';
                }
            });
          }
        return initialData;
    }, [meeting, detailFields]);
    
    const [updateMeetingData, setUpdateMeetingData] = useState(() => {
        const initialData = initializeUpdateMeeting();
        return initialData;
    });
    
    // Reinitialize when meeting or detailFields change
    useEffect(() => {
        const newData = initializeUpdateMeeting();
        setUpdateMeetingData(newData);
    }, [initializeUpdateMeeting]);
    
    // Function để cập nhật field
    const updateField = (fieldKey, value) => {
        setUpdateMeetingData(prev => ({
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
        const value = updateMeetingData[fieldKey] || '';
        return value;
    };
    
    // Function để lấy field error
    const getFieldErrorLocal = (fieldKey) => {
        return validationErrors[fieldKey] || null;
    };
   
    return {
        detailFields,
        formData: meeting || updateMeetingData,
        updateMeetingData, // Expose để component có thể access
        loading,
        error: null,
        validationErrors,
        refreshMeeting,
        updateField, 
        getFieldValue: getFieldValueLocal,
        getFieldLabel: routeGetFieldLabel,
        getFieldError: getFieldErrorLocal,
        isFormValid: () => {
            // Find the main field for validation
            const nameField = detailFields?.find(f => 
                f.key === 'name' || 
                f.key === 'title' || 
                f.key === 'subject' ||
                f.key.toLowerCase().includes('name') ||
                f.key.toLowerCase().includes('title')
            );
            
            if (nameField && (!updateMeetingData[nameField.key] || updateMeetingData[nameField.key].trim() === '')) {
                return false;
            }
            return true;
        },
        validateForm: () => {
            const errors = {};
            
            // Find the main field for validation
            const nameField = detailFields?.find(f => 
                f.key === 'name' || 
                f.key === 'title' || 
                f.key === 'subject' ||
                f.key.toLowerCase().includes('name') ||
                f.key.toLowerCase().includes('title')
            );
            
            if (nameField && (!updateMeetingData[nameField.key] || updateMeetingData[nameField.key].trim() === '')) {
                errors[nameField.key] = `${nameField.label || nameField.key} không được để trống`;
            }
            
            setValidationErrors(errors);
            return Object.keys(errors).length === 0;
        },
        updateMeeting: async () => {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                   navigation.navigate('LoginScreen');
                   return { success: false, error: 'No token' };
                }
                
                if (!meeting || !meeting.id) {
                    throw new Error('Không tìm thấy thông tin cuộc họp');
                }
                const result = await MeetingData.UpdateMeeting(meeting.id, updateMeetingData, token);
              
                setLoading(false);
                if (result) {
                    // Success if we have any meaningful response
                    if (result.data || result.id || result.attributes || (result.meta && !result.errors)) {
                        return { success: true, data: result };
                    } else if (result.errors && result.errors.length > 0) {
                        return { success: false, error: result.errors[0]?.detail || 'API returned errors' };
                    } else {
                        return { success: true, data: result };
                    }
                } else {
                    return { success: false, error: 'No response from server' };
                }
            } catch (error) {
                console.log('💥 Update error:', error);
                setLoading(false);
                throw error;
            }
        },
        resetForm: () => setUpdateMeetingData(initializeUpdateMeeting()),
        shouldDisplayField: (key) => true,
    };
};

export default function MeetingUpdateScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { 
    routeMeeting, 
    routeDetailFields, 
    routeGetFieldValue, 
    routeGetFieldLabel, 
    refreshMeeting,
    updateMeetingData
  } = route.params || {};

  // Alias để dễ sử dụng
  const meeting = routeMeeting;
  const detailFields = routeDetailFields;
  const routeGetFieldValueFunc = routeGetFieldValue;
  const routeGetFieldLabelFunc = routeGetFieldLabel;
  
  const {
    formData,
    updateMeetingData: hookUpdateMeetingData,
    loading,
    error,
    updateField,
    updateMeeting,
    resetForm,
    getFieldValue,
    getFieldLabel,
    getFieldError,
    isFormValid,
    validateForm
  } = useMeetingUpdate(meeting, detailFields, routeGetFieldValueFunc, routeGetFieldLabelFunc, navigation, refreshMeeting);

  // Local loading state for save button
  const [saving, setSaving] = useState(false);

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate form before saving
      if (!validateForm()) {
        Alert.alert('Lỗi', 'Vui lòng kiểm tra lại thông tin đã nhập');
        setSaving(false);
        return;
      }
      
      const result = await updateMeeting();
      if (result && result.success) {
        Alert.alert(
          'Thành công',
          'Cập nhật cuộc họp thành công!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Call updateMeetingData callback if provided
                if (typeof updateMeetingData === 'function') {
                  updateMeetingData(hookUpdateMeetingData);
                }
                
                // Also call refreshMeeting if provided
                if (typeof refreshMeeting === 'function') {
                  refreshMeeting();
                }
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', result?.error || 'Không thể cập nhật cuộc họp');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật cuộc họp');
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
          moduleName="Cập nhật Cuộc họp"
          navigation={navigation}
          name="MeetingDetailScreen"
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
          moduleName="Cập nhật Cuộc họp"
          navigation={navigation}
          name="MeetingDetailScreen"
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

                return (
                  <View key={field.key} style={styles.row}>
                    <Text style={styles.label}>{field.label}</Text>
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
                  <Text style={styles.saveButtonText}>Cập nhật cuộc họp</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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

  /* NHÃN */
  label: {
    fontSize: 16,
    color: '#000',
    marginBottom: 6,
    fontWeight: 'bold',
    paddingHorizontal: 20,
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

  /* CHỬ TRONG Ô HỒNG */
  value: {
    fontSize: 16,
    color: '#000',
  },

  // Additional styles for the enhanced version
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  errorContainer: {
    backgroundColor: '#FFE6E6',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB3B3',
  },

  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },

  errorInput: {
    borderColor: '#D32F2F',
    backgroundColor: '#FFE6E6',
  },

  fieldError: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 4,
    paddingHorizontal: 20,
  },

  buttonContainer: {
    marginTop: 30,
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  disabledButton: {
    backgroundColor: '#cccccc',
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
