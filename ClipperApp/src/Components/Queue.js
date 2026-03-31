import React, { useState, useEffect } from 'react';
import {
  Group, Div, RichCell, Text, Button, ButtonGroup, Select, FormItem,
  Placeholder, SimpleCell, UsersStack, Spinner, Header, IconButton, Avatar
} from '@vkontakte/vkui';
import {
  Icon28DeleteOutline, Icon28VideoSquareOutline, Icon28DocumentOutline,
  Icon28ErrorCircleOutline, Icon16DownloadOutline, Icon16ArrowUturnLeftOutline,
  Icon16ArrowshapeLeftRight
} from '@vkontakte/icons';
import { useAccounts } from '../contexts/AccountsContext';

const Queue = ({ api }) => {
  const { accounts } = useAccounts();
  const [queue, setQueue] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filterOwner, setFilterOwner] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [groupsResponse, queueResponse] = await Promise.all([
        api.getGroups(),
        api.getQueue(),
      ]);
      const allGroups = groupsResponse.response || [];
      setGroups(allGroups);
      let allTasks = queueResponse.response?.items || [];
      // Фильтруем по владельцу, если выбран
      if (filterOwner !== 'all') {
        const groupIdsForOwner = allGroups.filter(g => g.owner == filterOwner).map(g => g.id);
        allTasks = allTasks.filter(task => groupIdsForOwner.includes(task.groupId));
      }
      setQueue(allTasks);
    } catch (err) {
      setError(err.error_msg || 'Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterOwner]);

  const formatTime = (ms) => {
    if (!ms) return 'В очереди';
    const date = new Date(ms);
    const now = new Date();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isToday = date.toDateString() === now.toDateString();
    let pre = isToday ? 'Сегодня в ' : `${date.getDate()}.${date.getMonth()+1} в `;
    return pre + timeStr;
  };

  const refreshQueue = async () => {
    await loadData();
  };

  const handleSaveRestore = async (isSave) => {
    setIsLoading(true);
    try {
      await api.call(isSave ? 'queue.save' : 'queue.restore');
      await refreshQueue();
    } catch (err) {
      setError(err.error_msg || 'Ошибка операции');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTask = async (file, groupId) => {
    try {
      await api.completeTask(file, groupId);
      await refreshQueue();
    } catch (err) {
      setError(err.error_msg || 'Ошибка при удалении задачи');
    }
  };

  const handleShowVideo = (file) => {
    api.openVid(file);
  };

  const getGroupInfo = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    const owner = accounts.find(acc => acc.id === group?.owner);
    return { group, owner };
  };

  if (isLoading && queue.length === 0) {
    return (
      <Group>
        <Div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
          <Spinner />
        </Div>
      </Group>
    );
  }

  if (error) {
    return (
      <Group>
        <SimpleCell before={<Icon28ErrorCircleOutline />} subtitle={error}>
          Ошибка загрузки
        </SimpleCell>
      </Group>
    );
  }

  const ownerOptions = [
    { value: 'all', label: 'Все аккаунты' },
    ...accounts.map(acc => ({ value: acc.id.toString(), label: `${acc.first_name} ${acc.last_name}` }))
  ];

  return (
    <>
      <Group header={<Header size="s">Управление очередью</Header>}>
        <FormItem top="Фильтр по аккаунту">
          <Select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            options={ownerOptions}
          />
        </FormItem>
        <FormItem>
          <ButtonGroup mode="horizontal" gap="s" stretched>
            <Button size="m" onClick={refreshQueue} loading={isLoading} before={<Icon16ArrowshapeLeftRight />} stretched>
              Обновить
            </Button>
            <Button size="m" mode="secondary" before={<Icon16DownloadOutline />} onClick={() => handleSaveRestore(true)} loading={isLoading} stretched>
              Сохранить
            </Button>
            <Button size="m" mode="secondary" before={<Icon16ArrowUturnLeftOutline />} onClick={() => handleSaveRestore(false)} loading={isLoading} stretched>
              Восстановить
            </Button>
          </ButtonGroup>
        </FormItem>
      </Group>

      <Group header={<Header size="s">Задачи в очереди • {queue.length}</Header>}>
        {queue.length === 0 ? (
          <Div><Placeholder>Очередь пуста</Placeholder></Div>
        ) : (
          queue.map((task, idx) => {
            const { group, owner } = getGroupInfo(task.groupId);
            return (
              <RichCell
                key={idx}
                before={<Icon28DocumentOutline />}
                overTitle={formatTime(task.postTime)}
                caption={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {owner && <Avatar size={20} src={owner.photo_50} />}
                    <Text>{group?.data?.name || group?.name || `Группа ${task.groupId}`}</Text>
                    {owner && <Text weight="2" style={{ color: 'gray' }}>({owner.first_name})</Text>}
                  </div>
                }
                after={
                  <ButtonGroup mode="horizontal">
                    <IconButton onClick={() => handleShowVideo(task.file)}><Icon28VideoSquareOutline /></IconButton>
                    <IconButton onClick={() => handleRemoveTask(task.file, task.groupId)}><Icon28DeleteOutline color="#FF3347" /></IconButton>
                  </ButtonGroup>
                }
              >
                <Text weight="medium">{task.file}</Text>
              </RichCell>
            );
          })
        )}
      </Group>
    </>
  );
};

export default Queue;