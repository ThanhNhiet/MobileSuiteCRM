import { searchModulesApi } from '../../../services/api/external/ExternalApi';
import ReadCacheView from '../../../utils/cacheViewManagement/Accounts/ReadCacheView';
import WriteCacheView from '../../../utils/cacheViewManagement/Accounts/WriteCacheView';
import { SystemLanguageUtils } from '../../../utils/cacheViewManagement/SystemLanguageUtils';
import AccountApi from '../../api/account/AccountApi';

const AccountData = {};

/**
 * Lấy các trường bắt buộc không rỗng cho Account module
 */
AccountData.getRequiredFields = async (token) => {
  try {
    let ObjectrequiredFields = null;
    const cacheExists = await WriteCacheView.checkPath('Accounts', '/requiredFields/requiredfields');
    
    if (!cacheExists) {
      // Lấy từ API
      ObjectrequiredFields = await AccountApi.getFields(token);
      if (!ObjectrequiredFields) {
        console.error('❌ Không thể lấy required fields từ API');
        return null;
      }
     
      // Lưu vào cache
      await WriteCacheView.saveModuleField('Accounts', '/requiredFields/requiredfields', ObjectrequiredFields);
    } else {
      // Lấy từ cache
      ObjectrequiredFields = await ReadCacheView.getModuleField('Accounts', '/requiredFields/requiredfields');
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
AccountData.getLanguageModule = async (token, language) => {
  try {
    let languageData = null;
    const cacheExists = await WriteCacheView.checkLanguage('Accounts', language);
    if (!cacheExists) {
      // Lấy từ API
      languageData = await AccountApi.getLanguage(token, language);
      if (!languageData) {
        console.error('❌ Không thể lấy dữ liệu ngôn ngữ từ API');
        return {};
      }
      
      // Lưu vào cache
      await WriteCacheView.writeModuleLanguage('Accounts', language, languageData);
    } else {
      // Lấy từ cache
      languageData = await ReadCacheView.getModuleLanguage('Accounts', language);
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
AccountData.getListView = async (token) => {
  try {
    let listViewData = null;
    const cacheExists = await WriteCacheView.checkPath('Accounts', '/listViews/listviewdefs');
    
    if (!cacheExists) {
      // Lấy từ API
      listViewData = await AccountApi.getListFieldsView(token);
      if (!listViewData) {
        console.error('❌ Không thể lấy dữ liệu list view từ API');
        return [];
      }
     
      // Lưu vào cache
      await WriteCacheView.saveModuleField('Accounts', '/listViews/listviewdefs', listViewData);
    } else {
      // Lấy từ cache
      listViewData = await ReadCacheView.getModuleField('Accounts', '/listViews/listviewdefs');
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
AccountData.getEditView = async (token) => {
  try {
    let editViewData = null;
    const cacheExists = await WriteCacheView.checkPath('Accounts', '/editViews/editviewdefs');
    
    if (!cacheExists) {
      // Lấy từ API
      editViewData = await AccountApi.getEditView(token);
      if (!editViewData) {
        console.error('❌ Không thể lấy dữ liệu edit view từ API');
        return [];
      }
    
      // Lưu vào cache
      await WriteCacheView.saveModuleField('Accounts', '/editViews/editviewdefs', editViewData);
    } else {
      // Lấy từ cache
      editViewData = await ReadCacheView.getModuleField('Accounts', '/editViews/editviewdefs');
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
AccountData.getDataByPage = async (token, page, pageSize) => {
  try {
    const response = await AccountApi.getDataByPage(token, page, pageSize);
    
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
AccountData.useListData = async (token, page, pageSize, language) => {
  try {
    // Lấy dữ liệu fields và data song song
    const [requiredFields, listViews, editViews, languageData, data] = await Promise.all([
      AccountData.getRequiredFields(token),
      AccountData.getListView(token),
      AccountData.getEditView(token),
      AccountData.getLanguageModule(token, language),
      AccountData.getDataByPage(token, page, pageSize)
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

    const normalizedKey = fieldKey?.toLowerCase?.() || '';

    const specialFormats = {
      email1: 'Địa chỉ Email',
      phone_office: 'Điện thoại VP',
      website: 'Trang web',
      billing_address_street: 'Địa chỉ thanh toán',
      shipping_address_street: 'Địa chỉ giao hàng',
      assigned_user_name: 'Người phụ trách',
      date_entered: 'Ngày tạo',
      date_modified: 'Ngày sửa',
      description: 'Mô tả',
    };

    if (specialFormats[normalizedKey]) {
      return specialFormats[normalizedKey];
    }

    const translationKeys = [];

    // Ưu tiên originalLabel trước nếu có
    if (originalLabel) translationKeys.push(originalLabel);

    // Thêm các khả năng khác
    if (normalizedKey === 'name') {
      translationKeys.push('LBL_ACCOUNT_NAME', 'LBL_LIST_ACCOUNT_NAME');
    }

    translationKeys.push(
      `LBL_${fieldKey.toUpperCase()}`,
      `LBL_LIST_${fieldKey.toUpperCase()}`,
      fieldKey.toUpperCase(),
      fieldKey
    );

    for (const key of translationKeys) {
      if (languageData[key]) {
        return languageData[key];
      }
    }

    // Fallback cuối
    return (
      normalizedKey.charAt(0).toUpperCase() +
      normalizedKey.slice(1).replace(/_/g, ' ')
    );
  };


    // Tạo danh sách với labels đã dịch
    const translatedListViews = (listViews || []).map(field => ({
      key: field.field?.toLowerCase?.() || '',
      label: translateLabel(field.field.toLowerCase(), field.label, languageData),
      originalLabel: field.label,
      type: field.type || 'string',
      link: !!field.link, // ép kiểu boolean
    }));

   const translatedEditViews = (editViews || []).map(field => {
      let label = null;
      if (field.label.trim() === '') {
        label = `LBL_${field.field.toUpperCase()}`;
      }
      return {
        key: field.field,
        label: translateLabel(field.field, field.label || label, languageData),
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
      detailFields: translatedListViews || [],
      listViews: translatedListViews,
      editViews: translatedEditViews || [],
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

/**
 * API functions
 */
AccountData.UpdateAccount = async (accountId, data, token) => {
  try {
    return await AccountApi.updateAccount(accountId, data, token);
  } catch (error) {
    console.error('💥 Error in UpdateAccount:', error);
    return null;
  }
};

AccountData.DeleteAccount = async (accountId, token) => {
  try {
    return await AccountApi.deleteAccount(accountId, token);
  } catch (error) {
    console.error('💥 Error in DeleteAccount:', error);
    return null;
  }
};

AccountData.CreateAccount = async (accountData, token) => {
  try {
    return await AccountApi.createAccount(accountData, token);
  } catch (error) {
    console.error('💥 Error in CreateAccount:', error);
    return null;
  }
};

AccountData.getSearchKeyWords = async (parent_type, keyword, page) => {
  try {
    const response = await searchModulesApi(parent_type, keyword, page);
    if (!response || !response.data) {
      return null;
    }
    const searchResults = response.data.map(item => ({
      name:item.name,
      id:item.id
    }));
    return searchResults;
  } catch (error) {
    console.error('💥 Error in getSearchKeyWords:', error);
  }
}

AccountData.getRelationships = async (token, accountId) => {
  try {
    const relationshipsResponse = await AccountApi.getRelationships(token, accountId);
    const systemLanguageUtils = SystemLanguageUtils.getInstance();
    const importantModules = ['Notes', 'Accounts', 'Tasks', 'Meetings'];
    const filterTranslations = await systemLanguageUtils.translateKeys([
                'LBL_ACCOUNTS', // "Khách hàng"
                'LBL_NOTES', // "Ghi chú"
                'LBL_TASKS', // "Công việc"
                'LBL_MEETINGS', // "Hội họp" -> tương đương meetings
            ]);
    const language = [
        {value:'Accounts',label:filterTranslations.LBL_ACCOUNTS || 'Khách hàng'},
        {value:'Notes',label:filterTranslations.LBL_NOTES || 'Ghi chú'},
        {value:'Tasks',label:filterTranslations.LBL_TASKS || 'Công việc'},
        {value:'Meetings',label:filterTranslations.LBL_MEETINGS || 'Hội họp'}
    ];
    if (!relationshipsResponse?.data) {
      return null;
    }

    const relationshipsData = relationshipsResponse.data.relationships || relationshipsResponse.relationships;
    if (!relationshipsData) {
      return { relationships: [] };
    }

    const relationshipsArray = Object.entries(relationshipsData).map(([moduleName, relationData]) => {
      const labelItem = language.find(
        (item) => item.value.toLowerCase() === moduleName.toLowerCase()
      );
      return {
        id: moduleName.toLowerCase(),
        moduleName,
        displayName: moduleName,
        moduleLabel: labelItem?.label || moduleName,
        moduleLabelSingular: moduleName,
        moduleTable: moduleName.toLowerCase(),
        relatedLink: relationData.links?.related || '',
        meetingId: relationData.links?.related?.split('/')?.[3] || meetingId
      };
    });

    const sortedRelationships = relationshipsArray
      .filter(rel => importantModules.includes(rel.moduleName))
      .sort((a, b) => {
        const order = importantModules;
        return order.indexOf(a.moduleName) - order.indexOf(b.moduleName);
      });

    return {
      relationships: sortedRelationships,
      allRelationships: relationshipsArray
    };
  } catch (error) {
    console.error('getRelationships error:', error);
    return null;
  }
};

export default AccountData;