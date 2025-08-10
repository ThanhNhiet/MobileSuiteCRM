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

    // Define the modules we want to display in the hamburger menu
    getRequiredModules() {
        return {
            'Accounts': 'AccountListScreen',
            'Notes': 'NoteListScreen', 
            'Tasks': 'TaskListScreen',
            'Meetings': 'MeetingListScreen',
            'Calendar': 'CalendarScreen' // Special case for calendar
        };
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

    // Filter only the modules we need for the hamburger menu
    filterRequiredModules() {
        if (!this.modules) return;

        const requiredModules = this.getRequiredModules();
        const filtered = {};

        Object.keys(requiredModules).forEach(moduleKey => {
            if (this.modules[moduleKey]) {
                filtered[moduleKey] = {
                    ...this.modules[moduleKey],
                    screenName: requiredModules[moduleKey]
                };
            }
        });

        // Add Calendar as special case (not from API)
        filtered['Calendar'] = {
            label: 'Calendar',
            screenName: 'CalendarScreen',
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

    // Get fallback modules in case API fails
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
