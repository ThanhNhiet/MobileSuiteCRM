import AsyncStorage from '@react-native-async-storage/async-storage';

class LanguageUtils {
    constructor() {
        this.cachedLanguageData = null;
        this.currentLanguage = null;
    }

    // Load language data from local JSON files
    async loadLanguageData(moduleName = 'Notes', forceReload = false) {
        const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
        
        // If language changed or force reload, clear cache
        if (this.currentLanguage !== selectedLanguage || forceReload) {
            this.cachedLanguageData = null;
            this.currentLanguage = selectedLanguage;
        }

        // Return cached data if available
        if (this.cachedLanguageData) {
            return this.cachedLanguageData;
        }

        try {
            // Load language data based on module and language
            let languageData = {};
            
            // Use a mapping object for cleaner code
            const languageFiles = {
                'Notes-vi_VN': () => require('../metadata/systemLanguage/Notes/vi_VN.json'),
                // Add more language files as needed:
                // 'Accounts-vi_VN': () => require('../metadata/systemLanguage/Accounts/vi_VN.json'),
                // 'Notes-en_US': () => require('../metadata/systemLanguage/Notes/en_US.json'),
            };
            
            const fileKey = `${moduleName}-${selectedLanguage}`;
            const loadFile = languageFiles[fileKey];
            
            if (loadFile) {
                languageData = loadFile();
            } else {
                console.warn(`No language file found for ${fileKey}`);
            }
            
            if (languageData && Object.keys(languageData).length > 0) {
                this.cachedLanguageData = {
                    modStrings: languageData,
                    appStrings: {}
                };
                
                return this.cachedLanguageData;
            }
        } catch (error) {
            console.warn('Failed to load language data from JSON:', error);
        }

        // Return empty strings if no data available
        console.warn('No language data found, returning empty object');
        return {
            modStrings: {},
            appStrings: {}
        };
    }

    // Translate a single key
    async translate(key, moduleName = 'Notes', defaultValue = null) {
        try {
            const languageData = await this.loadLanguageData(moduleName);
            
            // Try mod_strings first, then app_strings
            let translation = languageData.modStrings[key] || languageData.appStrings[key];
            
            // If not found, try with LBL_LIST_ prefix
            if (!translation && key.startsWith('LBL_')) {
                const listKey = key.replace('LBL_', 'LBL_LIST_');
                translation = languageData.modStrings[listKey] || languageData.appStrings[listKey];
            }

            // Ensure we always return a string
            const result = translation || defaultValue || key;
            return String(result);
        } catch (error) {
            console.warn('Translation error for key:', key, error);
            return String(defaultValue || key);
        }
    }

    // Translate multiple keys at once - returns object with translations
    async translateKeys(keys, moduleName = 'Notes') {
        try {
            const languageData = await this.loadLanguageData(moduleName);
            const translations = {};

            for (const key of keys) {
                // Try mod_strings first, then app_strings
                let translation = languageData.modStrings[key] || languageData.appStrings[key];
                
                // If not found, try with LBL_LIST_ prefix
                if (!translation && key.startsWith('LBL_')) {
                    const listKey = key.replace('LBL_', 'LBL_LIST_');
                    translation = languageData.modStrings[listKey] || languageData.appStrings[listKey];
                }

                // Ensure we always store a string
                translations[key] = String(translation || key);
            }

            return translations;
        } catch (error) {
            console.warn('Translation error for keys:', keys, error);
            // Return fallback object with keys as values
            const fallbackTranslations = {};
            keys.forEach(key => {
                fallbackTranslations[key] = String(key);
            });
            return fallbackTranslations;
        }
    }

    // Clear cached language data (useful when language changes)
    clearCache() {
        this.cachedLanguageData = null;
        this.currentLanguage = null;
    }
}

// Export singleton instance
export const languageUtils = new LanguageUtils();
