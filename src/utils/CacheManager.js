import * as FileSystem from 'expo-file-system';

class CacheManager {
    constructor() {
        this.cacheDir = `${FileSystem.documentDirectory}cache/`;
    }

    // Đảm bảo thư mục tồn tại
    async ensureDirectoryExists(dirPath) {
        try {
            const dirInfo = await FileSystem.getInfoAsync(dirPath);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
                console.log(`Created directory: ${dirPath}`);
            }
        } catch (error) {
            console.warn('Error creating directory:', error);
        }
    }

    // Kiểm tra file có tồn tại không
    async fileExists(filePath) {
        try {
            const fileInfo = await FileSystem.getInfoAsync(filePath);
            return fileInfo.exists;
        } catch (error) {
            console.warn('Error checking file exists:', error);
            return false;
        }
    }

    // Lưu dữ liệu ngôn ngữ cho module
    async saveModuleLanguage(module, language, data) {
        try {
            const moduleDir = `${this.cacheDir}${module}/language/`;
            await this.ensureDirectoryExists(moduleDir);

            const filePath = `${moduleDir}${language}.json`;

            console.log("➡️ FilePath:", filePath);
            await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data, null, 2));
            console.log(`Saved language ${language} for module ${module}`);
            return true;
        } catch (error) {
            console.warn(`Error saving language ${language} for module ${module}:`, error);
            return false;
        }
    }

    // Lưu system language
    async saveSystemLanguage(language, data) {
        try {
            const includeDir = `${this.cacheDir}Include/`;
            await this.ensureDirectoryExists(includeDir);
            const filePath = `${includeDir}${language}.json`;
            await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data, null, 2));
            console.log(`Saved system language ${language}`);
            return true;
        } catch (error) {
            console.warn(`Error saving system language ${language}:`, error);
            return false;
        }
    }


    // Kiểm tra xem module file có tồn tại không
    async checkModuleExists(module, name) {
        const cleanName = name.startsWith('/') ? name.slice(1) : name;
        const filePath = `${this.cacheDir}${module}/metadata/${cleanName}.json`;
        return await this.fileExists(filePath);
    }


    // Kiểm tra xem module language có tồn tại không
    async checkModuleLanguageExists(module, language) {
        const filePath = `${this.cacheDir}${module}/language/${language}.json`;
        return await this.fileExists(filePath);
    }


    // Kiểm tra xem system language có tồn tại không
    async checkSystemLanguageExists(language) {
        const filePath = `${this.cacheDir}Include/${language}.json`;
        return await this.fileExists(filePath);
    }

    // Đọc dữ liệu ngôn ngữ của module
    async getModuleLanguage(module, language) {
        try {
            const filePath = `${this.cacheDir}${module}/language/${language}.json`;
            const fileExists = await this.fileExists(filePath);
            if (fileExists) {
                const content = await FileSystem.readAsStringAsync(filePath);
                return JSON.parse(content);
            }
            return null;
        } catch (error) {
            console.warn(`Error reading module language ${module}/${language}:`, error);
            return null;
        }
    }
    // Đọc dữ liệu ngôn ngữ của module  name =requiredFields
    async saveModuleField(module, name, data) {
        try {
            const cleanName = name.startsWith('/') ? name.slice(1) : name;

            const fullFilePath = `${this.cacheDir}${module}/metadata/${cleanName}.json`;

            // Lấy đường dẫn thư mục chứa file
            const folderPath = fullFilePath.substring(0, fullFilePath.lastIndexOf('/'));
            await this.ensureDirectoryExists(folderPath);

            console.log('➡️ Writing to:', fullFilePath);
            await FileSystem.writeAsStringAsync(fullFilePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.warn(`❌ Error saving required field ${name} for module ${module}:`, error);
            return false;
        }
    }

    async getModuleField(module, name) {
        try {
            const cleanName = name.startsWith('/') ? name.slice(1) : name;
            const filePath = `${this.cacheDir}${module}/metadata/${cleanName}.json`;

            const fileExists = await this.fileExists(filePath);
            if (fileExists) {
                const content = await FileSystem.readAsStringAsync(filePath);
                return JSON.parse(content);
            }
            return null;
        } catch (error) {
            console.warn(`❌ Error reading module field ${module}/${name}:`, error);
            return null;
        }
    }

    // Đọc system language
    async getSystemLanguage(language) {
        try {
            const filePath = `${this.cacheDir}Include/${language}.json`;
            const fileExists = await this.fileExists(filePath);
            if (fileExists) {
                const content = await FileSystem.readAsStringAsync(filePath);
                return JSON.parse(content);
            }
            return null;
        } catch (error) {
            console.warn(`Error reading system language ${language}:`, error);
            return null;
        }
    }

    // Xóa cache (nếu cần)
    async clearCache() {
        try {
            const cacheExists = await this.fileExists(this.cacheDir);
            if (cacheExists) {
                await FileSystem.deleteAsync(this.cacheDir);
                console.log('Cache cleared successfully');
            }
        } catch (error) {
            console.warn('Error clearing cache:', error);
        }
    }

    // Pretty print JSON from cache
    async getModuleLanguage_Pretty(module, language) {
        try {
            const filePath = `${this.cacheDir}${module}/language/${language}.json`;
            const fileExists = await this.fileExists(filePath);

            if (fileExists) {
                const content = await FileSystem.readAsStringAsync(filePath);
                const jsonData = JSON.parse(content);

                // ✅ In ra định dạng đẹp
                const prettyJson = JSON.stringify(jsonData, null, 2);
                return prettyJson;
            } else {
                console.warn(`⚠️ File not found: ${filePath}`);
                return null;
            }
        } catch (error) {
            console.warn(`❌ Error reading JSON from cache for ${module}/${language}:`, error);
            return null;
        }
    }

    // Pretty print JSON from cache for system language
    async getSystemLanguage_Pretty(language) {
        try {
            const filePath = `${this.cacheDir}Include/${language}.json`;
            const fileExists = await this.fileExists(filePath);

            if (fileExists) {
                const content = await FileSystem.readAsStringAsync(filePath);
                const jsonData = JSON.parse(content);

                // ✅ In ra định dạng đẹp
                const prettyJson = JSON.stringify(jsonData, null, 2);
                return prettyJson;
            } else {
                console.warn(`⚠️ System language file not found: ${filePath}`);
                return null;
            }
        } catch (error) {
            console.warn(`❌ Error reading system language from cache for ${language}:`, error);
            return null;
        }
    }

    // Trong class CacheManager
    async clearModuleCache(module) {
        try {
            const moduleDir = `${this.cacheDir}${module}/`;
            const moduleExists = await this.fileExists(moduleDir);
            if (moduleExists) {
                await FileSystem.deleteAsync(moduleDir, { idempotent: true });
                console.log(`🗑️ Cleared cache for module: ${module}`);
            } else {
                console.log(`ℹ️ No cache to clear for module: ${module}`);
            }
        } catch (error) {
            console.warn(`❌ Error clearing module cache for ${module}:`, error);
        }
    }

}
export const cacheManager = new CacheManager();
