import AsyncStorage from '@react-native-async-storage/async-storage';
import timezonesData from '../../assets/timezones.json';

// Cached locale settings
let cachedLocaleConfig = null;
let cachedSelectedLanguage = null;
let cacheInitialized = false;
let cachedTimezone = '';

// Initialize cache on app startup
export const initializeLocaleCache = async () => {
    try {
        const dateFormat = await AsyncStorage.getItem('dateFormat');
        const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'en_us';
        const timezone_store = await AsyncStorage.getItem('timezone') || '';

        const effectiveLocale = dateFormat || selectedLanguage;

        cachedLocaleConfig = effectiveLocale;
        cachedSelectedLanguage = selectedLanguage;
        cachedTimezone = timezone_store;
        cacheInitialized = true;

        console.log('Locale cache initialized:', {
            dateFormat,
            selectedLanguage,
            timezone: timezone_store,
            effectiveLocale
        });
    } catch (error) {
        console.warn('Error initializing locale cache:', error);
        cachedLocaleConfig = null;
        cachedSelectedLanguage = 'en_us';
        cacheInitialized = true;
    }
};

// Update cache when settings change
export const updateLocaleCache = (dateFormat, selectedLanguage, timezone) => {
    cachedLocaleConfig = dateFormat;
    cachedSelectedLanguage = selectedLanguage || 'en_us';
    cachedTimezone = timezone || '';
};

// Parse ISO string to Date object
const parseIsoIgnoreOffset = (isoString) => {
    const regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/;
    const match = isoString.match(regex);
    if (!match) return null;

    const [, year, month, day, hour, minute, second] = match;

    return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        parseInt(hour, 10),
        parseInt(minute, 10),
        parseInt(second, 10)
    );
};

// Parse timezone string format: "VN*Asia/Bangkok*+07:00"
export const parseTimezoneString = (timezoneString) => {
    if (!timezoneString || typeof timezoneString !== 'string') {
        return null;
    }

    const parts = timezoneString.split('*');
    if (parts.length !== 3) {
        return null;
    }

    return {
        code: parts[0],
        name: parts[1],
        utc: parts[2]
    };
};

// parse "YYYY-MM-DD HH:mm:ss" to Date
const parseDateTimeString = (dateTimeStr) => {
    const [datePart, timePart] = dateTimeStr.split(" ");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute, second] = timePart.split(":").map(Number);
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
};

// convert from local + offset -> UTC
export const convertToUTC = (dateTimeStr, offset = "+00:00") => {
    if (!dateTimeStr) return null;

    const date = parseDateTimeString(dateTimeStr);

    // offset like "+07:00" or "-07:00"
    const sign = offset.startsWith("-") ? -1 : 1;
    const [h, m] = offset.slice(1).split(":").map(Number);
    const offsetMinutes = sign * (h * 60 + m);

    // local = UTC + offset => UTC = local - offset
    const utcDate = new Date(date.getTime() - offsetMinutes * 60 * 1000);

    return utcDate.toISOString().slice(0, 19).replace("T", " ");
};

// Get timezone info from cache or fallback to language
const getTimezoneInfo = () => {
    if (cachedTimezone) {
        const parsed = parseTimezoneString(cachedTimezone);
        if (parsed) {
            return {
                utc: parsed.utc,
                localeCode: `${parsed.code.toLowerCase()}_${parsed.code.toUpperCase()}`
            };
        }
    }

    // Fallback to selectedLanguage
    if (cachedSelectedLanguage) {
        for (const country of timezonesData) {
            for (const tz of country.timezones) {
                if (tz.locale_code && tz.locale_code.toLowerCase() === cachedSelectedLanguage.toLowerCase()) {
                    return { utc: tz.utc, localeCode: tz.locale_code };
                }
            }
        }
    }

    return { utc: '+00:00', localeCode: 'en_US' };
};

// Apply timezone offset to date
const applyLocaleOffset = (date) => {
    const timezoneInfo = getTimezoneInfo();
    const offset = timezoneInfo.utc;

    const m = offset.match(/([+-])(\d{2}):(\d{2})/);
    if (!m) return date;

    const sign = m[1] === '+' ? 1 : -1;
    const hours = parseInt(m[2], 10);
    const minutes = parseInt(m[3], 10);
    const totalMs = sign * (hours * 60 + minutes) * 60000;

    return new Date(date.getTime() + totalMs);
};

