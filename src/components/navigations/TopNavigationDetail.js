// src/components/navigations/TopNavigation.js
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTheme } from '../../configs/ThemeConfig';

/**
 * Thanh điều hướng ở đầu màn hình.
 *
 * @param {string}  moduleName   Tiêu đề màn hình (mình thêm “Chi tiết” sẵn).
 * @param {object}  navigation   Prop từ React Navigation.
 * @param {object}  rightIcon    Tùy chọn icon bên phải: { name: string, onPress: () => void }
 */
export default function TopNavigationDetail({
  moduleName,
  navigation,
  rightIcon = { name: Platform.OS === 'ios' ? 'ellipsis-horizontal' : 'ellipsis-vertical' },
  name,
}) {
  // Chọn icon back theo platform
  const backIconName = Platform.select({
    ios: 'chevron-back',
    android: 'arrow-back',
    default: 'arrow-back',
  });

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
    color: AppTheme.colors.navText,
    fontWeight: 'bold',
    fontSize: 24,
  },
  placeholder: {
    width: 26, // Same width as back icon to balance
  },
});
