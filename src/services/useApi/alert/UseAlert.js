import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { deleteAlertApi, getAlertsApi, getUnreadAlertsCountApi, markAlertAsReadApi } from '../../api/alert/AlertApi';
import { eventEmitter } from '../../EventEmitter';

export const useAlert = () => {
    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pagination, setPagination] = useState({
        hasNext: false,
        hasPrev: false,
        nextLink: null,
        prevLink: null
    });
    
    // Refs for intervals
    const alertsIntervalRef = useRef(null);
    const countIntervalRef = useRef(null);
    const appStateRef = useRef(AppState.currentState);

    // Hàm lấy danh sách alerts
    const fetchAlerts = useCallback(async (isRefresh = false, pageNumber = 1) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await getAlertsApi(6, pageNumber); // Lấy 6 alerts mỗi trang
            
            // Xử lý dữ liệu alerts
            const processedAlerts = response.data.map(alert => ({
                id: alert.id,
                name: alert.attributes.name,
                created_by_name: alert.attributes.created_by_name,
                date_entered: alert.attributes.date_entered,
                is_read: alert.attributes.is_read === '1',
                target_module: alert.attributes.target_module,
                type: alert.attributes.type || 'info'
            }));

            setAlerts(processedAlerts);
            
            // Cập nhật thông tin phân trang
            setCurrentPage(pageNumber);
            setTotalPages(response.meta['total-pages'] || 1);
            setPagination({
                hasNext: response.links.next !== null,
                hasPrev: response.links.prev !== null,
                nextLink: response.links.next,
                prevLink: response.links.prev
            });
            
            // Cập nhật unread count từ dữ liệu hiện tại
            const currentUnreadCount = processedAlerts.filter(alert => !alert.is_read).length;
            // Chỉ cập nhật unread count khi ở trang 1 để tránh sai lệch
            if (pageNumber === 1) {
                setUnreadCount(currentUnreadCount);
            }
            
            // console.log(`Loaded ${processedAlerts.length} alerts on page ${pageNumber}/${response.meta['total-pages']}`);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Không thể tải thông báo';
            setError(errorMessage);
            console.warn('Fetch alerts error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Hàm lấy số lượng tin nhắn chưa đọc
    const fetchUnreadCount = useCallback(async () => {
        try {
            const count = await getUnreadAlertsCountApi();
            setUnreadCount(count);
            // console.log(`Unread alerts count: ${count}`);
        } catch (err) {
            console.warn('Fetch unread count error:', err);
        }
    }, []);

    // Hàm đánh dấu đã đọc
    const markAsRead = useCallback(async (alertId) => {
        try {
            await markAlertAsReadApi(alertId);
            
            // Cập nhật state local
            setAlerts(prevAlerts => 
                prevAlerts.map(alert => 
                    alert.id === alertId 
                        ? { ...alert, is_read: true }
                        : alert
                )
            );
            
            // Giảm unread count
            setUnreadCount(prevCount => Math.max(0, prevCount - 1));
            
            // console.log(`Marked alert ${alertId} as read`);
        } catch (err) {
            console.warn('Mark as read error:', err);
            throw err;
        }
    }, []);

    // Hàm đánh dấu tất cả đã đọc
    const markAllAsRead = useCallback(async () => {
        try {
            const unreadAlerts = alerts.filter(alert => !alert.is_read);
            
            // Đánh dấu từng alert
            await Promise.all(
                unreadAlerts.map(alert => markAlertAsReadApi(alert.id))
            );
            
            // Cập nhật state local
            setAlerts(prevAlerts => 
                prevAlerts.map(alert => ({ ...alert, is_read: true }))
            );
            
            setUnreadCount(0);
            // console.log(`Marked ${unreadAlerts.length} alerts as read`);
        } catch (err) {
            console.warn('Mark all as read error:', err);
            throw err;
        }
    }, [alerts]);

    // Hàm refresh thủ công
    const refreshAlerts = useCallback(() => {
        fetchAlerts(true, currentPage);
    }, [fetchAlerts, currentPage]);

    // Setup auto refresh intervals
    const startAutoRefresh = useCallback(() => {
        // Clear existing intervals
        if (alertsIntervalRef.current) {
            clearInterval(alertsIntervalRef.current);
        }
        if (countIntervalRef.current) {
            clearInterval(countIntervalRef.current);
        }

        // Refresh alerts every 2 minutes
        alertsIntervalRef.current = setInterval(() => {
            fetchAlerts(false, currentPage);
        }, 2 * 60 * 1000);

        // Refresh unread count every 30 seconds
        countIntervalRef.current = setInterval(() => {
            fetchUnreadCount();
        }, 30 * 1000);

        // console.log('Auto refresh started');
    }, [fetchAlerts, fetchUnreadCount]);

    // Stop auto refresh
    const stopAutoRefresh = useCallback(() => {
        if (alertsIntervalRef.current) {
            clearInterval(alertsIntervalRef.current);
            alertsIntervalRef.current = null;
        }
        if (countIntervalRef.current) {
            clearInterval(countIntervalRef.current);
            countIntervalRef.current = null;
        }
        // console.log('Auto refresh stopped');
    }, []);

    // Handle app state changes
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
                // App came to foreground, refresh data
                // console.log('App became active, refreshing alerts');
                fetchAlerts(false, currentPage);
                fetchUnreadCount();
            } else if (nextAppState.match(/inactive|background/)) {
                // App went to background, stop auto refresh
                stopAutoRefresh();
            } else if (nextAppState === 'active') {
                // App is active, start auto refresh
                startAutoRefresh();
            }
            
            appStateRef.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => subscription?.remove();
    }, [fetchAlerts, fetchUnreadCount, startAutoRefresh, stopAutoRefresh, currentPage]);

    // Initial load and setup
    useEffect(() => {
        fetchAlerts(false, 1);
        startAutoRefresh();

        // Listen for logout event
        const handleLogout = () => {
            clearAllData();
        };
        eventEmitter.on('logout', handleLogout);

        // Cleanup on unmount
        return () => {
            stopAutoRefresh();
            eventEmitter.off('logout', handleLogout);
        };
    }, [fetchAlerts, startAutoRefresh, stopAutoRefresh, clearAllData]);

    // Clear error when alerts change
    useEffect(() => {
        if (alerts.length > 0 && error) {
            setError(null);
        }
    }, [alerts, error]);

    // Hàm xóa một alert
    const deleteAlert = useCallback(async (alertId) => {
        try {
            await deleteAlertApi(alertId);
            
            // Cập nhật state local - xóa alert khỏi danh sách
            setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
            
            // Cập nhật unread count nếu alert bị xóa là chưa đọc
            setAlerts(prevAlerts => {
                const deletedAlert = prevAlerts.find(alert => alert.id === alertId);
                if (deletedAlert && !deletedAlert.is_read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
                return prevAlerts.filter(alert => alert.id !== alertId);
            });
            
            // console.log(`Deleted alert: ${alertId}`);
        } catch (err) {
            console.warn('Delete alert error:', err);
            throw err;
        }
    }, []);

    // Hàm xóa tất cả alerts
    const deleteAllAlerts = useCallback(async () => {
        try {
            // Xóa từng alert
            await Promise.all(
                alerts.map(alert => deleteAlertApi(alert.id))
            );
            
            // Clear toàn bộ state
            setAlerts([]);
            setUnreadCount(0);
            
            // console.log(`Deleted all ${alerts.length} alerts`);
        } catch (err) {
            console.warn('Delete all alerts error:', err);
            throw err;
        }
    }, [alerts]);

    // Hàm chuyển trang
    const goToPage = useCallback((pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            fetchAlerts(false, pageNumber);
        }
    }, [fetchAlerts, totalPages]);

    // Hàm chuyển trang tiếp theo
    const goToNextPage = useCallback(() => {
        if (pagination.hasNext && currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    }, [goToPage, currentPage, totalPages, pagination.hasNext]);

    // Hàm chuyển trang trước đó
    const goToPrevPage = useCallback(() => {
        if (pagination.hasPrev && currentPage > 1) {
            goToPage(currentPage - 1);
        }
    }, [goToPage, currentPage, pagination.hasPrev]);

    // Clear all data and stop intervals (for logout)
    const clearAllData = useCallback(() => {
        stopAutoRefresh();
        setAlerts([]);
        setUnreadCount(0);
        setLoading(false);
        setRefreshing(false);
        setError(null);
        setCurrentPage(1);
        setTotalPages(1);
        setPagination({
            hasNext: false,
            hasPrev: false,
            nextLink: null,
            prevLink: null
        });
    }, [stopAutoRefresh]);

    return {
        alerts,
        unreadCount,
        loading,
        refreshing,
        error,
        currentPage,
        totalPages,
        pagination,
        fetchAlerts,
        refreshAlerts,
        markAsRead,
        markAllAsRead,
        fetchUnreadCount,
        deleteAlert,
        deleteAllAlerts,
        goToPage,
        goToNextPage,
        goToPrevPage,
        clearAllData
    };
};
