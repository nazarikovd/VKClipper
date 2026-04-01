import React, { useState, useEffect } from 'react';
import {
  Group, FormLayoutGroup, FormItem, Textarea, Button, FormStatus,
  Input, Progress, Radio, RadioGroup, Header, Select
} from '@vkontakte/vkui';
import { Icon16Add } from '@vkontakte/icons';
import { useAccounts } from '../Contexts/AccountsContext';

const TikTokBatchUploader = ({ api }) => {
  const { accounts } = useAccounts();
  const [linksText, setLinksText] = useState('');
  const [progress, setProgress] = useState(0);
  const [batchMode, setBatchMode] = useState(false);
  const [groupId, setGroupId] = useState('all');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      const response = await api.getGroups();
      const allGroups = response.response || [];
      setGroups(allGroups);
      if (allGroups.length > 0) {
        setGroupId(allGroups[0].id.toString());
      } else {
        setGroupId('all');
      }
    } catch (err) {
      setError('Не удалось загрузить список групп');
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const doProgress = (qid) => {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        api.getLinkProgress(qid).then(response => {
          setProgress(response.progress);
          if (response.progress === 100) {
            clearInterval(interval);
            resolve();
          }
        });
      }, 1000);
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (batchMode) {
        const links = linksText.split('\n').map(l => l.trim()).filter(l => l);
        if (links.length === 0) throw new Error('Введите хотя бы одну ссылку');
        const response = await api.addTikTokLinks(links, groupId);
        if (!response.response) throw new Error('Ошибка при добавлении ссылок');
        if (response.qid) await doProgress(response.qid);
      } else {
        const response = await api.addTikTokLink(linksText, groupId);
        if (!response.response) throw new Error('Ошибка при добавлении ссылки');
      }
      setSuccess(true);
      setLinksText('');
    } catch (err) {
      setError(err.message || 'Ошибка сервера');
    } finally {
      setLoading(false);
    }
  };

  const getGroupLabel = (group) => {
    const owner = accounts.find(acc => acc.id === group.owner);
    const ownerName = owner ? `${owner.first_name} ${owner.last_name}` : `Аккаунт ${group.owner}`;
    return `${group.data?.name || group.name} (${ownerName})`;
  };

  const groupOptions = [
    { value: 'all', label: 'Все группы' },
    ...groups.map(g => ({ value: g.id.toString(), label: getGroupLabel(g) }))
  ];

  return (
    <Group header={<Header size="s">Скачивание видео</Header>}>
      <FormLayoutGroup>
        {success && (
          <FormItem>
            <FormStatus title="Готово" mode="none">Успех</FormStatus>
          </FormItem>
        )}
        {error && (
          <FormItem>
            <FormStatus title="Ошибка" mode="error">{error}</FormStatus>
          </FormItem>
        )}
        <FormItem>
          <RadioGroup>
            <Radio name="batch" checked={!batchMode} onChange={() => setBatchMode(false)}>Одна ссылка</Radio>
            <Radio name="batch" checked={batchMode} onChange={() => setBatchMode(true)}>Список ссылок</Radio>
          </RadioGroup>
        </FormItem>
        {batchMode ? (
          <FormItem top="Список ссылок на TikTok (каждая с новой строки)">
            <Textarea
              rows={8}
              value={linksText}
              onChange={(e) => setLinksText(e.target.value)}
              placeholder="https://www.tiktok.com/@user/video/123"
              disabled={loading}
            />
          </FormItem>
        ) : (
          <FormItem top="Ссылка">
            <Input
              value={linksText}
              onChange={(e) => setLinksText(e.target.value)}
              placeholder="https://www.tiktok.com/@user/video/123"
              disabled={loading}
            />
          </FormItem>
        )}
        <FormItem top="Группа для публикации">
          <Select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            disabled={loading || groupsLoading}
            options={groupOptions}
          />
        </FormItem>
        <FormItem>
          <Button size="l" stretched onClick={handleSubmit} disabled={loading || !linksText.trim() || groupsLoading} before={loading ? null : <Icon16Add />}>
            {loading ? 'Добавляем...' : batchMode ? `Добавить ${linksText.split('\n').filter(l=>l.trim()).length} ссылок` : 'Добавить'}
          </Button>
        </FormItem>
        {loading && batchMode && (
          <FormItem top="Прогресс">
            <Progress value={progress} />
          </FormItem>
        )}
      </FormLayoutGroup>
    </Group>
  );
};

export default TikTokBatchUploader;