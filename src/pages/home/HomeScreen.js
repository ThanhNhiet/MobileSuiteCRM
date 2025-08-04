import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../../components/navigations/BottomNavigation';
import TopNavigation from '../../components/navigations/TopNavigation';
import { useCountModules } from '../../services/useApi/home/UseCountModules';

const boxWidth = (Dimensions.get('window').width - 32 - 12) / 2;

export default function HomeScreen() {
  const navigation = useNavigation();
  const homeTitle = 'Home';
  const { data: DATA, loading, error, refresh } = useCountModules();

  const handleNavigation = (module) => {
    switch (module) {
      case 'Accounts':
        navigation.navigate('AccountListScreen');
        break;
      case 'Notes':
        navigation.navigate('NoteListScreen');
        break;
      case 'Tasks':
        navigation.navigate('TaskListScreen');
        break;
      case 'Meetings':
        navigation.navigate('MeetingListScreen');
        break;
      default:
        console.warn('No navigation defined for:', title);
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.wrapper}>

        <TopNavigation moduleName={homeTitle} navigation={navigation} />

        <ScrollView 
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
        >
          {DATA.map((item, index) => (
            <TouchableOpacity key={index} style={styles.box}
              onPress={() => {
                handleNavigation(item.module);
              }}
            >
              <Text style={styles.title}>{item.title}</Text>

              <View style={styles.row}>
                {item.my !== undefined && (
                  <View style={styles.statCol}>
                    <Text style={styles.number}>{item.my}</Text>
                    <Text style={styles.label}>My</Text>
                  </View>
                )}

                {item.all !== undefined && (
                  <View style={styles.statCol}>
                    <Text style={styles.number}>{item.all}</Text>
                    <Text style={styles.label}>All</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
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
