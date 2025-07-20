// src/components/navigations/TopNavigation.js
import { Ionicons } from '@expo/vector-icons';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * Thanh điều hướng ở đầu màn hình.
 *
 * @param {string}  moduleName   Tiêu đề màn hình (mình thêm “Chi tiết” sẵn).
 * @param {object}  navigation   Prop từ React Navigation.
 * @param {object}  rightIcon    Tùy chọn icon bên phải: { name: string, onPress: () => void }
 */
export default function TopNavigationUpdate({
  moduleName,
  navigation,
  rightIcon = { name: Platform.OS === 'ios' ? 'ellipsis-horizontal' : 'save-outline' },
  name
}) {
  // Chọn icon back theo platform
  const backIconName = Platform.select({
    ios: 'chevron-back',
    android: 'arrow-back',
    default: 'arrow-back',
  });

  const notify = (message) => {
  Alert.alert(
    'Thông báo',
    message,
    [
      {
        text: 'Không',          // ❌ Không đi
        style: 'cancel',        // iOS sẽ tô đậm & tự đóng dialog
      },
      {
        text: 'Có',             // ✅ Đồng ý đi
        onPress: () => navigation?.navigate(name),
      },
    ],
    { cancelable: true }
  );
};


const handleSave = () => {
  // TODO: logic lưu dữ liệu của bạn …
  notify('Lưu thành công!');
};

  return (
    <View style={styles.container}>
      {/* Nút back */}
      <Pressable
        onPress={() => navigation.canGoBack() && navigation.goBack()}
        hitSlop={12}
        android_ripple={{ borderless: true }}
        style={styles.iconBtn}
      >
        <Ionicons name={backIconName} size={26} color="#1e1e1e" />
      </Pressable>

      {/* Tiêu đề */}
      <Text style={styles.title}>Chi tiết {moduleName}</Text>

      {/* Nút bên phải (mặc định là “…”), truyền vào prop rightIcon nếu muốn khác */}
      <Pressable
        onPress={handleSave}
        hitSlop={12}
        android_ripple={{ borderless: true }}
        style={styles.iconBtn}
      >
        <Ionicons name={rightIcon.name} size={24} color="#1e1e1e" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
container: {
    backgroundColor: '#BFAAA1',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 24,
  },
});
