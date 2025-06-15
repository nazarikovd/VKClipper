import React, { useState, useEffect } from 'react';
import {
    Group,
    Div,
    Button,
    Select,
    FormItem,
    RichCell,
    Spinner,
    Placeholder,
    Header
} from '@vkontakte/vkui';
import {
    Icon28FolderSimpleOutline,
    Icon28Settings,
    Icon28VideoSquareOutline,
    Icon28ErrorCircleOutline,
    Icon28UserTagOutline,
    Icon28Users3Outline,
    Icon28StopwatchOutline,
    Icon16ArrowshapeLeftRight
} from '@vkontakte/icons';

const Logs = ({ api }) => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [logTypeFilter, setLogTypeFilter] = useState('all');

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await api.call('logs.get');
                setLogs(response.response.logs);
            } catch (err) {
                setError(err.error_msg || 'Ошибка загрузки логов');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [api]);

    const refreshLogs = async () => {
        setIsLoading(true);
        try {
            const response = await api.call('logs.get');
            setLogs(response.response.logs);
        } catch (err) {
            setError(err.error_msg || 'Ошибка обновления логов');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLogs = logTypeFilter === 'all'
        ? logs
        : logs.filter(log => log.type === logTypeFilter);

    const getLogIcon = (from, type) => {
        if (type === "error") {
            return <Icon28ErrorCircleOutline color="#FF3347" />;
        }
        switch (from) {
            case 'account': return <Icon28UserTagOutline color="#71AAEB" />;
            case 'video': return <Icon28VideoSquareOutline color="#4BB34B" />;
            case 'files': return <Icon28FolderSimpleOutline color="#FFA000" />;
            case 'task': return <Icon28StopwatchOutline color="#8A3FFC" />;
            case 'groups': return <Icon28Users3Outline color="#FF9F38" />;
            default: return <Icon28Settings color="#6D7885" />;
        }
    };

    const getLogSourceName = (from) => {
        const sources = {
            'files': 'Файлы',
            'account': 'Аккаунт',
            'task': 'Очередь',
            'groups': 'Группы',
            'video': 'Видео'
        };
        return sources[from] || 'Система';
    };

    if (isLoading && logs.length === 0) {
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
                <RichCell
                    before={<Icon28ErrorCircleOutline />}
                    subtitle={error}
                >
                    Ошибка загрузки
                </RichCell>
            </Group>
        );
    }

    return (
        <>
            <Group header={<Header size="s">Управление логами</Header>}>

                <FormItem>
                    <Button
                        size="m"
                        onClick={refreshLogs}
                        loading={isLoading}
                        before={<Icon16ArrowshapeLeftRight />}
                        stretched
                    >
                        Обновить логи
                    </Button>
                </FormItem>
                <FormItem top="Фильтр по типу">
                    <Select
                        value={logTypeFilter}
                        onChange={(e) => setLogTypeFilter(e.target.value)}
                        options={[
                            { value: 'all', label: 'Все типы' },
                            { value: 'info', label: 'Информация' },
                            { value: 'error', label: 'Ошибки' }
                        ]}
                        disabled={logs.length === 0}
                    />
                </FormItem>

            </Group>

            <Group header={<Header size="s">Журнал событий • {logs.length}</Header>}>
                {filteredLogs.length === 0 ? (
                    <Div>
                        <Placeholder>
                            {logs.length === 0 ? 'Логи не найдены' : 'Нет записей по выбранному фильтру'}
                        </Placeholder>
                    </Div>
                ) : (
                    <>
                        {filteredLogs.map((log, index) => (
                            <RichCell
                                key={index}
                                before={getLogIcon(log.from, log.type)}
                                subtitle={log.message}
                                extraSubtitle={new Date(log.timestamp).toLocaleString()}

                                beforeAlign="center"
                                contentAlign='start'
                            >

                                {getLogSourceName(log.from)}
                            </RichCell>

                        ))}
                    </>
                )}
            </Group>
        </>
    );
};

export default Logs;