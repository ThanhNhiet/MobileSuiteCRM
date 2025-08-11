import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../../configs/AxiosConfig';
import ModulesConfig from '../../../configs/ModulesConfig';
import RolesConfig from '../../../configs/RolesConfig';
import { getUserIdFromToken } from '../../../utils/DecodeToken';


// Count all accounts
// GET Api/V8/module/Accounts?fields[Accounts]=id&filter[deleted][eq]=0&page[size]=1
export const getCountAllAccounts = async () => {
    try {
        const response = await axiosInstance.get(
            '/Api/V8/module/Accounts',
            {
                params: {
                    'fields[Accounts]': 'id',
                    'filter[deleted][eq]': 0,
                    'page[size]': 1,
                }
            }
        );
        
        // Safe access to meta data with fallback
        const totalPages = response?.data?.meta?.['total-pages'];
        
        if (totalPages === undefined || totalPages === null || typeof totalPages !== 'number' || totalPages < 0) {
            return 0;
        }
        
        return totalPages;
    } catch (error) {
        console.error('Error fetching all account count:', error);
        throw error;
    }
}

// Count my meetings
// GET Api/V8/module/Meetings?fields[Meetings]=id&filter[assigned_user_id][eq]={userId}&filter[deleted][eq]=0&page[size]=1
export const getCountMyMeetings = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);
        const response = await axiosInstance.get(
            '/Api/V8/module/Meetings',
            {
                params: {
                    'fields[Meetings]': 'id',
                    'filter[assigned_user_id][eq]': userId,
                    'filter[deleted][eq]': 0,
                    'page[size]': 1,
                }
            }
        );
        
        // Safe access to meta data with fallback
        const totalPages = response?.data?.meta?.['total-pages'];
        
        if (totalPages === undefined || totalPages === null || typeof totalPages !== 'number' || totalPages < 0) {
            return 0;
        }
        
        return totalPages;
    } catch (error) {
        console.error('Error fetching my meeting count:', error);
        throw error;
    }
}

// Count my tasks
// GET Api/V8/module/Tasks?fields[Tasks]=id&filter[assigned_user_id][eq]={userId}&filter[deleted][eq]=0&page[size]=1
export const getCountMyTasks = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);
        const response = await axiosInstance.get(
            '/Api/V8/module/Tasks',
            {
                params: {
                    'fields[Tasks]': 'id',
                    'filter[assigned_user_id][eq]': userId,
                    'filter[deleted][eq]': 0,
                    'page[size]': 1,
                }
            }
        );
        
        // Safe access to meta data with fallback
        const totalPages = response?.data?.meta?.['total-pages'];
        
        if (totalPages === undefined || totalPages === null || typeof totalPages !== 'number' || totalPages < 0) {
            return 0;
        }
        
        return totalPages;
    } catch (error) {
        console.error('Error fetching my task count:', error);
        throw error;
    }
}

// Count my notes
// GET Api/V8/module/Notes?fields[Notes]=id&filter[assigned_user_id][eq]={userId}&filter[deleted][eq]=0&page[size]=1
export const getCountMyNotes = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);
        const response = await axiosInstance.get(
            '/Api/V8/module/Notes',
            {
                params: {
                    'fields[Notes]': 'id',
                    'filter[assigned_user_id][eq]': userId,
                    'filter[deleted][eq]': 0,
                    'page[size]': 1,
                }
            }
        );
        
        // Safe access to meta data with fallback
        const totalPages = response?.data?.meta?.['total-pages'];
        
        if (totalPages === undefined || totalPages === null || typeof totalPages !== 'number' || totalPages < 0) {
            return 0;
        }
        
        return totalPages;
    } catch (error) {
        console.error('Error fetching my note count:', error);
        throw error;
    }
}

