import React, { useState, useEffect } from "react"
import { 
  Group, Placeholder, Div, Button, Header, Spinner, 
  FormItem, ChipsSelect 
} from "@vkontakte/vkui"
import { Icon28AddOutline } from "@vkontakte/icons"
import GroupCell from "./Group/GroupCell"
import GroupModal from "./Group/GroupModal"
import { useAccounts } from "../Contexts/AccountsContext"

const Groups = ({ api }) => {
  const { accounts = [] } = useAccounts()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeModal, setActiveModal] = useState(null)
  
  // Храним выбранные опции как массив объектов [{value, label}, ...]
  const [selectedOwners, setSelectedOwners] = useState([])

  const fetchGroups = async () => {
    try {
      const response = await api.getGroups()
      setGroups(response.response || [])
      setError(null)
    } catch (err) {
      setError(err.error_msg || "Ошибка загрузки")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
    const interval = setInterval(fetchGroups, 5000)
    return () => clearInterval(interval)
  }, [])

  // Формируем опции для селекта
  const ownerOptions = accounts.map(acc => ({ 
    value: String(acc.id), 
    label: `${acc.first_name} ${acc.last_name}` 
  }))

  // Фильтруем список групп "на лету" 🪄
  const filteredGroups = selectedOwners.length > 0
    ? groups.filter(g => selectedOwners.some(option => option.value === String(g.owner)))
    : groups

  const handleDeleteGroup = async (groupId) => {
    try {
      await api.deleteGroup(groupId)
      fetchGroups()
    } catch (err) {
      setError(err.error_msg)
    }
  }

  if (loading && groups.length === 0) {
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

        <>
          <Group header={<Header size="s">Управление группами</Header>}>
            {groups.length > 1 && (
            <FormItem>
              <ChipsSelect
                value={selectedOwners}
                onChange={setSelectedOwners}
                options={ownerOptions}
                placeholder="Все аккаунты"
                emptyText="Ничего не найдено"
                selectedBehavior="highlight" 
              />
            </FormItem>
            )}
            <Div>
                  <Button onClick={() => setActiveModal("add")} size="m" before={<Icon28AddOutline />} stretched mode="secondary">
                    Добавить группу
                  </Button>
            </Div>
          </Group>
          {filteredGroups.length > 0 && (
            <Group header={<Header size="s">Список групп • {filteredGroups.length}</Header>}>
              {filteredGroups.map((group) => (
                <GroupCell 
                  key={group.id} 
                  group={group} 
                  accounts={accounts} 
                  onDelete={handleDeleteGroup} 
                />
              ))}
            </Group>
          )}
        </>


      <GroupModal
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        api={api}
        setError={setError}
        error={error}
        fetchGroups={fetchGroups}
      />
    </>
  )
}

export default Groups