const RelationshipsApi = {};
import { LOCALHOST_IP } from '../../../utils/localhost';

RelationshipsApi.getRelationshipsData = async (token, relatedLink, page, pageSize) => {
    try {
        // Tạo URL đầy đủ cho SuiteCRM API
        // relatedLink có format: /V8/module/Accounts/xxx/relationships/contacts
        const fullUrl = `${LOCALHOST_IP}/Api/${relatedLink}?page[size]=${pageSize}&page[number]=${page}`;
        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        
        // Kiểm tra response status trước khi parse JSON
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ HTTP Error ${response.status}:`, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
       
        
        return data;
    } catch (error) {
        console.error('Lỗi trong getRelationships:', error);
        throw error;
    }
}

RelationshipsApi.getRelationshipsLanguage = async (token,moduleName,language) => {
    try {
    const response = await fetch(`${LOCALHOST_IP}/Api/V8/custom/${moduleName}/language/lang=${language}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text); // Sửa lỗi nếu backend trả về HTML
      return data; // Trả về data trực tiếp thay vì { data }
    } catch (err) {
      console.error('❌ Lỗi parse JSON:', text);
      throw err;
    }
  } catch (error) {
    console.error('Lỗi trong language:', error);
    throw error;
  }
}
RelationshipsApi.getListViewModules = async (token,moduleName) => {
    try {
        const response = await fetch(`${LOCALHOST_IP}/Api/V8/custom/${moduleName}/list-fields`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Lỗi trong listFieldsView:', error);
        throw error;
    }
}
RelationshipsApi.getFields = async (token,moduleName) => {
     try {
        const response = await fetch(`${LOCALHOST_IP}/Api/V8/meta/fields/${moduleName}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Lỗi trong AccountApi:', error);
        throw error;
    }
}
RelationshipsApi.getEditView = async (token,moduleName) => {
  try {
    const response = await fetch(`${LOCALHOST_IP}/Api/V8/custom/${moduleName}/edit-fields`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi trong getEditView:', error);
    throw error;
  }
}
RelationshipsApi.getDataRelationship = async (token, relatedLink) => {
  try {
     const fullUrl = `${LOCALHOST_IP}/Api/${relatedLink}`;
    const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        const data = await response.json();
        return data;
  } catch (error) {
    console.error('Lỗi trong getDataRelationship:', error);
    throw error;  
  }
}

export default RelationshipsApi;