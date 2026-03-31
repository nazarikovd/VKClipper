import React, { useState, useEffect } from 'react';
import {
    Panel,
    Group,
    Placeholder,
    Div,
    Spinner
} from '@vkontakte/vkui';
import {
    Icon56NewsfeedOutline
} from '@vkontakte/icons';
import CookieAuth from './CookieAuth';
import Profile from './Profile';

const Main = ({ api, isAuthorized, setIsAuthorized }) => {
    const [userData, setUserData] = useState({});
    const [stats, setStats] = useState({
        groupsCount: 0,
        queueCount: 0,
        completedCount: 0,
        errorsCount: 0,
        nextRun: '—',
        lastClip: '—',
        nextTask: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [user, groups, queue, logs, tasks] = await Promise.all([
                api.call('account.getProfileInfo'),
                api.call('groups.get'),
                api.call('queue.get'),
                api.call('logs.get', { type: 'error' }),
                api.call('tasks.getAllNext'),
            ]);

            setUserData(user.response);
            setStats({
                groupsCount: groups.response.length,
                queueCount: queue.response.count,
                completedCount: queue.response.finished, // Заменить на реальные данные
                errorsCount: logs.response.logs.length,
                nextRun: tasks.response.response[0].int || '—',
                lastClip: queue.response.items[0]?.file || '—',
                nextTask: queue.response.items[0]&&{
                    img: groups.response.filter(g => g.id === queue.response.items[0].groupId)[0].data.photo_50,
                    title: groups.response.filter(g => g.id === queue.response.items[0].groupId)[0].data.name,
                    isAll: queue.response.items[0].isAll
                }
            });
        } catch (error) {
            console.error('Data loading failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthorized) {
            checkAuth();
        } else {
            setAuthChecked(true);
            loadData();
        }
        // eslint-disable-next-line
    }, [isAuthorized]);

    const checkAuth = async () => {
        try {
            const response = await api.call('account.checkAuth');
            setIsAuthorized(response.response);
        } catch (error) {
            console.error('Auth check failed:', error);
            setIsAuthorized(false);
        } finally {
            setAuthChecked(true);
        }
    };

    const handleAuthSuccess = () => {
        setIsAuthorized(true);
        loadData();
    };

    if (!authChecked) {
        return (
            <Group>
                <Placeholder icon={<Icon56NewsfeedOutline />}>
                    Проверка авторизации...
                </Placeholder>
            </Group>
        );
    }

    if (!isAuthorized) {
        return <CookieAuth api={api} onSuccess={handleAuthSuccess} />;
    }
    if (isLoading) {
        return (
            <Group>
                <Div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                    <Spinner />
                </Div>
            </Group>
        );
    }
    return (
        <Panel>


            {isLoading ? (
                <Group>
                    <Placeholder>
                        Загрузка данных...
                    </Placeholder>
                </Group>
            ) : (
                <Profile userData={userData} stats={stats} onRefresh={loadData} />
            )}
        </Panel>
    );
};

export default Main;