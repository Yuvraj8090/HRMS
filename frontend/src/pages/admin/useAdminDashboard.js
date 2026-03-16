import { useState, useEffect } from 'react';
import { employeeAPI, requestAPI, attendanceAPI, projectAPI, departmentAPI } from '../../services/api';
import { logger } from '../../utils/logger'; 

// CRITICAL FIX: This MUST be named useAdminDashboard, and it is a named export.
export function useAdminDashboard() {
  const [data, setData] = useState({ employees: 0, pending: 0, present: 0, projects: 0, departments: 0 });
  const [recentEmps, setRecentEmps] = useState([]);
  const [pendingReqs, setPendingReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          employeeAPI.getAll({ limit: 6 }),
          requestAPI.getPending({ limit: 5 }),
          attendanceAPI.getDailyOverview(),
          projectAPI.getAll({ limit: 1 }),
          departmentAPI.getAll(),
        ]);

        if (!isMounted) return;

        results.forEach((res, index) => {
            if (res.status === 'rejected') {
                logger.error(`Dashboard API call at index ${index} failed:`, res.reason);
            }
        });

        setData({
          employees: results[0].status === 'fulfilled' ? results[0].value.data.total : 0,
          pending: results[1].status === 'fulfilled' ? results[1].value.data.total : 0,
          present: results[2].status === 'fulfilled' ? results[2].value.data.count : 0,
          projects: results[3].status === 'fulfilled' ? results[3].value.data.total : 0,
          departments: results[4].status === 'fulfilled' ? (results[4].value.data.data || []).length : 0,
        });

        if (results[0].status === 'fulfilled') setRecentEmps(results[0].value.data.data || []);
        if (results[1].status === 'fulfilled') setPendingReqs(results[1].value.data.data?.slice(0, 4) || []);

      } catch (err) {
        logger.error('Critical failure loading dashboard:', err);
        setError('Failed to load dashboard metrics. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardData();
    return () => { isMounted = false; }; 
  }, []);

  return { data, recentEmps, pendingReqs, loading, error };
}