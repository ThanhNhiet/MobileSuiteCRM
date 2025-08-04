import ReadCacheView from '@/src/utils/cacheViewManagement/Tasks/ReadCacheView';
import WriteCacheView from '@/src/utils/cacheViewManagement/Tasks/WriteCacheView';
import TaskApi from '../../api/task/TaskApi';
const TaskData = {};

/**
 * Lấy các trường bắt buộc không rỗng cho Task module
 */
TaskData.getRequiredFields = async (token) => {
  try {
    let ObjectrequiredFields = null;
    const cacheExists = await WriteCacheView.checkPath('Tasks', '/requiredFields/required_fields');

    if (!cacheExists) {
      // Lấy từ API
      ObjectrequiredFields = await TaskApi.getFields(token);
      if (!ObjectrequiredFields) {
        console.error('❌ Không thể lấy required fields từ API');
        return null;
      }
      
      // Lưu vào cache
      await WriteCacheView.saveModuleField('Meetings', '/requiredFields/required_fields', ObjectrequiredFields);
    } else {
      // Lấy từ cache
      ObjectrequiredFields = await ReadCacheView.getModuleField('Meetings', '/requiredFields/required_fields');
      if (!ObjectrequiredFields) {
        console.error('❌ Không thể lấy required fields từ cache');
        return null;
      }
    }
    const attributes = ObjectrequiredFields?.data?.attributes || {};
    const requiredFields = Object.entries(attributes)
      .filter(([_, val]) => val.required === true)
      .map(([key, val]) => ({
        field: key,
        type: val.type || null,
        dbType: val.dbType || null
      }));
      
    return requiredFields;
  } catch (error) {
    console.error('💥 Error in getRequiredFields:', error);
    return null;
  }
};


/**
 * Lấy dữ liệu ngôn ngữ cho module
 */
TaskData.getLanguageModule = async (token, language) => {
  try {
    let languageData = null;
    const cacheExists = await WriteCacheView.checkLanguage('Tasks', language);

    if (!cacheExists) {
      // Lấy từ API
      languageData = await TaskApi.getLanguage(token, language);
      if (!languageData) {
        console.error('❌ Không thể lấy dữ liệu ngôn ngữ từ API');
        return {};
      }
      
      // Lưu vào cache
      await WriteCacheView.writeModuleLanguage('Tasks', language, languageData);
    } else {
      // Lấy từ cache
      languageData = await ReadCacheView.getModuleLanguage('Tasks', language);
      if (!languageData) {
        console.error('❌ Không thể lấy dữ liệu ngôn ngữ từ cache');
        return {};
      }
    }
    
    return languageData?.data?.mod_strings || languageData?.mod_strings || {};
  } catch (error) {
    console.error('💥 Error in getLanguageModule:', error);
    return {};
  }
};


/**
 * Lấy dữ liệu list view
 */
TaskData.getListView = async (token) => {
  try {
    let listViewData = null;
    const cacheExists = await WriteCacheView.checkPath('Tasks', '/listViews/list_view');

    if (!cacheExists) {
      // Lấy từ API
      listViewData = await TaskApi.getListFieldsView(token);
      if (!listViewData) {
        console.error('❌ Không thể lấy dữ liệu list view từ API');
        return [];
      }
      
      // Lưu vào cache
      await WriteCacheView.saveModuleField('Tasks', '/listViews/list_view', listViewData);
    } else {
      // Lấy từ cache
      listViewData = await ReadCacheView.getModuleField('Tasks', '/listViews/list_view');
      if (!listViewData) {
        console.error('❌ Không thể lấy dữ liệu list view từ cache');
        return [];
      }
    }
    
    const default_fields = listViewData?.default_fields || {};
    const listViewFields = Object.entries(default_fields).map(([key, value]) => ({
      field: key,
      label: value.label || key,
      type: value.type || 'string',
      link: value.link || false
    }));
    
    return listViewFields;
  } catch (error) {
    console.error('💥 Error in getListView:', error);
    return [];
  }
};

/**
 * Lấy dữ liệu edit view
 */
TaskData.getEditView = async (token) => {
  try {
    let editViewData = null;
    const cacheExists = await WriteCacheView.checkPath('Tasks', '/editViews/edit_view');

    if (!cacheExists) {
      // Lấy từ API
      editViewData = await TaskApi.getEditView(token);
      if (!editViewData) {
        console.error('❌ Không thể lấy dữ liệu edit view từ API');
        return [];
      }
      
      // Lưu vào cache
      await WriteCacheView.saveModuleField('Tasks', '/editViews/edit_view', editViewData);
    } else {
      // Lấy từ cache
      editViewData = await ReadCacheView.getModuleField('Tasks', '/editViews/edit_view');
      if (!editViewData) {
        console.error('❌ Không thể lấy dữ liệu edit view từ cache');
        return [];
      }
    }
    
    const editViews = Object.entries(editViewData || {}).map(([field, label]) => ({ 
      field, 
      label 
    }));
    
    return editViews;
  } catch (error) {
    console.error('💥 Error in getEditView:', error);
    return [];
  }
};



// Lấy danh sách dữ liệu theo trang
TaskData.getDataByPage = async(token, page, pageSize) => {
  try {
    const response = await TaskApi.getDataByPage(token, page, pageSize);

    if (!response || !response.data) {
     
      return null;
    }

    // Trả về data với meta information
    return {
      meta: response.meta || {},
      meetings: response.data.map(meeting => ({
        id: meeting.id,
        type: meeting.type,
        ...meeting.attributes
      }))
    };
    
  } catch (error) {
    console.error('💥 Error in getDataByPage:', error);
    return null;
  }
};

/**
 * Tổng hợp tất cả dữ liệu cần thiết cho list view
 */