// Get date format from timezone or language
const getPopularFormatForLocale = (localeCode) => {
    if (cachedTimezone) {
        const parsed = parseTimezoneString(cachedTimezone);
        if (parsed) {
            for (const country of timezonesData) {
                if (country.code === parsed.code) {
                    for (const timezone of country.timezones) {
                        if (timezone.name === parsed.name) {
                            return timezone.popular_format || 'dd/MM/yyyy';
                        }
                    }
                }
            }
        }
    }

    // Fallback to language locale
    if (!localeCode) {
        const timezoneInfo = getTimezoneInfo();
        localeCode = timezoneInfo.localeCode;
    }

    // Find the locale in timezones data
    for (const country of timezonesData) {
        for (const timezone of country.timezones) {
            if (timezone.locale_code && timezone.locale_code.toLowerCase() === localeCode.toLowerCase()) {
                return timezone.popular_format || 'dd/MM/yyyy';
            }
        }
    }

    // Default format by locale
    const lowerLocale = localeCode.toLowerCase();
    if (lowerLocale.startsWith('en_us') || lowerLocale.startsWith('en_ph')) {
        return 'MM/dd/yyyy';
    } else if (lowerLocale.startsWith('ja_') || lowerLocale.startsWith('ko_') || lowerLocale.startsWith('zh_cn')) {
        return 'yyyy/MM/dd';
    } else {
        return 'dd/MM/yyyy';
    }
};

