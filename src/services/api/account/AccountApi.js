import { getUserIdFromToken } from '../../../utils/DecodeToken';
import { LOCALHOST_IP } from '../../../utils/localhost';

const AccountApi = {};


// require các hàm từ
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
        const response = await fetch(`${LOCALHOST_IP}/Api/V8/custom/Accounts/list-fields`, {
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
AccountApi.getLanguage = async (token,language) => {
  try {
    const response = await fetch(`${LOCALHOST_IP}/Api/V8/custom/Accounts/language/lang=${language}`, {
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

// lay danh sach editView
AccountApi.getEditView = async (token) => {
  try {
    const response = await fetch(`${LOCALHOST_IP}/Api/V8/custom/Accounts/edit-fields`, {
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

AccountApi.updateAccount = async (accountId, accountData, token) => {
    try {
        
        const response = await fetch(`${LOCALHOST_IP}/Api/V8/module`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    type: 'Accounts',
                    id: accountId,
                    attributes: accountData
                }
            })
        });
        return response;
    } catch (error) {
        console.error("💥 Update Account API error:", error);
        throw error;
    }
};
// xoá
AccountApi.deleteAccount = async (accountId, token) => {
    try {
         const response = await fetch(`${LOCALHOST_IP}/Api/V8/module/Accounts/${accountId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        return response;
    } catch (error) {
        console.warn("Delete Account API error:", error);
        throw error;
    }
};
AccountApi.createAccount = async (accountData, token) => {
    try {
        const response = await fetch(`${LOCALHOST_IP}/Api/V8/module`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    type: 'Accounts',
                    attributes: {
                        assigned_user_id: getUserIdFromToken(token),
                        ...accountData
                    }
                }
            })
        });

        return response.data;
    } catch (error) {
        console.error('Error creating account:', error);
        throw error;
    }
};

AccountApi.getLanguage = async (module, language, token) => {
  try {
    const response = await fetch(`${LOCALHOST_IP}/Api/V8/custom/${module}/language/lang=${language}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    return response.json();
  } catch (error) {
    console.error('Lỗi trong language:', error);
    throw error;
  }
};


export default AccountApi;
