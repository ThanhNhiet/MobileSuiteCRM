import MeetingData from '@/src/services/useApi/meeting/MeetingData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useState } from 'react';
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
import TopNavigationCreate from '../../components/navigations/TopNavigationCreate';

const useMeetingCreate = (editViews, requiredFields, getFieldValue, getFieldLabel, navigation, refreshMeeting) => {
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    
    // Tạo newMeeting từ editViews
    const initializeNewMeeting = () => {
        const initialData = {};
        if (editViews && Array.isArray(editViews)) {
            editViews.forEach(field => {
                // Khởi tạo các field với giá trị rỗng
                initialData[field.key] = '';
            });
        }
        return initialData;
    };
    
    const [newMeeting, setNewMeeting] = useState(initializeNewMeeting());
    
    // Function để cập nhật field
    const updateField = (fieldKey, value) => {
        setNewMeeting(prev => ({
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
        return newMeeting[fieldKey] || '';
    };
    
    // Function để lấy field error
    const getFieldErrorLocal = (fieldKey) => {
        return validationErrors[fieldKey] || null;
    };
   
    return {
        editViews,
        formData: newMeeting,
        loading,
        error: null,
        validationErrors,
        refreshMeeting,
        updateField,
        getFieldValue: getFieldValueLocal,
        getFieldLabel,
        getFieldError: getFieldErrorLocal,
        isFormValid: () => {
            // Find the main field for validation
            const nameField = editViews?.find(f =>
                f.key === 'name' ||
                f.key === 'title' ||
                f.key === 'subject' ||
                f.key.toLowerCase().includes('name') ||
                f.key.toLowerCase().includes('title')
            );
            
            if (nameField) {
                return newMeeting[nameField.key] && newMeeting[nameField.key].trim() !== '';
            }
            
            // Fallback - check first field
            const firstField = editViews?.find(f => f.key !== 'id');
            if (firstField) {
                return newMeeting[firstField.key] && newMeeting[firstField.key].trim() !== '';
            }
            
            return false;
        },
        createMeeting: async () => {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    navigation.navigate('LoginScreen');
                    return { success: false };
                }
                
                const result = await MeetingData.CreateMeeting(newMeeting, token);
                setLoading(false);
                return { success: true, data: result };
            } catch (error) {
                setLoading(false);
                console.error('Create meeting error:', error);
                return { success: false, error: error.message };
            }
        },
        resetForm: () => setNewMeeting(initializeNewMeeting()),
        shouldDisplayField: (key) => true,
    };
};

export default function MeetingCreateScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { editViews, requiredFields, getFieldLabel: routeGetFieldLabel, getFieldValue: routeGetFieldValue, refreshMeeting: routeRefreshMeeting } = route.params || {};

  // Sử dụng custom hook
  const {
    formData,
    loading,
    error,
    updateField,
    createMeeting,
    refreshMeeting,
    resetForm,
    getFieldValue,
    getFieldLabel,
    getFieldError,
    isFormValid
  } = useMeetingCreate(editViews, requiredFields, routeGetFieldValue, routeGetFieldLabel, navigation, routeRefreshMeeting);

  // Local loading state for save button
  const [saving, setSaving] = useState(false);

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await createMeeting();
      if (result.success) {
        Alert.alert(
          'Thành công',
          'Tạo cuộc họp thành công!',
          [
            {
              text: 'OK',
              onPress: () => {
                resetForm();
                if(typeof refreshMeeting === 'function') {
                  refreshMeeting();
                }
                navigation.navigate('MeetingListScreen');
              }
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', result?.error || 'Không thể tạo cuộc họp');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo cuộc họp');
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
          moduleName="Tạo Cuộc họp"
          navigation={navigation}
          name="MeetingListScreen"
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
          moduleName="Tạo Cuộc họp"
          navigation={navigation}
          name="MeetingListScreen"
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
            .filter(field => field.key !== 'id')
            .map((field) => {
              const fieldError = getFieldError(field.key);
              const fieldValue = getFieldValue(field.key);
              let checkRequired = false;
              requiredFields.map((requiredField) => {
                if (requiredField.field === field.key ) {
                  return checkRequired = true;
                }
              });
              if (field.key === 'date_start' || field.key === 'date_end') {
                return null;
              }

              // Handle account_type as dropdown (simplified for now)
              if (field.key === 'account_type') {
                return (
                  <View key={field.key} style={styles.row}>
                    <Text style={styles.label}>{field.label} {checkRequired ? '(*)' : ''}</Text>
                    <View style={[styles.valueBox, fieldError && styles.errorInput]}>
                      <TextInput
                        style={styles.value}
                        value={fieldValue}
                        onChangeText={(value) => updateField(field.key,value)}
                        placeholder={`Chọn ${field.label.toLowerCase()}`}
                        autoCapitalize="none"
                        returnKeyType="done"
                      />
                    </View>
                    {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                  </View>
                );
              }

              return (
                <View key={field.key} style={styles.row}>
                  <Text style={styles.label}>{field.label} {checkRequired ? '(*)' : ''}</Text>
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
                  <Text style={styles.saveButtonText}>Tạo cuộc họp</Text>
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
