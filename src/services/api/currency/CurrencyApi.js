import axiosInstance from '../../../configs/AxiosConfig';

//GET /Api/V8/module/Currency
export const getCurrencyApi = async () => {
    try {
        const response = await axiosInstance.get(`/Api/V8/module/Currency`);
        return response.data;
    } catch (error) {
        console.warn("Get Currency API error:", error);
        throw error;
    }
}