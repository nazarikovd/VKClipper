import React, { useState, useEffect } from 'react'
import {
  Group, Div, FormItem,
  Placeholder, Spinner, Header, Avatar, ChipsSelect,
  Button, ButtonGroup, Image, SimpleGrid, ToolButton, ContentBadge, useAdaptivityWithJSMediaQueries
} from '@vkontakte/vkui'
import {
  Icon20DeleteOutline,
  Icon16DownloadOutline, Icon16ArrowUturnLeftOutline,
  Icon16ArrowshapeLeftRight, Icon20LinkCircleOutline
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
  const baseURL = api.getBaseUrl()
  const {viewWidth} = useAdaptivityWithJSMediaQueries();

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
    return (date.toDateString() === now.toDateString() 
    ? 'Сегодня в ' 
    : `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')} в `) + timeStr
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

  const open = (file) => {
    window.open(`${baseURL}method/files.showVideo?file=${file}`, "_blank", "noopener,noreferrer");
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
                Очередь пуста
              </Placeholder>
            </Div>
          ) : (
            <SimpleGrid gap="m" columns={Math.min(viewWidth, 2)}>
              {filteredQueue.map((task, idx) => {
                const { group, owner } = getGroupInfo(task.groupId)
                return (
                  <Image 
                    borderRadius="l"
                    style={{ 
                        width: '100%', 
                        aspectRatio: '9 / 16',
                    }}
                    heightSize={480}
                    objectFit="cover"
                    src={`${baseURL}method/files.showCover?file=${task.file}`}>

                    <Image.FloatElement placement="top-start" inlineIndent="s" blockIndent="s">
                      <ContentBadge size="m" mode="outline" appearance="overlay" weight="2" >
                        {group.data.name}
                        <ContentBadge.SlotIcon>
                          <Avatar size={16} src={group.data.photo_100} />
                        </ContentBadge.SlotIcon>
                      </ContentBadge>
                    </Image.FloatElement>

                    <Image.FloatElement placement="top-end" inlineIndent="s" blockIndent="s">
                      <ContentBadge size="m" mode="outline" appearance="overlay" weight="3" >
                         {formatTime(task.postTime)}
                      </ContentBadge>
                    </Image.FloatElement>

                    <Image.FloatElement placement="bottom-end" inlineIndent="s" blockIndent="s">
                      <ToolButton 
                        mode="secondary" 
                        appearance="neutral"
                        IconCompact={Icon20DeleteOutline}
                        IconRegular={Icon20DeleteOutline}
                        onClick={() => handleRemoveTask(task.file, task.groupId)}
                      >
                      </ToolButton> 
                    </Image.FloatElement>
                    <Image.FloatElement placement="bottom-start" inlineIndent="s" blockIndent="s">
                      <ToolButton 
                        mode="secondary" 
                        appearance="neutral"
                        IconCompact={Icon20LinkCircleOutline}
                        IconRegular={Icon20LinkCircleOutline}
                        onClick={(e) => {
                          open(task.file)
                        }}
                      >
                        Открыть
                      </ToolButton>
                    </Image.FloatElement>
                  </Image>
                )
              })}
            </SimpleGrid>
          )}
      </Group>
    </>
  )
}

export default Queue