import * as FileSystem from 'expo-file-system';

class ReadCacheView {
    constructor() {
        this.cacheDir = `${FileSystem.documentDirectory}cache/`;
    }

    // Ensure the cache directory exists
    async ensureCacheDirectoryExists() {
        try {
            const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
                console.log(`Created cache directory: ${this.cacheDir}`);
            }
        } catch (error) {
            console.warn('Error creating cache directory:', error);
        }
    }

    // Read data from a cache file
    async readCacheFile(fileName, module) {
        try {
            await this.ensureCacheDirectoryExists();
            const filePath = `${this.cacheDir}${module}/metadata/${fileName}.json`;
            
            // Check if file exists first
            const fileInfo = await FileSystem.getInfoAsync(filePath);
            if (!fileInfo.exists) {
                console.log(`Cache file not found: ${filePath}`);
                return null;
            }
            
            const fileContent = await FileSystem.readAsStringAsync(filePath);
            return JSON.parse(fileContent);
        } catch (error) {
            console.warn('Error reading from cache file:', error);
            return null;
        }
    }

    //Read pretty
    async readCacheFile_Pretty(fileName, module) {
        try {
            await this.ensureCacheDirectoryExists();
            const filePath = `${this.cacheDir}${module}/metadata/${fileName}.json`;
            
            // Check if file exists first
            const fileInfo = await FileSystem.getInfoAsync(filePath);
            if (!fileInfo.exists) {
                console.log(`Cache file not found: ${filePath}`);
                return null;
            }
            
            const fileContent = await FileSystem.readAsStringAsync(filePath);
            const jsonData = JSON.parse(fileContent);
            const prettyJson = JSON.stringify(jsonData, null, 2);
            return prettyJson;
        } catch (error) {
            console.warn('Error reading from cache file:', error);
            return null;
        }
    }
}

export const readCacheView = new ReadCacheView();