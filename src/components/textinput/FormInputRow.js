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
    switch (field.dbType) {
      case 'varchar':
            if (type ==='phone')
                return {len:field.len,type: 'phone-pad'};
            else if (type === 'email')
                return 'email-address';
            else if (type === 'varchar')
                return {len:field.len,type: 'default'};
            else if (type === 'url')
                return {len:field.len,type: 'default'};
      case 'text':
        return 'phone-pad';
      case 'relate':
        return 'default';
      case 'datetime':
        return 'default'; // Date input handled separately
      case 'link':
            if (field.type === 'link')
                return {type: 'default'};
            else if (field.type === 'link_multiple')
                return {len:field.len,type: 'default'};
        return 'default';
      case 'enum':
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

  const isDateType = type === 'datetime';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

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
            keyboardType={getKeyboard().type}
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
