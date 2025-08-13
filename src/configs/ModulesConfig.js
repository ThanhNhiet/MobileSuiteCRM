import { getAllModulesApi } from '../services/api/external/ExternalApi';

class ModulesConfig {
    constructor() {
        this.modules = null;
        this.filteredModules = null;
        this.isLoaded = false;
    }

    // Get singleton instance
    static getInstance() {
        if (!ModulesConfig.instance) {
            ModulesConfig.instance = new ModulesConfig();
        }
        return ModulesConfig.instance;
    }

    //Convert module to screen name. ex: Accounts -> AccountListScreen  
    getScreenName(moduleName) {
        if (!moduleName) return '';
        moduleName = moduleName.trim();
        let singularName = moduleName;
        if (moduleName.endsWith('s') && moduleName.length > 1) {
            singularName = moduleName.slice(0, -1);
        }
        return `${singularName}ListScreen`;
    }

    //Get generic screen name for navigation - uses ModuleListScreen for all modules except special cases
    getGenericScreenName(moduleName) {
        if (!moduleName) return '';
        
        // Special cases that have their own dedicated screens
        if (moduleName === 'Calendar') {
            return 'CalendarScreen';
        }
        
        // All other modules use the generic ModuleListScreen
        return 'ModuleListScreen';
    }

    // Get all available modules with their screen names
    getRequiredModules() {
        if (!this.modules) {
            // Return fallback if modules not loaded yet
            return {
                'Accounts': 'ModuleListScreen',
                'Notes': 'ModuleListScreen',
                'Tasks': 'ModuleListScreen',
                'Meetings': 'ModuleListScreen',
                'Calendar': 'CalendarScreen'
            };
        }
        
        // Generate screen names for all loaded modules
        const allModules = {};
        Object.keys(this.modules).forEach(moduleName => {
            allModules[moduleName] = this.getGenericScreenName(moduleName);
        });
        
        // Always include Calendar as special case
        allModules['Calendar'] = 'CalendarScreen';
        
        return allModules;
    }

    // Load all modules from API (only once)
    async loadModules() {
        if (this.isLoaded && this.modules) {
            return this.modules;
        }

        try {
            const response = await getAllModulesApi();
            if (response && response.data && response.data.attributes) {
                this.modules = response.data.attributes;
                this.isLoaded = true;
                this.filterRequiredModules();
                return this.modules;
            }
            throw new Error('Invalid response structure');
        } catch (error) {
            console.error('Error loading modules:', error);
            // Return fallback modules structure
            this.modules = this.getFallbackModules();
            this.isLoaded = true;
            this.filterRequiredModules();
            return this.modules;
        }
    }

    // Include all modules (no filtering by specific requirements)
    filterRequiredModules() {
        if (!this.modules) return;

        const filtered = {};

        // Include all modules from API
        Object.keys(this.modules).forEach(moduleKey => {
            filtered[moduleKey] = {
                ...this.modules[moduleKey],
                screenName: this.getGenericScreenName(moduleKey),
                originalScreenName: this.getScreenName(moduleKey),
                moduleName: moduleKey // Store module name for navigation params
            };
        });

        // Add Calendar as special case (not from API)
        filtered['Calendar'] = {
            label: 'Calendar',
            screenName: 'CalendarScreen',
            originalScreenName: 'CalendarScreen',
            moduleName: 'Calendar',
            access: ['access', 'view'] // Default permissions
        };

        this.filteredModules = filtered;
    }

    // Get filtered modules for hamburger menu
    getFilteredModules() {
        if (!this.isLoaded) {
            console.warn('Modules not loaded yet. Call loadModules() first.');
        }
        return this.filteredModules || {};
    }

    // Get fallback modules in case API fails - can be extended
    getFallbackModules() {
        return {
            'Accounts': {
                label: 'Accounts',
                access: ['access', 'view', 'list']
            },
            'Notes': {
                label: 'Notes',
                access: ['access', 'view', 'list']
            },
            'Tasks': {
                label: 'Tasks',
                access: ['access', 'view', 'list']
            },
            'Meetings': {
                label: 'Meetings',
                access: ['access', 'view', 'list']
            },
            'Contacts': {
                label: 'Contacts',
                access: ['access', 'view', 'list']
            },
            'Calls': {
                label: 'Calls',
                access: ['access', 'view', 'list']
            },
            'Leads': {
                label: 'Leads',
                access: ['access', 'view', 'list']
            },
            'Opportunities': {
                label: 'Opportunities',
                access: ['access', 'view', 'list']
            }
        };
    }

    // Reset the config (useful for logout/login)
    reset() {
        this.modules = null;
        this.filteredModules = null;
        this.isLoaded = false;
    }
}

export default ModulesConfig;
