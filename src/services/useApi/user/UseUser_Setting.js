import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';
import ModulesConfig from '../../../configs/ModulesConfig';
import RolesConfig from '../../../configs/RolesConfig';
import { cacheManager } from '../../../utils/cacheViewManagement/CacheManager';
import { SystemLanguageUtils } from '../../../utils/cacheViewManagement/SystemLanguageUtils';
import WriteCacheView from '../../../utils/cacheViewManagement/WriteCacheView';
import { initializeLocaleCache, updateLocaleCache } from '../../../utils/format/FormatDateTime';
import {
    getActiveCurrenciesNameApi,
    getDetailCurrenciesApi,
    getLanguageApi,
    getSystemLanguageApi
} from '../../api/user/UserApi';

export const useUserSetting = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currencies, setCurrencies] = useState([]);
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [dateFormat, setDateFormat] = useState('dd/MM/yyyy');
    const [thousandsSeparator, setThousandsSeparator] = useState(',');
    const [decimalSymbol, setDecimalSymbol] = useState('.');
    const [translations, setTranslations] = useState({});
    
    // Modal states
    const [showDateFormatModal, setShowDateFormatModal] = useState(false);
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);

    const systemLanguageUtils = SystemLanguageUtils.getInstance();

    // Get accessible modules dynamically from API and user permissions
    const getAccessibleModules = async () => {
        try {
            const rolesConfig = RolesConfig.getInstance();
            const modulesConfig = ModulesConfig.getInstance();
            
            // Load user roles and modules if not already loaded
            await Promise.all([
                rolesConfig.loadUserRoles(),
                modulesConfig.loadModules()
            ]);
            
            const allModules = modulesConfig.getFilteredModules();
            const accessibleModules = [];
            
            // Filter modules by user permissions
            for (const [moduleName] of Object.entries(allModules)) {
                if (rolesConfig.hasModuleAccess(moduleName)) {
                    accessibleModules.push(moduleName);
                }
            }
            
            // Always include special modules that don't follow standard patterns
            const specialModules = ['Users', 'Alerts', 'Calendar'];
            for (const specialModule of specialModules) {
                if (!accessibleModules.includes(specialModule)) {
                    accessibleModules.push(specialModule);
                }
            }
            
            console.log('Accessible modules for cache refresh:', accessibleModules);
            return accessibleModules;
        } catch (error) {
            console.warn('Error getting accessible modules, using fallback:', error);
            // Fallback to essential modules if API fails
            return ['Accounts', 'Meetings', 'Notes', 'Tasks', 'Users', 'Calendar', 'Alerts'];
        }
    };

    // Date format options
    const dateFormatOptions = [
        { value: 'dd/MM/yyyy', label: 'dd/MM/yyyy', example: '25/12/2024' },
        { value: 'MM/dd/yyyy', label: 'MM/dd/yyyy', example: '12/25/2024' },
        { value: 'yyyy-MM-dd', label: 'yyyy-MM-dd', example: '2024-12-25' }
    ];

    // Load translations
    useEffect(() => {
        const loadTranslations = async () => {
            try {
                const [
                    selectButton,
                    type,
                    time,
                    currency,
                    thousandsSep,
                    decimalSym,
                    example,
                    update,
                    language,
                    field
                ] = await Promise.all([
                    systemLanguageUtils.translate('LBL_SELECT_BUTTON_LABEL'),
                    systemLanguageUtils.translate('Type'),
                    systemLanguageUtils.translate('MSG_JS_ALERT_MTG_REMINDER_TIME'),
                    systemLanguageUtils.translate('LBL_CURRENCY'),
                    systemLanguageUtils.translate('LBL_1000S_SEPARATOR'),
                    systemLanguageUtils.translate('LBL_DECIMAL_SYMBOL'),
                    systemLanguageUtils.translate('LBL_EXAMPLE'),
                    systemLanguageUtils.translate('LBL_UPDATE', 'Update'),
                    systemLanguageUtils.translate('LBL_LANGUAGE', 'Language'),
                    systemLanguageUtils.translate('LBL_FIELD', 'Fields')
                ]);

                setTranslations({
                    selectButton,
                    type,
                    time,
                    currency,
                    thousandsSep,
                    decimalSym,
                    example,
                    update,
                    language,
                    field
                });
            } catch (error) {
                console.warn('Error loading translations:', error);
                // Set fallback translations
                // setTranslations({
                //     selectButton: 'chọn',
                //     type: 'Loại',
                //     time: 'Thời gian',
                //     currency: 'Tiền tệ',
                //     thousandsSep: 'ký tự ngăn cách hàng nghìn',
                //     decimalSym: 'Ký tự thập phân',
                //     example: 'ví dụ',
                //     update: 'Update',
                //     language: 'Language',
                //     field: 'Fields'
                // });
            }
        };

        loadTranslations();
    }, []);

    // Load settings from storage
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedDateFormat = await AsyncStorage.getItem('dateFormat');
                const savedThousandsSeparator = await AsyncStorage.getItem('thousandsSeparator');
                const savedDecimalSymbol = await AsyncStorage.getItem('decimalSymbol');
                const savedCurrency = await AsyncStorage.getItem('selectedCurrency');

                if (savedDateFormat) setDateFormat(savedDateFormat);
                if (savedThousandsSeparator) setThousandsSeparator(savedThousandsSeparator);
                if (savedDecimalSymbol) setDecimalSymbol(savedDecimalSymbol);
                if (savedCurrency) setSelectedCurrency(JSON.parse(savedCurrency));
            } catch (error) {
                console.warn('Error loading settings:', error);
            }
        };

        loadSettings();
    }, []);

    // Load currencies
    const loadCurrencies = async () => {
        try {
            setLoading(true);
            
            // Get currency names first
            const currencyNamesResponse = await getActiveCurrenciesNameApi();
            
            // Get detailed currency data
            const detailCurrenciesResponse = await getDetailCurrenciesApi();
            
            let currencyList = [];
            
            // Add default USD option (since it's the base currency for conversion_rate)
            const usdOption = {
                id: 'usd-default',
                type: 'Currencies',
                attributes: {
                    name: 'US Dollar',
                    iso4217: 'USD',
                    symbol: '$',
                    status: 'Active',
                    conversion_rate: '1.000000', // Base currency
                    deleted: '0'
                }
            };
            currencyList.push(usdOption);
            
            if (detailCurrenciesResponse && detailCurrenciesResponse.data) {
                // Add other currencies from API
                currencyList = [...currencyList, ...detailCurrenciesResponse.data];
                
                setCurrencies(currencyList);
                
                // Save to cache (including USD option)
                const updatedResponse = {
                    ...detailCurrenciesResponse,
                    data: currencyList
                };
                await WriteCacheView.saveCurrencyData(updatedResponse);
                
                // Set default currency if none selected
                if (!selectedCurrency && currencyList.length > 0) {
                    const defaultCurrency = currencyList[0]; // USD will be first
                    setSelectedCurrency(defaultCurrency);
                    await AsyncStorage.setItem('selectedCurrency', JSON.stringify(defaultCurrency));
                }
            } else {
                // If API fails, at least show USD option
                setCurrencies(currencyList);
                if (!selectedCurrency) {
                    setSelectedCurrency(usdOption);
                    await AsyncStorage.setItem('selectedCurrency', JSON.stringify(usdOption));
                }
            }
        } catch (error) {
            console.error('Error loading currencies:', error);
            setError(error.message);
            
            // Fallback to USD only if API completely fails
            const usdFallback = {
                id: 'usd-fallback',
                type: 'Currencies',
                attributes: {
                    name: 'US Dollar',
                    iso4217: 'USD',
                    symbol: '$',
                    status: 'Active',
                    conversion_rate: '1.000000',
                    deleted: '0'
                }
            };
            setCurrencies([usdFallback]);
            if (!selectedCurrency) {
                setSelectedCurrency(usdFallback);
                await AsyncStorage.setItem('selectedCurrency', JSON.stringify(usdFallback));
            }
        } finally {
            setLoading(false);
        }
    };

    // Save date format
    const saveDateFormat = async (format) => {
        try {
            setDateFormat(format);
            await AsyncStorage.setItem('dateFormat', format);
            
            // Update locale cache for FormatDateTime
            await AsyncStorage.setItem('localeConfig', format);
            
            // Update the cached values in FormatDateTime
            const selectedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'en_us';
            updateLocaleCache(format, selectedLanguage);
            
            // Reload cache để các function sync có thể sử dụng ngay lập tức
            await initializeLocaleCache();
            
            setShowDateFormatModal(false);
        } catch (error) {
            console.error('Error saving date format:', error);
        }
    };

    // Save currency
    const saveCurrency = async (currency) => {
        try {
            setSelectedCurrency(currency);
            await AsyncStorage.setItem('selectedCurrency', JSON.stringify(currency));
            setShowCurrencyModal(false);
        } catch (error) {
            console.error('Error saving currency:', error);
        }
    };

    // Save thousands separator
    const saveThousandsSeparator = async (separator) => {
        try {
            setThousandsSeparator(separator);
            await AsyncStorage.setItem('thousandsSeparator', separator);
        } catch (error) {
            console.error('Error saving thousands separator:', error);
        }
    };

    // Save decimal symbol
    const saveDecimalSymbol = async (symbol) => {
        try {
            setDecimalSymbol(symbol);
            await AsyncStorage.setItem('decimalSymbol', symbol);
        } catch (error) {
            console.error('Error saving decimal symbol:', error);
        }
    };

    // Get example currency format
    const getCurrencyExample = () => {
        if (!selectedCurrency) return '1,000.00';
        
        const amount = 1000;
        const symbol = selectedCurrency.attributes?.symbol || '$';
        const formattedAmount = amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        // Replace with custom separators
        let example = formattedAmount
            .replace(/,/g, thousandsSeparator)
            .replace(/\./g, decimalSymbol);
        
        // Add currency symbol based on currency type
        const currencyName = selectedCurrency.attributes?.name?.toLowerCase() || '';
        const iso4217 = selectedCurrency.attributes?.iso4217?.toUpperCase() || '';
        
        // Determine symbol position
        const suffixCurrencies = ['EUR', 'VND', 'dong'];
        const isSymbolSuffix = suffixCurrencies.some(curr => 
            iso4217.includes(curr) || currencyName.includes(curr.toLowerCase())
        );
        
        return isSymbolSuffix ? `${example}${symbol}` : `${symbol}${example}`;
    };

    // Function to refresh language cache (moved from UseUser_Profile)
    const refreshLanguageCache = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem('selectedLanguage') || 'vi_VN';
            const modules = await getAccessibleModules();
            
            // Delete all language cache files
            for (const module of modules) {
                const languageDir = `${FileSystem.documentDirectory}cache/${module}/language/`;
                const languageFilePath = `${languageDir}${savedLanguage}.json`;
                
                try {
                    const fileInfo = await FileSystem.getInfoAsync(languageFilePath);
                    if (fileInfo.exists) {
                        await FileSystem.deleteAsync(languageFilePath);
                        console.log(`Deleted language cache: ${languageFilePath}`);
                    }
                } catch (error) {
                    console.warn(`Error deleting language cache for ${module}:`, error);
                }
            }
            
            // Delete system language cache
            const systemLanguageDir = `${FileSystem.documentDirectory}cache/system/language/`;
            const systemLanguageFilePath = `${systemLanguageDir}${savedLanguage}.json`;
            
            try {
                const fileInfo = await FileSystem.getInfoAsync(systemLanguageFilePath);
                if (fileInfo.exists) {
                    await FileSystem.deleteAsync(systemLanguageFilePath);
                    console.log(`Deleted system language cache: ${systemLanguageFilePath}`);
                }
            } catch (error) {
                console.warn('Error deleting system language cache:', error);
            }
            
            // Fetch and save new language data
            try {
                // Fetch and cache system language
                const systemLangData = await getSystemLanguageApi(savedLanguage);
                await cacheManager.saveSystemLanguage(savedLanguage, systemLangData);
                console.log(`Refreshed system language: ${savedLanguage}`);
            } catch (error) {
                console.warn('Error refreshing system language:', error);
            }
            
            // Fetch and cache language for each accessible module
            for (const module of modules) {
                try {
                    const languageData = await getLanguageApi(module, savedLanguage);
                    await cacheManager.saveModuleLanguage(module, savedLanguage, languageData);
                    console.log(`Refreshed language for module: ${module} (${savedLanguage})`);
                } catch (error) {
                    console.warn(`Error refreshing language for module ${module}:`, error);
                }
            }
            
            return true;
        } catch (error) {
            console.warn('Error refreshing language cache:', error);
            throw error;
        }
    };

    // Function to refresh field metadata cache (moved from UseUser_Profile)
    const refreshFieldsCache = async () => {
        try {
            const modules = await getAccessibleModules();
            
            // Delete all field metadata cache files
            for (const module of modules) {
                const metadataDir = `${FileSystem.documentDirectory}cache/${module}/metadata/`;
                const fieldFiles = ['listviewdefs.json', 'detailviewdefs.json', 'editviewdefs.json', 'requiredfields.json'];
                
                for (const fileName of fieldFiles) {
                    const filePath = `${metadataDir}${fileName}`;
                    try {
                        const fileInfo = await FileSystem.getInfoAsync(filePath);
                        if (fileInfo.exists) {
                            await FileSystem.deleteAsync(filePath);
                            console.log(`Deleted field cache: ${filePath}`);
                        }
                    } catch (error) {
                        console.warn(`Error deleting field cache ${fileName} for ${module}:`, error);
                    }
                }
            }
            
            console.log('Field metadata cache cleared successfully. Cache will be refreshed automatically when navigating to modules.');
            return true;
        } catch (error) {
            console.warn('Error refreshing fields cache:', error);
            throw error;
        }
    };

    // Handle refresh language button
    const handleRefreshLanguage = async () => {
        try {
            setLoading(true);
            await refreshLanguageCache();
            // Reload translations after cache refresh
            const loadTranslations = async () => {
                try {
                    const [
                        selectButton,
                        type,
                        time,
                        currency,
                        thousandsSep,
                        decimalSym,
                        example,
                        update,
                        language,
                        field
                    ] = await Promise.all([
                        systemLanguageUtils.translate('LBL_SELECT_BUTTON_LABEL', 'chọn'),
                        systemLanguageUtils.translate('Type', 'Loại'),
                        systemLanguageUtils.translate('MSG_JS_ALERT_MTG_REMINDER_TIME', 'Thời gian'),
                        systemLanguageUtils.translate('LBL_CURRENCY', 'Tiền tệ'),
                        systemLanguageUtils.translate('LBL_1000S_SEPARATOR', 'ký tự ngăn cách hàng nghìn'),
                        systemLanguageUtils.translate('LBL_DECIMAL_SYMBOL', 'Ký tự thập phân'),
                        systemLanguageUtils.translate('LBL_EXAMPLE', 'ví dụ'),
                        systemLanguageUtils.translate('LBL_UPDATE', 'Update'),
                        systemLanguageUtils.translate('LBL_LANGUAGE', 'Language'),
                        systemLanguageUtils.translate('LBL_FIELD', 'Fields')
                    ]);

                    setTranslations({
                        selectButton,
                        type,
                        time,
                        currency,
                        thousandsSep,
                        decimalSym,
                        example,
                        update,
                        language,
                        field
                    });
                } catch (error) {
                    console.warn('Error reloading translations:', error);
                }
            };
            await loadTranslations();
        } catch (error) {
            setError('Error refreshing language cache');
            console.error('Error in handleRefreshLanguage:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle refresh fields button
    const handleRefreshFields = async () => {
        try {
            setLoading(true);
            await refreshFieldsCache();
        } catch (error) {
            setError('Error refreshing fields cache');
            console.error('Error in handleRefreshFields:', error);
        } finally {
            setLoading(false);
        }
    };

    return {
        // State
        loading,
        error,
        currencies,
        selectedCurrency,
        dateFormat,
        thousandsSeparator,
        decimalSymbol,
        translations,
        showDateFormatModal,
        showCurrencyModal,
        dateFormatOptions,
        
        // Actions
        loadCurrencies,
        saveDateFormat,
        saveCurrency,
        saveThousandsSeparator,
        saveDecimalSymbol,
        getCurrencyExample,
        setShowDateFormatModal,
        setShowCurrencyModal,
        handleRefreshLanguage,
        handleRefreshFields,
        refreshLanguageCache,
        refreshFieldsCache
    };
};
