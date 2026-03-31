import React, { useState, useEffect } from "react";
import { Group, Placeholder, Div, Button, Header, Spinner, Select, FormItem } from "@vkontakte/vkui";
import { Icon28AddOutline } from "@vkontakte/icons";
import GroupCell from "./Group/GroupCell";
import GroupModal from "./Group/GroupModal";
import { useAccounts } from "../contexts/AccountsContext";

const Groups = ({ api }) => {
  const { accounts } = useAccounts();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [filterOwner, setFilterOwner] = useState('all'); // 'all' или id аккаунта

  const fetchGroups = async () => {
    try {
      const response = await api.getGroups();
      let allGroups = response.response || [];
      if (filterOwner !== 'all') {
        allGroups = allGroups.filter(g => g.owner == filterOwner);
      }
      setGroups(allGroups);
      setError(null);
    } catch (err) {
      setError(err.error_msg || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    const interval = setInterval(fetchGroups, 5000);
    return () => clearInterval(interval);
  }, [filterOwner]);

  const handleDeleteGroup = async (groupId) => {
    try {
      await api.deleteGroup(groupId);
      await fetchGroups();
    } catch (err) {
      setError(err.error_msg || "Failed to delete group");
    }
  };

  if (loading && groups.length === 0) {
    return (
      <Group>
        <Div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
          <Spinner />
        </Div>
      </Group>
    );
  }

  const filterOptions = [
    { value: 'all', label: 'Все аккаунты' },
    ...accounts.map(acc => ({ value: acc.id.toString(), label: `${acc.first_name} ${acc.last_name}` }))
  ];

  return (
    <>
      <Group header={<Header size="s">Фильтр по аккаунту</Header>}>
        <FormItem>
          <Select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            options={filterOptions}
          />
        </FormItem>
      </Group>

      {groups.length === 0 ? (
        <Group>
          <Placeholder
            action={
              <Button onClick={() => setActiveModal("add")} size="m" before={<Icon28AddOutline />}>
                Новая группа
              </Button>
            }
          />
        </Group>
      ) : (
        <>
          <Group header={<Header size="s">Управление группами</Header>}>
            <Div>
              <Button onClick={() => setActiveModal("add")} size="m" before={<Icon28AddOutline />} stretched mode="secondary">
                Добавить группу
              </Button>
            </Div>
          </Group>
          <Group header={<Header size="s">Список групп • {groups.length}</Header>}>
            {groups.map((group) => (
              <GroupCell key={group.id} group={group} accounts={accounts} onDelete={handleDeleteGroup} />
            ))}
          </Group>
        </>
      )}

      <GroupModal
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        api={api}
        setError={setError}
        error={error}
        fetchGroups={fetchGroups}
      />
    </>
  );
};

export default Groups;