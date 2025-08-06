// import * as FileSystem from 'expo-file-system';

// class ReadCacheView {
//     constructor() {
//         this.cacheDir = `${FileSystem.documentDirectory}cache/`;
//     }

//     // Ensure the cache directory exists
//     async ensureCacheDirectoryExists() {
//         try {
//             const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
//             if (!dirInfo.exists) {
//                 await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
//                 console.log(`Created cache directory: ${this.cacheDir}`);
//             }
//         } catch (error) {
//             console.warn('Error creating cache directory:', error);
//         }
//     }

//     // Read data from a cache file
//     async readCacheFile(fileName, module) {
//         try {
//             await this.ensureCacheDirectoryExists();
//             const filePath = `${this.cacheDir}${module}/metadata/${fileName}.json`;
            
//             // Check if file exists first
//             const fileInfo = await FileSystem.getInfoAsync(filePath);
//             if (!fileInfo.exists) {
//                 console.log(`Cache file not found: ${filePath}`);
//                 return null;
//             }
            
//             const fileContent = await FileSystem.readAsStringAsync(filePath);
//             return JSON.parse(fileContent);
//         } catch (error) {
//             console.warn('Error reading from cache file:', error);
//             return null;
//         }
//     }

//     //Read pretty
//     async readCacheFile_Pretty(fileName, module) {
//         try {
//             await this.ensureCacheDirectoryExists();
//             const filePath = `${this.cacheDir}${module}/metadata/${fileName}.json`;
            
//             // Check if file exists first
//             const fileInfo = await FileSystem.getInfoAsync(filePath);
//             if (!fileInfo.exists) {
//                 console.log(`Cache file not found: ${filePath}`);
//                 return null;
//             }
            
//             const fileContent = await FileSystem.readAsStringAsync(filePath);
//             const jsonData = JSON.parse(fileContent);
//             const prettyJson = JSON.stringify(jsonData, null, 2);
//             return prettyJson;
//         } catch (error) {
//             console.warn('Error reading from cache file:', error);
//             return null;
//         }
//     }
// }

// export const readCacheView = new ReadCacheView();

import { cacheManager } from './CacheManager';


const ReadCacheView = {};

ReadCacheView.checkModuleLanguageExists = async (module, language) => {
    try {
        const result = await cacheManager.checkModuleLanguageExists(module, language);
        return result;
    } catch (error) {
        console.error(`❌ Error checking module language for ${module}:`, error);
        throw error;
    }
}


ReadCacheView.checkSystemLanguageExists = async (language) => {
    try {
        const result = await cacheManager.checkSystemLanguageExists(language);
        return result;
    } catch (error) {
        console.error(`❌ Error checking system language for ${language}:`, error);
        throw error;
    }
}

ReadCacheView.getModuleLanguage = async (module, language) => {
    try {
        const result = await cacheManager.getModuleLanguage(module, language);
        if (!result) {
            console.warn(`⚠️ No cached language data found for ${module}/${language}`);
            return null;
        }
        return result;
    } catch (error) {
        console.error(`❌ Error reading module language for ${module}:`, error);
        throw error;
    }
}   

ReadCacheView.getModuleField = async (module, name) => {
    try {
        const result = await cacheManager.getModuleField(module, name);
        if (!result) {
            console.warn(`⚠️ No cached field data found for ${module}/${name}`);
            return null;
        }
        return result;
    } catch (error) {
        console.error(`❌ Error reading module field for ${module}/${name}:`, error);
        throw error;
    }
}

ReadCacheView.getModuleLanguage_Pretty = async (module, language) => {
    try {
        const result = await cacheManager.getModuleLanguage_Pretty(module, language);
        if (!result) {
            console.warn(`⚠️ No cached system language data found for ${language}`);
            return null;
        }
        return result;
    } catch (error) {
        console.error(`❌ Error reading system language for ${language}:`, error);
        throw error;
    }
}

ReadCacheView.getCurrencyData = async () => {
    try {
        const result = await cacheManager.getCurrencyData();
        if (!result) {
            console.warn('⚠️ No cached currency data found');
            return null;
        }
        return result;
    } catch (error) {
        console.error('❌ Error reading currency data:', error);
        throw error;
    }
}
export default ReadCacheView;