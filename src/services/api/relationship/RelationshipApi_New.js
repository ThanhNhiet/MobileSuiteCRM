// RelationshipApi_New.js
import axiosInstance from '../../../configs/AxiosConfig';

/**
 * Relationship API functions for SuiteCRM
 * Based on RelationshipsApi.js but refactored to use axiosInstance and AsyncStorage
 * All functions are designed to work with any SuiteCRM module relationships
 */

/**
 * Get paginated related records for a given parent record
 * @param {string} relatedLink - API path starting from /V8/module/.../relationships/...
 * @param {number} pageNumber - Page number
 * @param {number} pageSize - Number of records per page
 */
export const getRelationshipsDataApi = async (relatedLink, pageNumber = 1, pageSize = 10) => {
    try {
        const response = await axiosInstance.get(`/Api/${relatedLink}`, {
            params: {
                'page[size]': pageSize,
                'page[number]': pageNumber
            }
        });
        
        return response.data;
    } catch (error) {
        console.warn(`Get Relationships Data API error:`, error);
        throw error;
    }
};

/**
 * Get language labels for a specific module in a specific language
 * @param {string} moduleName - Name of the module
 * @param {string} language - Language code (e.g., 'en_us', 'vi_vn')
 */
export const getRelationshipsLanguageApi = async (moduleName, language) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/custom/${moduleName}/language/lang=${language}`);
        return response.data;
    } catch (error) {
        console.warn(`Get ${moduleName} Language API error:`, error);
        throw error;
    }
};

/**
 * Get list view fields configuration for a module
 * Useful for displaying related module list view
 * @param {string} moduleName - Name of the module
 */
export const getRelationshipListViewFieldsApi = async (moduleName) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/custom/${moduleName}/list-fields`);
        return response.data;
    } catch (error) {
        console.warn(`Get ${moduleName} List Fields API error:`, error);
        throw error;
    }
};

/**
 * Get metadata of required fields for a module
 * @param {string} moduleName - Name of the module
 */
export const getRelationshipFieldsRequiredApi = async (moduleName) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/meta/fields/${moduleName}`);
        return response.data;
    } catch (error) {
        console.warn(`Get ${moduleName} Fields Required API error:`, error);
        throw error;
    }
};

/**
 * Get edit view fields for creating/updating related records
 * @param {string} moduleName - Name of the module
 */
export const getRelationshipEditFieldsApi = async (moduleName) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/custom/${moduleName}/edit-fields`);
        return response.data;
    } catch (error) {
        console.warn(`Get ${moduleName} Edit Fields API error:`, error);
        throw error;
    }
};

/**
 * Get all related records without pagination parameters
 * @param {string} relatedLink - API path starting from /V8/module/.../relationships/...
 */
export const getDataRelationshipApi = async (relatedLink) => {
    try {
        const response = await axiosInstance.get(`/Api/${relatedLink}`);
        return response.data;
    } catch (error) {
        console.warn(`Get Data Relationship API error:`, error);
        throw error;
    }
};

export const getRecordByIdApi = async (relaFor) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/module/${relaFor.moduleName}/${relaFor.recordId}`);

        if (response.data.data !== null) {
            return response.data.data.attributes;
        } else {
            return null;
        }
    } catch (error) {
        console.warn(`Get Record By ID from ${relaFor.moduleName} API error:`, error);
        throw error;
    }
};