import { useEffect, useState } from 'react';
import {
    getCountAllAccounts,
    getCountMyMeetings,
    getCountMyNotes,
    getCountMyTasks
} from '../../api/home/CountModulesApi';

export const useCountModules = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([
    { title: 'Accounts', all: 0 },
    { title: 'Notes', my: 0 },
    { title: 'Tasks', my: 0 },
    { title: 'Meetings', my: 0 }
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
        { title: 'Accounts', all: accountsCount },
        { title: 'Notes', my: notesCount },
        { title: 'Tasks', my: tasksCount },
        { title: 'Meetings', my: meetingsCount }
      ]);
    } catch (err) {
      console.error('Error fetching count modules:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountModules();
  }, []);

  const refresh = () => {
    fetchCountModules();
  };

  return {
    data,
    loading,
    error,
    refresh
  };
};