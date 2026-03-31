import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../Components/API';

const AccountsContext = createContext();

export const useAccounts = () => useContext(AccountsContext);

export const AccountsProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = async () => {
    try {
      const response = await api.call('account.getList');
      const list = response.response || [];
      setAccounts(list);
    } catch (err) {
      console.error('Failed to load accounts', err);
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async (cookie) => {
    const response = await api.call('account.addAccount', { cookie });
    const userId = response.response;
    if (userId) {
      await loadAccounts();
      return userId;
    }
    throw new Error('Failed to add account');
  };

  const removeAccount = async (userId) => {
    // если бэк поддержит удаление
    console.warn('removeAccount not implemented');
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  return (
    <AccountsContext.Provider value={{ accounts, loading, addAccount, removeAccount, refreshAccounts: loadAccounts }}>
      {children}
    </AccountsContext.Provider>
  );
};