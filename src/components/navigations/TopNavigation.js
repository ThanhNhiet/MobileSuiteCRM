// src/components/navigations/TopNavigation.js
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HamburgerModal from '../modals/HamburgerModal';

const TopNavigation = ({ moduleName, navigation }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setShowMenu(true)}>
          <Ionicons name="menu" size={30} color="black" />
        </TouchableOpacity>

        <Text style={styles.title}>{moduleName}</Text>

        <TouchableOpacity onPress={() => console.log('Notifications pressed')}>
          <Ionicons name="notifications" size={30} color="black" />
        </TouchableOpacity>
      </View>

      <HamburgerModal
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        navigation={navigation}
      />
    </>
  );
};

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

export default TopNavigation;
