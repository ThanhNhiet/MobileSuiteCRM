import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../../configs/AxiosConfig';
import { getUserIdFromToken } from '../../../utils/DecodeToken';

/**
 * Generic Module API functions that work with any SuiteCRM module
 * Based on Notes API pattern but made generic by accepting moduleName parameter
 */

//What fields are available for module list view
//GET /Api/V8/custom/{ModuleName}/list-fields
export const getModuleListFieldsApi = async (moduleName) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/custom/${moduleName}/list-fields`);
        return response.data;
    } catch (error) {
        console.warn(`Get ${moduleName} List Fields API error:`, error);
        throw error;
    }
};

//What fields are available for module detail view
//GET /Api/V8/custom/{ModuleName}/detail-fields
export const getModuleDetailFieldsApi = async (moduleName) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/custom/${moduleName}/detail-fields`);
        return response.data;
    } catch (error) {
        console.warn(`Get ${moduleName} Detail Fields API error:`, error);
        throw error;
    }
};

//Edit view for create and update module
//GET /Api/V8/custom/{ModuleName}/edit-fields
export const getModuleEditFieldsApi = async (moduleName) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/custom/${moduleName}/edit-fields`);
        return response.data;
    } catch (error) {
        console.warn(`Get ${moduleName} Edit Fields API error:`, error);
        throw error;
    }
}

//Get field required for module in create and update
//GET /Api/V8/meta/fields/{ModuleName}
export const getModuleFieldsRequiredApi = async (moduleName) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/meta/fields/${moduleName}`);
        return response.data;
    } catch (error) {
        console.warn(`Get ${moduleName} Fields API error:`, error);
        throw error;
    }
};

//For list view - get records assigned to current user or created by current user
//GET /Api/V8/module/{ModuleName}
//?filter[operator]=or
//?filter[assigned_user_id][eq]={id}
//&filter[created_by][eq]={id}
//&filter[deleted][eq]=0
//&fields[{ModuleName}]=nameFields&page[size]=10&page[number]=1&sort=-date_entered
export const getModuleRecordsApi = async (moduleName, pageSize = 10, pageNumber = 1, nameFields, sortField = 'date_entered') => {
    try {
        // const token = await AsyncStorage.getItem('token');
        // const userId = getUserIdFromToken(token);
        // console.log(`Full url: /Api/V8/module/${moduleName}?filter[operator]=or&filter[deleted][eq]=0&fields[${moduleName}]=${nameFields},created_by,assigned_user_id&page[size]=${pageSize}&page[number]=${pageNumber}&sort=-${sortField}`);

        const response = await axiosInstance.get(`/Api/V8/module/${moduleName}`, {
            params: {
                'filter[operator]': 'or',
                //  'filter[assigned_user_id]': userId,
                // 'filter[created_by]': userId,
                'filter[deleted][eq]': 0,
                [`fields[${moduleName}]`]: nameFields + ',created_by,assigned_user_id',
                'page[size]': pageSize,
                'page[number]': pageNumber,
                'sort': `-${sortField}`
            }
        });
        return response.data;
    } catch (error) {
        console.warn(`Get ${moduleName} List API error:`, error);
        throw error;
    }
};

