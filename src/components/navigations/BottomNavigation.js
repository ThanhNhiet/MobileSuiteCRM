// src/components/navigations/BottomNavigation.js
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BottomNavigation = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('HomeScreen')}>
        <Ionicons name="home-outline" size={24} color="black" />
        <Text>Trang chủ</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('ProfileScreen')}>
        <Ionicons name="person-circle-outline" size={24} color="black" />
        <Text>Hồ sơ của tôi</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#BFAAA1',
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  item: {
    alignItems: 'center',
  },
});

export default BottomNavigation;
