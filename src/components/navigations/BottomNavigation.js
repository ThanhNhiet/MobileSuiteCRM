// src/components/navigations/BottomNavigation.js
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

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('HomeScreen')}>
        <Ionicons name="home-outline" size={24} color="black" />
        <Text>{translations.home}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('CalendarScreen')}>
        <Ionicons name="calendar-outline" size={24} color="black" />
        <Text>{translations.calendar}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#BFAAA1',
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  item: {
    alignItems: 'center',
  },
});

export default BottomNavigation;
