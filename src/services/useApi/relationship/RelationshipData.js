import RelationshipsApi from '../../api/relationship/RelationshipApi';

const RelationshipsData = {};

RelationshipsData.getFields = async (token, moduleName) => {
  try {
    const fields = await RelationshipsApi.getFields(token, moduleName);
    const language = await RelationshipsApi.getRelationshipsLanguage(token, moduleName);

    if (!fields || !fields.data) {
      console.log(`❌ Fields or fields.data is null/undefined for module: ${moduleName}`);
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
          // Cách 3: Dùng key trực tiếp
          else if (modStrings[key]) {
            translatedLabel = modStrings[key];
          }
          // Cách 4: Dùng key uppercase
          else if (modStrings[key.toUpperCase()]) {
            translatedLabel = modStrings[key.toUpperCase()];
          }
          // Cách 5: Xử lý các field đặc biệt theo module
          else if (key === 'name') {
            // Tự động tạo pattern cho field name theo module
            const moduleNamePattern = `LBL_${moduleName.toUpperCase()}_NAME`;
            const listNamePattern = `LBL_LIST_${moduleName.toUpperCase()}_NAME`;
            if (modStrings[moduleNamePattern]) {
              translatedLabel = modStrings[moduleNamePattern];
            } else if (modStrings[listNamePattern]) {
              translatedLabel = modStrings[listNamePattern];
            } else if (modStrings['LBL_NAME']) {
              translatedLabel = modStrings['LBL_NAME'];
            }
          }
          else if (key === 'email1' && (modStrings['LBL_EMAIL'] || modStrings['LBL_EMAIL_ADDRESS'])) {
            translatedLabel = modStrings['LBL_EMAIL'] || modStrings['LBL_EMAIL_ADDRESS'];
          }
          else if (key.includes('phone') && modStrings['LBL_PHONE']) {
            translatedLabel = modStrings['LBL_PHONE'];
          }
          else if (key.includes('phone') && key.includes('office') && modStrings['LBL_PHONE_OFFICE']) {
            translatedLabel = modStrings['LBL_PHONE_OFFICE'];
          }
          else if (key === 'website' && modStrings['LBL_WEBSITE']) {
            translatedLabel = modStrings['LBL_WEBSITE'];
          }
          else if (key === 'description' && modStrings['LBL_DESCRIPTION']) {
            translatedLabel = modStrings['LBL_DESCRIPTION'];
          }
          // Cách 6: Tìm theo pattern khác trong mod_strings
          else {
            // Tìm các keys trong mod_strings có chứa tên field
            const possibleKeys = Object.keys(modStrings).filter(k => 
              k.toLowerCase().includes(key.toLowerCase()) ||
              (key === 'name' && (k.includes(moduleName.toUpperCase()) || k.includes('NAME'))) ||
              (key.includes('email') && k.includes('EMAIL')) ||
              (key.includes('phone') && k.includes('PHONE')) ||
              (key.includes('address') && k.includes('ADDRESS')) ||
              (key.includes('date') && k.includes('DATE'))
            );
            
            if (possibleKeys.length > 0) {
              translatedLabel = modStrings[possibleKeys[0]];
            }
          }
        }

        // Nếu vẫn chưa có label từ API, format key đẹp hơn
        if (translatedLabel === key) {
          // Format đặc biệt cho một số field thông dụng (đa module)
          const specialFormats = {
            'name': 'Tên',
            'email1': 'Email',
            'phone_office': 'Số điện thoại',
            'phone_work': 'Điện thoại công ty',
            'phone_mobile': 'Điện thoại di động',
            'website': 'Website',
            'billing_address_street': 'Địa chỉ thanh toán',
            'shipping_address_street': 'Địa chỉ giao hàng',
            'assigned_user_name': 'Người phụ trách',
            'date_entered': 'Ngày tạo',
            'date_modified': 'Ngày sửa',
            'description': 'Mô tả',
            'status': 'Trạng thái',
            'priority': 'Độ ưu tiên',
            'first_name': 'Tên',
            'last_name': 'Họ',
            'title': 'Chức danh',
            'department': 'Phòng ban',
            'account_name': 'Tên công ty',
            'lead_source': 'Nguồn khách hàng',
            'industry': 'Ngành nghề',
            'annual_revenue': 'Doanh thu hàng năm',
            'employees': 'Số nhân viên'
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
          moduleName, // Thêm thông tin module để debug
          ...rest
        };
      });

    return requiredFields;
    
  } catch (error) {
    console.error(`💥 Error in getFields for ${moduleName}:`, error);
    return null;
  }
};

