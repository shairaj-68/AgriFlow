import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const FarmContext = createContext();

export const FarmProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [farms, setFarms] = useState([]);
  const [activeFarm, setActiveFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchFarms = async () => {
    if (!isAuthenticated) {
      setFarms([]);
      setActiveFarm(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/farms');
      const farmList = res.data;
      setFarms(farmList);

      if (farmList.length > 0) {
        // Keep current active farm if still present, or pick first active/available
        const savedId = localStorage.getItem('agriflow_active_farm_id');
        const found = farmList.find(f => f.id === parseInt(savedId)) || farmList.find(f => f.is_active) || farmList[0];
        setActiveFarm(found);
        localStorage.setItem('agriflow_active_farm_id', found.id.toString());
      } else {
        setActiveFarm(null);
      }
    } catch (err) {
      console.error('Failed to fetch farms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, [isAuthenticated, refreshKey]);

  const selectActiveFarm = (farm) => {
    setActiveFarm(farm);
    localStorage.setItem('agriflow_active_farm_id', farm.id.toString());
  };

  const triggerRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <FarmContext.Provider value={{
      farms,
      activeFarm,
      loading,
      selectActiveFarm,
      triggerRefresh,
      fetchFarms
    }}>
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => useContext(FarmContext);
