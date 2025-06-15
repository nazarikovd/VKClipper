import React, { useState, useEffect } from "react";
import {
  ModalPage,
  FormItem,
  Input,
  Button,
  FormLayoutGroup,
  FormStatus,
  ModalRoot,
  ModalPageHeader,
  Select,
  Radio,
  CustomSelectOption,
  Avatar
} from "@vkontakte/vkui";

const GroupModal = ({ activeModal, setActiveModal, api, error, setError, fetchGroups }) => {
  const [newGroup, setNewGroup] = useState({
    group_id: "",
    title: "",
    wallpost: 0, // 0 - не постить, 1 - постить
    interval: "15",
    data: {},
  });

  const [userGroups, setUserGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [inputMethod, setInputMethod] = useState("id");

  const handleInputMethodChange = (method) => {
    setInputMethod(method);
    if (method === "select" && userGroups.length === 0) {
      handleGetUserGroups();
    }
  };

  const handleGetUserGroups = async () => {
    setLoadingGroups(true);
    setError(null);
    
    try {
      const response = await api.call("account.getGroups");
      setUserGroups((response.response || []).map(group => ({
        value: group.id.toString(),
        label: group.name || `Группа ${group.id}`,
        avatar: group.photo_50 || group.photo_100 || undefined
      })));
    } catch (err) {
      console.error("Ошибка загрузки групп:", err);
      setError(err.error_msg || "Не удалось загрузить список групп");
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleGroupSelect = (e) => {
    const selectedGroup = userGroups.find(g => g.value === e.target.value) || {};
    setNewGroup(prev => ({
      ...prev,
      group_id: selectedGroup.value || "",
      title: selectedGroup.label || "",
    }));
  };

  const handleAddGroup = async () => {
    if (!newGroup.group_id) {
      setError("Укажите ID группы");
      return;
    }

    setError(null);
    try {
      await api.call("groups.add", newGroup);
      await fetchGroups();
      setActiveModal(null);
      setNewGroup({
        group_id: "",
        title: "",
        wallpost: 0,
        interval: "15",
        data: {},
      });
    } catch (err) {
      console.error("Ошибка добавления группы:", err);
      setError(err.error_msg || "Не удалось добавить группу");
    }
  };

  return (
    <ModalRoot activeModal={activeModal}>
      <ModalPage
        id="add"
        settlingHeight={100}
        onClose={() => setActiveModal(null)}
        header={<ModalPageHeader>Новая группа</ModalPageHeader>}
      >
        <FormLayoutGroup>
          {error && (
            <FormItem>
              <FormStatus mode="error">{error}</FormStatus>
            </FormItem>
          )}

          <FormItem>
            <Radio
              name="inputMethod"
              value="id"
              checked={inputMethod === "id"}
              onChange={() => handleInputMethodChange("id")}
            >
              Ввести ID группы
            </Radio>
            <Radio
              name="inputMethod"
              value="select"
              checked={inputMethod === "select"}
              onChange={() => handleInputMethodChange("select")}
            >
              Выбрать из моих групп
            </Radio>
          </FormItem>

          {inputMethod === "id" ? (
            <FormItem top="ID группы или screen_name">
              <Input
                type="text"
                value={newGroup.group_id}
                onChange={(e) => setNewGroup(prev => ({ ...prev, group_id: e.target.value }))}
                placeholder="123456789 или team"
              />
            </FormItem>
          ) : (
            <FormItem
              top="Мои группы"
              htmlFor="groups-select"
              bottom={loadingGroups ? "Загрузка..." : "Выберите группу из списка"}
            >
              <Select
                id="groups-select"
                placeholder={loadingGroups ? "Загрузка..." : "Выберите группу"}
                value={newGroup.group_id}
                onChange={handleGroupSelect}
                disabled={loadingGroups}
                options={userGroups}
                renderOption={({ option, ...restProps }) => (
                  <CustomSelectOption
                    key={option.value}
                    {...restProps}
                    before={option.avatar && <Avatar size={24} src={option.avatar} />}
                  />
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

          <FormItem top="Интервал (мин)">
            <Input
              type="number"
              value={newGroup.interval}
              onChange={(e) => setNewGroup(prev => ({ ...prev, interval: e.target.value }))}
              min="1"
              max="1440"
            />
          </FormItem>

          <FormItem top="Постить на стене?">
            <Radio
              name="wallpost"
              value="1"
              checked={newGroup.wallpost === 1}
              onChange={() => setNewGroup(prev => ({ ...prev, wallpost: 1 }))}
            >
              Да
            </Radio>
            <Radio
              name="wallpost"
              value="0"
              checked={newGroup.wallpost === 0}
              onChange={() => setNewGroup(prev => ({ ...prev, wallpost: 0 }))}
            >
              Нет
            </Radio>
          </FormItem>
          
          <FormItem>
            <Button
              size="l"
              stretched
              onClick={handleAddGroup}
              disabled={!newGroup.group_id}
            >
              Добавить
            </Button>
          </FormItem>
        </FormLayoutGroup>
      </ModalPage>
    </ModalRoot>
  );
};

export default GroupModal;