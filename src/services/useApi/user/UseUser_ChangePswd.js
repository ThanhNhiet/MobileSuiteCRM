import { useState } from 'react';
import { changePasswordApi } from '../../api/user/UserApi';

export const useChangePassword = () => {
    const [changing, setChanging] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Hàm validate password
    const validatePasswords = (oldPassword, newPassword, confirmPassword) => {
        if (!oldPassword.trim()) {
            return 'Vui lòng nhập mật khẩu hiện tại';
        }

        if (!newPassword.trim()) {
            return 'Vui lòng nhập mật khẩu mới';
        }

        if (newPassword.length < 6) {
            return 'Mật khẩu mới phải có ít nhất 6 ký tự';
        }

        if (newPassword !== confirmPassword) {
            return 'Mật khẩu xác nhận không khớp';
        }

        if (oldPassword === newPassword) {
            return 'Mật khẩu mới phải khác mật khẩu hiện tại';
        }

        return null;
    };

    // Hàm đổi mật khẩu
    const changePassword = async (oldPassword, newPassword, confirmPassword) => {
        try {
            // Validate trước khi gọi API
            const validationError = validatePasswords(oldPassword, newPassword, confirmPassword);
            if (validationError) {
                setError(validationError);
                return false;
            }

            setChanging(true);
            setError(null);
            setSuccess(false);

            const response = await changePasswordApi(oldPassword, newPassword);
            setSuccess(true);
            
            // Tự động clear success message sau 3 giây
            setTimeout(() => {
                setSuccess(false);
            }, 3000);

            return true;
        } catch (err) {
            let errorMessage = 'Không thể đổi mật khẩu';
            
            // Xử lý các lỗi cụ thể
            if (err.response?.status === 401) {
                errorMessage = 'Mật khẩu hiện tại không đúng';
            } else if (err.response?.status === 400) {
                errorMessage = 'Dữ liệu không hợp lệ';
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            console.warn('Change password error:', err);
            return false;
        } finally {
            setChanging(false);
        }
    };

    // Hàm reset state
    const resetState = () => {
        setError(null);
        setSuccess(false);
        setChanging(false);
    };

    // Hàm clear error
    const clearError = () => {
        setError(null);
    };

    return {
        changing,
        error,
        success,
        changePassword,
        validatePasswords,
        resetState,
        clearError
    };
};
