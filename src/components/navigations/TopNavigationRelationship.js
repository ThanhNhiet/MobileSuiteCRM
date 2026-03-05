// src/components/navigations/TopNavigation.js
import { AppTheme, createThemedStyles } from '@/src/configs/ThemeConfig';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const backIconName = Platform.select({
    ios: 'chevron-back',
    android: 'arrow-back',
    default: 'arrow-back',
  });

const TopNavigationRelationship = ({ moduleName, navigation }) => {
  const styles = getStyles();

  return (
    <>
      <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()}>
            <Ionicons name={backIconName} size={26} color={AppTheme.colors.navIcon} />
            </TouchableOpacity>

            <Text style={styles.title}>{moduleName}</Text>
            
            <View style={styles.placeholder} />
      </View>

      
    </>
  );
};

const getStyles = createThemedStyles((colors) => StyleSheet.create({
  container: {
    backgroundColor: colors.navBG,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 24,
    flex: 1,
    textAlign: 'center',
    color: colors.navText,
  },
  placeholder: {
    width: 26, // Same width as back icon to balance
  },
}));

export default TopNavigationRelationship;
