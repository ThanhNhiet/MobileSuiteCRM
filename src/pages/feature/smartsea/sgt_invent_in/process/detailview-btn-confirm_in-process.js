import { callDetailViewApi } from '../api/detailview-btn-api';

export const detailViewBtnConfirmInProcess = async ({ recordId, apiConfig, payload }) => {
    try {
        // payload should contain: status_detail, actual_receive (array)
        const params = {
            id: recordId,
            status_detail: payload.status_detail || 'in_full',
            actual_receive: payload.actual_receive || []
        };
        const response = await callDetailViewApi(apiConfig, params);
        return response;
    } catch (error) {
        throw error;
    }
};
