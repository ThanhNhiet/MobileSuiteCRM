import { useEffect, useState } from 'react';
import { getGroupRoleActionsApi, getGroupRoleUsersApi, getGroupUsersApi } from '../../api/external/ExternalApi';


export const useModule_Role = (moduleName) => {
    const [groups,setGroups] = useState([]);
    const [roles,setRoles] = useState([]);
    const [actions,setActions] = useState([]);
    const nameRole = ['delete','list','edit','create','view'];
    const [roleInfoGroup, setRoleInfoGroup] = useState({ roleName: '', listAccess: 'none' });
    useEffect(() => {
        const initializationGroup = async () => {
            const data = await getGroupUsersApi();
            if (!data || data.groups.length === 0) {
                setGroups([]);
            } 
            setGroups(data.groups);
            }
            initializationGroup();
        },[moduleName]);


    useEffect(() => {
        const initializationRole = async () => {
            if (!groups[0]?.id) return;
            const data = await getGroupRoleUsersApi(groups[0]?.id);
            if (!data || data.roles.length === 0) {
                setRoles([]);
            } 
            setRoles(data.roles);
            }
            initializationRole();
        },[groups[0]?.id]);

    useEffect(() => {
        let isMounted = true;
        const initializationAction = async () => {
            // 1) Guard: chưa có role id thì clear và thoát
            const firstRoleId = roles?.[0]?.id;
            if (!firstRoleId) {
            if (isMounted) setActions([]);
            return;
            }
            try {
            const data = await getGroupRoleActionsApi(firstRoleId);
            // 2) Validate payload
            const actions = Array.isArray(data?.actions) ? data.actions : [];
            if (actions.length === 0) {
                if (isMounted) setActions([]);
                return;
            }

            // 3) Lọc theo moduleName (so sánh không phân biệt hoa thường)
            const filtered = actions.filter(a =>{
               return a?.category?.toLowerCase() === String(moduleName || '').toLowerCase() && nameRole.includes(a?.name);
            });
            // 4) (tuỳ chọn) nếu bạn chỉ muốn giữ các action hợp lệ
            const roleOptions = {
                roleId: data?.role_id,
                roleName: data?.role_name,
                roles: filtered, // hoặc đổi key tuỳ cấu trúc state bạn mong muốn
            };

            if (isMounted) setActions(roleOptions);
            } catch (err) {
            console.error('initializationAction failed:', err);
            if (isMounted) setActions([]);
            }
        };

        initializationAction();

        return () => { isMounted = false; };
        }, [roles, moduleName]); // thêm moduleName vì đang dùng trong filter

        // lấy quyền truy cập của người dùng list
        useEffect(() => {
        if (!actions) return;
            const roleName = actions?.roleName?.toLowerCase?.() ?? '';
            const listPerm = (actions?.roles ?? []).find(a => (a?.name || a?.action_name) === 'list');
            setRoleInfoGroup({ roleName, listPerm });
        }, [actions]);
        // lấy quyền truy cập của người dùng view
        useEffect(() => {
            if (!actions) return;
            const viewPerm = (actions?.roles ?? []).find(a => (a?.name || a?.action_name) === 'view');
            setRoleInfoGroup(prev => ({ ...prev, viewPerm }));
        }, [actions]);
        // lấy quyền xoá
        useEffect(() => {
            if (!actions) return;
            const deletePerm = (actions?.roles ?? []).find(a => (a?.name || a?.action_name) === 'delete');
            setRoleInfoGroup(prev => ({ ...prev, deletePerm }));
        }, [actions]);
        // lấy quyền sửa
        useEffect(() => {
            if (!actions) return;
            const editPerm = (actions?.roles ?? []).find(a => (a?.name || a?.action_name) === 'edit');
            setRoleInfoGroup(prev => ({ ...prev, editPerm }));
        }, [actions]);

        return{
            groups,
            roles,
            actions,
            roleInfoGroup
        }

}