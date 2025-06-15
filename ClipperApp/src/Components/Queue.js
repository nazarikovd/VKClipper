import React, { useState, useEffect } from 'react';
import {
    Group,
    Div,
    RichCell,
    Text,
    Button,
    ButtonGroup,
    Select,
    FormItem,
    Placeholder,
    SimpleCell,
    UsersStack,
    Spinner,
    Header,
    IconButton
} from '@vkontakte/vkui';
import {
    Icon28DeleteOutline,
    Icon28VideoSquareOutline,
    Icon28DocumentOutline,
    Icon28ErrorCircleOutline,
    Icon16DownloadOutline,
    Icon16ArrowUturnLeftOutline,
    Icon16ArrowshapeLeftRight
} from '@vkontakte/icons';

const Queue = ({ api }) => {
    const [queue, setQueue] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const [groupsResponse, queueResponse] = await Promise.all([
                    api.call('groups.get'),
                    api.call('queue.get')
                ]);

                setGroups(groupsResponse.response);
                setQueue(queueResponse.response.items);
            } catch (err) {
                setError(err.error_msg || 'Ошибка загрузки данных');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [api]);

    const refreshQueue = async () => {
        setIsLoading(true);
        try {
            const params = selectedGroup !== 'all' ? { group_id: selectedGroup } : {};
            const response = await api.call('queue.get', params);
            setQueue(response.response.items);
        } catch (err) {
            setError(err.error_msg || 'Ошибка обновления очереди');
        } finally {
            setIsLoading(false);
        }
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
            await api.call('queue.complete', { file, group_id: groupId });
            await refreshQueue();
        } catch (err) {
            setError(err.error_msg || 'Ошибка при удалении задачи');
        }
    };

    const handleShowVideo = (file) => {
        api.openVid(file);
    };

    const getGroupTitle = (groupId) => {
        const group = groups.find(g => g.id === groupId);
        return group?.data?.name || `Группа ${groupId}`;
    };

    const getGroupImg = (groupId) => {
        const group = groups.find(g => g.id === groupId);
        return group?.data?.photo_50 || ``;
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
                <SimpleCell
                    before={<Icon28ErrorCircleOutline />}
                    subtitle={error}
                >
                    Ошибка загрузки
                </SimpleCell>
            </Group>
        );
    }

    const hasGroups = groups.length > 0;
    const hasTasks = queue.length > 0;

    return (
        <>
            <Group header={<Header size="s">Управление очередью</Header>}>

                <FormItem>
                    <ButtonGroup mode="horizontal" gap="s" stretched>
                        <Button
                            size="m"
                            onClick={refreshQueue}
                            loading={isLoading}
                            before={<Icon16ArrowshapeLeftRight />}
                            stretched
                        >
                            Обновить
                        </Button>
                        <Button
                            size="m"
                            mode="secondary"
                            before={<Icon16DownloadOutline />}
                            onClick={() => handleSaveRestore(true)}
                            loading={isLoading}
                            stretched
                            disabled={!hasTasks}
                        >
                            Сохранить
                        </Button>
                        <Button
                            size="m"
                            mode="secondary"
                            before={<Icon16ArrowUturnLeftOutline />}
                            onClick={() => handleSaveRestore(false)}
                            loading={isLoading}
                            stretched
                        >
                            Восстановить
                        </Button>
                    </ButtonGroup>
                </FormItem>

                {hasGroups && (
                    <FormItem top="Фильтр по группе">
                        <Select
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            options={[
                                { value: 'all', label: 'Все группы' },
                                ...groups.map(g => ({
                                    value: g.id.toString(),
                                    label: g.data.name || `Группа ${g.id}`
                                }))
                            ]}
                            disabled={!hasTasks}
                        />
                    </FormItem>
                )}

            </Group>

            <Group header={<Header size="s">Задачи в очереди • {queue.length}</Header>}>
                {!hasTasks ? (
                    <Div>
                        <Placeholder>
                            Очередь пуста
                        </Placeholder>
                    </Div>
                ) : (
                    <>

                        {queue.map((task, index) => (
                            <RichCell
                                key={index}
                                before={<Icon28DocumentOutline />}
                                beforeAlign="center"
                                afterAlign="center"
                                contentAlign='start'
                                bottom={
                                    task.isAll ? (
                                        <UsersStack>
                                            Все группы
                                        </UsersStack>
                                    ) : (
                                        <UsersStack photos={[getGroupImg(task.groupId)]}>
                                            {getGroupTitle(task.groupId)}
                                        </UsersStack>
                                    )
                                }
                                after={
                                    <ButtonGroup mode="horizontal">
                                        <IconButton
                                            size="m"
                                            mode="tertiary"
                                            appearance="accent"
                                            onClick={() => handleShowVideo(task.file)}

                                        >
                                            <Icon28VideoSquareOutline />
                                        </IconButton>
                                        <IconButton
                                            size="m"
                                            mode="tertiary"
                                            appearance="negative"
                                            onClick={() => handleRemoveTask(task.file, task.groupId)}
                                            before={<Icon28DeleteOutline width={16} height={16} />}
                                        >
                                            <Icon28DeleteOutline color="#FF3347" />
                                        </IconButton>
                                    </ButtonGroup>
                                }
                                textWrap="full"
                                style={{ padding: '12px 16px' }}
                            >
                                <Text weight="medium" ellipsis>
                                    {task.file}
                                </Text>
                            </RichCell>
                        ))}
                    </>
                )}
            </Group>
        </>
    );
};

export default Queue;