import { LOCALHOST_IP } from '../../../utils/localhost';
const AccountApi = {};

// Lấy thông tin trường của mô hình Accounts
AccountApi.getFields = async (token) => {
    try {
        const response = await fetch(`${LOCALHOST_IP}/Api/V8/meta/fields/Accounts`, {
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
};
// lấy danh sách listfieldView
AccountApi.getListFieldsView = async (token) => {
    try {
        const response = await fetch(`${LOCALHOST_IP}/Api/V8/custom/Accounts/default-fields`, {
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
};

// lấy danh sách ngôn ngữ theo model (tiếng anh)
AccountApi.getLanguage = async (token) => {
  try {
    const response = await fetch(`${LOCALHOST_IP}/Api/V8/custom/Accounts/language/lang=en_us`, {
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
};

// lấy data account theo trang
//{{suitecrm.url}}/V8/module/Accounts?page[size]=10&page[number]=1&sort=date_entered
AccountApi.getDataByPage = async (token, page, pageSize) => {
  try{
    const response = await fetch(`${LOCALHOST_IP}/Api/V8/module/Accounts?page[size]=${pageSize}&page[number]=${page}&sort=date_entered`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi trong getDataByPage:', error);
    throw error;
  }
}

// lấy metadata của tất cả modules từ V8/meta/modules
AccountApi.getModuleMeta = async (token) => {
  try {
    const response = await fetch(`${LOCALHOST_IP}/Api/V8/meta/modules`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi trong getModuleMeta:', error);
    throw error;
  }
};

// lấy mối quan hệ của account
AccountApi.getRelationships = async (token,accountId) => {
  try {
    const response = await fetch(`${LOCALHOST_IP}/Api/V8/module/Accounts/${accountId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi trong getRelationships:', error);
    throw error;
  }
};

export default AccountApi;
