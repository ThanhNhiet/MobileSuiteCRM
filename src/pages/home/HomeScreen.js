import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../../components/navigations/BottomNavigation';
import TopNavigation from '../../components/navigations/TopNavigation';

const DATA = [
  { title: 'Accounts', my: 1, all: 52 },
  { title: 'Calls', my: 6, all: 54 },
  { title: 'Cases', my: 1, all: 51 },
  { title: 'Check-ins', my: 3, all: 3 },
  { title: 'Contacts', my: 0, all: 200 },
  { title: 'Contracts', my: 0, all: 0 },
];

const boxWidth = (Dimensions.get('window').width - 32 - 12) / 2;

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.wrapper}>

        <TopNavigation navigation={navigation} />

        <ScrollView contentContainerStyle={styles.container}>
          {DATA.map((item, index) => (
            <View key={index} style={styles.box}>
              <Text style={styles.title}>{item.title}</Text>

              <View style={styles.row}>
                <View style={styles.statCol}>
                  <Text style={styles.number}>{item.my}</Text>
                  <Text style={styles.label}>My</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.number}>{item.all}</Text>
                  <Text style={styles.label}>All</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <BottomNavigation navigation={navigation} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 80, // để tránh che bởi BottomNavigation
  },
  box: {
    width: boxWidth,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 16,

    // Bóng đổ nhẹ (Material style)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B4B4B',
    textAlign: 'center',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
  },
  number: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2a2a2a',
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
