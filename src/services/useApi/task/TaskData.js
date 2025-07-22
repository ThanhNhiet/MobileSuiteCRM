import TaskApi from '../../api/task/TaskApi';

// Helper function để lấy module metadata từ API
const getModuleMetadata = async (token) => {
  try {
    // Gọi API để lấy metadata của tất cả modules
    const metaResponse = await TaskApi.getModuleMeta(token);
    
    if (!metaResponse || !metaResponse.data) {
      
      return null;
    }

    // Chuyển đổi metadata thành object để dễ lookup
    const moduleMetaMap = {};
    if (Array.isArray(metaResponse.data)) {
      metaResponse.data.forEach(module => {
        if (module.attributes) {
          moduleMetaMap[module.attributes.name] = {
            name: module.attributes.name,
            label: module.attributes.label || module.attributes.name,
            labelSingular: module.attributes.label_singular || module.attributes.label || module.attributes.name,
            table: module.attributes.table || module.attributes.name.toLowerCase(),
            // Thêm các thông tin khác nếu cần
            ...module.attributes
          };
        }
      });
    }

    
    return moduleMetaMap;
  } catch (error) {
    console.error('💥 Error getting module metadata:', error);
    return null;
  }
};

// Helper function để chuyển đổi module name thành tên hiển thị từ metadata
const getModuleDisplayName = (moduleName, moduleMetaMap = null) => {
  // Nếu có metadata từ API, dùng label từ đó
  if (moduleMetaMap && moduleMetaMap[moduleName]) {
    return moduleMetaMap[moduleName].labelSingular || moduleMetaMap[moduleName].label || moduleName;
  }

  // Nếu không có metadata, trả về moduleName gốc
  return moduleName;
};

const TaskData = {};

TaskData.getFields = async (token) => {
  try {
   
    
    const fields = await TaskApi.getFields(token);
    const language = await TaskApi.getLanguage(token);

  

    if (!fields || !fields.data) {
      console.log('❌ No fields data');
      return null;
    }

    // Xác định cấu trúc language
    let modStrings = null;
    if (language && language.data && language.data.mod_strings) {
      modStrings = language.data.mod_strings;
      
    } else if (language && language.mod_strings) {
      modStrings = language.mod_strings;
      
    } else {
      
      modStrings = {};
    }

    const attributes = fields.data.attributes;

    const requiredFields = Object.entries(attributes || {})
      .filter(([_, val]) => val.required === true)
      .map(([key, val]) => {
        const { required, ...rest } = val;

        let translatedLabel = key; // Fallback mặc định

        // Dùng mod_strings từ API để dịch
        if (modStrings) {
          // Cách 1: Dùng pattern LBL_FIELDNAME
          const labelKey = `LBL_${key.toUpperCase()}`;
          if (modStrings[labelKey]) {
            translatedLabel = modStrings[labelKey];
            
          }
          // Cách 2: Dùng pattern LBL_LIST_FIELDNAME (cho list views)
          else if (modStrings[`LBL_LIST_${key.toUpperCase()}`]) {
            translatedLabel = modStrings[`LBL_LIST_${key.toUpperCase()}`];
            
          }
          // Cách 3: Dùng LBL_TASK_NAME cho field name
          else if (key === 'name' && modStrings['LBL_TASK_NAME']) {
            translatedLabel = modStrings['LBL_TASK_NAME'];
            
          }
          // Cách 4: Dùng LBL_LIST_TASK_NAME cho field name
          else if (key === 'name' && modStrings['LBL_LIST_TASK_NAME']) {
            translatedLabel = modStrings['LBL_LIST_TASK_NAME'];
            
          }
          // Cách 5: Dùng key trực tiếp
          else if (modStrings[key]) {
            translatedLabel = modStrings[key];
            
          }
          // Cách 6: Dùng key uppercase
          else if (modStrings[key.toUpperCase()]) {
            translatedLabel = modStrings[key.toUpperCase()];
           
          }
          // Cách 7: Xử lý các field đặc biệt cho Task
          else if (key === 'date_due' && (modStrings['LBL_DATE_DUE'] || modStrings['LBL_DUE_DATE'])) {
            translatedLabel = modStrings['LBL_DATE_DUE'] || modStrings['LBL_DUE_DATE'];
            
          }
          else if (key === 'date_start' && (modStrings['LBL_DATE_START'] || modStrings['LBL_START_DATE'])) {
            translatedLabel = modStrings['LBL_DATE_START'] || modStrings['LBL_START_DATE'];
            
          }
          else if (key === 'priority' && modStrings['LBL_PRIORITY']) {
            translatedLabel = modStrings['LBL_PRIORITY'];
            
          }
          else if (key === 'status' && modStrings['LBL_STATUS']) {
            translatedLabel = modStrings['LBL_STATUS'];
            
          }
          // Cách 8: Tìm theo pattern khác trong mod_strings
          else {
            // Tìm các keys trong mod_strings có chứa tên field
            const possibleKeys = Object.keys(modStrings).filter(k => 
              k.toLowerCase().includes(key.toLowerCase()) ||
              (key === 'name' && (k.includes('TASK') || k.includes('NAME'))) ||
              (key === 'date_due' && (k.includes('DUE') || k.includes('DATE'))) ||
              (key === 'date_start' && (k.includes('START') || k.includes('DATE'))) ||
              (key === 'date_entered' && (k.includes('ENTERED') || k.includes('CREATED') || k.includes('DATE'))) ||
              (key === 'date_modified' && (k.includes('MODIFIED') || k.includes('UPDATED') || k.includes('DATE'))) ||
              (key.includes('priority') && k.includes('PRIORITY')) ||
              (key.includes('status') && k.includes('STATUS'))
            );
            
            if (possibleKeys.length > 0) {
              translatedLabel = modStrings[possibleKeys[0]];
            } else {
              console.log(`⚠️ No translation found for ${key}, using formatted key`);
            }
          }
        }

        // Nếu vẫn chưa có label từ API, format key đẹp hơn
        if (translatedLabel === key) {
          // Format đặc biệt cho một số field thông dụng của Task
          const specialFormats = {
            'name': 'Tên công việc',
            'date_due': 'Hạn hoàn thành',
            'date_start': 'Ngày bắt đầu',
            'priority': 'Độ ưu tiên',
            'status': 'Trạng thái',
            'description': 'Mô tả',
            'assigned_user_name': 'Người phụ trách',
            'date_entered': 'Ngày tạo',
            'date_modified': 'Ngày sửa',
            'parent_name': 'Liên quan đến',
            'parent_type': 'Loại liên quan'
          };
          
          if (specialFormats[key]) {
            translatedLabel = specialFormats[key];
          } else {
            // Format mặc định: viết hoa chữ cái đầu và thay _ thành khoảng trắng
            translatedLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
          }
        }

        return {
          key,
          label: translatedLabel,
          ...rest
        };
      });

    
    return requiredFields;
    
  } catch (error) {
    console.error('💥 Error in getFields:', error);
    return null;
  }
};

