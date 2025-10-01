// Function to determine symbol position based on currency name or ISO code
const getSymbolPosition = (currencyData) => {
    const name = currencyData?.name?.toLowerCase() || '';
    const iso4217 = currencyData?.iso4217?.toUpperCase() || '';
    
    // Define prefix currencies (symbol before amount)
    const prefixCurrencies = {
        // ISO codes
        'USD': true, 'GBP': true, 'CAD': true, 'AUD': true, 'NZD': true, 
        'INR': true, 'CNY': true, 'JPY': true, 'KRW': true, 'HKD': true, 
        'SGD': true, 'PHP': true, 'MXN': true,
        // Common names
        'dollar': true, 'dollars': true, 'pound': true, 'pounds': true,
        'yuan': true, 'yen': true, 'won': true, 'rupee': true, 'rupees': true,
        'peso': true, 'pesos': true
    };
    
    // Define suffix currencies (symbol after amount)  
    const suffixCurrencies = {
        // ISO codes
        'EUR': true, 'SEK': true, 'PLN': true, 'HUF': true, 'CZK': true, 
        'ILS': true, 'VND': true,
        // Common names
        'euro': true, 'euros': true, 'krona': true, 'kronor': true,
        'zloty': true, 'forint': true, 'koruna': true, 'shekel': true,
        'dong': true, 'dong vietnam': true, 'vietnamese dong': true
    };
    
    // Check by name first (priority)
    if (prefixCurrencies[name]) {
        return 'prefix';
    }
    if (suffixCurrencies[name]) {
        return 'suffix';
    }
    
    // Check by ISO code if name doesn't match
    if (prefixCurrencies[iso4217]) {
        return 'prefix';
    }
    if (suffixCurrencies[iso4217]) {
        return 'suffix';
    }
    
    // Default to prefix if unknown
    return 'prefix';
};

// Default currency format function
// Currency formatting function with position and custom separators support
const formatCurrencyWithPosition = (amount, symbol = '$', position = 'prefix', thousandsSeparator = ',', decimalSymbol = '.') => {
    if (typeof amount !== 'number') {
        throw new Error('Amount must be a number');
    }
    if (typeof symbol !== 'string') {
        throw new Error('Currency symbol must be a string');
    }

    // Format the amount to two decimal places with standard separators first
    const standardFormatted = amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Replace with custom separators
    const customFormatted = standardFormatted
        .replace(/,/g, thousandsSeparator)
        .replace(/\./g, decimalSymbol);

    // Return the formatted currency string based on position
    if (position === 'suffix') {
        return `${customFormatted}${symbol}`;
    } else {
        return `${symbol}${customFormatted}`;
    }
};

// Default currency format function (kept for backward compatibility)
const formatCurrency_USD = (amount, symbol = '$') => {
    return formatCurrencyWithPosition(amount, symbol, 'prefix');
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import ReadCacheView from '../cacheViewManagement/ReadCacheView';

// Function to convert currency using conversion_rate (base is USD)
const convertCurrency = (amount, conversionRate) => {
    if (!conversionRate || conversionRate === 0) {
        return amount;
    }
    return amount * conversionRate;
};

export const formatCurrency = async (amount, shouldConvert = false) => {
    try {
        const [cachedCurrency, thousandsSeparator, decimalSymbol] = await Promise.all([
            ReadCacheView.getCurrencyData(),
            AsyncStorage.getItem('thousandsSeparator'),
            AsyncStorage.getItem('decimalSymbol')
        ]);
        
        // Get custom separators or use defaults
        const customThousandsSeparator = thousandsSeparator || ',';
        const customDecimalSymbol = decimalSymbol || '.';
        
        // If no cached currency data, fallback to USD format
        if (!cachedCurrency || !cachedCurrency.data || !Array.isArray(cachedCurrency.data) || cachedCurrency.data.length === 0) {
            return formatCurrencyWithPosition(amount, '$', 'prefix', customThousandsSeparator, customDecimalSymbol);
        }
        
        // Get the selected currency from AsyncStorage or use the first active currency
        let selectedCurrency;
        try {
            const savedCurrency = await AsyncStorage.getItem('selectedCurrency');
            if (savedCurrency) {
                selectedCurrency = JSON.parse(savedCurrency);
            }
        } catch (error) {
            console.warn('Error getting selected currency:', error);
        }
        
        // If no selected currency, get the first active currency from cache
        if (!selectedCurrency) {
            selectedCurrency = cachedCurrency.data.find(currency => 
                currency.attributes && 
                currency.attributes.status === 'Active' && 
                currency.attributes.deleted !== '1'
            );
        }
        
        if (!selectedCurrency || !selectedCurrency.attributes) {
            return formatCurrencyWithPosition(amount, '$', 'prefix', customThousandsSeparator, customDecimalSymbol);
        }
        
        const currencyAttributes = selectedCurrency.attributes;
        const symbol = currencyAttributes.symbol || '$';
        const position = getSymbolPosition(currencyAttributes);
        
        // Keep original amount - do not convert currency
        // Only format the display with the selected currency symbol and position
        return formatCurrencyWithPosition(amount, symbol, position, customThousandsSeparator, customDecimalSymbol);
        
    } catch (error) {
        console.warn('Error formatting currency:', error);
        // Fallback to USD format on error
        return formatCurrencyWithPosition(amount, '$', 'prefix', ',', '.');
    }
};

// Export function to format currency without conversion (for display purposes)
export const formatCurrencyWithoutConversion = async (amount) => {
    return await formatCurrency(amount, false);
};
