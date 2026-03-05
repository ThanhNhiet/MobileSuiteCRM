import * as FileSystem from 'expo-file-system';
import { AppTheme } from '../../../configs/ThemeConfig';

class ReadCacheTheme {
    constructor() {
        this.cacheDir = `${FileSystem.documentDirectory}cache/`;
        this.themeFilePath = `${this.cacheDir}themeColorMobile.json`;
        
        // Default fallback colors from ThemeConfig
        this.defaultColors = AppTheme.colors;
    }

    // Check if theme cache file exists
    async themeFileExists() {
        try {
            const fileInfo = await FileSystem.getInfoAsync(this.themeFilePath);
            return fileInfo.exists;
        } catch (error) {
            console.warn('Error checking theme file exists:', error);
            return false;
        }
    }

    // Validate color value (basic hex color validation)
    isValidColor(value) {
        if (!value || typeof value !== 'string') {
            return false;
        }
        
        // Check if it's a valid hex color (with or without alpha)
        // Matches: #RGB, #RRGGBB, #RRGGBBAA
        const hexColorRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
        return hexColorRegex.test(value);
    }

    // Read and validate theme colors from cache
    async readThemeColors() {
        try {
            const cacheExists = await this.themeFileExists();
            
            if (!cacheExists) {
                console.log('No theme cache found, using default theme colors');
                return this.defaultColors;
            }

            // Read cache file
            const content = await FileSystem.readAsStringAsync(this.themeFilePath);
            const cachedTheme = JSON.parse(content);

            // Validate and merge with defaults
            const validatedTheme = this.validateAndMergeTheme(cachedTheme);
            return validatedTheme;
        } catch (error) {
            console.error('Error reading theme colors from cache:', error);
            return this.defaultColors;
        }
    }

    // Validate cached theme and fallback to defaults for invalid values
    validateAndMergeTheme(cachedTheme) {
        const validatedTheme = {};
        
        // Get all keys from default theme
        const themeKeys = Object.keys(this.defaultColors);
        
        let fallbackCount = 0;
        
        themeKeys.forEach(key => {
            // Check if key exists in cached theme and has valid value
            if (cachedTheme && 
                cachedTheme.hasOwnProperty(key) && 
                this.isValidColor(cachedTheme[key])) {
                // Use cached value
                validatedTheme[key] = cachedTheme[key];
            } else {
                // Fallback to default value
                validatedTheme[key] = this.defaultColors[key];
                fallbackCount++;
                
                if (cachedTheme && !cachedTheme.hasOwnProperty(key)) {
                    console.warn(`Key "${key}" missing in cache, using default: ${this.defaultColors[key]}`);
                } else if (cachedTheme && !this.isValidColor(cachedTheme[key])) {
                    console.warn(`Invalid color for "${key}": ${cachedTheme[key]}, using default: ${this.defaultColors[key]}`);
                }
            }
        });

        if (fallbackCount > 0) {
            console.log(`${fallbackCount} color(s) fell back to defaults`);
        } else {
            console.log('All cached colors are valid');
        }

        return validatedTheme;
    }

    // Get a specific color from cache or default
    async getThemeColor(colorKey) {
        try {
            const theme = await this.readThemeColors();
            
            if (theme && theme.hasOwnProperty(colorKey)) {
                return theme[colorKey];
            }
            
            console.warn(`Color key "${colorKey}" not found, using default`);
            return this.defaultColors[colorKey] || '#000000'; // Ultimate fallback
        } catch (error) {
            console.error(`Error getting theme color for "${colorKey}":`, error);
            return this.defaultColors[colorKey] || '#000000';
        }
    }

    // Check if cache is valid
    async isCacheValid() {
        try {
            const cacheExists = await this.themeFileExists();
            
            if (!cacheExists) {
                return false;
            }

            const content = await FileSystem.readAsStringAsync(this.themeFilePath);
            const cachedTheme = JSON.parse(content);

            // Check if cache has data
            if (!cachedTheme || Object.keys(cachedTheme).length === 0) {
                console.warn('Cache is empty');
                return false;
            }

            // Check if all required keys exist
            const themeKeys = Object.keys(this.defaultColors);
            const cachedKeys = Object.keys(cachedTheme);
            
            const missingKeys = themeKeys.filter(key => !cachedKeys.includes(key));
            
            if (missingKeys.length > 0) {
                console.warn(`Cache is missing ${missingKeys.length} key(s):`, missingKeys);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error validating cache:', error);
            return false;
        }
    }
}

// Export singleton instance
export const readCacheTheme = new ReadCacheTheme();
export default readCacheTheme;