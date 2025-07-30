import WriteCacheView from '@/src/utils/cacheViewManagement/Meetings/WriteCacheView';
import ReadCacheView from '../../../utils/cacheViewManagement/Meetings/ReadCacheView';
import MeetingApi from '../../api/meeting/MeetingApi';

const MeetingData = {};


/**
 * Lấy các trường bắt buộc không rỗng cho Meeting module
 */
MeetingData.getRequiredFields = async (token) => {
  try {
    let ObjectrequiredFields = null;
    const cacheExists = await WriteCacheView.checkPath('Meetings', '/requiredFields/required_fields');
    
    if (!cacheExists) {
      // Lấy từ API
      ObjectrequiredFields = await MeetingApi.getFields(token);
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
MeetingData.getLanguageModule = async (token, language) => {
  try {
    let languageData = null;
    const cacheExists = await WriteCacheView.checkPath('Meetings', `/language/${language}`);

    if (!cacheExists) {
      // Lấy từ API
      languageData = await MeetingApi.getLanguage(token, language);
      if (!languageData) {
        console.error('❌ Không thể lấy dữ liệu ngôn ngữ từ API');
        return {};
      }
      
      // Lưu vào cache
      await WriteCacheView.writeModuleLanguage('Meetings', language, languageData);
    } else {
      // Lấy từ cache
      languageData = await ReadCacheView.getModuleLanguage('Meetings', language);
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
MeetingData.getListView = async (token) => {
  try {
    let listViewData = null;
    const cacheExists = await WriteCacheView.checkPath('Meetings', '/listViews/list_view');

    if (!cacheExists) {
      // Lấy từ API
      listViewData = await MeetingApi.getListFieldsView(token);
      if (!listViewData) {
        console.error('❌ Không thể lấy dữ liệu list view từ API');
        return [];
      }
      
      // Lưu vào cache
      await WriteCacheView.saveModuleField('Meetings', '/listViews/list_view', listViewData);
    } else {
      // Lấy từ cache
      listViewData = await ReadCacheView.getModuleField('Meetings', '/listViews/list_view');
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
MeetingData.getEditView = async (token) => {
  try {
    let editViewData = null;
    const cacheExists = await WriteCacheView.checkPath('Meetings', '/editViews/edit_view');

    if (!cacheExists) {
      // Lấy từ API
      editViewData = await MeetingApi.getEditView(token);
      if (!editViewData) {
        console.error('❌ Không thể lấy dữ liệu edit view từ API');
        return [];
      }
      
      // Lưu vào cache
      await WriteCacheView.saveModuleField('Meetings', '/editViews/edit_view', editViewData);
    } else {
      // Lấy từ cache
      editViewData = await ReadCacheView.getModuleField('Meetings', '/editViews/edit_view');
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
MeetingData.getDataByPage = async(token, page, pageSize) => {
  try {
    const response = await MeetingApi.getDataByPage(token, page, pageSize);
    
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
MeetingData.useListData = async (token, page, pageSize, language) => {
  try {
    const [requiredFields, listViews, editViews, languageData, data] = await Promise.all([
      MeetingData.getRequiredFields(token),
      MeetingData.getListView(token),
      MeetingData.getEditView(token),
      MeetingData.getLanguageModule(token, language),
      MeetingData.getDataByPage(token, page, pageSize)
    ]);


    if (!data || !requiredFields || !listViews || !editViews || !languageData) {
      console.warn('❗ Không có dữ liệu cuộc họp nào để hiển thị');
      return null;
    }

    const translateLabel = (fieldKey, originalLabel) => {
      if (!languageData || typeof languageData !== 'object') {
        return originalLabel || fieldKey;
      }

      const labelKey = originalLabel?.startsWith('LBL_') ? originalLabel : `LBL_${fieldKey.toUpperCase()}`;
      if (languageData[labelKey]) {
        return languageData[labelKey];
      }

      const altKeys = [
        `LBL_LIST_${fieldKey.toUpperCase()}`,
        fieldKey,
        fieldKey.toUpperCase()
      ];

      if (fieldKey === 'name') {
        altKeys.unshift('LBL_ACCOUNT_NAME', 'LBL_LIST_ACCOUNT_NAME');
      }

      for (const key of altKeys) {
        if (languageData[key]) {
          return languageData[key];
        }
      }

      const specialFormats = {
        email1: 'Email',
        phone_office: 'Số điện thoại',
        website: 'Website',
        billing_address_street: 'Địa chỉ thanh toán',
        shipping_address_street: 'Địa chỉ giao hàng',
        assigned_user_name: 'Người phụ trách',
        date_entered: 'Ngày tạo',
        date_modified: 'Ngày sửa',
        description: 'Mô tả'
      };

      return specialFormats[fieldKey] ||
        (fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1).replace(/_/g, ' '));
    };

    const translatedListViews = listViews.map(field => ({
      key: field.field.toLowerCase(),
      label: translateLabel(field.field, field.label),
      originalLabel: field.label,
      type: field.type || 'string',
      link: field.link || false
    }));

    const translatedEditViews = editViews.map(field => {
      const labelKey = field.label?.trim() ? field.label : `LBL_${field.field.toUpperCase()}`;
      return {
        key: field.field,
        label: translateLabel(field.field, labelKey || field.label),
        originalLabel: field.label || labelKey,
        type: field.type || 'string'
      };
    });

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
    return {
      meetings: processedMeetings,
      detailFields: translatedListViews,
      listViews: translatedListViews,
      editViews: translatedEditViews,
      requiredFields,
      meta: data.meta || {},

      getFieldValue: (accountData, key) => accountData?.[key] || '',

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


// lấy mối quan hệ của meeting với metadata từ V8/meta/modules
MeetingData.getRelationships = async (token, meetingId) => {
  try {
    const relationshipsResponse = await MeetingApi.getRelationships(token, meetingId);
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

MeetingData.CreateMeeting = async (data, token) => {
  try {
    const response = await MeetingApi.createMeeting(data, token);
    return response;
  } catch (error) {
    console.error('💥 Error in CreateMeeting:', error);
    return null;
  }
};

MeetingData.UpdateMeeting = async (meetingId, data, token) => {
  try {
    const response = await MeetingApi.updateMeeting(meetingId, data, token);
    return response;
  } catch (error) {
    console.error('💥 Error in UpdateMeeting:', error);
    return null;
  }
}

MeetingData.DeleteMeeting = async (meetingId, token) => {
  try {
    const response = await MeetingApi.deleteMeeting(meetingId, token);
    return response;
  } catch (error) {
    console.error('💥 Error in DeleteMeeting:', error);
    return null;
  }
};

export default MeetingData;