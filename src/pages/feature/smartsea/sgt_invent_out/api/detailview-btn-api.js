import axiosInstance from '@/src/configs/AxiosConfig';

export const callDetailViewApi = async (apiConfigString, params = {}) => {
    try {
        let method = 'GET';
        let urlTemplate = apiConfigString;

        const methodMatch = apiConfigString.match(/^\[(GET|POST|PUT|DELETE|PATCH)\](.*)/i);
        if (methodMatch) {
            method = methodMatch[1].toUpperCase();
            urlTemplate = methodMatch[2].trim();
        }

        // Replace params
        let finalUrl = urlTemplate;
        for (const [key, value] of Object.entries(params)) {
            let valueStr = value;
            if (typeof value === 'object') {
                valueStr = JSON.stringify(value);
            }
            // replace all occurrences
            const regex = new RegExp(`%${key}%`, 'g');
            finalUrl = finalUrl.replace(regex, encodeURIComponent(valueStr));
        }

        // Remove any unreplaced placeholders
        finalUrl = finalUrl.replace(/&?[a-zA-Z0-9_]+=%[a-zA-Z0-9_]+%/g, '');
        finalUrl = finalUrl.replace(/[\?&]$/, '');

        const response = await axiosInstance({
            method,
            url: finalUrl,
        });

        return response.data;
    } catch (error) {
        console.warn("DetailView API error:", error?.response?.data || error);
        throw error;
    }
}
