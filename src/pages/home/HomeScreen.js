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
  const { data: DATA, loading, error, refresh, allModules, selectedModules, saveHomeSettings } = useCountModules();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [checkedModules, setCheckedModules] = React.useState(selectedModules || []);

  // Navigation logic
  const handleNavigation = async (item) => {
    const targetScreen = item.navigationTarget || 'ModuleListScreen';
    if (!loading) {
      navigation.navigate(targetScreen, { moduleName: item.module });
    }
  };

  // Open modal to select modules
  const openModuleModal = () => {
    setCheckedModules(selectedModules || []);
    setModalVisible(true);
  };

  // Save selected modules
  const handleSaveModules = async () => {
    await saveHomeSettings(checkedModules);
    setModalVisible(false);
    refresh();
  };

  // Toggle module checkbox
  const toggleModule = (module) => {
    setCheckedModules(prev =>
      prev.includes(module)
        ? prev.filter(m => m !== module)
        : [...prev, module]
    );
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
            <View style={styles.initialLoadingContainer}>
              <Text style={styles.loadingText}>...</Text>
            </View>
          ) : (
            <>
              {DATA.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.box, loading && styles.disabledBox]}
                  onPress={() => handleNavigation(item)}
                  disabled={loading}
                  activeOpacity={loading ? 1 : 0.7}
                >
                  <Text style={[styles.title, loading && styles.disabledText]}>{item.title}</Text>
                  <View style={styles.row}>
                    {item.my !== undefined && (
                      <View style={styles.statCol}>
                        <Text style={[styles.number, loading && styles.disabledText]}>{item.my}</Text>
                        <Text style={[styles.label, loading && styles.disabledText]}>My</Text>
                      </View>
                    )}
                    {item.calendar && (
                      <View style={styles.statCol}>
                        <Text style={[styles.calendarIcon, loading && styles.disabledText]}>📅</Text>
                        <Text style={[styles.label, loading && styles.disabledText]}>View</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              {/* Dấu cộng để mở modal chọn module */}
              <TouchableOpacity style={[styles.box, styles.addBox]} onPress={openModuleModal}>
                <Text style={styles.addIcon}>＋</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
        {/* Modal chọn module */}
        {modalVisible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Chọn module hiển thị</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {allModules && allModules.map((module, idx) => (
                  <TouchableOpacity key={module} style={styles.checkboxRow} onPress={() => toggleModule(module)}>
                    <View style={[styles.checkbox, checkedModules.includes(module) && styles.checkboxChecked]} />
                    <Text style={styles.checkboxLabel}>{module}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveModules}>
                  <Text style={styles.saveBtnText}>Lưu</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        <BottomNavigation navigation={navigation} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  addBox: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eaf6ff',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  addIcon: {
    fontSize: 32,
    color: '#007AFF',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 350,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  saveBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: '#eee',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelBtnText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
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
  moduleIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
