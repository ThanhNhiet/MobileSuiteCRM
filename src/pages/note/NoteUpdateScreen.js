import { useNavigation, useRoute } from '@react-navigation/native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
    getFieldError,
    isFormValid,
    hasChanges
  } = useNoteUpdate(noteData);

  // Local loading state for save button
  const [saving, setSaving] = useState(false);

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
                  <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
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