// Date format: dd/MM/yy
export const formatDate_ddMMyyy = (isoString) => {
    const date = parseIsoIgnoreOffset(isoString);
    const adjustedDate = applyLocaleOffset(date);
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const year = String(adjustedDate.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
};

// Date format: dd/MM/yyyy
export const formatDate_ddMMyyyy = (isoString) => {
    const date = parseIsoIgnoreOffset(isoString);
    const adjustedDate = applyLocaleOffset(date);
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const year = adjustedDate.getFullYear();
    return `${day}/${month}/${year}`;
};

// Date format: MM/dd/yy
export const formatDate_MMddyyy = (isoString) => {
    const date = parseIsoIgnoreOffset(isoString);
    const adjustedDate = applyLocaleOffset(date);
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const year = String(adjustedDate.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
};

// DateTime format: MM/dd/yy hh:mm:ss
export const formatDateTime_MMddyyy = (isoString) => {
    const date = parseIsoIgnoreOffset(isoString);
    const adjustedDate = applyLocaleOffset(date);
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const year = String(adjustedDate.getFullYear()).slice(-2);
    const hours = String(adjustedDate.getHours()).padStart(2, '0');
    const minutes = String(adjustedDate.getMinutes()).padStart(2, '0');
    const seconds = String(adjustedDate.getSeconds()).padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
};

// Date format: yyyy/MM/dd
export const formatDate_YYYYmmdd = (isoString) => {
    const date = parseIsoIgnoreOffset(isoString);
    const adjustedDate = applyLocaleOffset(date);
    const year = adjustedDate.getFullYear();
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
};

// DateTime format: dd/MM/yyyy hh:mm:ss
export const formatDateTime_ddMMyyyy = (isoString) => {
    const date = parseIsoIgnoreOffset(isoString);
    const adjustedDate = applyLocaleOffset(date);
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const year = adjustedDate.getFullYear();
    const hours = String(adjustedDate.getHours()).padStart(2, '0');
    const minutes = String(adjustedDate.getMinutes()).padStart(2, '0');
    const seconds = String(adjustedDate.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

// DateTime format: MM/dd/yyyy hh:mm:ss
export const formatDateTime_MMddyyyy = (isoString) => {
    const date = parseIsoIgnoreOffset(isoString);
    const adjustedDate = applyLocaleOffset(date);
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const year = adjustedDate.getFullYear();
    const hours = String(adjustedDate.getHours()).padStart(2, '0');
    const minutes = String(adjustedDate.getMinutes()).padStart(2, '0');
    const seconds = String(adjustedDate.getSeconds()).padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
};

// DateTime format: yyyy/MM/dd hh:mm:ss
export const formatDateTime_YYYYmmdd = (isoString) => {
    const date = parseIsoIgnoreOffset(isoString);
    const adjustedDate = applyLocaleOffset(date);
    const year = adjustedDate.getFullYear();
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const hours = String(adjustedDate.getHours()).padStart(2, '0');
    const minutes = String(adjustedDate.getMinutes()).padStart(2, '0');
    const seconds = String(adjustedDate.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};

// Get effective date format from cache/storage
const getEffectiveDateFormat = async () => {
    if (!cacheInitialized) {
        console.warn('Locale cache not initialized, using default');
        return 'dd/MM/yyyy';
    }

    try {
        const savedDateFormat = await AsyncStorage.getItem('dateFormat');
        if (savedDateFormat) {
            return savedDateFormat;
        }

        const selectedLanguage = cachedSelectedLanguage || 'en_us';
        const popularFormat = getPopularFormatForLocale(selectedLanguage);

        return popularFormat;
    } catch (error) {
        console.warn('Error getting effective date format:', error);
        return 'dd/MM/yyyy';
    }
};

// Format date/datetime by format string
const formatByFormat = (isoString, format, isDateTime = true) => {
    const formatMap = {
        'dd/MM/yyyy': isDateTime ? formatDateTime_ddMMyyyy : formatDate_ddMMyyyy,
        'MM/dd/yyyy': isDateTime ? formatDateTime_MMddyyyy : formatDate_MMddyyy,
        'yyyy/MM/dd': isDateTime ? formatDateTime_YYYYmmdd : formatDate_YYYYmmdd,
        'dd/MM/yy': isDateTime ? formatDateTime_ddMMyyyy : formatDate_ddMMyyy,
        'MM/dd/yy': isDateTime ? formatDateTime_MMddyyy : formatDate_MMddyyy,
    };

    const formatter = formatMap[format] || (isDateTime ? formatDateTime_ddMMyyyy : formatDate_ddMMyyyy);
    return formatter(isoString);
};

// Format datetime with user preferences (async)
export const formatDateTimeBySelectedLanguageAsync = async (isoString) => {
    if (!isoString || typeof isoString !== 'string') {
        throw new Error('Valid ISO string is required');
    }

    const format = await getEffectiveDateFormat();
    return formatByFormat(isoString, format, true);
};

// Format date with user preferences (async)
export const formatDateBySelectedLanguageAsync = async (isoString) => {
    if (!isoString || typeof isoString !== 'string') {
        throw new Error('Valid ISO string is required');
    }

    const format = await getEffectiveDateFormat();
    return formatByFormat(isoString, format, false);
};

// Format datetime with cached values (sync)
export const formatDateTimeBySelectedLanguage = (isoString) => {
    if (!isoString || typeof isoString !== 'string') {
        throw new Error('Valid ISO string is required');
    }

    if (!cacheInitialized) {
        console.warn('Locale cache not initialized, using default format');
        return formatDateTime_ddMMyyyy(isoString);
    }

    let format = cachedLocaleConfig;
    if (!format || format === cachedSelectedLanguage || format === cachedTimezone) {
        format = getPopularFormatForLocale();
    }

    return formatByFormat(isoString, format, true);
};

// Format date with cached values (sync)
export const formatDateBySelectedLanguage = (isoString) => {
    if (!isoString || typeof isoString !== 'string') {
        throw new Error('Valid ISO string is required');
    }

    if (!cacheInitialized) {
        console.warn('Locale cache not initialized, using default format');
        return formatDate_ddMMyyyy(isoString);
    }

    let format = cachedLocaleConfig;
    if (!format || format === cachedSelectedLanguage || format === cachedTimezone) {
        format = getPopularFormatForLocale();
    }

    return formatByFormat(isoString, format, false);
};

// Get available date format options
export const getAvailableDateFormats = () => {
    return [
        { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY' },
        { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY' },
        { value: 'yyyy/MM/dd', label: 'YYYY/MM/DD' }
    ];
};

// Get popular format for current locale
export const getPopularFormatForCurrentLocale = async () => {
    const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'en_us';
    return getPopularFormatForLocale(selectedLanguage);
};

// Test formatting with sample data
export const testFormatting = (isoString = '2025-09-10T07:00:00+02:00') => {
    console.log('Testing FormatDateTime_Zones with:', isoString);
    console.log('formatDate_ddMMyyy:', formatDate_ddMMyyy(isoString));
    console.log('formatDate_ddMMyyyy:', formatDate_ddMMyyyy(isoString));
    console.log('formatDate_MMddyyy:', formatDate_MMddyyy(isoString));
    console.log('formatDateTime_MMddyyy:', formatDateTime_MMddyyy(isoString));
    console.log('formatDate_YYYYmmdd:', formatDate_YYYYmmdd(isoString));
    console.log('formatDateTime_ddMMyyyy:', formatDateTime_ddMMyyyy(isoString));
    console.log('formatDateTime_MMddyyyy:', formatDateTime_MMddyyyy(isoString));
    console.log('formatDateTime_YYYYmmdd:', formatDateTime_YYYYmmdd(isoString));
};
