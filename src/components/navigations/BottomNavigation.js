// src/components/navigations/BottomNavigation.js
import { AppTheme, createThemedStyles } from '@/src/configs/ThemeConfig';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SystemLanguageUtils } from '../../utils/cacheViewManagement/SystemLanguageUtils';

const BottomNavigation = ({ navigation }) => {
  const systemLanguageUtils = SystemLanguageUtils.getInstance();
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    const loadTranslations = async () => {
      const homeLabel = await systemLanguageUtils.translate('Home');
      const calendarLabel = await systemLanguageUtils.translate('Calendar');
      setTranslations({ home: homeLabel, calendar: calendarLabel });
    };
    loadTranslations();
  }, []);

  // Get dynamic styles with current theme colors
  const styles = getStyles();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('HomeScreen')}>
        <Ionicons name="home-outline" size={24} color={AppTheme.colors.navIcon} />
        <Text style={{ color: AppTheme.colors.navText }}>{translations.home}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('CalendarScreen')}>
        <Ionicons name="calendar-outline" size={24} color={AppTheme.colors.navIcon} />
        <Text style={{ color: AppTheme.colors.navText }}>{translations.calendar}</Text>
      </TouchableOpacity>
    </View>
  );
};

// Create dynamic styles that update with theme
const getStyles = createThemedStyles((colors) => StyleSheet.create({
  container: {
    backgroundColor: colors.navBG,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  item: {
    alignItems: 'center',
  },
}));

export default BottomNavigation;
