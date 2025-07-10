import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import TopNavigationCreate from '../../components/navigations/TopNavigationCreate';
export default function AccountCreateScreen() {
    const navigation = useNavigation();
     const [formData, setFormData] = useState({
        'Tên': 'Công ty ABC',
        'Loại': 'Khách hàng',
        'Số điện thoại': '0312345678',
      });
    
      const rows = [
        { label: 'Tên', key: 'Tên' },
        { label: 'Loại', key: 'Loại' },
        { label: 'Số điện thoại', key: 'Số điện thoại' },
      ];
    
      const handleInputChange = (key, value) => {
        setFormData(prev => ({
          ...prev,
          [key]: value
        }));
      };
    return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
            {/* Thanh điều hướng */}
            <TopNavigationCreate
                moduleName="Tạo khách hàng"
                navigation={navigation}
            />
            <View style={styles.content}>
                 {rows.map((item) => (
                            <View key={item.label} style={styles.row}>
                              <Text style={styles.label}>{item.label}</Text>
                
                          {/* Ô màu hồng chứa giá trị */}
                          <View style={styles.valueBox}>
                            <TextInput 
                              style={styles.value}
                              value={formData[item.key]}
                              onChangeText={(value) => handleInputChange(item.key, value)}
                              placeholder={item.label}
                              autoCapitalize="none"
                            />
                          </View>
                        </View>
                      ))}
            </View>

        </SafeAreaView>
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
});