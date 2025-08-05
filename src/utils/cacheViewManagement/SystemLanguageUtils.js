import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

class SystemLanguageUtils {
    constructor() {
        this.cachedLanguageData = {};
        this.currentLanguage = null;
    }

    // Load language data from FileSystem cache files
    async loadLanguageData(forceReload = false) {
        const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
        const cacheKey = `system-${selectedLanguage}`;
        
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
            const cacheFilePath = `${FileSystem.documentDirectory}cache/Include/${selectedLanguage}.json`;
            
            // Check if cache file exists
            const cacheFileInfo = await FileSystem.getInfoAsync(cacheFilePath);
            if (!cacheFileInfo.exists) {
                console.warn(`System language cache file not found: ${cacheFilePath}`);
                return this.getEmptyLanguageData(cacheKey);
            }

            // Read cache file
            const cacheFileContent = await FileSystem.readAsStringAsync(cacheFilePath);
            const languageData = JSON.parse(cacheFileContent);

            if (languageData && languageData.data) {
                const result = {
                    appStrings: languageData.data.app_strings || {},
                    appListStrings: languageData.data.app_list_strings || {},
                    language: languageData.language || selectedLanguage,
                    meta: languageData.meta || {},
                    fullData: languageData.data // Keep full data for flexibility
                };
                
                // Cache the result
                this.cachedLanguageData[cacheKey] = result;
                console.log(`Successfully loaded system language data from cache for ${selectedLanguage}`);
                return result;
            } else {
                console.warn(`Invalid language data structure in cache file: ${cacheFilePath}`);
                return this.getEmptyLanguageData(cacheKey);
            }
        } catch (error) {
            console.warn('Failed to load system language data from cache:', error);
            return this.getEmptyLanguageData(cacheKey);
        }
    }

    // Helper method to return empty language data structure
    getEmptyLanguageData(cacheKey) {
        const emptyData = {
            appStrings: {},
            appListStrings: {},
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
            
            // Try appStrings first
            let translation = languageData.appStrings[key];
            
            // Then try appListStrings direct lookup
            if (!translation) {
                translation = languageData.appListStrings[key];
            }
            
            // Then try nested search in appListStrings (for values like "unread", "read", etc.)
            if (!translation) {
                translation = this.searchNestedValue(languageData.appListStrings, key);
            }
            
            // If not found, try with common prefix variations
            if (!translation && key.startsWith('LBL_')) {
                // Try without LBL_ prefix
                const simpleKey = key.replace('LBL_', '');
                translation = languageData.appStrings[simpleKey] || languageData.appListStrings[simpleKey];
                
                // Try with LBL_LIST_ prefix
                if (!translation) {
                    const listKey = key.replace('LBL_', 'LBL_LIST_');
                    translation = languageData.appStrings[listKey] || languageData.appListStrings[listKey];
                }
            }

            // Ensure we always return a string
            const result = translation || defaultValue || key;
            return String(result);
        } catch (error) {
            console.warn('System translation error for key:', key, error);
            return String(defaultValue || key);
        }
    }

    // Translate multiple keys at once - returns object with translations
    async translateKeys(keys) {
        try {
            const languageData = await this.loadLanguageData();
            const translations = {};

            for (const key of keys) {
                // Try appStrings first
                let translation = languageData.appStrings[key];
                
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
                    // Try without LBL_ prefix
                    const simpleKey = key.replace('LBL_', '');
                    translation = languageData.appStrings[simpleKey] || languageData.appListStrings[simpleKey];
                    
                    // Try with LBL_LIST_ prefix
                    if (!translation) {
                        const listKey = key.replace('LBL_', 'LBL_LIST_');
                        translation = languageData.appStrings[listKey] || languageData.appListStrings[listKey];
                    }
                }

                // Ensure we always store a string
                translations[key] = String(translation || key);
            }

            return translations;
        } catch (error) {
            console.warn('System translation error for keys:', keys, error);
            // Return fallback object with keys as values
            const fallbackTranslations = {};
            keys.forEach(key => {
                fallbackTranslations[key] = String(key);
            });
            return fallbackTranslations;
        }
    }

    // Get current language
    async getCurrentLanguage() {
        return await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
    }

    // Clear cached language data (useful when language changes)
    clearCache(specificLanguage = null) {
        if (specificLanguage) {
            const cacheKey = `system-${specificLanguage}`;
            delete this.cachedLanguageData[cacheKey];
        } else {
            this.cachedLanguageData = {};
            this.currentLanguage = null;
        }
    }

    // Static method to get singleton instance
    static getInstance() {
        if (!SystemLanguageUtils.instance) {
            SystemLanguageUtils.instance = new SystemLanguageUtils();
        }
        return SystemLanguageUtils.instance;
    }
}

// Export both the class and singleton instance
export { SystemLanguageUtils };
export const systemLanguageUtils = new SystemLanguageUtils();
