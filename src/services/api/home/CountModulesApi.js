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

const countMyRecordApi = async (module) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const userId = getUserIdFromToken(token);
    const query = `fields[${module}]=id&filter[assigned_user_id][eq]=${userId}&filter[deleted][eq]=0&page[size]=1`;
    const url = `/Api/V8/module/${module}?${query}`;
    const response = await axiosInstance.get(url);
    const totalPages = response?.data?.meta?.['total-pages'];
    return totalPages || 0;
  } catch (error) {
    console.warn(`Error fetching my ${module} count:`, error);
    return 0;
  }
};

export const countMyRecord_EachModuleApi = async (modules) => {
  try {
    const results = {};

    // Loại bỏ Calendar
    const modulesToCount = modules.filter(module => module !== 'Calendar');

    // Gọi song song cho tất cả module
    const countPromises = modulesToCount.map(async (module) => {
      try {
        const count = await countMyRecordApi(module);
        return { module, count, success: true };
      } catch (error) {
        console.error(`Error counting my records for ${module}:`, error);
        return { module, count: 0, success: false, error: error.message };
      }
    });

    const settledResults = await Promise.allSettled(countPromises);

    settledResults.forEach((result, index) => {
      const module = modulesToCount[index];
      if (result.status === 'fulfilled') {
        const { module: m, count, success, error } = result.value;
        results[m] = { count: count || 0, success, error: error || null };
      } else {
        results[module] = {
          count: 0,
          success: false,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });

    return {
      success: true,
      results,
      totalModules: modulesToCount.length,
      processedModules: Object.keys(results),
    };
  } catch (error) {
    console.error('Error in countMyRecord_EachModuleApi:', error);
    return {
      success: false,
      error: error.message,
      results: {},
    };
  }
};


// Get counts for all accessible modules based on user permissions
export const getAccessibleModuleCounts = async () => {
    try {
        const rolesConfig = RolesConfig.getInstance();
        const modulesConfig = ModulesConfig.getInstance();
        await Promise.all([
            rolesConfig.loadUserRoles(),
            modulesConfig.loadModules()
        ]);

        // Get selected modules from Home settings
        let selectedModules = null;
        try {
            const ReadCacheView = (await import('../../../utils/cacheViewManagement/ReadCacheView')).default;
            selectedModules = await ReadCacheView.getHomeSettings();
        } catch (e) {
            selectedModules = null;
        }

        // If no settings are found, get the first 2 modules from the list of user-accessible modules
        const availableModules = modulesConfig.getRequiredModules();
        let modulesToCount = [];
        if (selectedModules && Array.isArray(selectedModules) && selectedModules.length > 0) {
            modulesToCount = selectedModules;
        } else {
            modulesToCount = Object.keys(availableModules).filter(m => rolesConfig.hasModuleAccess(m)).slice(0, 2);
        }

        // Define icon and showType for each module
        const iconMap = {
            'Accounts': 'business-outline',
            'Meetings': 'people-outline',
            'Tasks': 'checkbox-outline',
            'Notes': 'document-text-outline',
            'Calendar': 'calendar-outline',
            'Contacts': 'person-outline',
            'Calls': 'call-outline',
            'Leads': 'trending-up-outline',
            'Opportunities': 'briefcase-outline',
            'Campaigns': 'megaphone-outline',
            'Cases': 'folder-outline',
            'Documents': 'document-outline',
            'Emails': 'mail-outline',
            'Projects': 'layers-outline',
            'Reports': 'bar-chart-outline'
        };

        const moduleCounts = {};
        for (const moduleName of modulesToCount) {
            let count = 0;
            let showType = 'my';
            if (moduleName === 'Calendar') {
                showType = 'calendar';
            } else {
                try {
                    count = await countMyRecordApi(moduleName);
                } catch (error) {
                    count = 0;
                }
            }
            moduleCounts[moduleName] = {
                count,
                icon: iconMap[moduleName] || 'apps-outline',
                showType,
                navigationTarget: availableModules[moduleName],
                hasAccess: true
            };
        }

        return {
            success: true,
            moduleCounts,
            totalAccessibleModules: Object.keys(moduleCounts).length,
            processedModules: modulesToCount
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
        
        // Special handling for ModuleListScreen - it's a generic screen that should always be accessible
        // The actual module access will be checked when loading the specific module data
        if (screenName === 'ModuleListScreen') {
            return true;
        }
        
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
