import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const FormInputRow = ({
  label,
  value,
  onChangeText,
  type = 'text', // text | phone | email | date
  placeholder,
  editable = true,
  field
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const getKeyboardType = () => {
    switch (type) {
      case 'email':
        return 'email-address';
      case 'phone':
        return 'phone-pad';
      default:
        return 'default';
    }
  };
  const getKeyboard = () => {
    // Nếu không có field info, dùng logic cũ
    if (!field || !field.dbType) {
      return getKeyboardType();
    }

    switch (field.dbType) {
      case 'varchar':
        if (field.type === 'phone') {
          return 'phone-pad';
        } else if (field.type === 'email') {
          return 'email-address';
        } else if (field.type === 'url') {
          return 'url';
        } else {
          return 'default';
        }
        
      case 'text':
        return 'default';
        
      case 'int':
      case 'decimal':
      case 'float':
        return 'numeric';
        
      case 'relate':
      case 'id':
        return 'default';
        
      case 'datetime':
      case 'date':
      case 'time':
        return 'default'; // Date input handled separately
        
      case 'link':
        return 'default';
        
      case 'enum':
      case 'multienum':
        return 'default';
        
      case 'bool':
        return 'default';
        
      default:
        return 'default';
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const isoString = selectedDate.toISOString().split('T')[0]; // yyyy-mm-dd
      onChangeText(isoString);
    }
  };

  const isDateType = type === 'datetime' || field?.dbType === 'datetime' || field?.dbType === 'date';

  // Tạo label với thông tin length nếu có
  const getLabelWithLength = () => {
    if (field?.len && field.len > 0) {
      return `${label} (${field.len})`;
    }
    return label;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{getLabelWithLength()}</Text>

      <View style={styles.valueBox}>
        {isDateType ? (
          <>
            <TouchableOpacity onPress={() => editable && setShowDatePicker(true)}>
              <Text style={[styles.value, { paddingVertical: 8 }]}>
                {value || `Chọn ${label.toLowerCase()}`}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={value ? new Date(value) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
              />
            )}
          </>
        ) : (
          <TextInput
            style={styles.value}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder || label}
            autoCapitalize="none"
            keyboardType={getKeyboard()}
            maxLength={field?.len || undefined}
            editable={editable}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
    fontWeight: 'bold',
  },
  valueBox: {
    backgroundColor: '#e07c7c',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  value: {
    fontSize: 16,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
});

export default FormInputRow;
