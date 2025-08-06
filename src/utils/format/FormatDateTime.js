/* 
    dd/MM/yyyy hh:mm:ss format
*/
export const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

/*
    dd/MM/yyyy format
*/
export const formatDate = (isoString) => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

/* 
     MM/dd/yyyy hh:mm:ss format
*/
export const formatDateTime_mmddyyy = (isoString) => {
    const date = new Date(isoString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
};

/*
    MM/dd/yyyy format
*/
export const formatDate_mmddyyy = (isoString) => {
    const date = new Date(isoString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
};

/*
    yyyy-MM-dd format
*/
export const formatDate_yyyymmdd = (isoString) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/*
    yyyy-MM-dd hh:mm:ss format
*/
export const formatDateTime_yyyymmdd = (isoString) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};


/*
    Use format depending on selectedLanguage (locale code)
*/
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache for locale settings to avoid repeated AsyncStorage calls
let cachedLocaleConfig = null;
let cachedSelectedLanguage = null;
let cacheInitialized = false;

// Initialize cache (call this once during app startup)
export const initializeLocaleCache = async () => {
    try {
        const localeConfig = await AsyncStorage.getItem('localeConfig');
        const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'en_us';
        
        cachedLocaleConfig = localeConfig;
        cachedSelectedLanguage = selectedLanguage;
        cacheInitialized = true;
        
        console.log('Locale cache initialized:', { localeConfig, selectedLanguage });
    } catch (error) {
        console.warn('Error initializing locale cache:', error);
        // Set defaults
        cachedLocaleConfig = null;
        cachedSelectedLanguage = 'en_us';
        cacheInitialized = true;
    }
};

// Update cache when locale changes (call this when user changes settings)
export const updateLocaleCache = (localeConfig, selectedLanguage) => {
    cachedLocaleConfig = localeConfig;
    cachedSelectedLanguage = selectedLanguage || 'en_us';
    console.log('Locale cache updated:', { localeConfig, selectedLanguage });
};

// Helper function to get the effective locale
const getEffectiveLocale = () => {
    if (!cacheInitialized) {
        console.warn('Locale cache not initialized, using default');
        return 'en_us';
    }
    
    // Use localeConfig if available, otherwise use selectedLanguage
    const locale = cachedLocaleConfig || cachedSelectedLanguage || 'en_us';
    return locale.toLowerCase();
};

// Helper function to format based on locale
const formatByLocale = (isoString, locale, isDateTime = true) => {
    const formatters = {
        'vi_vn': isDateTime ? formatDateTime : formatDate,
        'en_us': isDateTime ? formatDateTime_mmddyyy : formatDate_mmddyyy,
        'en_gb': isDateTime ? formatDateTime : formatDate,
        'fr_fr': isDateTime ? formatDateTime : formatDate,
        'de_de': isDateTime ? formatDateTime : formatDate
    };
    
    const formatter = formatters[locale] || (isDateTime ? formatDateTime : formatDate);
    return formatter(isoString);
};

// Non-async version using cached locale
export const formatDateTimeBySelectedLanguage = (isoString) => {
    if (!isoString) {
        throw new Error('ISO string is required');
    }
    if (typeof isoString !== 'string') {
        throw new Error('ISO string must be a string');
    }

    const locale = getEffectiveLocale();
    return formatByLocale(isoString, locale, true);
};

export const formatDateBySelectedLanguage = (isoString) => {
    if (!isoString) {
        throw new Error('ISO string is required');
    }
    if (typeof isoString !== 'string') {
        throw new Error('ISO string must be a string');
    }

    const locale = getEffectiveLocale();
    return formatByLocale(isoString, locale, false);
};

// Async versions (kept for backward compatibility)
export const formatDateTimeBySelectedLanguageAsync = async (isoString) => {
    if (!isoString) {
        throw new Error('ISO string is required');
    }
    if (typeof isoString !== 'string') {
        throw new Error('ISO string must be a string');
    }

    const localeConfig = await AsyncStorage.getItem('localeConfig');
    const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'en_us';
    
    // Use localeConfig if available, otherwise use selectedLanguage
    const locale = (localeConfig || selectedLanguage).toLowerCase();
    return formatByLocale(isoString, locale, true);
};

export const formatDateBySelectedLanguageAsync = async (isoString) => {
    if (!isoString) {
        throw new Error('ISO string is required');
    }
    if (typeof isoString !== 'string') {
        throw new Error('ISO string must be a string');
    }

    const localeConfig = await AsyncStorage.getItem('localeConfig');
    const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'en_us';
    
    // Use localeConfig if available, otherwise use selectedLanguage
    const locale = (localeConfig || selectedLanguage).toLowerCase();
    return formatByLocale(isoString, locale, false);
};