import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { callDetailViewApi } from '../api/detailview-btn-api';

export const detailViewBtnPrintProcess = async ({ recordId, apiConfig, record, navigation }) => {
    try {
        const response = await callDetailViewApi(apiConfig, { id: recordId });
        if (response && response.success && response.url) {
            await WebBrowser.openBrowserAsync(response.url);
        } else {
            Alert.alert("Lỗi", response?.message || "Không thể tải link PDF");
        }
    } catch (error) {
        Alert.alert("Lỗi", "Đã có lỗi xảy ra khi gọi API In PDF");
    }
};
