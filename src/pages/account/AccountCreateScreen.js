import AccountData from '@/src/services/useApi/account/AccountData';
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
const useAccountCreate = (editViews, requiredFields, getFieldValue, getFieldLabel, navigation, refreshAccount) => {
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    
    // Tạo newAccount từ editViews
    const initializeNewAccount = () => {
        const initialData = {};
        if (editViews && Array.isArray(editViews)) {
            editViews.forEach(field => {
                // Khởi tạo các field với giá trị rỗng
                initialData[field.key] = '';
            });
        }
        return initialData;
    };
    
    const [newAccount, setNewAccount] = useState(initializeNewAccount());
    
    // Function để cập nhật field
    const updateField = (fieldKey, value) => {
      
        setNewAccount(prev => ({
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
        return newAccount[fieldKey] || '';
    };
    
    // Function để lấy field error
    const getFieldErrorLocal = (fieldKey) => {
        return validationErrors[fieldKey] || null;
    };
   
    return {
        editViews,
        formData: newAccount,
        loading,
        error: null,
        validationErrors,
        refreshAccount,
        updateField,
        getFieldValue: getFieldValueLocal,
        getFieldLabel,
        getFieldError: getFieldErrorLocal,
        //isFormValid: () => {},
        validateForm: () => {
            const errors = {};
            requiredFields.map((field) => {
              const fieldKey = field.field;
              const fieldValue = newAccount[fieldKey];
              if(fieldValue.trim() === '') {
                errors[fieldKey] = `${getFieldLabel(fieldKey)} không được để trống`;
              }
            });
            // Kiểm tra các trường bắt buộc
            setValidationErrors(errors);
            if (Object.keys(errors).length > 0) {
                return false;
            }
            return true;
        },
        createAccount: async () => {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    navigation.navigate('LoginScreen');
                    return { success: false };
                }
                
                const result = await AccountData.CreateAccount(newAccount, token);
                setLoading(false);
                return { success: true, data: result };
            } catch (error) {
                setLoading(false);
                console.error('Create account error:', error);
                return { success: false, error: error.message };
            }
        },
        resetForm: () => setNewAccount(initializeNewAccount()),
        shouldDisplayField: (key) => true,
    };
};

export default function AccountCreateScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { editViews, requiredFields, getFieldLabel: routeGetFieldLabel, getFieldValue: routeGetFieldValue, refreshAccount: routeRefreshAccount } = route.params || {};
  // Sử dụng custom hook
  const {
    formData,
    loading,
    error,
    updateField,
    createAccount,
    refreshAccount,
    resetForm,
    getFieldValue,
    getFieldLabel,
    getFieldError,
   // isFormValid,
    validateForm
  } = useAccountCreate(editViews, requiredFields, routeGetFieldValue, routeGetFieldLabel, navigation, routeRefreshAccount);

  // Local loading state for save button
  const [saving, setSaving] = useState(false);

  // Handle save
  const handleSave = async () => {
    // Validate form trước khi save
    if (validateForm() === false) {
      Alert.alert(
        'lỗi',
        'Vui lòng điền đầy đủ các trường bắt buộc (*) trước khi lưu.',
        [{ text: 'OK' }]
      );
      return;
    }
    try {
      setSaving(true);
      const result = await createAccount();
      if (result.success) {
        Alert.alert(
          'Thành công',
          'Tạo khách hàng thành công!',
          [
            {
              text: 'OK',
              onPress: () => {
                resetForm();
                if(typeof refreshAccount === 'function') {
                refreshAccount();
                }
                navigation.navigate('AccountListScreen');
              }
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', result?.error || 'Không thể tạo khách hàng');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo khách hàng');
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
          moduleName="Tạo khách hàng"
          navigation={navigation}
          name="AccountListScreen"
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
          moduleName="Tạo khách hàng"
          navigation={navigation}
          name="AccountListScreen"
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
                if (field.key ==='date_entered' || field.key === 'date_modified') {
                  // Skip date_entered and date_modified fields
                  return ;
                }
                let checkRequired = false;
                requiredFields.map((requiredField) => {
                  if (requiredField.field === field.key ) {
                    return checkRequired = true;
                  }
                });
                if(field.key === 'phone_office' || field.key === 'phone_fax' || field.key === 'phone_alternate') {
                  // Handle phone fields with specific formatting
                  return (
                    <View key={field.key} style={styles.row}>
                      <Text style={styles.label}>{field.label} {checkRequired ? '(*)' : ''}</Text>
                      <View style={[styles.valueBox, fieldError && styles.errorInput]}>
                        <TextInput
                          style={styles.value}
                          value={fieldValue}
                          onChangeText={(value) => updateField(field.key, value)}
                          placeholder={`Nhập ${field.label.toLowerCase()}`}
                          keyboardType="phone-pad"
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          maxLength={10} // tuỳ theo số điện thoại quốc gia, có thể thay đổi
                        />
                      </View>
                      {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                    </View>
                  );
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
                  ( saving) && styles.disabledButton
                ]}
                onPress={handleSave}
                disabled={ saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Tạo khách hàng</Text>
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
});