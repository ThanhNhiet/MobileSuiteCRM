import { cacheManager } from '../../CacheManager';


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
export default ReadCacheView;