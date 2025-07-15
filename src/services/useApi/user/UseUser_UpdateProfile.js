import { useState } from 'react';
import { updateUserProfileApi } from '../../api/user/UserApi';

export const useUpdateProfile = () => {
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Hàm cập nhật profile
    const updateProfile = async (updateData) => {
        try {
            setUpdating(true);
            setError(null);
            setSuccess(false);

            const response = await updateUserProfileApi(updateData);
            setSuccess(true);
            
            // Tự động clear success message sau 3 giây
            setTimeout(() => {
                setSuccess(false);
            }, 3000);

            return response;
        } catch (err) {
            setError(err.message || 'Không thể cập nhật thông tin');
            console.warn('Update profile error:', err);
            throw err;
        } finally {
            setUpdating(false);
        }
    };

    // Hàm reset state
    const resetState = () => {
        setError(null);
        setSuccess(false);
        setUpdating(false);
    };

    // Hàm clear error
    const clearError = () => {
        setError(null);
    };

    return {
        updating,
        error,
        success,
        updateProfile,
        resetState,
        clearError
    };
};
