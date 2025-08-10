import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

class UserLanguageUtils {
    constructor() {
        this.cachedLanguageData = {};
        this.currentLanguage = null;
    }

    async loadLanguageData(forceReload = false) {
        const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
        const cacheKey = `Users-${selectedLanguage}`;
        
        // If language changed, clear all cache
        if (this.currentLanguage !== selectedLanguage || forceReload) {
            if (this.currentLanguage !== selectedLanguage) {
                this.cachedLanguageData = {};
            }
            this.currentLanguage = selectedLanguage;
        }

        // Return cached data if available
        if (this.cachedLanguageData[cacheKey] && !forceReload) {
            return this.cachedLanguageData[cacheKey];
        }

        try {
            // Construct path to cache file
            const cacheFilePath = `${FileSystem.documentDirectory}cache/Users/language/${selectedLanguage}.json`;
            
            // Check if cache file exists
            const cacheFileInfo = await FileSystem.getInfoAsync(cacheFilePath);
            if (!cacheFileInfo.exists) {
                console.warn(`Users language cache file not found: ${cacheFilePath}`);
                return this.getEmptyLanguageData(cacheKey);
            }

            // Read cache file
            const cacheFileContent = await FileSystem.readAsStringAsync(cacheFilePath);
            const languageData = JSON.parse(cacheFileContent);

            if (languageData && languageData.data) {
                const result = {
                    appStrings: languageData.data.app_strings || {},
                    appListStrings: languageData.data.app_list_strings || {},
                    modStrings: languageData.data.mod_strings || {}, // Add User module strings
                    language: languageData.language || selectedLanguage,
                    meta: languageData.meta || {},
                    fullData: languageData.data // Keep full data for flexibility
                };
                
                // Cache the result
                this.cachedLanguageData[cacheKey] = result;
                console.log(`Successfully loaded users language data from cache for ${selectedLanguage}`);
                return result;
            } else {
                console.warn(`Invalid language data structure in cache file: ${cacheFilePath}`);
                return this.getEmptyLanguageData(cacheKey);
            }
        } catch (error) {
            console.warn('Failed to load notes language data from cache:', error);
            return this.getEmptyLanguageData(cacheKey);
        }
    }

    // Helper method to return empty language data structure
    getEmptyLanguageData(cacheKey) {
        const emptyData = {
            appStrings: {},
            appListStrings: {},
            modStrings: {}, // Add User module strings
            language: 'vi_VN',
            meta: {},
            fullData: {}
        };
        this.cachedLanguageData[cacheKey] = emptyData;
        return emptyData;
    }

