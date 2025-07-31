import { useState } from 'react';
import { UserLanguageUtils } from '../../../utils/cacheViewManagement/Users/UserLanguageUtils';
import { changePasswordApi } from '../../api/user/UserApi';

export const useChangePassword = () => {
    const [changing, setChanging] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const userLanguageUtils = UserLanguageUtils.getInstance();

    // Hàm validate password
    const validatePasswords = async (oldPassword, newPassword, confirmPassword) => {
        if (!oldPassword.trim()) {
            return await userLanguageUtils.translate('ERR_ENTER_OLD_PASSWORD', 'Vui lòng nhập mật khẩu hiện tại');
        }

        if (!newPassword.trim()) {
            return await userLanguageUtils.translate('ERR_ENTER_NEW_PASSWORD', 'Vui lòng nhập mật khẩu mới');
        }

        if (newPassword.length < 6) {
            const minLengthMessage = await userLanguageUtils.translate('ERR_PASSWORD_MINPWDLENGTH', 'Mật khẩu phải chứa tối thiểu 6 ký tự.');
            // Replace %d with the actual number (6)
            return minLengthMessage.replace('%d', '6');
        }

        if (newPassword !== confirmPassword) {
            return await userLanguageUtils.translate('ERR_REENTER_PASSWORDS', 'Mật khẩu xác nhận không khớp');
        }

        if (oldPassword === newPassword) {
            const newPasswordLabel = await userLanguageUtils.translate('LBL_NEW_PASSWORD', 'Mật khẩu mới');
            const otherLabel = await userLanguageUtils.translate('Other', 'phải khác');
            const oldPasswordLabel = await userLanguageUtils.translate('LBL_OLD_PASSWORD', 'mật khẩu hiện tại');
            return `${newPasswordLabel} ${otherLabel} ${oldPasswordLabel}`;
        }

        return null;
    };

    // Hàm đổi mật khẩu
    const changePassword = async (oldPassword, newPassword, confirmPassword) => {
        try {
            // Validate trước khi gọi API
            const validationError = await validatePasswords(oldPassword, newPassword, confirmPassword);
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
            let errorMessage = await userLanguageUtils.translate('ERR_AJAX_LOAD_FAILURE', 'Không thể đổi mật khẩu');
            
            // Xử lý các lỗi cụ thể
            if (err.response?.status === 401) {
                errorMessage = await userLanguageUtils.translate('ERR_PASSWORD_INCORRECT_OLD_1', 'Mật khẩu hiện tại không đúng');
            } else if (err.response?.status === 400) {
                const passwordLabel = await userLanguageUtils.translate('LBL_PASSWORD', 'Mật khẩu');
                const invalidLabel = await userLanguageUtils.translate('LBL_OPT_IN_INVALID', 'không hợp lệ');
                errorMessage = `${passwordLabel} ${invalidLabel}`;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
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
