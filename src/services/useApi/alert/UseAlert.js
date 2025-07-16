import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { deleteAlertApi, getAlertsApi, getUnreadAlertsCountApi, markAlertAsReadApi } from '../../api/alert/AlertApi';

export const useAlert = () => {
    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    
    // Refs for intervals
    const alertsIntervalRef = useRef(null);
    const countIntervalRef = useRef(null);
    const appStateRef = useRef(AppState.currentState);

    // Hàm lấy danh sách alerts
    const fetchAlerts = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await getAlertsApi(20, 1); // Lấy 20 alerts mới nhất
            
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
            
            // Cập nhật unread count từ dữ liệu hiện tại
            const currentUnreadCount = processedAlerts.filter(alert => !alert.is_read).length;
            setUnreadCount(currentUnreadCount);
            
            console.log(`Loaded ${processedAlerts.length} alerts, ${currentUnreadCount} unread`);
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
            console.log(`Unread alerts count: ${count}`);
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
            
            console.log(`Marked alert ${alertId} as read`);
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
            console.log(`Marked ${unreadAlerts.length} alerts as read`);
        } catch (err) {
            console.warn('Mark all as read error:', err);
            throw err;
        }
    }, [alerts]);

    // Hàm refresh thủ công
    const refreshAlerts = useCallback(() => {
        fetchAlerts(true);
    }, [fetchAlerts]);

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
            fetchAlerts(false);
        }, 2 * 60 * 1000);

        // Refresh unread count every 30 seconds
        countIntervalRef.current = setInterval(() => {
            fetchUnreadCount();
        }, 30 * 1000);

        console.log('Auto refresh started');
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
        console.log('Auto refresh stopped');
    }, []);

    // Handle app state changes
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
                // App came to foreground, refresh data
                console.log('App became active, refreshing alerts');
                fetchAlerts(false);
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
    }, [fetchAlerts, fetchUnreadCount, startAutoRefresh, stopAutoRefresh]);

    // Initial load and setup
    useEffect(() => {
        fetchAlerts(false);
        startAutoRefresh();

        // Cleanup on unmount
        return () => {
            stopAutoRefresh();
        };
    }, [fetchAlerts, startAutoRefresh, stopAutoRefresh]);

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
            
            console.log(`Deleted alert: ${alertId}`);
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
            
            console.log(`Deleted all ${alerts.length} alerts`);
        } catch (err) {
            console.warn('Delete all alerts error:', err);
            throw err;
        }
    }, [alerts]);

    return {
        alerts,
        unreadCount,
        loading,
        refreshing,
        error,
        fetchAlerts,
        refreshAlerts,
        markAsRead,
        markAllAsRead,
        fetchUnreadCount,
        deleteAlert,
        deleteAllAlerts
    };
};
