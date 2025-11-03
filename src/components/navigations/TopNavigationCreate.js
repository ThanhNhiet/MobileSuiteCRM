// src/components/navigations/TopNavigation.js
import { AppTheme } from '@/src/configs/ThemeConfig';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * Thanh điều hướng ở đầu màn hình.
 *
 * @param {string}  moduleName   Tiêu đề màn hình (mình thêm “Chi tiết” sẵn).
 * @param {object}  navigation   Prop từ React Navigation.
 * @param {object}  rightIcon    Tùy chọn icon bên phải: { name: string, onPress: () => void }
 */
export default function TopNavigationCreate({
  moduleName,
  navigation,
  name,
  rightIcon = { name: Platform.OS === 'ios' ? 'ellipsis-horizontal' : 'save-outline' },
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
  notify('Tạo thành công!');
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
        <Ionicons name={backIconName} size={26} color={AppTheme.colors.navIcon} />
      </Pressable>

      {/* Tiêu đề */}
      <Text style={styles.title}>{moduleName}</Text>

      {/* Nút bên phải (mặc định là “…”), truyền vào prop rightIcon nếu muốn khác */}
      <View style={styles.isNaN}/>      
    </View>
  );
}

const styles = StyleSheet.create({
 container: {
    backgroundColor: AppTheme.colors.navBG,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 24,
    color: AppTheme.colors.navText,
  },
  isNaN: {
    width: 26
  }
});