// Lấy danh sách các trường hiển thị trong view
TaskData.getListFieldsView = async (token) => {
  try {
    
    
    const fields = await TaskApi.getListFieldsView(token);
    const language = await TaskApi.getLanguage(token);
    
   

    // Kiểm tra fields response
    if (!fields) {
      console.log('❌ Fields is null/undefined');
      return null;
    }
    
    // Xác định cấu trúc fields
    let defaultFieldsObject = null;
    if (fields.default_fields) {
      defaultFieldsObject = fields.default_fields;
      
    } else if (fields.data && fields.data.default_fields) {
      defaultFieldsObject = fields.data.default_fields;
      
    } else {
      
      return null;
    }

    // Kiểm tra language response
    if (!language) {
      console.log('❌ Language is null/undefined');
      return null;
    }
    
    // Xác định cấu trúc language
    let modStrings = null;
    if (language.data && language.data.mod_strings) {
      modStrings = language.data.mod_strings;
     
    } else if (language.mod_strings) {
      modStrings = language.mod_strings;
      
    } else {
      
      return null;
    }

    // Chuyển đổi object thành array
    const defaultFields = Object.entries(defaultFieldsObject).map(([key, field]) => ({
      key,
      ...field
    }));
    
   

    // Dịch labels
    const translatedFields = defaultFields.map((field) => {
      let translatedLabel = field.key; // Fallback mặc định
      
      // Thử các cách dịch khác nhau
      if (field.label && modStrings[field.label]) {
        // Cách 1: Dùng field.label làm key trong mod_strings
        translatedLabel = modStrings[field.label];
       
      } else if (modStrings[field.key]) {
        // Cách 2: Dùng field.key trực tiếp
        translatedLabel = modStrings[field.key];
        
      } else if (modStrings[`LBL_${field.key.toUpperCase()}`]) {
        // Cách 3: Dùng pattern LBL_FIELDNAME
        translatedLabel = modStrings[`LBL_${field.key.toUpperCase()}`];
        
      } else {
        console.log(`⚠️ No translation found for ${field.key}, using fallback: ${translatedLabel}`);
      }
      
      return {
        ...field,
        label: translatedLabel,
        originalLabel: field.label // Giữ lại label gốc để debug
      };
    });
    
   
    return translatedFields;
    
  } catch (error) {
    console.error('💥 Error in getListFieldsView:', error);
    return null;
  }
};

// Lấy danh sách dữ liệu theo trang
TaskData.getDataByPage = async(token, page, pageSize) => {
  try {
    
    const response = await TaskApi.getDataByPage(token, page, pageSize);
    
    
    
    if (!response || !response.data) {
      console.log('❌ TaskData: No data in response');
      return null;
    }

    

    // Trả về data với meta information
    const result = {
      meta: response.meta || {},
      tasks: response.data.map(task => {
        
        return {
          id: task.id,
          type: task.type,
          ...task.attributes
        };
      })
    };
    
  
    return result;
    
  } catch (error) {
    console.error('💥 Error in TaskData.getDataByPage:', error);
    return null;
  }
};

