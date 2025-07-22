import axiosInstance from '../../../configs/AxiosConfig';
import { getUserIdFromToken } from '../../../utils/DecodeToken';
import { LOCALHOST_IP } from '../../../utils/localhost';

const TaskApi = {};

// Lấy thông tin trường của mô hình Tasks
TaskApi.getFields = async (token) => {
    try {
        const response = await fetch(`${LOCALHOST_IP}/Api/V8/meta/fields/Tasks`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Lỗi trong TaskApi:', error);
        throw error;
    }
};

// lấy danh sách listfieldView
TaskApi.getListFieldsView = async (token) => {
    try {
        const response = await fetch(`${LOCALHOST_IP}/Api/V8/custom/Tasks/default-fields`, {
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
TaskApi.getLanguage = async (token) => {
  try {
    const response = await fetch(`${LOCALHOST_IP}/Api/V8/custom/Tasks/language/lang=en_us`, {
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

// lấy data task theo trang
TaskApi.getDataByPage = async (token, page, pageSize) => {
  try{
   
    
    const response = await fetch(`${LOCALHOST_IP}/Api/V8/module/Tasks?page[size]=${pageSize}&page[number]=${page}&sort=date_entered`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    
   
    
    const data = await response.json();
   
    
    return data;
  } catch (error) {
    console.error('💥 Lỗi trong getDataByPage:', error);
    throw error;
  }
}

// lấy metadata của tất cả modules từ V8/meta/modules
TaskApi.getModuleMeta = async (token) => {
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

// lấy mối quan hệ của task
TaskApi.getRelationships = async (token, taskId) => {
  try {
    const response = await fetch(`${LOCALHOST_IP}/Api/V8/module/Tasks/${taskId}`, {
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

// cập nhật task
TaskApi.updateTask = async (taskId, taskData, token) => {
    try {
        const response = await axiosInstance.patch(`/Api/V8/module`, {
            data: {
                type: 'Tasks',
                id: taskId,
                attributes: taskData
            }
        });
        return response.data;
    } catch (error) {
        console.warn("Update Task API error:", error);
        throw error;
    }
};

// tạo task mới
TaskApi.createTask = async (taskData, token) => {
    try {   
        const userId = getUserIdFromToken(token);

        const response = await axiosInstance.post(`/Api/V8/module`, {
            data: {
                type: 'Tasks',
                attributes: {
                    assigned_user_id: userId,
                    ...taskData
                }
            }
        });
        return response.data;
    }
    catch (error) {
        console.warn("Create Task API error:", error);
        throw error;
    }
};

// xoá task
TaskApi.deleteTask = async (taskId, token) => {
    try {
         const response = await fetch(`${LOCALHOST_IP}/Api/V8/module/Tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        return response;
    } catch (error) {
        console.warn("Delete Task API error:", error);
        throw error;
    }
};

export default TaskApi;