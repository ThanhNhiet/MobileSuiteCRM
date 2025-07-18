import { useNavigation } from '@react-navigation/native';
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
import { useNoteCreate } from '../../services/useApi/note/UseNote_Create';
export default function NoteCreateScreen() {
  const navigation = useNavigation();

  // Sử dụng custom hook
  const {
    formData,
    createFields,
    parentTypeOptions,
    loading,
    error,
    validationErrors,
    updateField,
    createNote,
    resetForm,
    getFieldValue,
    getFieldLabel,
    getFieldError,
    isFormValid
  } = useNoteCreate();

  // Local loading state for save button
  const [saving, setSaving] = useState(false);

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await createNote();
      if (result.success) {
        Alert.alert(
          'Thành công',
          'Tạo ghi chú thành công!',
          [
            {
              text: 'OK',
              onPress: () => {
                resetForm();
                navigation.navigate('NoteListScreen');
              }
            }
          ]
        );
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo ghi chú');
    } finally {
      setSaving(false);
    }
  };

  // Show loading state for initialization
  if (loading && createFields.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
        <TopNavigationCreate
          moduleName="Tạo Ghi chú"
          navigation={navigation}
          name="NoteListScreen"
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
          moduleName="Tạo Ghi chú"
          navigation={navigation}
          name="NoteListScreen"
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
            {createFields.map((field) => {
              const fieldError = getFieldError(field.key);
              const fieldValue = getFieldValue(field.key);

              // Handle parent_type as dropdown (simplified for now)
              if (field.key === 'parent_type') {
                return (
                  <View key={field.key} style={styles.row}>
                    <Text style={styles.label}>{field.label}</Text>
                    <View style={[styles.valueBox, fieldError && styles.errorInput]}>
                      <TextInput
                        style={styles.value}
                        value={fieldValue}
                        onChangeText={(value) => updateField(field.key, value)}
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
                  <Text style={styles.saveButtonText}>Tạo ghi chú</Text>
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