import ReadCacheView from '@/src/utils/cacheViewManagement/Relationships/ReadCacheView';
import WriteCacheView from '@/src/utils/cacheViewManagement/Relationships/WriteCacheView';
import RelationshipsApi from '../../api/relationship/RelationshipApi';
const RelationshipsData = {};

RelationshipsData.getRequiredFields = async (token,moduleName) => {
  try {
    let ObjectrequiredFields = null;
    const cacheExists = await WriteCacheView.checkPath(moduleName, '/requiredFields/required_fields');
    
    if (!cacheExists) {
      // Lấy từ API
      ObjectrequiredFields = await RelationshipsApi.getFields(token,moduleName);
      if (!ObjectrequiredFields) {
        console.error('❌ Không thể lấy required fields từ API');
        return null;
      }
     
      // Lưu vào cache
      await WriteCacheView.saveModuleField(moduleName, '/requiredFields/required_fields', ObjectrequiredFields);
    } else {
      // Lấy từ cache
      ObjectrequiredFields = await ReadCacheView.getModuleField(moduleName, '/requiredFields/required_fields');
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
RelationshipsData.getLanguageModule = async (token, language,moduleName) => {
  try {
    let languageData = null;
    const cacheExists = await WriteCacheView.checkLanguage(moduleName, language);

    if (!cacheExists) {
      // Lấy từ API
      languageData = await RelationshipsApi.getRelationshipsLanguage(token, moduleName, language);
      if (!languageData) {
        console.error('❌ Không thể lấy dữ liệu ngôn ngữ từ API');
        return {};
      }
      
      // Lưu vào cache
      await WriteCacheView.writeModuleLanguage(moduleName, language, languageData);
    } else {
      // Lấy từ cache
      languageData = await ReadCacheView.getModuleLanguage(moduleName, language);
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
RelationshipsData.getListView = async (token,moduleName) => {
  try {
    let listViewData = null;
    const cacheExists = await WriteCacheView.checkPath(moduleName, '/listViews/list_view');

    if (!cacheExists) {
      // Lấy từ API
      listViewData = await RelationshipsApi.getListViewModules(token,moduleName);
      if (!listViewData) {
        console.error('❌ Không thể lấy dữ liệu list view từ API');
        return [];
      }
     
      // Lưu vào cache
      await WriteCacheView.saveModuleField(moduleName, '/listViews/list_view', listViewData);
    } else {
      // Lấy từ cache
      listViewData = await ReadCacheView.getModuleField(moduleName, '/listViews/list_view');
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
RelationshipsData.getEditView = async (token,moduleName) => {
  try {
    let editViewData = null;
    const cacheExists = await WriteCacheView.checkPath(moduleName, '/editViews/edit_view');

    if (!cacheExists) {
      // Lấy từ API
      editViewData = await  RelationshipsApi.getEditView(token, moduleName);
      if (!editViewData) {
        console.error('❌ Không thể lấy dữ liệu edit view từ API');
        return [];
      }
    
      // Lưu vào cache
      await WriteCacheView.saveModuleField(moduleName, '/editViews/edit_view', editViewData);
    } else {
      // Lấy từ cache
      editViewData = await ReadCacheView.getModuleField(moduleName, '/editViews/edit_view');
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

/**
 * Lấy danh sách dữ liệu theo trang
 */
RelationshipsData.getDataByPage = async (token, relatedLink, page, pageSize) => {
  try {
    const response = await RelationshipsApi.getRelationshipsData(token, relatedLink, page, pageSize);

    if (!response || !response.data) {
      return { accounts: [], meta: {} };
    }

    return {
      meta: response.meta || {},
      accounts: response.data.map(account => ({
        id: account.id,
        type: account.type,
        ...account.attributes
      }))
    };
    
  } catch (error) {
    console.error('💥 Error in getDataByPage:', error);
    return { accounts: [], meta: {} };
  }
};

/**
 * Tổng hợp tất cả dữ liệu cần thiết cho list view
 */
RelationshipsData.useListData = async (token, page, pageSize, language,moduleName,relatedLink) => {
  try {
    // Lấy dữ liệu fields và data song song
    const [requiredFields, listViews, editViews, languageData, data] = await Promise.all([
      RelationshipsData.getRequiredFields(token,moduleName),
      RelationshipsData.getListView(token,moduleName),
      RelationshipsData.getEditView(token,moduleName),
      RelationshipsData.getLanguageModule(token, language,moduleName),
      RelationshipsData.getDataByPage(token,relatedLink, page, pageSize)
    ]);

    // console.log('📊 Data loaded:', {
    //   requiredFields: requiredFields?.length || 0,
    //   listViews: listViews?.length || 0,
    //   editViews: editViews?.length || 0,
    //   languageKeys: Object.keys(languageData || {}).length,
    //   accounts: data?.accounts?.length || 0
    // });
    // Nếu không có dữ liệu nào, trả về null
    if (!data || !requiredFields || !listViews || !editViews || !languageData) {
      console.warn('❗ Không có dữ liệu tài khoản nào để hiển thị');
      return null;
    }

    // Helper function để dịch label từ languageData
    const translateLabel = (fieldKey, originalLabel) => {
      if (!languageData || typeof languageData !== 'object') {
        return originalLabel || fieldKey;
      }

      const translationKeys = [
        originalLabel,
        `LBL_${fieldKey.toUpperCase()}`,
        `LBL_LIST_${fieldKey.toUpperCase()}`,
        fieldKey,
        fieldKey.toUpperCase(),
      ];

      // Xử lý các trường đặc biệt
      if (fieldKey === 'name') {
        translationKeys.unshift('LBL_ACCOUNT_NAME', 'LBL_LIST_ACCOUNT_NAME');
      }

      // Tìm translation đầu tiên khả dụng
      for (const key of translationKeys) {
        if (languageData[key]) {
          return languageData[key];
        }
      }

      // Fallback formatting
      const specialFormats = {
        'email1': 'Email',
        'phone_office': 'Số điện thoại',
        'website': 'Website',
        'billing_address_street': 'Địa chỉ thanh toán',
        'shipping_address_street': 'Địa chỉ giao hàng',
        'assigned_user_name': 'Người phụ trách',
        'date_entered': 'Ngày tạo',
        'date_modified': 'Ngày sửa',
        'description': 'Mô tả'
      };

      return specialFormats[fieldKey] || 
        (fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1).replace(/_/g, ' '));
    };

    // Tạo danh sách với labels đã dịch
    const translatedListViews = (listViews || []).map(field => ({
      key: field.field.toLowerCase(),
      label: translateLabel(field.field, field.label),
      originalLabel: field.label,
      type: field.type || 'string',
      link: field.link || false
    }));

   const translatedEditViews = (editViews || []).map(field => {
      let label = null;
      if (field.label.trim() === '') {
        label = `LBL_${field.field.toUpperCase()}`;
      }
      return {
        key: field.field,
        label: translateLabel(field.field, field.label || label),
        originalLabel: field.label,
        type: field.type || 'string'
      };
    });


    // Process accounts data
    const processedAccounts = (data?.accounts || []).map(account => {
      const processedAccount = { 
        id: account.id, 
        type: account.type 
      };

      // Thêm tất cả fields từ listViews
      (editViews || []).forEach(field => {
        processedAccount[field.field] = account[field.field] || '';
      });

      return processedAccount;
    });
    
    return {
      accounts: processedAccounts,
      detailFields: translatedListViews,
      listViews: translatedListViews,
      editViews: translatedEditViews,
      requiredFields: requiredFields || [],
      meta: data?.meta || {},
      
      // Utility functions
      getFieldValue: (accountData, key) => accountData?.[key] || '',
      
      getFieldLabel: (key) => {
        const listField = translatedListViews.find(f => f.key === key);
        if (listField) return listField.label;
        
        const editField = translatedEditViews.find(f => f.key === key);
        if (editField) return editField.label;
        
        return translateLabel(key, key);
      },
      
      shouldDisplayField: (key) => (listViews || []).some(f => f.field === key),
      
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
            } catch (e) {
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

RelationshipsData.getDataRelationship = async (token, relatedLinks) => {
  try {
    let data = [];
    for (const ratelink of relatedLinks) {
      const response = await RelationshipsApi.getDataRelationship(token, ratelink.relatedLink);
      // Kiểm tra nếu response.data là mảng thì lấy length, nếu không thì gán là 0
      const length = Array.isArray(response.data) ? response.data.length : 0;
      const item = {
        length: length,
        moduleName: ratelink.moduleName,
      };
      data.push(item);
    }
    return data;
  } catch (error) {
    console.error('❌ Lỗi trong getDataRelationship:', error);
    throw error;
  }
};


export default RelationshipsData;
