// Rule system for SmartSea features

/**
 * Determines whether a field should be hidden based on business rules and the current user's role.
 * 
 * @param {string} fieldKey - The key/name of the field being evaluated.
 * @param {object} userRoles - The user's role object (contains roleName).
 * @returns {boolean} - true if the field should be hidden, false otherwise.
 */
export const shouldHideFieldByRule = (fieldKey, userRoles) => {
    if (!fieldKey) return false;
    
    const lowerFieldKey = String(fieldKey).toLowerCase();
    
    // Rule: Hide fields containing 'price' if the user role contains 'Thuyền' or 'Thuyen'
    if (lowerFieldKey.includes('price')) {
        if (userRoles && userRoles.roleName) {
            const roleName = String(userRoles.roleName).toLowerCase();
            if (roleName.includes('thuyền') || roleName.includes('thuyen')) {
                return true; // Hide this field
            }
        }
    }
    
    return false;
};