// Get counts for all accessible modules based on user permissions
export const getAccessibleModuleCounts = async () => {
    try {
        const rolesConfig = RolesConfig.getInstance();
        const modulesConfig = ModulesConfig.getInstance();
        
        // Load user roles and modules if not already loaded
        await Promise.all([
            rolesConfig.loadUserRoles(),
            modulesConfig.loadModules()
        ]);
        
        const moduleCounts = {};
        
        // Get dynamic module list from ModulesConfig
        const availableModules = modulesConfig.getRequiredModules();
        
        // Define count functions and metadata for each module
        const moduleCountFunctions = {
            'Accounts': {
                getCount: getCountAllAccounts,
                icon: 'business-outline',
                showType: 'all'
            },
            'Meetings': {
                getCount: getCountMyMeetings,
                icon: 'people-outline',
                showType: 'my'
            },
            'Tasks': {
                getCount: getCountMyTasks,
                icon: 'checkbox-outline',
                showType: 'my'
            },
            'Notes': {
                getCount: getCountMyNotes,
                icon: 'document-text-outline',
                showType: 'my'
            },
            'Calendar': {
                getCount: () => Promise.resolve(0), // Calendar doesn't have count API
                icon: 'calendar-outline',
                showType: 'calendar'
            }
        };
        
        // Process each module from ModulesConfig
        for (const [moduleName, navigationTarget] of Object.entries(availableModules)) {
            try {
                // Check if user has access to this module
                if (rolesConfig.hasModuleAccess(moduleName)) {
                    const moduleConfig = moduleCountFunctions[moduleName];
                    
                    if (moduleConfig) {
                        const count = await moduleConfig.getCount();
                        moduleCounts[moduleName] = {
                            count: count || 0,
                            icon: moduleConfig.icon,
                            showType: moduleConfig.showType,
                            navigationTarget: navigationTarget,
                            hasAccess: true
                        };
                    } else {
                        console.warn(`Module ${moduleName} from ModulesConfig not found in moduleCountFunctions`);
                    }
                }
            } catch (error) {
                console.error(`Error getting count for ${moduleName}:`, error);
                // If error occurs, still include module but with 0 count if user has access
                if (rolesConfig.hasModuleAccess(moduleName)) {
                    const moduleConfig = moduleCountFunctions[moduleName];
                    if (moduleConfig) {
                        moduleCounts[moduleName] = {
                            count: 0,
                            icon: moduleConfig.icon,
                            showType: moduleConfig.showType,
                            navigationTarget: availableModules[moduleName],
                            hasAccess: true,
                            error: true
                        };
                    }
                }
            }
        }
        
        return {
            success: true,
            moduleCounts,
            totalAccessibleModules: Object.keys(moduleCounts).length,
            processedModules: Object.keys(availableModules)
        };
        
    } catch (error) {
        console.error('Error in getAccessibleModuleCounts:', error);
        throw error;
    }
};

// Check if user has navigation access to specific screen
export const hasNavigationAccess = async (screenName) => {
    try {
        const rolesConfig = RolesConfig.getInstance();
        const modulesConfig = ModulesConfig.getInstance();
        
        // Load user roles and modules if not already loaded
        await Promise.all([
            rolesConfig.loadUserRoles(),
            modulesConfig.loadModules()
        ]);
        
        // Get dynamic screen to module mapping from ModulesConfig
        const availableModules = modulesConfig.getRequiredModules();
        
        // Create reverse mapping: screen -> module
        const screenToModuleMap = {};
        Object.entries(availableModules).forEach(([moduleName, screenTarget]) => {
            screenToModuleMap[screenTarget] = moduleName;
            
            // Also map detail/create/update screens for each module
            const baseScreenName = screenTarget.replace('ListScreen', '');
            screenToModuleMap[`${baseScreenName}DetailScreen`] = moduleName;
            screenToModuleMap[`${baseScreenName}CreateScreen`] = moduleName;
            screenToModuleMap[`${baseScreenName}UpdateScreen`] = moduleName;
        });
        
        // Add special cases for Calendar
        screenToModuleMap['TimetableScreen'] = 'Calendar';
        
        const moduleName = screenToModuleMap[screenName];
        if (!moduleName) {
            console.log(`Screen ${screenName} not mapped to any module, allowing access`);
            return true;
        }
        
        const hasAccess = rolesConfig.hasModuleAccess(moduleName);
        return hasAccess;
        
    } catch (error) {
        console.error('Error checking navigation access:', error);
        // On error, deny access for security
        return false;
    }
};
