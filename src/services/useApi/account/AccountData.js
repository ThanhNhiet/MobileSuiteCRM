import AccountApi from '../../api/account/AccountApi';

// Helper function để lấy module metadata từ API
const getModuleMetadata = async (token) => {
  try {
    // Gọi API để lấy metadata của tất cả modules
    const metaResponse = await AccountApi.getModuleMeta(token);
    
    if (!metaResponse || !metaResponse.data) {
      console.log('❌ Module meta response is null/undefined');
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

    console.log('📋 Module metadata loaded:', Object.keys(moduleMetaMap));
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

const AccountData = {};
AccountData.getFields = async (token) => {
  try {
    const fields = await AccountApi.getFields(token);
    const language = await AccountApi.getLanguage(token);

    if (!fields || !fields.data) {
      console.log('❌ Fields or fields.data is null/undefined');
      return null;
    }

    // Xác định cấu trúc language
    let modStrings = null;
    if (language && language.data && language.data.mod_strings) {
      modStrings = language.data.mod_strings;
      console.log('✅ Using language.data.mod_strings');
    } else if (language && language.mod_strings) {
      modStrings = language.mod_strings;
      console.log('✅ Using language.mod_strings');
    } else {
      console.log('⚠️ No mod_strings found, using field keys as labels');
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
          // Cách 3: Dùng LBL_ACCOUNT_NAME cho field name
          else if (key === 'name' && modStrings['LBL_ACCOUNT_NAME']) {
            translatedLabel = modStrings['LBL_ACCOUNT_NAME'];
            
          }
          // Cách 4: Dùng LBL_LIST_ACCOUNT_NAME cho field name
          else if (key === 'name' && modStrings['LBL_LIST_ACCOUNT_NAME']) {
            translatedLabel = modStrings['LBL_LIST_ACCOUNT_NAME'];
            
          }
          // Cách 5: Dùng key trực tiếp
          else if (modStrings[key]) {
            translatedLabel = modStrings[key];
            
          }
          // Cách 6: Dùng key uppercase
          else if (modStrings[key.toUpperCase()]) {
            translatedLabel = modStrings[key.toUpperCase()];
           
          }
          // Cách 7: Xử lý các field đặc biệt
          else if (key === 'email1' && (modStrings['LBL_EMAIL'] || modStrings['LBL_EMAIL_ADDRESS'])) {
            translatedLabel = modStrings['LBL_EMAIL'] || modStrings['LBL_EMAIL_ADDRESS'];
            
          }
          else if (key === 'phone_office' && modStrings['LBL_PHONE_OFFICE']) {
            translatedLabel = modStrings['LBL_PHONE_OFFICE'];
            
          }
          else if (key === 'website' && modStrings['LBL_WEBSITE']) {
            translatedLabel = modStrings['LBL_WEBSITE'];
            
          }
          // Cách 8: Tìm theo pattern khác trong mod_strings
          else {
            // Tìm các keys trong mod_strings có chứa tên field
            const possibleKeys = Object.keys(modStrings).filter(k => 
              k.toLowerCase().includes(key.toLowerCase()) ||
              (key === 'name' && (k.includes('ACCOUNT') || k.includes('NAME'))) ||
              (key === 'email1' && (k.includes('EMAIL'))) ||
              (key.includes('phone') && k.includes('PHONE')) ||
              (key.includes('address') && k.includes('ADDRESS'))
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
          // Format đặc biệt cho một số field thông dụng
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

    console.log('🎯 Final required fields:', requiredFields);
    return requiredFields;
    
  } catch (error) {
    console.error('💥 Error in getFields:', error);
    return null;
  }
};

  // Lấy danh sách các trường hiển thị trong view
AccountData.getListFieldsView = async (token) => {
  try {
    
    
    const fields = await AccountApi.getListFieldsView(token);
    const language = await AccountApi.getLanguage(token);
    
   

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
      console.log('❌ No default_fields found. Available keys:', Object.keys(fields));
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
      console.log('❌ No mod_strings found. Available keys:', Object.keys(language));
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
AccountData.getDataByPage = async(token, page, pageSize) => {
  try {
    const response = await AccountApi.getDataByPage(token, page, pageSize);
    
    if (!response || !response.data) {
      console.log('❌ Response or response.data is null/undefined');
      return null;
    }

    // Trả về data với meta information
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
    return null;
  }
};

// Lấy danh sách dữ liệu theo fields đã định nghĩa
AccountData.getDataWithFields = async(token, page, pageSize) => {
  try {
    // Lấy fields và data song song
    const [fieldsResult, dataResult] = await Promise.all([
      AccountData.getFields(token),
      AccountData.getDataByPage(token, page, pageSize)
    ]);

    if (!fieldsResult || !dataResult) {
      console.log('❌ Fields or Data is null/undefined');
      return null;
    }

    // Xử lý accounts data
    const processedAccounts = dataResult.accounts.map(account => {
      // Tạo object account với cấu trúc đơn giản
      const processedAccount = { 
        id: account.id, 
        type: account.type 
      };
      
      // Thêm tất cả attributes vào account object
      fieldsResult.forEach(field => {
        const fieldKey = field.key;
        processedAccount[fieldKey] = account[fieldKey] || '';
      });

      return processedAccount;
    });

    // Trả về object với cấu trúc giống useAccountDetail
    return {
      accounts: processedAccounts,
      detailFields: fieldsResult.map(field => ({
        key: field.key,
        label: field.label ? field.label.replace(':', '') : field.key
      })),
      meta: dataResult.meta || {},
      getFieldValue: (accountData, key) => {
        return accountData[key] || '';
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
// lấy mối quan hệ của account với metadata từ V8/meta/modules
AccountData.getRelationships = async (token, accountId) => {
  try {
    // Lấy metadata và relationships song song để tối ưu performance
    const [metaResponse, relationshipsResponse] = await Promise.all([
      getModuleMetadata(token),
      AccountApi.getRelationships(token, accountId)
    ]);

    if (!relationshipsResponse || !relationshipsResponse.data) {
      console.log('❌ Relationships response or response.data is null/undefined');
      return null;
    }

    // Xử lý relationships data từ API
    const relationshipsData = relationshipsResponse.data.relationships || relationshipsResponse.relationships;
    
    if (!relationshipsData) {
      console.log('❌ No relationships data found');
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
        // Tách accountId từ link để sử dụng sau
        accountId: relationData.links?.related ? 
          relationData.links.related.split('/')[3] : accountId
      };
    });

    // Lọc các relationships quan trọng dựa trên metadata hoặc hardcode list
    const importantModules = ['Notes', 'Contacts', 'Meetings', 'Tasks', 'Calls', 'Opportunities', 'Cases'];
    const importantRelationships = relationshipsArray.filter(rel => 
      importantModules.includes(rel.moduleName)
    );

    // Sắp xếp theo thứ tự ưu tiên
    const sortedRelationships = importantRelationships.sort((a, b) => {
      const order = ['Notes', 'Contacts', 'Meetings', 'Tasks', 'Calls', 'Opportunities', 'Cases'];
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
    console.error('💥 Error in getRelationships:', error);
    return null;
  }
};

export default AccountData;
