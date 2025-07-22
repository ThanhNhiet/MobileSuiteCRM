import { useCallback, useEffect, useState } from 'react';
import {
    getCountAllAccounts,
    getCountMyMeetings,
    getCountMyNotes,
    getCountMyTasks
} from '../../api/home/CountModulesApi';
import { eventEmitter } from '../../EventEmitter';

export const useCountModules = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([
    { title: 'Khách hàng', module: 'Accounts', all: 0 },
    { title: 'Ghi chú', module: 'Notes', my: 0 },
    { title: 'Công việc', module: 'Tasks', my: 0 },
    { title: 'Cuộc họp', module: 'Meetings', my: 0 }
  ]);

  const fetchCountModules = async () => {
    try {
      setLoading(true);
      setError(null);

      // Gọi các API song song để tăng hiệu suất
      const [accountsCount, meetingsCount, tasksCount, notesCount] = await Promise.all([
        getCountAllAccounts(),
        getCountMyMeetings(),
        getCountMyTasks(),
        getCountMyNotes()
      ]);

      setData([
        { title: 'Khách hàng', module: 'Accounts', all: accountsCount },
        { title: 'Ghi chú', module: 'Notes', my: notesCount },
        { title: 'Công việc', module: 'Tasks', my: tasksCount },
        { title: 'Cuộc họp', module: 'Meetings', my: meetingsCount }
      ]);
    } catch (err) {
      console.error('Error fetching count modules:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchCountModules();
  };

  // Clear data when logout
  const clearData = useCallback(() => {
    setData([
      { title: 'Khách hàng', module: 'Accounts', all: 0 },
    { title: 'Ghi chú', module: 'Notes', my: 0 },
    { title: 'Công việc', module: 'Tasks', my: 0 },
    { title: 'Cuộc họp', module: 'Meetings', my: 0 }
    ]);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    fetchCountModules();

    // Listen for logout event
    const handleLogout = () => {
      clearData();
    };
    eventEmitter.on('logout', handleLogout);

    return () => {
      eventEmitter.off('logout', handleLogout);
    };
  }, [clearData]);

  return {
    data,
    loading,
    error,
    refresh
  };
};