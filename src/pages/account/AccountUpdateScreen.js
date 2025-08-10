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
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TopNavigationUpdate from '../../components/navigations/TopNavigationUpdate';
import AccountData from '../../services/useApi/account/AccountData';
import { SystemLanguageUtils } from '../../utils/cacheViewManagement/SystemLanguageUtils';
const useAccountUpdate = (account, editViews, listViews, requiredFields, routeGetFieldValue, routeGetFieldLabel, navigation, refreshAccount) => {
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    
    // Tạo updateAccount từ account và detailFields
    const initializeUpdateAccount = useCallback(() => {
        const initialData = {};
        if (account && typeof account === 'object') {
            // Copy dữ liệu từ account
            Object.keys(account).forEach(key => {
                initialData[key] = account[key] || '';
            });
        }
        if (editViews && Array.isArray(editViews) && editViews.length > 0) {
            editViews.forEach(field => {
                // Đảm bảo tất cả fields có giá trị và field có key
                if (field && field.key && !(field.key in initialData)) {
                    initialData[field.key] = '';
                }
            });
        }
        return initialData;
    }, [account, editViews]);

    const [updateAccountData, setUpdateAccountData] = useState(() => {
        const initialData = initializeUpdateAccount();
        return initialData;
    });
    
    // Reinitialize when account or detailFields change
    useEffect(() => {
        const newData = initializeUpdateAccount();
        setUpdateAccountData(newData);
    }, [initializeUpdateAccount]);
    
    // Function để cập nhật field
    const updateField = (fieldKey, value) => {
        setUpdateAccountData(prev => {
            const newData = {
                ...prev,
                [fieldKey]: value
            };
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
    };
    
    // Function để lấy giá trị field
    const getFieldValueLocal = (fieldKey) => {
        const value = updateAccountData[fieldKey] || '';
        return value;
    };
    
    // Function để lấy field error
    const getFieldErrorLocal = (fieldKey) => {
        return validationErrors[fieldKey] || null;
    };
   
    return {
        editViews: editViews || [],
        listViews: listViews || [],
        requiredFields: requiredFields || [],
        formData: account || updateAccountData,
        updateAccountData, // Expose để component có thể access
        loading,
        error: null,
        validationErrors,
        refreshAccount,
        updateField, 
        getFieldValue: getFieldValueLocal,
        getFieldLabel: routeGetFieldLabel,
        getFieldError: getFieldErrorLocal,
        validateForm: () => {
            const errors = {};
            if (!updateAccountData.name || updateAccountData.name.trim() === '') {
                errors.name = 'Tên khách hàng không được để trống';
            }
            setValidationErrors(errors);
            return Object.keys(errors).length === 0;
        },
        updateAccount: async () => {
            try {

                setLoading(true);
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                   navigation.navigate('LoginScreen');
                   return { success: false, error: 'No token' };
                }
                
                if (!account || !account.id) {
                    throw new Error('Không tìm thấy thông tin khách hàng');
                }

                // Chỉ gửi các field đã được thay đổi thực sự so với dữ liệu gốc
                const fieldsToUpdate = {};
                
                // Danh sách các field system không nên update
                const systemFields = ['id', 'created_by', 'modified_user_id', 'deleted'];

                if (editViews && Array.isArray(editViews) && editViews.length > 0) {
                    editViews.forEach(field => {
                        // Kiểm tra field có tồn tại và có key không
                        if (!field || !field.key) return;
                        
                        // Bỏ qua system fields
                        if (!systemFields.includes(field.key)) {
                            const currentValue = updateAccountData[field.key];
                            const originalValue = account[field.key];
                            
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

                // for (const requiredField of Array.from(requiredFields.filter(f => f.field!=='id'))) {
                //     const value = requiredField.field.toLowerCase();
                //     if (fieldsToUpdate[value].trim() !== '') {
                //       const label = editViews.find(view => view.key === value)?.label || value;
                //       setLoading(false);
                //       return { success: false, error: `${label} không được để trống` };
                //     }
                //   }
                // Gọi API để cập nhật
                const result = await AccountData.UpdateAccount(account.id, fieldsToUpdate, token);
                setLoading(false);
                if (result) {
                    // Success if we have any meaningful response
                    return { success: true, data: result };
                } else {

                    return { success: false, err: 'No response from server' };
                }
            } catch (error) {
                console.log('💥 Update error:', error);
                setLoading(false);
                throw error;
            }
        },
        resetForm: () => setUpdateAccountData(initializeUpdateAccount()),
        shouldDisplayField: (key) => true,
        getStyledFieldLabel: useCallback((fieldKey) => {
            const field = editViews.find(f => f.key === fieldKey);
            if (!field) return fieldKey;

        if (field.required) {
            // Tách label và dấu * để có thể style riêng
            const labelText = field.label.replace(' *', '');
            return {
                text: labelText,
                required: true
            };
        }

        return {
            text: field.label,
            required: false
        };
    }, [editViews]),
    };
};

export default function AccountUpdateScreen() {
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

  // Safely extract route parameters with fallbacks
  const routeParams = route.params || {};
  const { 
    routeAccount,
    routeEditViews,
    routeListViews,
    routeRequiredFields,
    routeGetFieldValue, 
    routeGetFieldLabel, 
    refreshAccount,
    refreshAccountList // Thêm callback để refresh AccountListScreen
  } = routeParams;

  // Early return if essential data is missing
  if (!routeAccount || !routeEditViews || !routeListViews || !routeRequiredFields) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
        <TopNavigationUpdate
          moduleName="Cập nhật khách hàng"
          navigation={navigation}
        />
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#ff6b6b', fontSize: 16, textAlign: 'center' }}>
            Lỗi: Không tìm thấy dữ liệu khách hàng
          </Text>
          <Text style={{ color: '#666', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
            Vui lòng thử lại hoặc quay lại trang trước
          </Text>
          <TouchableOpacity 
            style={[styles.saveButton, { marginTop: 20, marginHorizontal: 40 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.saveButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Alias để dễ sử dụng
  const account = routeAccount;
  const routeGetFieldValueFunc = routeGetFieldValue;
  const routeGetFieldLabelFunc = routeGetFieldLabel;
  const {
    formData,
    editViews,
    listViews,
    requiredFields,
    updateAccountData,
    loading,
    error,
    updateField,
    updateAccount,
    resetForm,
    getFieldValue,
    getFieldLabel,
    getFieldError,
    validateForm,
    getStyledFieldLabel,
  } = useAccountUpdate( account,routeEditViews, routeListViews, routeRequiredFields,routeGetFieldValueFunc, routeGetFieldLabelFunc, navigation, refreshAccount);

  // Local loading state for save button
  const [saving, setSaving] = useState(false);
 const [showParentTypeModal, setShowParentTypeModal] = useState(false);
 const [selectedParentType, setSelectedParentType] = useState('');
 const [getParentTypeLabel, setGetParentTypeLabel] = useState('');
  
  
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
      
      const result = await updateAccount();
      if (result && result.success) {
        const message = result.message || 'Cập nhật khách hàng thành công!';
        Alert.alert(
          'Thành công',
          message,
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh dữ liệu ở DetailScreen trước khi quay lại
                if (typeof refreshAccount === 'function') {
                  // Chỉ merge những field đã thay đổi thực sự
                  const updatedAccountData = {
                    ...account,
                    ...updateAccountData // Merge original với updated fields
                  };
                  refreshAccount(updatedAccountData);
                }
                
                // Refresh dữ liệu ở AccountListScreen
                if (typeof refreshAccountList === 'function') {
                  refreshAccountList();
                }
                
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', result?.error || 'Không thể cập nhật khách hàng');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật khách hàng');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (account && account.assigned_user_name && account.created_by_name && account.assigned_user_name !== account.created_by_name) {
      Alert.alert(
        'Cảnh báo',
        'Bạn không thể hủy cập nhật vì khách hàng này đã được giao cho người khác.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
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
  if (!editViews || editViews.length === 0 || !account) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
        <TopNavigationUpdate
          moduleName="Cập nhật khách hàng"
          navigation={navigation}
        />
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 16, color: '#666' }}>Đang tải dữ liệu...</Text>
          {!account && (
            <Text style={{ marginTop: 8, color: '#ff6b6b', fontSize: 12 }}>
              Không tìm thấy thông tin khách hàng
            </Text>
          )}
          {(!editViews || editViews.length === 0) && (
            <Text style={{ marginTop: 8, color: '#ff6b6b', fontSize: 12 }}>
              Không tìm thấy cấu trúc form
            </Text>
          )}
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
          moduleName="Cập nhật khách hàng"
          navigation={navigation}
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
            {editViews && Array.isArray(editViews) && editViews.length > 0 ? (
              editViews
                .filter(field => field && field.key && field.key !== 'id')
                .map((field) => {
                  const fieldError = getFieldError(field.key);
                  const fieldValue = getFieldValue(field.key);
                

                if (field.key === 'date_entered' || field.key === 'date_modified') {
                  return null;
                }
                if (
                  field.key === 'assigned_user_name'|| 
                  field.key === 'created_by_name'|| 
                  field.key === 'campaign_name'|| 
                  field.key === 'account_type') {
                return null;
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
              })
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#666', fontSize: 16 }}>
                  Không có dữ liệu để hiển thị
                </Text>
              </View>
            )}

            {/* Save Button */}
            <View style={styles.buttonContainer}>
              
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (saving) && styles.disabledButton
                ]}
                onPress={handleSave}
                disabled={ saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Cập nhật khách hàng</Text>
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