//For detail view
//GET /Api/V8/module/{ModuleName}/{id}?fields[{ModuleName}]={nameFields}
export const getModuleDetailApi = async (moduleName, recordId, nameFields) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/module/${moduleName}/${recordId}`, {
            params: {
                [`fields[${moduleName}]`]: nameFields + ',created_by'
            }
        });
        return response.data;
    } catch (error) {
        console.warn(`Get ${moduleName} Detail API error:`, error);
        throw error;
    }
};

//POST /Api/V8/module
// body: { "data": { "type": "{ModuleName}", "attributes": { "name": "", "description": "", ... } } }
export const createModuleRecordApi = async (moduleName, recordData) => {
    try {
        const token = await AsyncStorage.getItem('token');
        let response;
        if (recordData.assigned_user_id == null) {
            const userId = getUserIdFromToken(token);
            response = await axiosInstance.post(`/Api/V8/module`, {
                data: {
                    type: moduleName,
                    attributes: {
                        assigned_user_id: userId,
                        ...recordData
                    }
                }
            });
        } else{
            response = await axiosInstance.post(`/Api/V8/module`, {
                data: {
                    type: moduleName,
                    attributes: {
                        ...recordData
                    }
                }
            });
        }
        return response.data;
    } catch (error) {
        console.warn(`Create ${moduleName} API error:`, error);
        throw error;
    }
};

//PATCH /Api/V8/module
// body: { "data": { "type": "{ModuleName}", "id": "", "attributes": { "name": "", "description": "", ... } } }
export const updateModuleRecordApi = async (moduleName, recordId, recordData) => {
    try {
        const response = await axiosInstance.patch(`/Api/V8/module`, {
            data: {
                type: moduleName,
                id: recordId,
                attributes: recordData
            }
        });
        return response.data;
    } catch (error) {
        console.warn(`Update ${moduleName} API error:`, error);
        throw error;
    }
};

//DELETE /Api/V8/module/{ModuleName}/{id}
export const deleteModuleRecordApi = async (moduleName, recordId) => {
    try {
        const response = await axiosInstance.delete(`/Api/V8/module/${moduleName}/${recordId}`);
        return response.data;
    } catch (error) {
        console.warn(`Delete ${moduleName} API error:`, error);
        throw error;
    }
};

//Search by keywords
//GET /Api/V8/custom/{ModuleName}?keyword={keyword}&field={nameField}&page={page}
export const searchModuleByKeywordApi = async (moduleName, keyword, page = 1, fields = 'name,description,created_by,assigned_user_id,date_entered') => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);

        const response = await axiosInstance.get(`/Api/V8/custom/${moduleName}`, {
            params: {
                'keyword': keyword,
                'assigned_user_id': userId,
                'fields': fields,
                'page': page
            }
        });
        return response.data;
    } catch (error) {
        console.warn(`Search ${moduleName} API error:`, error);
        throw error;
    }
};

//Filter records with various criteria
//GET /Api/V8/module/{ModuleName}
//?filter[operator]=and
//?filter[assigned_user_id][eq]={id}
//&filter[created_by][eq]={id}
//&filter[deleted][eq]=0
//...additional filters
//&fields[{ModuleName}]=nameFields&page[size]=10&page[number]=1&sort=-date_entered
export const searchModuleByFilterApi = async (moduleName, pageSize = 10, pageNumber = 1, nameFields, additionalFilters = {}, sortField = 'date_entered') => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userId = getUserIdFromToken(token);

        // Base parameters
        const params = {
            //'filter[operator]': 'and',
            // 'filter[assigned_user_id][eq]': userId,
            //  'filter[created_by][eq]': userId,
            'filter[deleted][eq]': 0,
            [`fields[${moduleName}]`]: nameFields + ',created_by,assigned_user_id',
            'page[size]': pageSize,
            'page[number]': pageNumber,
            'sort': `-${sortField}`
        };

        // Add additional filters
        Object.entries(additionalFilters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params[key] = value;
            }
        });

        const response = await axiosInstance.get(`/Api/V8/module/${moduleName}`, { params });
        return response.data;
    } catch (error) {
        console.warn(`Search ${moduleName} By Filter API error:`, error);
        throw error;
    }
};

//Check if record exists in another module by name
//GET /Api/V8/module/{TargetModule}?filter[name][eq]={recordName}
export const checkRecordExistsApi = async (targetModule, recordName) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/module/${targetModule}`, {
            params: {
                'filter[name][eq]': recordName,
                [`fields[${targetModule}]`]: 'name'
            }
        });

        if (response.data && response.data.data && response.data.data.length > 0) {
            return response.data.data[0].attributes.name;
        } else {
            return null;
        }
    } catch (error) {
        console.warn(`Check Record Exists in ${targetModule} API error:`, error);
        throw error;
    }
};

//Get record by ID from any module
//GET /Api/V8/module/{ModuleName}/{id}?fields[{ModuleName}]={fields}
export const getRecordByIdApi = async (moduleName, recordId, fields = 'name') => {
    try {
        const response = await axiosInstance.get(`/Api/V8/module/${moduleName}/${recordId}`, {
            params: {
                [`fields[${moduleName}]`]: fields
            }
        });

        if (response.data.data !== null) {
            return response.data.data.attributes;
        } else {
            return null;
        }
    } catch (error) {
        console.warn(`Get Record By ID from ${moduleName} API error:`, error);
        throw error;
    }
};

