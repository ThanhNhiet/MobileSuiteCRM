import AccountApi from '../../api/account/AccountApi';

const AccountData = {};

// lấy danh sách các trường hiển thị
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
          // Cách 7: Tìm theo pattern khác trong mod_strings
          else {
            // Tìm các keys trong mod_strings có chứa tên field
            const possibleKeys = Object.keys(modStrings).filter(k => 
              k.toLowerCase().includes(key.toLowerCase()) ||
              (key === 'name' && (k.includes('ACCOUNT') || k.includes('NAME')))
            );
            
            if (possibleKeys.length > 0) {
              translatedLabel = modStrings[possibleKeys[0]];
              
            } else {
              console.log(`⚠️ No translation found for ${key}, using key`);
            }
          }
        }

        // Nếu vẫn chưa có label từ API, format key đẹp hơn
        if (translatedLabel === key) {
          translatedLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
          
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



export default AccountData;
