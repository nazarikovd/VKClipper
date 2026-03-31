import React, { useState } from 'react';
import {
  Group, Placeholder, Button, Textarea, Snackbar, Alert,
  FormItem, FormLayoutGroup, Text
} from '@vkontakte/vkui';
import { Icon56KeyOutline, Icon16Done } from '@vkontakte/icons';
import { useAccounts } from '../contexts/AccountsContext';

const AddAccount = ({ onSuccess }) => {
  const { addAccount } = useAccounts();
  const [cookie, setCookie] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [popout, setPopout] = useState(null);

  const closePopout = () => setPopout(null);

  const showHint = () => {
    setPopout(
      <Alert
        actions={[{ title: 'Открыть vk.com', mode: 'none', action: () => window.open("https://vk.com/id0", "_blank") }]}
        onClose={closePopout}
        title="Как получить куки"
        description={
          <>
            <Text>1. Откройте VK.com и авторизуйтесь</Text>
            <Text>2. Нажмите F12 → вкладка Network</Text>
            <Text>3. Введите в фильтр "token"</Text>
            <Text>4. Нажмите F5 (обновить страницу)</Text>
            <Text>5. Найдите запрос ?act=web_token и нажмите на него</Text>
            <Text>6. Скопируйте Cookie: из вкладки Headers → Response Headers</Text>
          </>
        }
      />
    );
  };

  const handleSubmit = async () => {
    if (!cookie.trim()) {
      setError('Введите cookie');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await addAccount(cookie.trim());
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Group style={{ minHeight: '300px' }}>
      {popout}
      <Placeholder icon={<Icon56KeyOutline width={56} height={56} />} header="Авторизация по Cookie">
        Добавление аккаунта VK
      </Placeholder>
      <FormLayoutGroup>
        <FormItem top="Cookie">
          <Textarea
            grow={false}
            rows={3}
            value={cookie}
            onChange={(e) => setCookie(e.target.value)}
            placeholder="remixsid=..."
          />
        </FormItem>
        <FormItem>
          <Button size="l" onClick={handleSubmit} disabled={loading} stretched>
            Добавить аккаунт
          </Button>
        </FormItem>
        <FormItem>
          <Button size="l" onClick={showHint} stretched mode="link" appearance="accent-invariable">
            Как получить cookie?
          </Button>
        </FormItem>
      </FormLayoutGroup>
      {error && (
        <Snackbar onClose={() => setError(null)} before={<Icon16Done fill="var(--vkui--color_icon_negative)" />}>
          {error}
        </Snackbar>
      )}
      {success && (
        <Snackbar onClose={() => setSuccess(false)} before={<Icon16Done fill="var(--vkui--color_icon_positive)" />}>
          Аккаунт добавлен!
        </Snackbar>
      )}
    </Group>
  );
};

export default AddAccount;