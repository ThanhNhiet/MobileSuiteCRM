import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  ActivityIndicator,
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
import { hasNavigationAccess } from '../../services/api/home/CountModulesApi';
import { useCountModules } from '../../services/useApi/home/UseCountModules';

const boxWidth = (Dimensions.get('window').width - 32 - 12) / 2;

export default function HomeScreen() {
  const navigation = useNavigation();
  const homeTitle = 'Home';
  const { data: DATA, loading, error, refresh } = useCountModules();

  const handleNavigation = async (item) => {
    try {
      // Use navigationTarget from the item if available (new permission-based approach)
      const targetScreen = item.navigationTarget || getScreenNameFromModule(item.module);
      
      // Check if user has permission to navigate to this screen
      const hasAccess = await hasNavigationAccess(targetScreen);
      
      if (!hasAccess) {
        console.warn(`User doesn't have access to ${targetScreen}`);
        // You could show an alert or toast here
        return;
      }
      
      navigation.navigate(targetScreen);
    } catch (error) {
      console.error('Error checking navigation access:', error);
      // Fallback to original navigation on error
      const targetScreen = getScreenNameFromModule(item.module);
      navigation.navigate(targetScreen);
    }
  };

  // Legacy function for mapping modules to screen names
  const getScreenNameFromModule = (module) => {
    switch (module) {
      case 'Accounts':
        return 'AccountListScreen';
      case 'Notes':
        return 'NoteListScreen';
      case 'Tasks':
        return 'TaskListScreen';
      case 'Meetings':
        return 'MeetingListScreen';
      case 'Calendar':
        return 'CalendarScreen';
      default:
        console.warn('No navigation defined for module:', module);
        return 'HomeScreen';
    }
  };

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
          {loading && DATA.length === 0 ? (
            // Show loading state when no data and loading
            <View style={styles.initialLoadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          ) : (
            DATA.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.box,
                  loading && styles.disabledBox
                ]}
                onPress={() => {
                  if (!loading) {
                    handleNavigation(item);
                  }
                }}
                disabled={loading}
                activeOpacity={loading ? 1 : 0.7}
              >
                <Text style={[
                  styles.title,
                  loading && styles.disabledText
                ]}>{item.title}</Text>

                <View style={styles.row}>
                  {item.my !== undefined && (
                    <View style={styles.statCol}>
                      <Text style={[
                        styles.number,
                        loading && styles.disabledText
                      ]}>{item.my}</Text>
                      <Text style={[
                        styles.label,
                        loading && styles.disabledText
                      ]}>My</Text>
                    </View>
                  )}

                  {item.all !== undefined && (
                    <View style={styles.statCol}>
                      <Text style={[
                        styles.number,
                        loading && styles.disabledText
                      ]}>{item.all}</Text>
                      <Text style={[
                        styles.label,
                        loading && styles.disabledText
                      ]}>All</Text>
                    </View>
                  )}

                  {item.calendar && (
                    <View style={styles.statCol}>
                      <Text style={[
                        styles.calendarIcon,
                        loading && styles.disabledText
                      ]}>📅</Text>
                      <Text style={[
                        styles.label,
                        loading && styles.disabledText
                      ]}>View</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
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
  disabledBox: {
    opacity: 0.5,
    backgroundColor: '#f8f8f8',
  },
  disabledText: {
    color: '#ccc',
  },
  initialLoadingContainer: {
    width: '100%',
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
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
  calendarIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
