// src/components/navigations/TopNavigation.js
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

const TopNavigation = () => {
  return (
    <View style={styles.container}>
      <Ionicons name="menu" size={24} color="black" />
      <Text style={styles.title}>Module name</Text>
      <Ionicons name="notifications" size={24} color="black" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#BFAAA1',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TopNavigation;
