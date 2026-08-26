import * as FileSystem from 'expo-file-system';
import { getThemeColorApi } from '../../../services/api/external/ExternalApi';

class WriteCacheTheme {
    constructor() {
        this.cacheDir = `${FileSystem.documentDirectory}cache/`;
        this.themeFilePath = `${this.cacheDir}themeColorMobile.json`;
    }

    // Ensure cache directory exists
    async ensureCacheDirectoryExists() {
        try {
            const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
                console.log(`Created cache directory: ${this.cacheDir}`);
            }
        } catch (error) {
            console.warn('Error creating cache directory:', error);
            throw error;
        }
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

    // Save theme colors to cache
    async saveThemeColors(themeData) {
        try {
            await this.ensureCacheDirectoryExists();
            
            // Validate theme data
            if (!themeData || typeof themeData !== 'object') {
                console.warn('Invalid theme data provided');
                return false;
            }

            await FileSystem.writeAsStringAsync(
                this.themeFilePath, 
                JSON.stringify(themeData, null, 2)
            );
            
            console.log(`Theme colors saved to cache: ${this.themeFilePath}`);
            return true;
        } catch (error) {
            console.warn('Error saving theme colors to cache:', error);
            return false;
        }
    }

    // Load theme colors with cache-first strategy
    async loadThemeColors() {
        try {
            // Check if cache exists
            const cacheExists = await this.themeFileExists();
            
            if (cacheExists) {
                const content = await FileSystem.readAsStringAsync(this.themeFilePath);
                const cachedTheme = JSON.parse(content);
                
                // Validate cached data is not empty
                if (cachedTheme && Object.keys(cachedTheme).length > 0) {
                    return cachedTheme;
                } else {
                    console.warn('Cached theme is empty, fetching from API...');
                }
            } else {
                console.log('No theme cache found, fetching from API...');
            }

            // Fetch from API if cache doesn't exist or is invalid
            const apiThemeData = await getThemeColorApi();
            
            if (apiThemeData && typeof apiThemeData === 'object') {
                // Save to cache for future use
                await this.saveThemeColors(apiThemeData);
                return apiThemeData;
            } else {
                console.warn('Invalid API response for theme colors');
                return null;
            }
        } catch (error) {
            console.error('Error loading theme colors:', error);
            return null;
        }
    }

    // Force refresh theme from API (bypass cache)
    async refreshThemeColors() {
        try {
            const apiThemeData = await getThemeColorApi();
            
            if (apiThemeData && typeof apiThemeData === 'object') {
                await this.saveThemeColors(apiThemeData);
                return apiThemeData;
            } else {
                console.warn('Invalid API response for theme colors');
                return null;
            }
        } catch (error) {
            console.error('Error refreshing theme colors:', error);
            return null;
        }
    }

    // Clear theme cache
    async clearThemeCache() {
        try {
            const exists = await this.themeFileExists();
            if (exists) {
                await FileSystem.deleteAsync(this.themeFilePath);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error clearing theme cache:', error);
            return false;
        }
    }
}

// Export singleton instance
export const writeCacheTheme = new WriteCacheTheme();
export default writeCacheTheme;