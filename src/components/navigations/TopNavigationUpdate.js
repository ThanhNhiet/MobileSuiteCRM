// src/components/navigations/TopNavigation.js
import { AppTheme } from '@/src/configs/ThemeConfig';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

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
        <Ionicons name={backIconName} size={26} color={AppTheme.colors.navIcon} />
      </Pressable>

      {/* Tiêu đề */}
      <Text style={styles.title}>{moduleName}</Text>

      
     <View style={styles.placeholder} />
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
    justifyContent: 'center',
    fontSize: 24,
    color: AppTheme.colors.navText,
  },
  placeholder: {
    width: 26, // Same width as back icon to balance
  },
});
