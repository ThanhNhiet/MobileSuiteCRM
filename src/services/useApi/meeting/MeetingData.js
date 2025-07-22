import MeetingApi from '../../api/meeting/MeetingApi';

// Helper function để lấy module metadata từ API
const getModuleMetadata = async (token) => {
  try {
    // Gọi API để lấy metadata của tất cả modules
    const metaResponse = await MeetingApi.getModuleMeta(token);
    
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

const MeetingData = {};

MeetingData.getFields = async (token) => {
  try {
    const fields = await MeetingApi.getFields(token);
    const language = await MeetingApi.getLanguage(token);

    if (!fields || !fields.data) {
      
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
          // Cách 3: Dùng LBL_MEETING_NAME cho field name
          else if (key === 'name' && modStrings['LBL_MEETING_NAME']) {
            translatedLabel = modStrings['LBL_MEETING_NAME'];
            
          }
          // Cách 4: Dùng LBL_LIST_MEETING_NAME cho field name
          else if (key === 'name' && modStrings['LBL_LIST_MEETING_NAME']) {
            translatedLabel = modStrings['LBL_LIST_MEETING_NAME'];
            
          }
          // Cách 5: Dùng key trực tiếp
          else if (modStrings[key]) {
            translatedLabel = modStrings[key];
            
          }
          // Cách 6: Dùng key uppercase
          else if (modStrings[key.toUpperCase()]) {
            translatedLabel = modStrings[key.toUpperCase()];
           
          }
          // Cách 7: Xử lý các field đặc biệt cho Meeting
          else if (key === 'date_start' && (modStrings['LBL_DATE_START'] || modStrings['LBL_START_DATE'])) {
            translatedLabel = modStrings['LBL_DATE_START'] || modStrings['LBL_START_DATE'];
            
          }
          else if (key === 'date_end' && (modStrings['LBL_DATE_END'] || modStrings['LBL_END_DATE'])) {
            translatedLabel = modStrings['LBL_DATE_END'] || modStrings['LBL_END_DATE'];
            
          }
          else if (key === 'duration_hours' && modStrings['LBL_DURATION_HOURS']) {
            translatedLabel = modStrings['LBL_DURATION_HOURS'];
            
          }
          else if (key === 'duration_minutes' && modStrings['LBL_DURATION_MINUTES']) {
            translatedLabel = modStrings['LBL_DURATION_MINUTES'];
            
          }
          else if (key === 'location' && modStrings['LBL_LOCATION']) {
            translatedLabel = modStrings['LBL_LOCATION'];
            
          }
          // Cách 8: Tìm theo pattern khác trong mod_strings
          else {
            // Tìm các keys trong mod_strings có chứa tên field
            const possibleKeys = Object.keys(modStrings).filter(k => 
              k.toLowerCase().includes(key.toLowerCase()) ||
              (key === 'name' && (k.includes('MEETING') || k.includes('NAME'))) ||
              (key === 'date_start' && (k.includes('START') || k.includes('DATE'))) ||
              (key === 'date_end' && (k.includes('END') || k.includes('DATE'))) ||
              (key.includes('duration') && k.includes('DURATION')) ||
              (key.includes('location') && k.includes('LOCATION'))
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
          // Format đặc biệt cho một số field thông dụng của Meeting
          const specialFormats = {
            'name': 'Tên cuộc họp',
            'date_start': 'Thời gian bắt đầu',
            'date_end': 'Thời gian kết thúc',
            'duration_hours': 'Thời lượng (giờ)',
            'duration_minutes': 'Thời lượng (phút)',
            'location': 'Địa điểm',
            'description': 'Mô tả',
            'status': 'Trạng thái',
            'assigned_user_name': 'Người phụ trách',
            'date_entered': 'Ngày tạo',
            'date_modified': 'Ngày sửa'
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
MeetingData.getListFieldsView = async (token) => {
  try {
    
    
    const fields = await MeetingApi.getListFieldsView(token);
    const language = await MeetingApi.getLanguage(token);
    
   

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

// Lấy danh sách dữ liệu theo fields đã định nghĩa
MeetingData.getDataWithFields = async(token, page, pageSize) => {
  try {
    // Lấy fields và data song song
    const [fieldsResult, dataResult] = await Promise.all([
      MeetingData.getFields(token),
      MeetingData.getDataByPage(token, page, pageSize)
    ]);

    if (!fieldsResult || !dataResult) {
      
      return null;
    }

    // Xử lý meetings data
    const processedMeetings = dataResult.meetings.map(meeting => {
      // Tạo object meeting với cấu trúc đơn giản
      const processedMeeting = { 
        id: meeting.id, 
        type: meeting.type 
      };
      
      // Thêm tất cả attributes vào meeting object
      fieldsResult.forEach(field => {
        const fieldKey = field.key;
        processedMeeting[fieldKey] = meeting[fieldKey] || '';
      });

      // Đảm bảo luôn có assigned_user_name field
      if (!processedMeeting.assigned_user_name) {
        processedMeeting.assigned_user_name = meeting.assigned_user_name || '';
      }

      // Đảm bảo luôn có created_by_name field
      if (!processedMeeting.created_by_name) {
        processedMeeting.created_by_name = meeting.created_by_name || '';
      }

      return processedMeeting;
    });

    // Trả về object với cấu trúc giống useMeetingDetail
    return {
      meetings: processedMeetings,
      detailFields: fieldsResult.map(field => ({
        key: field.key,
        label: field.label ? field.label.replace(':', '') : field.key
      })),
      meta: dataResult.meta || {},
      getFieldValue: (meetingData, key) => {
        return meetingData[key] || '';
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

// lấy mối quan hệ của meeting với metadata từ V8/meta/modules
MeetingData.getRelationships = async (token, meetingId) => {
  try {
    // Lấy metadata và relationships song song để tối ưu performance
    const [metaResponse, relationshipsResponse] = await Promise.all([
      getModuleMetadata(token),
      MeetingApi.getRelationships(token, meetingId)
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
        // Tách meetingId từ link để sử dụng sau
        meetingId: relationData.links?.related ? 
          relationData.links.related.split('/')[3] : meetingId
      };
    });

    // Lọc các relationships quan trọng dựa trên metadata hoặc hardcode list
    const importantModules = ['Notes', 'Contacts', 'Accounts', 'Tasks', 'Calls', 'Opportunities', 'Cases'];
    const importantRelationships = relationshipsArray.filter(rel => 
      importantModules.includes(rel.moduleName)
    );

    // Sắp xếp theo thứ tự ưu tiên
    const sortedRelationships = importantRelationships.sort((a, b) => {
      const order = ['Notes', 'Contacts', 'Accounts', 'Tasks', 'Calls', 'Opportunities', 'Cases'];
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