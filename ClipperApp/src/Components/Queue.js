import React, { useState, useEffect } from 'react'
import {
  Group, Div, RichCell, Text, FormItem,
  Placeholder, Spinner, Header, IconButton, Avatar, ChipsSelect,
  Button, ButtonGroup
} from '@vkontakte/vkui'
import {
  Icon28DeleteOutline, Icon28DocumentOutline,
  Icon16DownloadOutline, Icon16ArrowUturnLeftOutline,
  Icon16ArrowshapeLeftRight
} from '@vkontakte/icons'
import { useAccounts } from '../Contexts/AccountsContext'

const Queue = ({ api }) => {
  const { accounts = [] } = useAccounts()
  const [queue, setQueue] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedOwners, setSelectedOwners] = useState([]) 
  const [selectedGroups, setSelectedGroups] = useState([]) 
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [groupsResponse, queueResponse] = await Promise.all([
        api.getGroups(),
        api.getQueue(),
      ])
      setGroups(groupsResponse.response || [])
      setQueue(queueResponse.response?.items || [])
      setError(null)
    } catch (err) {
      setError(err.error_msg || 'Ошибка загрузки данных')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const ownerOptions = accounts.map(acc => ({ 
    value: String(acc.id), 
    label: `${acc.first_name} ${acc.last_name}` 
  }))

  const groupOptions = groups
    .filter(g => {
      if (selectedOwners.length === 0) return true
      return selectedOwners.some(o => Number(o.value) === Number(g.owner))
    })
    .map(g => ({
      value: String(g.id),
      label: g.data?.name || `Группа ${g.id}` 
    }))

  const filteredQueue = queue.filter(task => {
    const group = groups.find(g => Number(g.id) === Number(task.groupId))
    if (!group) return false

    const matchesOwner = selectedOwners.length === 0 || 
      selectedOwners.some(o => Number(o.value) === Number(group.owner))
      
    const matchesGroup = selectedGroups.length === 0 || 
      selectedGroups.some(g => Number(g.value) === Number(task.groupId))

    return matchesOwner && matchesGroup
  })

  const formatTime = (ms) => {
    if (!ms) return 'В очереди'
    const date = new Date(ms)
    const now = new Date()
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return (date.toDateString() === now.toDateString() ? 'Сегодня в ' : `${date.getDate()}.${date.getMonth()+1} в `) + timeStr
  }

  const handleRemoveTask = async (file, groupId) => {
    try {
      await api.completeTask(file, groupId)
      await loadData()
    } catch (err) {
      setError(err.error_msg)
    }
  }

  const handleDownloadQueue = async () => {
    try {
      const response = await api.saveQueue()
    } catch (err) {
      setError(err.error_msg)
    }
  }

  const handleRestoreQueue = async () => {

    try {
      await api.restoreQueue()
      await loadData()
    } catch (err) {
      setError('Ошибка при восстановлении')
    }
  
  }

  const getGroupInfo = (groupId) => {
    const group = groups.find(g => g.id === groupId)
    const owner = accounts.find(acc => acc.id === group?.owner)
    return { group, owner }
  }

  if (isLoading && queue.length === 0) {
    return (
      <Group>
        <Div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
          <Spinner />
        </Div>
      </Group>
    )
  }

  return (
    <>
      <Group header={<Header size="s">Управление очередью</Header>}>
        <FormItem>
          <ChipsSelect
            value={selectedOwners}
            onChange={(val) => {
              setSelectedOwners(val)
              setSelectedGroups([])
            }}
            options={ownerOptions}
            placeholder="Все аккаунты"
            emptyText="Ничего не найдено"
          />
        </FormItem>
        
        {groups.length > 0 && (
          <FormItem>
            <ChipsSelect
              value={selectedGroups}
              onChange={setSelectedGroups}
              options={groupOptions}
              placeholder="Все доступные группы"
              emptyText="Группы не найдены"
            />
          </FormItem>
        )}

        <FormItem>
          <ButtonGroup mode="horizontal" gap="s" stretched>
            <Button size="m" onClick={handleDownloadQueue} before={<Icon16DownloadOutline />} mode="secondary" stretched>
              Скачать
            </Button>
            <Button size="m" onClick={handleRestoreQueue} before={<Icon16ArrowUturnLeftOutline />} mode="secondary" stretched>
              Восстановить
            </Button>
            <Button size="m" onClick={loadData} loading={isLoading} before={<Icon16ArrowshapeLeftRight />} stretched>
              Обновить
            </Button>
          </ButtonGroup>
        </FormItem>
      </Group>

      <Group header={<Header size="s">Задачи • {filteredQueue.length}</Header>}>
        {filteredQueue.length === 0 ? (
          <Div>
            <Placeholder>
              {queue.length === 0 ? "Очередь пуста" : "Ничего не найдено по фильтрам"}
            </Placeholder>
          </Div>
        ) : (
          filteredQueue.map((task, idx) => {
            const { group, owner } = getGroupInfo(task.groupId)
            return (
              <RichCell
                key={`${task.file}-${idx}`}
                before={<Icon28DocumentOutline />}
                overTitle={formatTime(task.postTime)}
                caption={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {owner && <Avatar size={20} src={owner.photo_50} />}
                    <Text>{group?.data?.name || `Группа ${task.groupId}`}</Text>
                    {owner && <Text weight="2" style={{ color: 'gray' }}>({owner.first_name})</Text>}
                  </div>
                }
                after={
                  <IconButton onClick={() => handleRemoveTask(task.file, task.groupId)}>
                    <Icon28DeleteOutline color="#FF3347" />
                  </IconButton>
                }
              >
                <Text weight="medium">{task.file}</Text>
              </RichCell>
            )
          })
        )}
      </Group>
    </>
  )
}

export default Queue