import TopNavigationUpdate from '@/src/components/navigations/TopNavigationUpdate';
import FormInputRow from '@/src/components/textinput/FormInputRow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import AccountData from '../../services/useApi/account/AccountData';
export default function AccountUpdateScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    'name': 'Công ty ABC',
    'description': 'Khách hàng',
    'phone_fax': '0312345678',
    'birthdate': '1990-01-01',
  });
   const [fields, setFields] = useState([]);
     useEffect(() => {
        const fetchFields = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) {   
                    navigation.navigate('LoginScreen');
                }
                // Lấy danh sách các trường từ API
                const data = await AccountData.getFields(token);
                console.log('Fields:', data);
                setFields(data || []);
                } catch (error) {
                console.error('Lỗi lấy fields:', error);
                }
            };
            fetchFields();
            }, []);

  const handleInputChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
            {/* Thanh điều hướng */}
            <TopNavigationUpdate
                moduleName="Khách hàng"
                navigation={navigation} // Giả lập navigation prop
            />
          {fields
          .filter(field => field.key !== 'id')
          .map((item) => (
            <FormInputRow
              key={item.key}
              label={item.label}
              value={formData[item.key]}
              onChangeText={(value) => handleInputChange(item.key, value)}
              type={item.type}
              field={item} // Truyền thông tin trường để lấy len
            />
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* MÀN HÌNH CHUNG */
  container: {
    flex: 1,
    backgroundColor: '#d8d8d8', // nền xám nhạt
  }
});