// Lấy danh sách dữ liệu theo fields đã định nghĩa
TaskData.getDataWithFields = async(token, page, pageSize) => {
  try {
 
    
    // Lấy fields và data song song
    const [fieldsResult, dataResult] = await Promise.all([
      TaskData.getFields(token),
      TaskData.getDataByPage(token, page, pageSize)
    ]);

  
    if (!fieldsResult || !dataResult) {
    
      return null;
    }

    // Xử lý tasks data
    const processedTasks = dataResult.tasks.map(task => {
      // Tạo object task với cấu trúc đơn giản
      const processedTask = { 
        id: task.id, 
        type: task.type 
      };
      
      // Thêm tất cả attributes vào task object
      fieldsResult.forEach(field => {
        const fieldKey = field.key;
        processedTask[fieldKey] = task[fieldKey] || '';
      });

      // Đảm bảo luôn có assigned_user_name field
      if (!processedTask.assigned_user_name) {
        processedTask.assigned_user_name = task.assigned_user_name || '';
      }

      // Đảm bảo luôn có created_by_name field
      if (!processedTask.created_by_name) {
        processedTask.created_by_name = task.created_by_name || '';
      }

      return processedTask;
    });
    // Trả về object với cấu trúc giống useTaskDetail
    return {
      tasks: processedTasks,
      detailFields: fieldsResult.map(field => ({
        key: field.key,
        label: field.label ? field.label.replace(':', '') : field.key
      })),
      meta: dataResult.meta || {},
      getFieldValue: (taskData, key) => {
        return taskData[key] || '';
      },
      getFieldLabel: (key) => {
        const field = fieldsResult.find(f => f.key === key);
        return field ? field.label : key;
      },
      shouldDisplayField: (key) => {
        return fieldsResult.some(f => f.key === key);
      }
    };
    
  } catch (error) {
    console.error('💥 Error in getDataWithFields:', error);
    return null;
  }
};

// lấy mối quan hệ của task với metadata từ V8/meta/modules
TaskData.getRelationships = async (token, taskId) => {
  try {
    // Lấy metadata và relationships song song để tối ưu performance
    const [metaResponse, relationshipsResponse] = await Promise.all([
      getModuleMetadata(token),
      TaskApi.getRelationships(token, taskId)
    ]);

    if (!relationshipsResponse || !relationshipsResponse.data) {
      
      return null;
    }

    // Xử lý relationships data từ API
    const relationshipsData = relationshipsResponse.data.relationships || relationshipsResponse.relationships;
    
    if (!relationshipsData) {
     
      return { relationships: [] };
    }

    // Chuyển đổi object relationships thành array với metadata
    const relationshipsArray = Object.entries(relationshipsData).map(([moduleName, relationData]) => {
      const moduleInfo = metaResponse ? metaResponse[moduleName] : null;
      
      return {
        id: moduleName.toLowerCase(),
        moduleName: moduleName,
        displayName: getModuleDisplayName(moduleName, metaResponse),
        moduleLabel: moduleInfo?.label || moduleName,
        moduleLabelSingular: moduleInfo?.labelSingular || moduleName,
        moduleTable: moduleInfo?.table || moduleName.toLowerCase(),
        relatedLink: relationData.links?.related || '',
        // Tách taskId từ link để sử dụng sau
        taskId: relationData.links?.related ? 
          relationData.links.related.split('/')[3] : taskId
      };
    });

    // Lọc các relationships quan trọng dựa trên metadata hoặc hardcode list
    const importantModules = ['Notes', 'Contacts', 'Accounts', 'Meetings', 'Calls', 'Opportunities', 'Cases'];
    const importantRelationships = relationshipsArray.filter(rel => 
      importantModules.includes(rel.moduleName)
    );

    // Sắp xếp theo thứ tự ưu tiên
    const sortedRelationships = importantRelationships.sort((a, b) => {
      const order = ['Notes', 'Contacts', 'Accounts', 'Meetings', 'Calls', 'Opportunities', 'Cases'];
      const indexA = order.indexOf(a.moduleName);
      const indexB = order.indexOf(b.moduleName);
      return (indexA !== -1 ? indexA : 999) - (indexB !== -1 ? indexB : 999);
    });

    // Trả về data với meta information
    return {
      relationships: sortedRelationships,
      allRelationships: relationshipsArray, // Giữ tất cả để sử dụng sau
      moduleMetadata: metaResponse 
    };
  } catch (error) {
    return null;
  }
};

// Tạo task mới
TaskData.CreateTask = async (data, token) => {
  try {
    const response = await TaskApi.createTask(data, token);
    return response;
  } catch (error) {
    console.error('💥 Error in CreateTask:', error);
    throw error;
  }
};

TaskData.UpdateTask = async (taskId, data, token) => {
  try {
    const response = await TaskApi.updateTask(taskId, data, token);
    return response;
  } catch (error) {
    console.error('💥 Error in UpdateTask:', error);
    throw error;
  }
}

TaskData.DeleteTask = async (taskId, token) => {
  try {
    const response = await TaskApi.deleteTask(taskId, token);
    return response;
  } catch (error) {
    console.error('💥 Error in DeleteTask:', error);
    return null;
  }
};

export default TaskData;