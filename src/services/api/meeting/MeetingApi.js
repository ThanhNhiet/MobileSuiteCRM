import axiosInstance from '../../../configs/AxiosConfig';
import { getUserIdFromToken } from '../../../utils/DecodeToken';
import { LOCALHOST_IP } from '../../../utils/localhost';

const MeetingApi = {};

// Lấy thông tin trường của mô hình Meetings
MeetingApi.getFields = async (token) => {
    try {
        const response = await fetch(`${LOCALHOST_IP}/Api/V8/meta/fields/Meetings`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Lỗi trong MeetingApi:', error);
        throw error;
    }
};

// lấy danh sách listfieldView
MeetingApi.getListFieldsView = async (token) => {
    try {
        const response = await fetch(`${LOCALHOST_IP}/Api/V8/custom/Meetings/default-fields`, {
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
MeetingApi.getLanguage = async (token) => {
  try {
    const response = await fetch(`${LOCALHOST_IP}/Api/V8/custom/Meetings/language/lang=en_us`, {
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

// lấy data meeting theo trang
MeetingApi.getDataByPage = async (token, page, pageSize) => {
  try{
    const response = await fetch(`${LOCALHOST_IP}/Api/V8/module/Meetings?page[size]=${pageSize}&page[number]=${page}&sort=date_entered`, {
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
MeetingApi.getModuleMeta = async (token) => {
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

// lấy mối quan hệ của meeting
MeetingApi.getRelationships = async (token, meetingId) => {
  try {
    const response = await fetch(`${LOCALHOST_IP}/Api/V8/module/Meetings/${meetingId}`, {
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

// cập nhật meeting
MeetingApi.updateMeeting = async (meetingId, meetingData, token) => {
    try {
        const response = await axiosInstance.patch(`/Api/V8/module`, {
            data: {
                type: 'Meetings',
                id: meetingId,
                attributes: meetingData
            }
        });
        return response.data;
    } catch (error) {
        console.warn("Update Meeting API error:", error);
        throw error;
    }
};

// tạo meeting mới
MeetingApi.createMeeting = async (meetingData, token) => {
    try {   
        // Use the provided token instead of getting it from AsyncStorage
        const userId = getUserIdFromToken(token);

        const response = await axiosInstance.post(`/Api/V8/module`, {
            data: {
                type: 'Meetings',
                attributes: {
                    assigned_user_id: userId,
                    ...meetingData
                }
            }
        });
        return response.data;
    }
    catch (error) {
        console.warn("Create Meeting API error:", error);
        throw error;
    }
};

// xoá meeting
MeetingApi.deleteMeeting = async (meetingId, token) => {
    try {
         const response = await fetch(`${LOCALHOST_IP}/Api/V8/module/Meetings/${meetingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        return response;
    } catch (error) {
        console.warn("Delete Meeting API error:", error);
        throw error;
    }
};

export default MeetingApi;


