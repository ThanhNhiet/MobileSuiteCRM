import { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
    checkNotificationPermissions,
    getDeviceInfo,
    registerDeviceTokenWithServer,
    sendTestNotification
} from '../../utils/PushNotifications';

export default function PushNotificationTestScreen() {
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);

  useEffect(() => {
    // Get device info on component mount
    const info = getDeviceInfo();
    setDeviceInfo(info);
    
    // Check permissions
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    setIsCheckingPermissions(true);
    try {
      const perms = await checkNotificationPermissions();
      setPermissions(perms);
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  const handleRegisterToken = async () => {
    try {
      setIsRegistering(true);
      const success = await registerDeviceTokenWithServer();
      
      if (success) {
        Alert.alert('Success', 'Device token registered successfully!');
      } else {
        Alert.alert('Error', 'Failed to register device token');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Failed to register device token: ' + error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      Alert.alert(
        'Test Notification',
        'This will send a local test notification in 2 seconds. You can minimize the app to test background delivery.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Send Test', 
            onPress: async () => {
              const success = await sendTestNotification();
              if (success) {
                Alert.alert('Success', 'Test notification scheduled! Minimize the app to see if it works in background.');
              } else {
                Alert.alert('Error', 'Failed to send test notification');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Test notification error:', error);
      Alert.alert('Error', 'Failed to send test notification: ' + error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Push Notification Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Information:</Text>
        {deviceInfo && (
          <View style={styles.deviceInfo}>
            <Text>Is Device: {deviceInfo.isDevice ? 'Yes' : 'No'}</Text>
            <Text>Platform: {deviceInfo.platform}</Text>
            <Text>Device Type: {deviceInfo.deviceType}</Text>
            <Text>Device Name: {deviceInfo.deviceName}</Text>
            <Text>Model: {deviceInfo.modelName}</Text>
            <Text>OS: {deviceInfo.osName} {deviceInfo.osVersion}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Permissions:</Text>
        {isCheckingPermissions ? (
          <Text>Checking permissions...</Text>
        ) : permissions ? (
          <View style={styles.deviceInfo}>
            <Text>Status: {permissions.status}</Text>
            <Text>Granted: {permissions.granted ? 'Yes' : 'No'}</Text>
            <Text>Can Ask Again: {permissions.canAskAgain ? 'Yes' : 'No'}</Text>
            {permissions.ios && (
              <>
                <Text style={styles.subTitle}>iOS Permissions:</Text>
                <Text>Alert: {permissions.ios.allowsAlert ? 'Yes' : 'No'}</Text>
                <Text>Badge: {permissions.ios.allowsBadge ? 'Yes' : 'No'}</Text>
                <Text>Sound: {permissions.ios.allowsSound ? 'Yes' : 'No'}</Text>
              </>
            )}
            {permissions.android && (
              <>
                <Text style={styles.subTitle}>Android Permissions:</Text>
                <Text>Importance: {permissions.android.importance}</Text>
              </>
            )}
          </View>
        ) : (
          <Text>Unable to check permissions</Text>
        )}
        
        <View style={styles.spacer} />
        <Button 
          title="Refresh Permissions"
          onPress={checkPermissions}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions:</Text>
        <Button 
          title={isRegistering ? "Registering..." : "Register Device Token"}
          onPress={handleRegisterToken}
          disabled={isRegistering}
        />
        
        <View style={styles.spacer} />
        
        <Button 
          title="Send Local Test Notification"
          onPress={handleTestNotification}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Testing Background Notifications:</Text>
        <Text style={styles.note}>
          1. Tap "Send Local Test Notification"
          {'\n'}2. Immediately minimize/close the app
          {'\n'}3. Wait 2 seconds for the notification
          {'\n'}4. You should receive the notification even when app is closed
          {'\n\n'}Note: Push notifications work only on physical devices, not simulators.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 2,
  },
  deviceInfo: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  spacer: {
    height: 10,
  },
  note: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});