// Lấy danh sách các trường hiển thị trong view cho bất kỳ module nào
RelationshipsData.getListFieldsView = async (token, moduleName) => {
  try {
    const fields = await RelationshipsApi.getListViewModules(token, moduleName);
    const language = await RelationshipsApi.getRelationshipsLanguage(token, moduleName);
    
    // Kiểm tra fields response
    if (!fields) {
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
      } else if (field.label && field.label.startsWith('LBL_')) {
        // Cách 4: Nếu field.label là LBL_* nhưng không có trong mod_strings, format nó
        translatedLabel = field.label.replace('LBL_', '').charAt(0).toUpperCase() + 
                         field.label.replace('LBL_', '').slice(1).toLowerCase().replace(/_/g, ' ');
      } else if (field.label && !field.label.startsWith('LBL_')) {
        // Cách 5: Nếu có field.label từ API và không phải LBL_*, dùng nó
        translatedLabel = field.label;
      } else {
        // Cách 6: Format mặc định - viết hoa chữ cái đầu và thay _ thành khoảng trắng
        translatedLabel = field.key.charAt(0).toUpperCase() + field.key.slice(1).replace(/_/g, ' ');
      }
      
      return {
        ...field,
        label: translatedLabel,
        originalLabel: field.label // Giữ lại label gốc để debug
      };
    });
    
    return translatedFields;
    
  } catch (error) {
    console.error(`💥 Error in getListFieldsView for ${moduleName}:`, error);
    return null;
  }
};
// Lấy danh sách dữ liệu theo trang cho bất kỳ module nào
RelationshipsData.getDataByPage = async (token, relatedLink, page, pageSize) => {
  try {
    const response = await RelationshipsApi.getRelationships(token, relatedLink, page, pageSize);
    
    if (!response || !response.data) {
      console.log(`❌ No data received for ${relatedLink}`);
      return null;
    }

    // Trả về data với meta information
    return {
      meta: response.meta || {},
      records: response.data.map(record => ({
        id: record.id,
        type: record.type,
        ...record.attributes
      }))
    };
    
  } catch (error) {
    console.error(`💥 Error in getDataByPage for ${relatedLink}:`, error);
    return null;
  }
};
// Lấy danh sách dữ liệu với các trường cụ thể cho bất kỳ module nào
RelationshipsData.getDataWithFields = async (token, moduleName, relatedLink, page, pageSize) => {
  try {
    // Lấy fields và data song song
    const [fieldsResult, dataResult] = await Promise.all([
      RelationshipsData.getListFieldsView(token, moduleName),
      RelationshipsData.getDataByPage(token, relatedLink, page, pageSize)
    ]);

    if (!fieldsResult || !dataResult) {
      console.log(`❌ Fields or Data is null/undefined for ${moduleName}`);
      return null;
    }

    // Xử lý records data
    const processedRecords = dataResult.records.map((record, index) => {
      // Tạo object record với cấu trúc đơn giản
      const processedRecord = { 
        id: record.id, 
        type: record.type 
      };
      
      // Thêm tất cả attributes từ record gốc vào processed record
      Object.keys(record).forEach(key => {
        if (key !== 'id' && key !== 'type') {
          processedRecord[key] = record[key];
        }
      });
      
      return processedRecord;
    });

    // Trả về object với cấu trúc giống useAccountDetail nhưng cho relationships
    return {
      records: processedRecords,
      detailFields: fieldsResult.map(field => ({
        key: field.key,
        label: field.label ? field.label.replace(':', '') : field.key
      })),
      meta: dataResult.meta || {},
      moduleName: moduleName, // Thêm thông tin module
      getFieldValue: (recordData, key) => {
        return recordData[key] || '';
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
    console.error(`💥 Error in getDataWithFields for ${moduleName}:`, error);
    return null;
  }
};

export default RelationshipsData;