    // Helper method to search nested objects in app_list_strings
    searchNestedValue(obj, searchValue) {
        if (!obj || typeof obj !== 'object') return null;
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                if (typeof value === 'string' && key === searchValue) {
                    return value;
                } else if (typeof value === 'object') {
                    const found = this.searchNestedValue(value, searchValue);
                    if (found) return found;
                }
            }
        }
        return null;
    }

    // Translate a single key
    async translate(key, defaultValue = null) {
        try {
            const languageData = await this.loadLanguageData();
            
            // Try modStrings first (User module strings)
            let translation = languageData.modStrings[key];
            if (translation) {
                return String(translation);
            }
            
            // Try appStrings second
            if (!translation) {
                translation = languageData.appStrings[key];
                if (translation) {
                    return String(translation);
                }
            }
            
            // Then try appListStrings direct lookup
            if (!translation) {
                translation = languageData.appListStrings[key];
                if (translation) {
                    return String(translation);
                }
            }
            
            // Then try nested search in appListStrings (for values like "unread", "read", etc.)
            if (!translation) {
                translation = this.searchNestedValue(languageData.appListStrings, key);
                if (translation) {
                    return String(translation);
                }
            }
            
            // If not found, try with common prefix variations
            if (!translation && key.startsWith('LBL_')) {
                // Try without LBL_ prefix in all sources
                const simpleKey = key.replace('LBL_', '');
                translation = languageData.modStrings[simpleKey] || languageData.appStrings[simpleKey] || languageData.appListStrings[simpleKey];
                if (translation) {
                    return String(translation);
                }
                
                // Try with LBL_LIST_ prefix
                if (!translation) {
                    const listKey = key.replace('LBL_', 'LBL_LIST_');
                    translation = languageData.modStrings[listKey] || languageData.appStrings[listKey] || languageData.appListStrings[listKey];
                    if (translation) {
                        return String(translation);
                    }
                }
            }

            // Ensure we always return a string
            const result = translation || defaultValue || key;
            return String(result);
        } catch (error) {
            console.warn('Users translation error for key:', key, error);
            return String(defaultValue || key);
        }
    }

    // Translate multiple keys at once - returns object with translations
    async translateKeys(keys) {
        try {
            const languageData = await this.loadLanguageData();
            const translations = {};

            for (const key of keys) {
                // Try modStrings first (User module strings)
                let translation = languageData.modStrings[key];
                
                // Try appStrings second
                if (!translation) {
                    translation = languageData.appStrings[key];
                }
                
                // Then try appListStrings direct lookup
                if (!translation) {
                    translation = languageData.appListStrings[key];
                }
                
                // Then try nested search in appListStrings
                if (!translation) {
                    translation = this.searchNestedValue(languageData.appListStrings, key);
                }
                
                // If not found, try with common prefix variations
                if (!translation && key.startsWith('LBL_')) {
                    // Try without LBL_ prefix in all sources
                    const simpleKey = key.replace('LBL_', '');
                    translation = languageData.modStrings[simpleKey] || languageData.appStrings[simpleKey] || languageData.appListStrings[simpleKey];
                    
                    // Try with LBL_LIST_ prefix
                    if (!translation) {
                        const listKey = key.replace('LBL_', 'LBL_LIST_');
                        translation = languageData.modStrings[listKey] || languageData.appStrings[listKey] || languageData.appListStrings[listKey];
                    }
                }

                // Ensure we always store a string
                translations[key] = String(translation || key);
            }

            return translations;
        } catch (error) {
            console.warn('Users translation error for keys:', keys, error);
            // Return fallback object with keys as values
            const fallbackTranslations = {};
            keys.forEach(key => {
                fallbackTranslations[key] = String(key);
            });
            return fallbackTranslations;
        }
    }

    // Translate field name to user-friendly label
    async translateFieldName(fieldName, defaultValue = null) {
        try {
            // First try direct translation
            let translation = await this.translate(fieldName, null);
            if (translation && translation !== fieldName) {
                return translation;
            }

            // Try with LBL_ prefix
            const lblKey = `LBL_${fieldName.toUpperCase()}`;
            translation = await this.translate(lblKey, null);
            if (translation && translation !== lblKey) {
                return translation;
            }

            // Try common field name patterns
            const patterns = [
                `LBL_${fieldName.replace(/_/g, '_').toUpperCase()}`,
                `LBL_LIST_${fieldName.toUpperCase()}`,
                fieldName.toUpperCase()
            ];

            for (const pattern of patterns) {
                translation = await this.translate(pattern, null);
                if (translation && translation !== pattern) {
                    return translation;
                }
            }

            // Return default value or formatted field name
            return defaultValue || this.formatFieldName(fieldName);
        } catch (error) {
            console.warn('Error translating field name:', fieldName, error);
            return defaultValue || this.formatFieldName(fieldName);
        }
    }

    // Format field name as fallback (convert snake_case to Title Case)
    formatFieldName(fieldName) {
        return fieldName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    // Get current language
    async getCurrentLanguage() {
        return await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
    }

    // Clear cached language data (useful when language changes)
    clearCache(specificLanguage = null) {
        if (specificLanguage) {
            const cacheKey = `Users-${specificLanguage}`;
            delete this.cachedLanguageData[cacheKey];
        } else {
            this.cachedLanguageData = {};
            this.currentLanguage = null;
        }
    }

    // Static method to get singleton instance
    static getInstance() {
        if (!UserLanguageUtils.instance) {
            UserLanguageUtils.instance = new UserLanguageUtils();
        }
        return UserLanguageUtils.instance;
    }
}

// Export both the class and singleton instance
export { UserLanguageUtils };
export const userLanguageUtils = new UserLanguageUtils();
