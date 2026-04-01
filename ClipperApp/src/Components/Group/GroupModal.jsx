import React, { useState, useEffect } from "react";
import {
  ModalPage, FormItem, Input, Button, FormLayoutGroup, FormStatus,
  ModalRoot, ModalPageHeader, Select, Radio, CustomSelectOption, Avatar, SegmentedControl
} from "@vkontakte/vkui";
import { useAccounts } from "../../Contexts/AccountsContext";

const GroupModal = ({ activeModal, setActiveModal, api, error, setError, fetchGroups }) => {
  const { accounts } = useAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [newGroup, setNewGroup] = useState({
    group_id: "",
    title: "",
    wallpost: 0,
    schedule: "15",
    owner_id: null,
  });
  const [mode, setMode] = useState("interval");
  const [userGroups, setUserGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [params, setParams] = useState({
    interval: "15",
    hourlyMinute: "02",
    dailyTime: "12:00",
    customCron: "* * * * *"
  });

  useEffect(() => {
    if (!selectedAccountId) {
      setUserGroups([]);
      setNewGroup(prev => ({ ...prev, group_id: "", title: "", owner_id: null }));
      return;
    }
    const loadGroups = async () => {
      setLoadingGroups(true);
      try {
        const response = await api.getUserGroups(selectedAccountId);
        const groups = response.response || [];
        setUserGroups(groups.map(g => ({
          value: g.id.toString(),
          label: g.name || `Группа ${g.id}`,
          avatar: g.photo_50 || g.photo_100,
        })));
      } catch (err) {
        setError("Не удалось загрузить группы пользователя");
      } finally {
        setLoadingGroups(false);
      }
    };
    loadGroups();
  }, [selectedAccountId, api]);

  useEffect(() => {
    let finalSchedule = "";
    if (mode === "interval") {
      finalSchedule = params.interval;
    } else if (mode === "hourly") {
      const min = parseInt(params.hourlyMinute) || 0;
      finalSchedule = `${min} * * * *`;
    } else if (mode === "daily") {
      const [hours, minutes] = params.dailyTime.split(':');
      finalSchedule = `${parseInt(minutes)} ${parseInt(hours)} * * *`;
    } else {
      finalSchedule = params.customCron;
    }
    setNewGroup(prev => ({ ...prev, schedule: finalSchedule }));
  }, [mode, params]);

  const handleGroupSelect = (groupId) => {
    const selected = userGroups.find(g => g.value === groupId);
    setNewGroup(prev => ({
      ...prev,
      group_id: groupId,
      title: selected?.label || "",
      owner_id: parseInt(selectedAccountId),
    }));
  };

  const handleAddGroup = async () => {
    if (!newGroup.group_id) {
      setError("Выберите группу");
      return;
    }
    if (!newGroup.owner_id) {
      setError("Выберите аккаунт");
      return;
    }
    setError(null);
    try {
      await api.addGroup(newGroup);
      await fetchGroups();
      setActiveModal(null);
      setNewGroup({ group_id: "", title: "", wallpost: 0, schedule: "15", owner_id: null });
      setSelectedAccountId('');
      setMode("interval");
    } catch (err) {
      setError(err.error_msg || "Не удалось добавить группу");
    }
  };

  const accountOptions = accounts.map(acc => ({
    value: acc.id.toString(),
    label: `${acc.first_name} ${acc.last_name}`,
    avatar: acc.photo_50,
  }));

  return (
    <ModalRoot activeModal={activeModal}>
      <ModalPage id="add" settlingHeight={100} onClose={() => setActiveModal(null)} header={<ModalPageHeader>Новая группа</ModalPageHeader>}>
        <FormLayoutGroup>
          {error && (
            <FormItem>
              <FormStatus mode="error">{error}</FormStatus>
            </FormItem>
          )}

          <FormItem top="Аккаунт VK">
            <Select
              placeholder="Выберите аккаунт"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              options={accountOptions}
              renderOption={({ option, ...restProps }) => (
                <CustomSelectOption key={option.value} {...restProps} before={option.avatar && <Avatar size={24} src={option.avatar} />} />
              )}
            />
          </FormItem>

          {selectedAccountId && (
            <FormItem top="Группа из VK">
              <Select
                placeholder={loadingGroups ? "Загрузка..." : "Выберите группу"}
                value={newGroup.group_id}
                onChange={(e) => handleGroupSelect(e.target.value)}
                disabled={loadingGroups || !selectedAccountId}
                options={userGroups}
                renderOption={({ option, ...restProps }) => (
                  <CustomSelectOption key={option.value} {...restProps} before={option.avatar && <Avatar size={24} src={option.avatar} />} />
                )}
              />
            </FormItem>
          )}

          <FormItem top="Описание клипов">
            <Input
              type="text"
              value={newGroup.title}
              onChange={(e) => setNewGroup(prev => ({ ...prev, title: e.target.value }))}
              placeholder="ХАХАХА"
            />
          </FormItem>

          <FormItem top="Режим очереди">
            <SegmentedControl
              value={mode}
              onChange={(v) => setMode(v)}
              options={[
                { label: 'Интервал', value: 'interval' },
                { label: 'Раз в час', value: 'hourly' },
                { label: 'Ежедневно', value: 'daily' },
                { label: 'Сам решу', value: 'custom' },
              ]}
            />
          </FormItem>

          {mode === 'interval' && (
            <FormItem top="Интервал (мин)">
              <Input type="number" value={params.interval} onChange={(e) => setParams(p => ({ ...p, interval: e.target.value }))} placeholder="15" />
            </FormItem>
          )}
          {mode === 'hourly' && (
            <FormItem top="В какую минуту каждого часа?" bottom={`Выражение: ${newGroup.schedule}`}>
              <Input type="number" min="0" max="59" value={params.hourlyMinute} onChange={(e) => setParams(p => ({ ...p, hourlyMinute: e.target.value }))} placeholder="02" />
            </FormItem>
          )}
          {mode === 'daily' && (
            <FormItem top="В какое время каждый день?" bottom={`Выражение: ${newGroup.schedule}`}>
              <Input type="time" value={params.dailyTime} onChange={(e) => setParams(p => ({ ...p, dailyTime: e.target.value }))} />
            </FormItem>
          )}
          {mode === 'custom' && (
            <FormItem top="Cron выражение">
              <Input value={params.customCron} onChange={(e) => setParams(p => ({ ...p, customCron: e.target.value }))} placeholder="* * * * *" />
            </FormItem>
          )}

          <FormItem top="Постить на стене?">
            <Radio name="wallpost" checked={newGroup.wallpost === 1} onChange={() => setNewGroup(prev => ({ ...prev, wallpost: 1 }))}>Да</Radio>
            <Radio name="wallpost" checked={newGroup.wallpost === 0} onChange={() => setNewGroup(prev => ({ ...prev, wallpost: 0 }))}>Нет</Radio>
          </FormItem>

          <FormItem>
            <Button size="l" stretched onClick={handleAddGroup} disabled={!newGroup.group_id || !newGroup.owner_id}>
              Добавить
            </Button>
          </FormItem>
        </FormLayoutGroup>
      </ModalPage>
    </ModalRoot>
  );
};

export default GroupModal;