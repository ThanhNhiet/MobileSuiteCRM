// import * as FileSystem from 'expo-file-system';

// class WriteCacheView {
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

//     // Write data to a cache file
//     async writeCacheFile(fileName, module, data) {
//         try {
//             await this.ensureCacheDirectoryExists();
            
//             // Ensure module/metadata directory exists
//             const moduleMetadataDir = `${this.cacheDir}${module}/metadata/`;
//             const dirInfo = await FileSystem.getInfoAsync(moduleMetadataDir);
//             if (!dirInfo.exists) {
//                 await FileSystem.makeDirectoryAsync(moduleMetadataDir, { intermediates: true });
//                 console.log(`Created module metadata directory: ${moduleMetadataDir}`);
//             }
            
//             const filePath = `${moduleMetadataDir}${fileName}.json`;
//             await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data, null, 2));
//             console.log(`Data written to cache file: ${filePath}`);
//         } catch (error) {
//             console.warn('Error writing to cache file:', error);
//         }
//     }
// }

// export const writeCacheView = new WriteCacheView();

import { cacheManager } from '../CacheManager';


const WriteCacheView = {};

WriteCacheView.checkPath = async (module, name) => {
    try {
        const result = await cacheManager.checkModuleExists(module, name);
        return result;
    } catch (error) {
        console.error(`❌ Error checking path ${name}:`, error);
        throw error;
    }
}

WriteCacheView.writeModuleLanguage = async (module, language, data) => {
    try {
       const result = await cacheManager.saveModuleLanguage(module, language, data);
       return result;
    } catch (error) {
        console.error(`❌ Error writing module language for ${module}:`, error);
        throw error;
    }
};
WriteCacheView.saveModuleField = async (module, name, data) => {
    try {
        await cacheManager.saveModuleField(module, name, data);
        console.log(`✅ Field ${name} for module ${module} written to cache successfully.`);
        return true;
    } catch (error) {
        console.error(`❌ Error writing field ${name} for module ${module}:`, error);
        throw error;
    }
};

WriteCacheView.clearModuleCache = async (module) => {
    try {
        await cacheManager.clearModuleCache(module);
        console.log(`✅ Cache for module ${module} cleared successfully.`);
        return true;
    } catch (error) {
        console.error(`❌ Error clearing cache for ${module}:`, error);
        throw error;
    }
};

export default WriteCacheView;