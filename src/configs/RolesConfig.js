import { getUserRolesApi } from '../services/api/external/ExternalApi';

class RolesConfig {
    constructor() {
        this.userRoles = null;
        this.modulePermissions = null;
        this.isLoaded = false;
    }

    // Get singleton instance
    static getInstance() {
        if (!RolesConfig.instance) {
            RolesConfig.instance = new RolesConfig();
        }
        return RolesConfig.instance;
    }

    // Define access level constants
    getAccessLevels() {
        return {
            ACL_ALLOW_ADMIN_DEV: 100,
            ACL_ALLOW_ADMIN: 99,
            ACL_ALLOW_ALL: 90,
            ACL_ALLOW_ENABLED: 89,
            ACL_ALLOW_OWNER: 75,
            ACL_ALLOW_NORMAL: 1,
            ACL_ALLOW_DEFAULT: 0,
            ACL_ALLOW_DISABLED: -98,
            ACL_ALLOW_NONE: -99,
            ACL_ALLOW_DEV: 95
        };
    }

    // Load user roles from API (only once)
    async loadUserRoles() {
        if (this.isLoaded && this.userRoles) {
            return this.userRoles;
        }

        try {
            const response = await getUserRolesApi();
            if (response && response.hasOwnProperty('roles')) {
                this.userRoles = response;
                this.isLoaded = true;
                this.processModulePermissions();
                return this.userRoles;
            }
            throw new Error('Invalid response structure');
        } catch (error) {
            console.error('Error loading user roles:', error);
            // If API fails, assume full access as fallback to avoid blocking user
            this.userRoles = { roles: [], total_roles: 0 };
            this.isLoaded = true;
            this.processModulePermissions();
            return this.userRoles;
        }
    }

    // Process and organize module permissions for easy access
    processModulePermissions() {
        if (!this.userRoles) {
            this.modulePermissions = {};
            return;
        }

        // If roles array is empty, user has full access to all modules
        if (!this.userRoles.roles || this.userRoles.roles.length === 0) {
            this.modulePermissions = 'FULL_ACCESS';
            return;
        }

        const permissions = {};
        const accessLevels = this.getAccessLevels();

        // Iterate through all roles and actions
        this.userRoles.roles.forEach(role => {
            if (role.actions) {
                role.actions.forEach(action => {
                    const moduleName = action.category;
                    const actionName = action.name;
                    const accessLevel = action.access_override;

                    // Initialize module permissions if not exists
                    if (!permissions[moduleName]) {
                        permissions[moduleName] = {};
                    }

                    // Store the highest access level for each action
                    if (!permissions[moduleName][actionName] || 
                        permissions[moduleName][actionName] < accessLevel) {
                        permissions[moduleName][actionName] = accessLevel;
                    }
                });
            }
        });

        this.modulePermissions = permissions;
    }

    // Check if user has access to a specific module
    hasModuleAccess(moduleName) {
        if (!this.isLoaded) {
            console.warn('User roles not loaded yet. Call loadUserRoles() first.');
            return false;
        }
        
        // If user has full access (empty roles), allow access to all modules
        if (this.modulePermissions === 'FULL_ACCESS') {
            return true;
        }
        
        if (!this.modulePermissions) return false;
        
        const modulePerms = this.modulePermissions[moduleName];
        if (!modulePerms) return false;

        // Check if user has access permission and it's enabled or higher
        const accessLevel = modulePerms['access'];
        const accessLevels = this.getAccessLevels();
        
        return accessLevel && accessLevel >= accessLevels.ACL_ALLOW_DEFAULT;
    }

    // Check if user has specific permission for a module (access, view, edit, etc.)
    hasModulePermission(moduleName, permission) {
        // If user has full access (empty roles), allow all permissions
        if (this.modulePermissions === 'FULL_ACCESS') {
            return true;
        }
        
        if (!this.modulePermissions) return false;
        
        const modulePerms = this.modulePermissions[moduleName];
        if (!modulePerms) return false;

        const permissionLevel = modulePerms[permission];
        const accessLevels = this.getAccessLevels();
        
        return permissionLevel && permissionLevel >= accessLevels.ACL_ALLOW_DEFAULT;
    }

    // Get all accessible modules for the user
    getAccessibleModules(allModules) {
        if (!allModules) return {};
        
        const accessibleModules = {};
        
        Object.keys(allModules).forEach(moduleKey => {
            if (this.hasModuleAccess(moduleKey)) {
                accessibleModules[moduleKey] = allModules[moduleKey];
            }
        });

        return accessibleModules;
    }

    // Get user's permissions for a specific module
    getModulePermissions(moduleName) {
        // If user has full access (empty roles), return admin-level permissions
        if (this.modulePermissions === 'FULL_ACCESS') {
            const accessLevels = this.getAccessLevels();
            return {
                access: accessLevels.ACL_ALLOW_ADMIN,
                view: accessLevels.ACL_ALLOW_ADMIN,
                edit: accessLevels.ACL_ALLOW_ADMIN,
                delete: accessLevels.ACL_ALLOW_ADMIN,
                list: accessLevels.ACL_ALLOW_ADMIN,
                export: accessLevels.ACL_ALLOW_ADMIN,
                import: accessLevels.ACL_ALLOW_ADMIN,
                massupdate: accessLevels.ACL_ALLOW_ADMIN
            };
        }
        
        if (!this.modulePermissions) return {};
        return this.modulePermissions[moduleName] || {};
    }

    // Reset the config (useful for logout/login)
    reset() {
        this.userRoles = null;
        this.modulePermissions = null;
        this.isLoaded = false;
    }
}

export default RolesConfig;
