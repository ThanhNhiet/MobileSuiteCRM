import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { getAvailableLanguagesApi } from '../../services/api/login/Login_outApi';
import { useLogin_out } from '../../services/useApi/login/UseLogin_out';
import { cacheManager } from '../../utils/cacheViewManagement/CacheManager';
import { convertLocaleCode } from '../../utils/convert/ConvertLanguageCode';

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [languageList, setLanguageList] = useState([]);
  const [websiteInput, setWebsiteInput] = useState('');
  const [showWebsiteModal, setShowWebsiteModal] = useState(true);
  const [originalLangs, setOriginalLangs] = useState([]); // Store original locale codes
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [languageLoading, setLanguageLoading] = useState(false);
  const [selectedLanguageLabel, setSelectedLanguageLabel] = useState('Language');

  const {
    website, setWebsite,
    username, setUsername,
    password, setPassword,
    handleLogin,
    loading,
    isCheckingAuth,
    selectedLanguage,
    handleLanguageSelect,
    checkExistingAuth, // Add this
  } = useLogin_out();

  // Check authentication when LoginScreen mounts
  useEffect(() => {
    const checkUrl = async () => {
      const storedUrl = await AsyncStorage.getItem('url');
      if (storedUrl && storedUrl.trim() !== '') {
        setWebsiteInput(storedUrl);
        setShowWebsiteModal(false);
        setWebsite(storedUrl);
      }
    };
    checkUrl();
    checkExistingAuth();
  }, []);

  useEffect(() => {
    if (showWebsiteModal) return; //fetch after website modal is closed
    const fetchLanguages = async () => {
      try {
        setLanguageLoading(true);
        const langs = await getAvailableLanguagesApi();

        // Store original langs for mapping later
        setOriginalLangs(langs);

        // Convert locale codes to display names
        const convertedLangs = langs.map(lang => convertLocaleCode(lang));
        setLanguageList(convertedLangs);

        // Set initial language label based on selectedLanguage from hook
        if (selectedLanguage && langs.includes(selectedLanguage)) {
          setSelectedLanguageLabel(convertLocaleCode(selectedLanguage));
        }
      } catch (error) {
        console.warn('Failed to fetch languages', error);
      } finally {
        setLanguageLoading(false);
      }
    };
    fetchLanguages();
  }, [selectedLanguage]);

  const handleSelectLanguage = (displayName) => {
    setLangModalVisible(false);
    setSelectedLanguageLabel(displayName);

    // Find the original locale code by matching display name
    const originalLangIndex = languageList.indexOf(displayName);
    if (originalLangIndex !== -1 && originalLangs[originalLangIndex]) {
      handleLanguageSelect(originalLangs[originalLangIndex]);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Delete Cache',
      'Are you sure you want to delete all cached data?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await cacheManager.clearCache();
              Alert.alert('Success', 'Cache cleared successfully!');
            } catch (error) {
              console.warn('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache');
            }
          }
        }
      ]
    );
  };

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />
        <View style={styles.loadingContent}>
          <Image source={require("../../assets/images/logo-login.png")} style={styles.imageSize} />
          <ActivityIndicator size="large" color="#E85A4F" style={{ marginTop: 40 }} />
          <Text style={styles.loadingText}>Checking authentication...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />
      <Modal visible={showWebsiteModal} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: 'white', padding: 30, borderRadius: 15, width: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>Your website link</Text>
            <TextInput
              style={{ backgroundColor: '#E0E0E0', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 20 }}
              placeholder="https://..."
              value={websiteInput}
              onChangeText={setWebsiteInput}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TouchableOpacity
              style={{ backgroundColor: '#E85A4F', borderRadius: 10, paddingVertical: 12 }}
              onPress={async () => {
                if (!websiteInput.trim()) return;
                await AsyncStorage.setItem('url', websiteInput.trim());
                setWebsite(websiteInput.trim());
                setShowWebsiteModal(false);
              }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image source={require("../../assets/images/logo-login.png")} style={styles.imageSize} />
          </View>

          <View style={styles.formContainer}>
            {/* Combobox chọn ngôn ngữ */}
            <TouchableOpacity
              style={styles.languageSelector}
              onPress={() => setLangModalVisible(true)}
            >
              <Text style={styles.languageTextSelected}>{selectedLanguageLabel}</Text>
              <Ionicons name="chevron-down" size={20} color="#333" />
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Link website"
                placeholderTextColor="#999"
                value={website}
                onChangeText={setWebsite}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>

            {/* Clear Cache Button */}
            <TouchableOpacity
              style={styles.clearCacheButton}
              onPress={handleClearCache}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color="#666" />
              <Text style={styles.clearCacheButtonText}>Delete Cache</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal chọn ngôn ngữ */}
      <Modal visible={langModalVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Language</Text>
              {languageLoading ? (
                <ActivityIndicator size="large" color="#E85A4F" />
              ) : (
                <FlatList
                  data={languageList}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.languageOption}
                      onPress={() => handleSelectLanguage(item)}
                    >
                      <Text style={styles.languageText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, paddingHorizontal: 30, justifyContent: 'center', alignItems: 'center', minHeight: '100%' },
  logoContainer: { marginBottom: 40, alignItems: 'center' },
  formContainer: { width: '100%', alignItems: 'center' },
  imageSize: { width: 370, height: 110 },

  // Loading styles
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },

  inputContainer: { width: '100%', marginBottom: 20, position: 'relative' },
  input: {
    backgroundColor: '#E0E0E0',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  passwordInput: { paddingRight: 55 },
  eyeIcon: { position: 'absolute', right: 20, top: '50%', transform: [{ translateY: -12 }], padding: 5 },
  loginButton: {
    backgroundColor: '#E85A4F',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 50,
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 1,
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Clear Cache Button
  clearCacheButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 15,
  },
  clearCacheButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },

  // Ngôn ngữ combobox
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 25,
    marginBottom: 20,
  },
  languageTextSelected: {
    fontSize: 16,
    color: '#333',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  languageOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  languageText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
