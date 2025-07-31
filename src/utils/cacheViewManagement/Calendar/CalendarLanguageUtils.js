import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

class CalendarLanguageUtils {
    constructor() {
        this.cachedLanguageData = {};
        this.currentLanguage = null;
    }

    // Load language data from FileSystem cache files
    async loadLanguageData(forceReload = false) {
        const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
        const cacheKey = `calendar-${selectedLanguage}`;
        
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
            const cacheFilePath = `${FileSystem.documentDirectory}cache/Calendar/language/${selectedLanguage}.json`;
            
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
                    modStrings: languageData.data.mod_strings || {}, // Add mod_strings support
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
            modStrings: {}, // Add mod_strings support
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

    // Translate a single key with enhanced debugging
    async translate(key, defaultValue = null) {
        try {
            const languageData = await this.loadLanguageData();
            
            // Try modStrings first (Calendar module strings)
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

            // If still not found, log a warning for debugging
            if (!translation) {
                console.warn(`[CalendarLanguageUtils] Key not found: ${key}`);
            }

            // Ensure we always return a string
            const result = translation || defaultValue || key;
            return String(result);
        } catch (error) {
            console.warn('System translation error for key:', key, error);
            return String(defaultValue || key);
        }
    }

    // New method: Get array data from app_list_strings (for calendar arrays like dom_cal_month_long)
    async getArrayData(arrayKey, defaultValue = []) {
        try {
            const languageData = await this.loadLanguageData();
            
            // Look for the array key in appListStrings
            const arrayData = languageData.appListStrings[arrayKey];
            
            if (Array.isArray(arrayData)) {
                return arrayData;
            }
            
            console.warn(`Array data not found or not an array for key: ${arrayKey}`);
            return defaultValue;
        } catch (error) {
            console.warn('Error getting array data for key:', arrayKey, error);
            return defaultValue;
        }
    }

    // New method: Get month names from dom_cal_month_long (returns array without first empty element)
    async getMonthNames(useShort = false) {
        try {
            const arrayKey = useShort ? 'dom_cal_month_short' : 'dom_cal_month_long';
            const defaultMonths = useShort ? 
                ['', 'Th. 1', 'Th. 2', 'Th. 3', 'Th. 4', 'Th. 5', 'Th. 6', 'Th. 7', 'Th. 8', 'Th. 9', 'Th. 10', 'Th. 11', 'Th. 12'] :
                ['', 'Tháng một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu', 'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'];
            
            const monthArray = await this.getArrayData(arrayKey, defaultMonths);
            
            // Skip the first empty element (index 0)
            return monthArray.slice(1);
        } catch (error) {
            console.warn('Error getting month names:', error);
            const fallback = useShort ? 
                ['Th. 1', 'Th. 2', 'Th. 3', 'Th. 4', 'Th. 5', 'Th. 6', 'Th. 7', 'Th. 8', 'Th. 9', 'Th. 10', 'Th. 11', 'Th. 12'] :
                ['Tháng một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu', 'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'];
            return fallback;
        }
    }

    // New method: Get day names from dom_cal_day_short (returns array without first empty element)
    async getDayNames(useShort = true) {
        try {
            const arrayKey = useShort ? 'dom_cal_day_short' : 'dom_cal_day_long';
            const defaultDays = useShort ? 
                ['', 'CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] :
                ['', 'Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
            
            const dayArray = await this.getArrayData(arrayKey, defaultDays);
            
            // Skip the first empty element (index 0)
            return dayArray.slice(1);
        } catch (error) {
            console.warn('Error getting day names:', error);
            const fallback = useShort ? 
                ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] :
                ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
            return fallback;
        }
    }

    // Debug method: Get all available keys for debugging
    async getAvailableKeys(searchTerm = '') {
        try {
            const languageData = await this.loadLanguageData();
            const allKeys = {
                modStrings: Object.keys(languageData.modStrings),
                appStrings: Object.keys(languageData.appStrings),
                appListStrings: Object.keys(languageData.appListStrings)
            };
            
            if (searchTerm) {
                const searchUpper = searchTerm.toUpperCase();
                allKeys.modStrings = allKeys.modStrings.filter(key => 
                    key.toUpperCase().includes(searchUpper)
                );
                allKeys.appStrings = allKeys.appStrings.filter(key => 
                    key.toUpperCase().includes(searchUpper)
                );
                allKeys.appListStrings = allKeys.appListStrings.filter(key => 
                    key.toUpperCase().includes(searchUpper)
                );
            }
            
            return allKeys;
        } catch (error) {
            console.warn('Error getting available keys:', error);
            return { modStrings: [], appStrings: [], appListStrings: [] };
        }
    }

    // Debug method: Find similar keys
    async findSimilarKeys(targetKey) {
        try {
            const languageData = await this.loadLanguageData();
            const allModStringKeys = Object.keys(languageData.modStrings);
            const allAppStringKeys = Object.keys(languageData.appStrings);
            const allAppListStringKeys = Object.keys(languageData.appListStrings);
            
            const keywords = targetKey.replace('LBL_', '').split('_');
            const similarKeys = {
                modStrings: [],
                appStrings: [],
                appListStrings: []
            };
            
            // Search in modStrings
            allModStringKeys.forEach(key => {
                const keyUpper = key.toUpperCase();
                if (keywords.some(keyword => keyUpper.includes(keyword.toUpperCase()))) {
                    similarKeys.modStrings.push(key);
                }
            });
            
            // Search in appStrings
            allAppStringKeys.forEach(key => {
                const keyUpper = key.toUpperCase();
                if (keywords.some(keyword => keyUpper.includes(keyword.toUpperCase()))) {
                    similarKeys.appStrings.push(key);
                }
            });
            
            // Search in appListStrings
            allAppListStringKeys.forEach(key => {
                const keyUpper = key.toUpperCase();
                if (keywords.some(keyword => keyUpper.includes(keyword.toUpperCase()))) {
                    similarKeys.appListStrings.push(key);
                }
            });
            
            return similarKeys;
        } catch (error) {
            console.warn('Error finding similar keys:', error);
            return { modStrings: [], appStrings: [], appListStrings: [] };
        }
    }

    // Translate multiple keys at once - returns object with translations
    async translateKeys(keys) {
        try {
            const languageData = await this.loadLanguageData();
            const translations = {};

            for (const key of keys) {
                // Try modStrings first (Calendar module strings)
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
            const cacheKey = `calendar-${specificLanguage}`;
            delete this.cachedLanguageData[cacheKey];
        } else {
            this.cachedLanguageData = {};
            this.currentLanguage = null;
        }
    }

    // Static method to get singleton instance
    static getInstance() {
        if (!CalendarLanguageUtils.instance) {
            CalendarLanguageUtils.instance = new CalendarLanguageUtils();
        }
        return CalendarLanguageUtils.instance;
    }
}

// Export both the class and singleton instance
export default CalendarLanguageUtils;
export { CalendarLanguageUtils };
export const calendarLanguageUtils = new CalendarLanguageUtils();
