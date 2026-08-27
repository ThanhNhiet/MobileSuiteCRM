import { callDetailViewApi } from '../api/detailview-btn-api';

export const detailViewBtnConfirmOutProcess = async ({ recordId, apiConfig }) => {
    try {
        const response = await callDetailViewApi(apiConfig, { id: recordId });
        return response;
    } catch (error) {
        throw error;
    }
};
