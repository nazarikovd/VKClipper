import React, { useState, useEffect } from 'react'
import {
  Group, Div, Button, FormItem, RichCell, Spinner, 
  Placeholder, Header, ChipsSelect
} from '@vkontakte/vkui'
import {
  Icon28FolderSimpleOutline, Icon28Settings, Icon28VideoSquareOutline,
  Icon28ErrorCircleOutline, Icon28UserTagOutline, Icon28Users3Outline,
  Icon28StopwatchOutline, Icon16ArrowshapeLeftRight
} from '@vkontakte/icons'

const Logs = ({ api }) => {
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Теперь это массив выбранных типов объектов 📝
  const [selectedTypes, setSelectedTypes] = useState([])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.call('logs.get')
      setLogs(response.response.logs || [])
    } catch (err) {
      setError(err.error_msg || 'Ошибка загрузки логов')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Опции для фильтра
  const typeOptions = [
    { value: 'info', label: 'Информация' },
    { value: 'error', label: 'Ошибки' }
  ]

  // Фильтруем логи "на лету" 🪄
  const filteredLogs = selectedTypes.length > 0
    ? logs.filter(log => selectedTypes.some(t => t.value === log.type))
    : logs

  const getLogIcon = (from, type) => {
    if (type === "error") return <Icon28ErrorCircleOutline color="#FF3347" />
    switch (from) {
      case 'account': return <Icon28UserTagOutline color="#71AAEB" />
      case 'video': return <Icon28VideoSquareOutline color="#4BB34B" />
      case 'files': return <Icon28FolderSimpleOutline color="#FFA000" />
      case 'task': return <Icon28StopwatchOutline color="#8A3FFC" />
      case 'groups': return <Icon28Users3Outline color="#FF9F38" />
      default: return <Icon28Settings color="#6D7885" />
    }
  }

  const getLogSourceName = (from) => {
    const sources = {
      'files': 'Файлы',
      'account': 'Аккаунт',
      'task': 'Очередь',
      'groups': 'Группы',
      'video': 'Видео'
    }
    return sources[from] || 'Система'
  }

  if (isLoading && logs.length === 0) {
    return (
      <Group>
        <Div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
          <Spinner/>
        </Div>
      </Group>
    )
  }

  return (
    <>
      <Group header={<Header size="s">Управление логами</Header>}>
        <FormItem>
          <ChipsSelect
            value={selectedTypes}
            onChange={setSelectedTypes}
            options={typeOptions}
            placeholder="Все типы"
            emptyText="Ничего не найдено"
          />
        </FormItem>
      </Group>

      <Group header={<Header size="s">Журнал событий • {filteredLogs.length}</Header>}>
        {filteredLogs.length === 0 ? (
          <Div>
            <Placeholder>
              {logs.length === 0 ? 'Логи еще не записаны' : 'Нет записей по выбранным фильтрам'}
            </Placeholder>
          </Div>
        ) : (
          filteredLogs.map((log, index) => (
            <RichCell
              key={`${log.timestamp}-${index}`}
              before={getLogIcon(log.from, log.type)}
              subtitle={log.message}
              extraSubtitle={new Date(log.timestamp).toLocaleString()}
              beforeAlign="center"
              contentAlign="start"
            >
              {getLogSourceName(log.from)}
            </RichCell>
          ))
        )}
      </Group>
    </>
  )
}

export default Logs