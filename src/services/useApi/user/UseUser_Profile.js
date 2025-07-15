import { useEffect, useState } from 'react';
import { getUserProfileApi } from '../../api/user/UserApi';

export const useUserProfile = () => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Hàm lấy dữ liệu profile
    const fetchProfile = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await getUserProfileApi();
            setProfileData(response.data);
        } catch (err) {
            setError(err.message || 'Không thể tải thông tin người dùng');
            console.warn('Fetch profile error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Hàm refresh dữ liệu
    const refreshProfile = () => {
        fetchProfile(true);
    };

    // Lấy dữ liệu lần đầu khi mount
    useEffect(() => {
        fetchProfile();
    }, []);

    return {
        profileData,
        loading,
        error,
        refreshing,
        refreshProfile,
        fetchProfile
    };
};
