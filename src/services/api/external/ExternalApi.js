import { getUserIdFromToken } from '@/src/utils/DecodeToken';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import axiosInstance from '../../../configs/AxiosConfig';

//Search by keywords
//GET /Api/V8/custom/{parent_type}?keyword={keyword}&page={page}
export const searchModulesApi = async (parent_type, keyword, page = 1) => {
  try {
    const response = await axiosInstance.get(`/Api/V8/custom/${parent_type}`, {
      params: {
        'keyword': keyword,
        'page': page
      }
    });
    return response.data;
  } catch (error) {
    console.warn("Search Modules API error:", error);
    throw error;
  }
};

//Get all modules
//GET /Api/V8/custom/setup/get-modules-list
export const getAllModulesApi = async () => {
  try {
    const response = await axiosInstance.get(`/Api/V8/custom/setup/get-modules-list`);
    return response.data;
  } catch (error) {
    console.warn("Get All Modules API error:", error);
    throw error;
  }
};

//Get role
//GET /Api/V8/custom/user/{user_id}/roles
export const getUserRolesApi = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const user_id = getUserIdFromToken(token);
    const response = await axiosInstance.get(`/Api/V8/custom/user/${user_id}/roles`);
    return response.data;
  } catch (error) {
    console.warn("Get User Roles API error:", error);
    throw error;
  }
};

// get security groups
// GET /Api/V8/custom/user/{user_id}/security_groups
export const getUserSecurityGroupsApi = async () => {
  try {
    const response = await axiosInstance.get(`/Api/V8/module/ACLRole`);
    return response.data;
  } catch (error) {
    console.warn("Get User Security Groups API error:", error);
    throw error;
  }
};
export const getUserSecurityGroupsRelationsApi = async (role_name) => {
  try {
    const payload = await getUserSecurityGroupsApi(); // trả về { data: [...] } các ACLRole
    const items = Array.isArray(payload?.data) ? payload.data : [];
    const role = items.find((it) => it?.attributes?.name === role_name);
    if (!role) {
      console.warn(`No role found for name: ${role_name}`);
      return [];
    }

    // lấy related link (hỗ trợ SecurityGroups/securitygroups + string hoặc {href})
    const rel =
      role?.relationships?.SecurityGroups?.links?.related ??
      role?.relationships?.securitygroups?.links?.related ??
      null;
    let url =
      typeof rel === 'string' ? rel :
        (rel && typeof rel === 'object' ? rel.href : '');
    if (!url) {
      console.warn('No related link for SecurityGroups on this role');
      return [];
    }
    // nếu là relative (V8/module/...) -> chèn /Api/
    if (!/^https?:\/\//i.test(url)) {
      url = url.replace(/^\/+/, '');          // bỏ '/' đầu
      if (!/^api\//i.test(url)) url = `Api/${url}`;  // thêm Api/ nếu thiếu
      url = `/${url}`;                         // đưa về dạng /Api/...
    }
    // axios sẽ tự ghép baseURL + url (nếu url không phải http absolute)
    const resp = await axiosInstance.get(url);
    const data = Array.isArray(resp?.data?.data) ? resp.data.data : [];
    const map = data.map(it => ({
      id: it.id
    }));
    return map;
  } catch (error) {
    if (error?.response?.status === 404) {
      console.warn('Role→SecurityGroups 404 (nhiều bản SuiteCRM không expose).');
      return [];
    }
    console.warn('Get User Security Groups Relations API error:', error);
    throw error;
  }
};

export const getUserSecurityGroupsMember = async (groups) => {
  try {
    // chuẩn hoá thành mảng id duy nhất
    const ids = [...new Set(
      (groups || [])
        .map(g => (typeof g === 'string' ? g : g?.id))
        .filter(Boolean)
    )];

    if (ids.length === 0) return [];

    // gọi song song
    const jobs = ids.map(id => {
      const url = `/Api/V8/custom/security-groups/${encodeURIComponent(id)}/members`;
      return axiosInstance.get(url)
        .then(r => ({ ok: true, id, data: r.data }))
        .catch(error => ({ ok: false, id, error }));
    });

    const results = await Promise.all(jobs);

    // gom kết quả: mỗi phần tử là object trả về từ API (KHÔNG spread object vào mảng)
    const list = [];
    for (const r of results) {
      if (!r.ok) {
        console.warn('Get members failed for group:', r.id, r.error?.response?.status, r.error?.response?.data);
        continue;
      }
      if (r.data) list.push(r.data); // { group_id, group_name, members:[...], ... }
    }

    return list;
  } catch (error) {
    console.warn('Get User Security Groups Member API error:', error);
    throw error;
  }
};

export const getGroupUsersApi = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const user_id = getUserIdFromToken(token);
    const response = await axiosInstance.get(`/Api/V8/custom/users/${user_id}/groups`);
    return response.data;
  } catch (error) {
    console.warn("Get Group Users API error:", error);
    throw error;
  }
}

export const getGroupRoleUsersApi = async (group_id) => {
  try {
    const response = await axiosInstance.get(`/Api/V8/custom/security-groups/${group_id}/roles`);
    return response.data;
  } catch (error) {
    console.warn("Get Group Role Users API error:", error);
    throw error;
  }
}

export const getGroupRoleActionsApi = async (role_id) => {
  try {
    const response = await axiosInstance.get(`/Api/V8/custom/roles/${role_id}/actions`);
    return response.data;
  } catch (error) {
    console.warn("Get Group Role Actions API error:", error);
    throw error;
  }
}

//GET /Api/V8/custom/file/{module}/{id}
export const getFileApi = async (module, id) => {
  try {
    const response = await axiosInstance.get(`/Api/V8/custom/file/${module}/${id}`);
    return response.data;
  } catch (error) {
    console.warn("Get User File API error:", error);
    throw error;
  }
}

//POST /Api/V8/custom/file/{module}/{id}
//body form-data: file
//Content-Type: multipart/form-data
export const uploadFileApi = async (module, id, file) => {
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri, // file local url
      type: file.type,
      name: file.name,
    });

    const response = await axiosInstance.post(
      `/Api/V8/custom/file/${module}/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.warn("Upload File API error:", error.response?.data || error.message);
    throw error;
  }
};

// POST /Api/V8/custom/save-token
export const saveDeviceTokenApi = async (expo_token, platform) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const user_id = getUserIdFromToken(token);
    const response = await axiosInstance.post(`/Api/V8/custom/save-token`, { user_id, expo_token, platform });
    return response.data;
  } catch (error) {
    console.warn("Save Device Token API error:", error);
    throw error;
  }
};

// POST https://exp.host/--/api/v2/push/send
export const sendPushNotificationApi = async (expo_token, title, body) => {
  try {
    const payload = {
      to: expo_token,
      title,
      body
    };
    const response = await axios.post(`https://exp.host/--/api/v2/push/send`, payload, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.warn("Send Push Notification API error:", error.response?.data || error.message);
    throw error;
  }
};