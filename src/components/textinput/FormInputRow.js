import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const FormInputRow = ({
  label,
  value,
  onChangeText,
  type = 'text', // text | phone | email | date | datetime | number | multiline | boolean | select | url
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
      case 'number':
        return 'numeric';
      case 'url':
        return 'url';
      case 'decimal':
        return 'decimal-pad';
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
      try {
        let formattedDate;
        if (type === 'datetime') {
          // Format: YYYY-MM-DD HH:MM:SS
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const hours = String(selectedDate.getHours()).padStart(2, '0');
          const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
          const seconds = String(selectedDate.getSeconds()).padStart(2, '0');
          formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } else if (type === 'time') {
          // Format: HH:MM:SS
          const hours = String(selectedDate.getHours()).padStart(2, '0');
          const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
          const seconds = String(selectedDate.getSeconds()).padStart(2, '0');
          formattedDate = `${hours}:${minutes}:${seconds}`;
        } else {
          // Format: YYYY-MM-DD
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          formattedDate = `${year}-${month}-${day}`;
        }
        onChangeText(formattedDate);
      } catch (error) {
        console.error('Error formatting date:', error);
      }
    }
  };

  const isDateType = ['date', 'datetime', 'time'].includes(type) || 
                     ['datetime', 'date', 'time'].includes(field?.dbType);

  // Tạo label với thông tin length nếu có
  const getLabelWithLength = () => {
    if (field?.len && field.len > 0) {
      return `${label} (${field.len})`;
    }
    return label;
  };

  // Handle boolean type
  if (type === 'boolean') {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{getLabelWithLength()}</Text>
        <TouchableOpacity
          style={[styles.valueBox, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
          onPress={() => editable && onChangeText(value === 'true' || value === '1' ? 'false' : 'true')}
          disabled={!editable}
        >
          <Text style={styles.value}>
            {value === 'true' || value === '1' ? 'Yes' : 'No'}
          </Text>
          <View style={[
            {
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: (value === 'true' || value === '1') ? '#007AFF' : '#ddd',
              justifyContent: 'center',
              alignItems: 'center'
            }
          ]}>
            {(value === 'true' || value === '1') && (
              <Text style={{ color: 'white', fontSize: 16 }}>✓</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{getLabelWithLength()}</Text>

      <View style={styles.valueBox}>
        {isDateType ? (
          <>
            <TouchableOpacity 
              onPress={() => editable && setShowDatePicker(true)}
              style={{ paddingVertical: 8 }}
            >
              <Text style={styles.value}>
                {value || `Chọn ${label.toLowerCase()}`}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={value ? new Date(value) : new Date()}
                mode={type === 'datetime' ? 'datetime' : type === 'time' ? 'time' : 'date'}
                display="default"
                onChange={handleDateChange}
              />
            )}
          </>
        ) : (
          <TextInput
            style={[styles.value, { 
              height: type === 'multiline' ? 80 : undefined,
              textAlignVertical: type === 'multiline' ? 'top' : 'center'
            }]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder || label}
            autoCapitalize="none"
            keyboardType={getKeyboard()}
            maxLength={field?.len || undefined}
            editable={editable}
            multiline={type === 'multiline'}
            numberOfLines={type === 'multiline' ? 4 : 1}
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
