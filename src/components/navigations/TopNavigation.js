// src/components/navigations/TopNavigation.js
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTheme } from '../../configs/ThemeConfig';
import { useAlert } from '../../services/useApi/alert/UseAlert';
import AlertModal from '../modals/AlertModal';
import HamburgerModal from '../modals/HamburgerModal';

const TopNavigation = ({ moduleName, navigation }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  
  // Sử dụng hook để lấy số thông báo chưa đọc
  const { unreadCount } = useAlert();

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setShowMenu(true)}>
          <Ionicons name="menu" size={30} color={AppTheme.colors.navIcon} />
        </TouchableOpacity>

        <Text style={styles.title}>{moduleName}</Text>

        <TouchableOpacity style={styles.notificationContainer} onPress={() => setShowAlert(true)}>
          <Ionicons name="notifications" size={30} color={AppTheme.colors.navIcon} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <HamburgerModal
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        navigation={navigation}
      />

      <AlertModal
        visible={showAlert}
        onClose={() => setShowAlert(false)}
        navigation={navigation}
      />

    </>
  );
};

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
  notificationContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BFAAA1',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default TopNavigation;
