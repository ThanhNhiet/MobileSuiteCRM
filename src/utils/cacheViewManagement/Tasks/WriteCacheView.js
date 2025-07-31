import { cacheManager } from '../../CacheManager';


const WriteCacheView = {};

WriteCacheView.checkPath = async (module, path) => {
    try {
        const result = await cacheManager.checkModuleExists(module, path);
        return result;
    } catch (error) {
        console.error(`❌ Error checking path ${path}:`, error);
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