TaskData.useListData = async (token, page, pageSize, language) => {
  try {
    // 1. Lấy toàn bộ dữ liệu song song
    const [
      requiredFields,
      listViews,
      editViews,
      languageData,
      data
    ] = await Promise.all([
      TaskData.getRequiredFields(token),
      TaskData.getListView(token),
      TaskData.getEditView(token),
      TaskData.getLanguageModule(token, language),
      TaskData.getDataByPage(token, page, pageSize)
    ]);
    

    // 2. Kiểm tra dữ liệu
    if (!data || !requiredFields || !listViews || !editViews || !languageData) {
      console.warn('❗ Không có đủ dữ liệu để hiển thị.');
      return null;
    }

    // 3. Hàm dịch label
    const translateLabel = (fieldKey, originalLabel) => {
      if (!languageData || typeof languageData !== 'object') return originalLabel || fieldKey;

      // Ưu tiên label gốc nếu là LBL_ và có trong languageData
      if (originalLabel?.startsWith('LBL_') && languageData[originalLabel]) {
        return languageData[originalLabel];
      }

      const upperKey = fieldKey.toUpperCase();
      const labelCandidates = [
        `LBL_LIST_${upperKey}`,
        `LBL_${upperKey}`,
        upperKey,
        fieldKey
      ];

      // Ưu tiên đặc biệt cho 'name'
      if (fieldKey === 'name') {
        labelCandidates.unshift('LBL_ACCOUNT_NAME', 'LBL_LIST_ACCOUNT_NAME');
      }

      for (const key of labelCandidates) {
        if (languageData[key]) return languageData[key];
      }

      // Một số ánh xạ đặc biệt fallback
      const manualLabels = {
        email1: 'Email',
        phone_office: 'Số điện thoại',
        assigned_user_name: 'Người phụ trách',
        date_entered: 'Ngày tạo',
        date_modified: 'Ngày sửa',
        description: 'Mô tả'
      };

      return manualLabels[fieldKey] ||
        (fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1).replace(/_/g, ' '));
    };

    // 4. Biến đổi list view
    const translatedListViews = listViews.map(field => ({
      key: field.field.toLowerCase(),
      label: translateLabel(field.field, field.label),
      originalLabel: field.label,
      type: field.type || 'string',
      link: field.link || false
    }));

    // 5. Biến đổi edit view
    const translatedEditViews = editViews.map(field => {
      const labelKey = field.label?.trim() ? field.label : `LBL_${field.field.toUpperCase()}`;
      return {
        key: field.field,
        label: translateLabel(field.field, labelKey),
        originalLabel: field.label || labelKey,
        type: field.type || 'string'
      };
    });

    // 6. Chuẩn hóa dữ liệu từng task/meeting
    const processedMeetings = (data.meetings || []).map(meeting => {
      const processed = {
        id: meeting.id,
        type: meeting.type
      };

      editViews.forEach(field => {
        processed[field.field] = meeting[field.field] || '';
      });

      return processed;
    });

    // 7. Trả về object dữ liệu
    return {
      tasks: processedMeetings,
      detailFields: translatedListViews,
      listViews: translatedListViews,
      editViews: translatedEditViews,
      requiredFields,
      meta: data.meta || {},

      // Các hàm tiện ích
      getFieldValue: (item, key) => item?.[key] || '',

      getFieldLabel: (key) => {
        return translatedListViews.find(f => f.key === key)?.label ||
               translatedEditViews.find(f => f.key === key)?.label ||
               translateLabel(key, key);
      },

      shouldDisplayField: (key) => listViews.some(f => f.field === key),

      formatFieldValue: (key, value) => {
        if (!value) return '';

        const field = translatedListViews.find(f => f.key === key) ||
                      translatedEditViews.find(f => f.key === key);

        if (!field) return value;

        switch (field.type) {
          case 'date':
          case 'datetime':
            try {
              return new Date(value).toLocaleDateString('vi-VN');
            } catch {
              return value;
            }
          case 'currency':
            return new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(parseFloat(value) || 0);
          case 'bool':
            return value ? 'Có' : 'Không';
          default:
            return value;
        }
      }
    };

  } catch (error) {
    console.error('💥 Error in useListData:', error);
    return null;
  }
};



// lấy mối quan hệ của task với metadata từ V8/meta/modules
TaskData.getRelationships = async (token, taskId) => {
  try {
    const relationshipsResponse = await TaskApi.getRelationships(token, taskId);
    if (!relationshipsResponse?.data) {
      return null;
    }

    const relationshipsData = relationshipsResponse.data.relationships || relationshipsResponse.relationships;
    if (!relationshipsData) {
      return { relationships: [] };
    }

    const relationshipsArray = Object.entries(relationshipsData).map(([moduleName, relationData]) => {
      return {
        id: moduleName.toLowerCase(),
        moduleName,
        displayName: moduleName, // hoặc có thể dùng hàm khác nếu bạn có getModuleDisplayName
        moduleLabel: moduleName,
        moduleLabelSingular: moduleName,
        moduleTable: moduleName.toLowerCase(),
        relatedLink: relationData.links?.related || '',
        meetingId: relationData.links?.related?.split('/')?.[3] || meetingId
      };
    });

    const importantModules = ['Notes', 'Contacts', 'Accounts', 'Tasks', 'Calls'];
    const sortedRelationships = relationshipsArray
      .filter(rel => importantModules.includes(rel.moduleName))
      .sort((a, b) => {
        const order = importantModules;
        return order.indexOf(a.moduleName) - order.indexOf(b.moduleName);
      });

    return {
      relationships: sortedRelationships,
      allRelationships: relationshipsArray,
      moduleMetadata: null // vì không còn metaResponse
    };
  } catch (error) {
    console.error('getRelationships error:', error);
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