//Create relationship between two records
//POST /Api/V8/module/{ParentModule}/{parentId}/relationships
export const createModuleRelationshipApi = async (parentModule, parentId, relatedModule, relatedId) => {
    try {
        const response = await axiosInstance.post(`/Api/V8/module/${parentModule}/${parentId}/relationships`, {
            data: {
                type: relatedModule,
                id: relatedId
            }
        });
        return response.data;
    } catch (error) {
        console.warn(`Create ${relatedModule} ${parentModule} Relation API error:`, error);
        throw error;
    }
};

//Delete relationship between two records
//DELETE /Api/V8/module/{ParentModule}/{parentId}/relationships/{relatedModule}/{relatedId}
export const deleteModuleRelationshipApi = async (parentModule, parentId, relatedModule, relatedId) => {
    try {
        const response = await axiosInstance.delete(`/Api/V8/module/${parentModule}/${parentId}/relationships/${relatedModule.toLowerCase()}/${relatedId}`);
        return response.data;
    } catch (error) {
        console.warn(`Delete ${relatedModule} ${parentModule} Relation API error:`, error);
        throw error;
    }
};

// Helper function to build date filters for common time periods
export const buildDateFilter = (dateType, fieldName = 'date_entered') => {
    if (!dateType || !dateType.trim()) return {};

    const today = new Date();
    let startDate, endDate;

    switch (dateType.toLowerCase()) {
        case 'today':
            startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
            break;

        case 'this_week':
            const dayOfWeek = today.getDay();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - dayOfWeek);
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);

            startDate = startOfWeek;
            endDate = endOfWeek;
            break;

        case 'this_month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            break;

        case 'this_year':
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date(today.getFullYear() + 1, 0, 1);
            break;

        default:
            return {};
    }

    return {
        [`filter[${fieldName}][gte]`]: startDate.toISOString(),
        [`filter[${fieldName}][lt]`]: endDate.toISOString()
    };
};

//Get parent_id by moduleId
export const getParentId_typeByModuleIdApi = async (moduleName, id) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/module/${moduleName}/${id}`, {
            params: {
                [`fields[${moduleName}]`]: 'parent_id,parent_type'
            }
        });

        const attributes = response.data.data.attributes || {};

        // Return the attributes, defaulting to null if fields don't exist
        return {
            parent_id: attributes.parent_id || null,
            parent_type: attributes.parent_type || null
        };
    } catch (error) {
        console.warn(`Get Parent ID by ID API error for ${moduleName}:`, error);

        // If the error is specifically about the fields not existing (400), 
        // return null values instead of throwing
        if (error.response && (error.response.status === 400 || error.response.status === 422)) {
            console.info(`Module ${moduleName} does not support parent_id/parent_type fields`);
            return {
                parent_id: null,
                parent_type: null
            };
        }

        // For network errors or other critical errors, also return safe defaults
        // to prevent breaking the detail view loading
        if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
            console.warn(`Network error when fetching parent info for ${moduleName}, using defaults`);
            return {
                parent_id: null,
                parent_type: null
            };
        }

        // For other errors, still throw
        throw error;
    }
};

//GET /Api/V8/custom/enum/{moduleName}?fields=&lang=vi_VN
export const getEnumsApi = async (moduleName, enumFields, lang) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/custom/enum/${moduleName}`, {
            params: {
                fields: enumFields,
                lang: lang
            }
        });
        return response.data;
    } catch (error) {
        console.warn("Get Enum API error:", error);
        throw error;
    }
};
//V8/module/AOS_Quotes/${id}/relationships/aos_products_quotes
export const getAosProductsQuotesApi = async (quoteId) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/module/AOS_Quotes/${quoteId}/relationships/aos_products_quotes`);
        return response.data;
    } catch (error) {
        console.warn("Get AOS Products Quotes API error:", error);
        throw error;
    }
};

///Api/V8/custom/aos_products_quotes/language/lang=en_us
export const getAosProductsQuotesLangApi = async (lang) => {
    try {
        const response = await axiosInstance.get(`/Api/V8/custom/AOS_products_quotes/language/lang=${lang}`);
        return response.data;
    } catch (error) {
        console.warn("Get AOS Products Quotes Language API error:", error);
        throw error;
    }
}