import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

class ModuleLanguageUtils {
    constructor() {
        this.cachedLanguageData = {};
        this.currentLanguage = null;
    }

    async loadLanguageData(moduleName = 'Users', forceReload = false) {
        const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
        const cacheKey = `${moduleName}-${selectedLanguage}`;

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
            const cacheFilePath = `${FileSystem.documentDirectory}cache/${moduleName}/language/${selectedLanguage}.json`;
            
            // Check if cache file exists
            const cacheFileInfo = await FileSystem.getInfoAsync(cacheFilePath);
            if (!cacheFileInfo.exists) {
                console.warn(`${moduleName} language cache file not found: ${cacheFilePath}`);
                return this.getEmptyLanguageData(cacheKey, moduleName);
            }

            // Read cache file
            const cacheFileContent = await FileSystem.readAsStringAsync(cacheFilePath);
            const languageData = JSON.parse(cacheFileContent);

            if (languageData && languageData.data) {
                const result = {
                    appStrings: languageData.data.app_strings || {},
                    appListStrings: languageData.data.app_list_strings || {},
                    modStrings: languageData.data.mod_strings || {}, // Add module strings
                    language: languageData.language || selectedLanguage,
                    meta: languageData.meta || {},
                    fullData: languageData.data, // Keep full data for flexibility
                    moduleName: moduleName // Track which module this is for
                };
                
                // Cache the result
                this.cachedLanguageData[cacheKey] = result;
                console.log(`Successfully loaded ${moduleName} language data from cache for ${selectedLanguage}`);
                return result;
            } else {
                console.warn(`Invalid language data structure in cache file: ${cacheFilePath}`);
                return this.getEmptyLanguageData(cacheKey, moduleName);
            }
        } catch (error) {
            console.warn(`Failed to load ${moduleName} language data from cache:`, error);
            return this.getEmptyLanguageData(cacheKey, moduleName);
        }
    }

    // Helper method to return empty language data structure
    getEmptyLanguageData(cacheKey, moduleName = 'Users') {
        const emptyData = {
            appStrings: {},
            appListStrings: {},
            modStrings: {}, // Add module strings
            language: 'vi_VN',
            meta: {},
            fullData: {},
            moduleName: moduleName // Track which module this is for
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
    async translate(key, defaultValue = null, moduleName = 'Users') {
        try {
            const languageData = await this.loadLanguageData(moduleName);
            
            // Try modStrings first (module strings)
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
            console.warn(`${moduleName} translation error for key:`, key, error);
            return String(defaultValue || key);
        }
    }

    // Translate multiple keys at once - returns object with translations
    async translateKeys(keys, moduleName = 'Users') {
        try {
            const languageData = await this.loadLanguageData(moduleName);
            const translations = {};

            for (const key of keys) {
                // Try modStrings first (module strings)
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
            console.warn(`${moduleName} translation error for keys:`, keys, error);
            // Return fallback object with keys as values
            const fallbackTranslations = {};
            keys.forEach(key => {
                fallbackTranslations[key] = String(key);
            });
            return fallbackTranslations;
        }
    }

    // Translate field name to user-friendly label
    async translateFieldName(fieldName, defaultValue = null, moduleName = 'Users') {
        try {
            // First try direct translation
            let translation = await this.translate(fieldName, null, moduleName);
            if (translation && translation !== fieldName) {
                return translation;
            }

            // Try with LBL_ prefix
            const lblKey = `LBL_${fieldName.toUpperCase()}`;
            translation = await this.translate(lblKey, null, moduleName);
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
                translation = await this.translate(pattern, null, moduleName);
                if (translation && translation !== pattern) {
                    return translation;
                }
            }

            // Return default value or formatted field name
            return defaultValue || this.formatFieldName(fieldName);
        } catch (error) {
            console.warn(`Error translating field name for ${moduleName}:`, fieldName, error);
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

    // Load language data for multiple modules at once
    async loadMultipleModulesLanguageData(moduleNames = ['Users'], forceReload = false) {
        try {
            const results = {};
            const loadPromises = moduleNames.map(async (moduleName) => {
                try {
                    const data = await this.loadLanguageData(moduleName, forceReload);
                    return { moduleName, data, success: true };
                } catch (error) {
                    console.warn(`Failed to load language data for ${moduleName}:`, error);
                    return { moduleName, data: null, success: false, error };
                }
            });

            const loadResults = await Promise.allSettled(loadPromises);
            
            loadResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    const { moduleName, data, success } = result.value;
                    results[moduleName] = { data, success };
                } else {
                    const moduleName = moduleNames[index];
                    results[moduleName] = { 
                        data: null, 
                        success: false, 
                        error: result.reason 
                    };
                }
            });

            return results;
        } catch (error) {
            console.error('Error loading multiple modules language data:', error);
            const errorResults = {};
            moduleNames.forEach(moduleName => {
                errorResults[moduleName] = { data: null, success: false, error };
            });
            return errorResults;
        }
    }

    // Get cached module names
    getCachedModuleNames() {
        const moduleNames = new Set();
        Object.keys(this.cachedLanguageData).forEach(key => {
            const moduleName = key.split('-')[0]; // Extract module name from "ModuleName-language" format
            moduleNames.add(moduleName);
        });
        return Array.from(moduleNames);
    }

    // Clear cached language data (useful when language changes)
    clearCache(specificLanguage = null, specificModule = null) {
        if (specificLanguage && specificModule) {
            // Clear specific module-language combination
            const cacheKey = `${specificModule}-${specificLanguage}`;
            delete this.cachedLanguageData[cacheKey];
        } else if (specificLanguage) {
            // Clear all modules for specific language
            Object.keys(this.cachedLanguageData).forEach(key => {
                if (key.endsWith(`-${specificLanguage}`)) {
                    delete this.cachedLanguageData[key];
                }
            });
        } else if (specificModule) {
            // Clear specific module for all languages
            Object.keys(this.cachedLanguageData).forEach(key => {
                if (key.startsWith(`${specificModule}-`)) {
                    delete this.cachedLanguageData[key];
                }
            });
        } else {
            // Clear all cache
            this.cachedLanguageData = {};
            this.currentLanguage = null;
        }
    }

    // Static method to get singleton instance
    static getInstance() {
        if (!ModuleLanguageUtils.instance) {
            ModuleLanguageUtils.instance = new ModuleLanguageUtils();
        }
        return ModuleLanguageUtils.instance;
    }
}

// Export both the class and singleton instance
export { ModuleLanguageUtils };
export const moduleLanguageUtils = new ModuleLanguageUtils();