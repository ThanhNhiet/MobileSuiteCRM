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