import AccountData from '@/src/services/useApi/account/AccountData';
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
  const [showParentTypeModal, setShowParentTypeModal] = useState(false);
  const [selectedParentType, setSelectedParentType] = useState('');
  const [getParentTypeLabel, setGetParentTypeLabel] = useState('');
  const route = useRoute();
  const { editViews, requiredFields, getFieldLabel: routeGetFieldLabel, getFieldValue: routeGetFieldValue, refreshAccount: routeRefreshAccount } = route.params || {};
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

                if (field.key === 'parent_name') {
                                  return (
                                    <>
                                      <View style={styles.row}>
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