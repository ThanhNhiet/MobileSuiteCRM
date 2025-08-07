// No external dependencies, no library imports needed

// prefix for iso code 4217: USD, GPB, CAD, AUD, NZD, INR, CNY, JPY, KRW, HKD, SGD, PHP, MXN

// suffix for iso code 4217: EUR, SEK, PLN, HUF, CZK, ILS, VND

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
// Currency formatting function with position support
const formatCurrencyWithPosition = (amount, symbol = '$', position = 'prefix') => {
    if (typeof amount !== 'number') {
        throw new Error('Amount must be a number');
    }
    if (typeof symbol !== 'string') {
        throw new Error('Currency symbol must be a string');
    }

    // Format the amount to two decimal places
    const formattedAmount = amount.toFixed(2);

    // Return the formatted currency string based on position
    if (position === 'suffix') {
        return `${formattedAmount}${symbol}`;
    } else {
        return `${symbol}${formattedAmount}`;
    }
};

// Default currency format function (kept for backward compatibility)
const formatCurrency_USD = (amount, symbol = '$') => {
    return formatCurrencyWithPosition(amount, symbol, 'prefix');
};

import ReadCacheView from '../cacheViewManagement/ReadCacheView';

export const formatCurrency = async (amount) => {
    try {
        const cachedCurrency = await ReadCacheView.getCurrencyData();
        
        // If no cached currency data, fallback to USD format
        if (!cachedCurrency || !cachedCurrency.data || !Array.isArray(cachedCurrency.data) || cachedCurrency.data.length === 0) {
            return formatCurrency_USD(amount);
        }
        
        // Get the first active currency from the cached data
        const activeCurrency = cachedCurrency.data.find(currency => 
            currency.attributes && 
            currency.attributes.status === 'Active' && 
            currency.attributes.deleted !== '1'
        );
        
        if (!activeCurrency || !activeCurrency.attributes) {
            return formatCurrency_USD(amount);
        }
        
        const currencyAttributes = activeCurrency.attributes;
        const symbol = currencyAttributes.symbol || '$';
        const position = getSymbolPosition(currencyAttributes);
        
        return formatCurrencyWithPosition(amount, symbol, position);
        
    } catch (error) {
        console.warn('Error formatting currency:', error);
        // Fallback to USD format on error
        return formatCurrency_USD(amount);
    }
};
