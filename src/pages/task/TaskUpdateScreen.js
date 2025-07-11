import TopNavigationUpdate from '@/src/components/navigations/TopNavigationUpdate';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function TaskUpdateScreen() {
  const navigation = useNavigation();

  // Dữ liệu biểu mẫu
  const [formData, setFormData] = useState({
    name: 'Ghi chú ABC',
    type: 'Khách hàng',
    phone: '0312345678',
  });

  // Các trường hiển thị
  const rows = [
    { label: 'Tên', key: 'name', keyboardType: 'default' },
    { label: 'Loại', key: 'type', keyboardType: 'default' },
    { label: 'Số điện thoại', key: 'phone', keyboardType: 'phone-pad' },
  ];

  // Xử lý thay đổi giá trị
  const handleInputChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Thanh điều hướng */}
      <TopNavigationUpdate
        moduleName="Cập nhật công việc"
        navigation={navigation}
        name="TaskListScreen"
      />

      {/* Form các trường */}
      {rows.map((item) => (
        <View key={item.key} style={styles.row}>
          <Text style={styles.label}>{item.label}</Text>
          <View style={styles.valueBox}>
            <TextInput
              style={styles.value}
              value={formData[item.key]}
              onChangeText={(value) => handleInputChange(item.key, value)}
              placeholder={item.label}
              keyboardType={item.keyboardType}
              autoCapitalize="none"
              returnKeyType="done"
            />
          </View>
        </View>
      ))}
    </SafeAreaView>
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
});
