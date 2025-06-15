import React, { useState, useEffect } from 'react';
import {
    Group,
    FormLayoutGroup,
    FormItem,
    Textarea,
    Button,
    FormStatus,
    Input,
    Progress,
    Radio,
    RadioGroup,
    Header,
    Select
} from '@vkontakte/vkui';
import {
    Icon16Add,
} from '@vkontakte/icons';

const TikTokBatchUploader = ({ api }) => {
    const [linksText, setLinksText] = useState('');
    const [progress, setProgress] = useState(0);
    const [batchMode, setBatchMode] = useState(false);
    const [groupId, setGroupId] = useState('all');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [groups, setGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(true);

    useEffect(() => {
        // Загружаем список групп при монтировании компонента
        const fetchGroups = async () => {
            try {
                const response = await api.call('groups.get');
                if (response.response) {
                    setGroups(response.response);
                    if (response.response.length > 0) {
                        setGroupId(response.response[0].id.toString());
                    }
                }
            } catch (err) {
                setError('Не удалось загрузить список групп');
            } finally {
                setGroupsLoading(false);
            }
        };

        fetchGroups();
    }, [api]);

    const setBatchModeF = (value) => {
        if (value) {
            setBatchMode(true)
        } else {
            setBatchMode(false)
            setLinksText("")
        }
    }

    const doProgress = (qid) => {
        return new Promise((resolve) => {
            let inter = setInterval(() => {
                api.call('links.getProgress', {
                    queue_id: qid
                }).then(response => {
                    setProgress(response.progress)
                    if (response.progress === 100) {
                        clearInterval(inter)
                        resolve()
                    }
                });
            }, 1000)
        })
    }

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            if (batchMode) {
                const links = linksText.split('\n')
                    .map(link => link.trim())
                    .filter(link => link.length > 0);

                if (links.length === 0) {
                    setError('Введите хотя бы одну ссылку');
                    return;
                }
                const response = await api.call('links.add', {
                    links: links.join(','),
                    group_id: groupId
                });

                if (!response.response) {
                    throw new Error(response.error || 'Ошибка при добавлении ссылок');
                }

                await doProgress(response.qid)

                setSuccess(true);
                setLinksText('');
            } else {
                const response = await api.call('links.add', {
                    link: linksText,
                    group_id: groupId
                });

                if (!response === 1) {
                    throw new Error(response.error || 'Ошибка при добавлении ссылок');
                }

                setSuccess(true);
                setLinksText('');
            }
        } catch (err) {
            setError(err.message || 'Ошибка сервера');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Group header={<Header size="s">Скачивание видео</Header>}>
            <FormLayoutGroup>
                {success && (
                    <FormItem>
                        <FormStatus title="Готово" mode="none">
                            Успех
                        </FormStatus>
                    </FormItem>
                )}

                {error && (
                    <FormItem>
                        <FormStatus title="Ошибка" mode="error">
                            {error}
                        </FormStatus>
                    </FormItem>
                )}

                <FormItem>
                    <RadioGroup>
                        <Radio name="batch" value="1" checked={!batchMode} onClick={() => setBatchModeF(0)} readOnly>
                            Одна ссылка
                        </Radio>
                        <Radio name="batch" value="0" checked={batchMode} onClick={() => setBatchModeF(1)} readOnly>
                            Список ссылок
                        </Radio>
                    </RadioGroup>
                </FormItem>

                {batchMode ? (
                    <FormItem top="Список ссылок на TikTok (каждая с новой строки)">
                        <Textarea
                            grow={false}
                            rows={8}
                            value={linksText}
                            onChange={(e) => setLinksText(e.target.value)}
                            placeholder={`https://www.tiktok.com/@user1/video/123\nhttps://www.tiktok.com/@user2/video/456\nhttps://www.tiktok.com/@user3/video/789\n...`}
                            disabled={loading}
                        />
                    </FormItem>
                ) : (
                    <FormItem top="Ссылка">
                        <Input
                            value={linksText}
                            onChange={(e) => setLinksText(e.target.value)}
                            placeholder={`https://www.tiktok.com/@user1/video/123`}
                            disabled={loading}
                        />
                    </FormItem>
                )}

                <FormItem top="Группа для публикации">
                    <Select
                        value={groupId}
                        onChange={(e) => setGroupId(e.target.value)}
                        disabled={loading || groupsLoading}
                        options={[
                            { value: 'all', label: 'Все группы' },
                            ...groups.map(group => ({
                                value: group.id.toString(),
                                label: `${group.data?.name || `Группа ${group.id}`} (${group.pending_tasks} в очереди)`
                            }))
                        ]}
                    />
                </FormItem>

                <FormItem>
                    <Button
                        size="l"
                        stretched
                        onClick={handleSubmit}
                        disabled={loading || !linksText.trim() || groupsLoading}
                        before={loading ? null : <Icon16Add />}
                    >
                        {loading ? 'Добавляем...' : batchMode ? `Добавить ${linksText.split('\n').filter(l => l.trim()).length} ссылок` : 'Добавить'}
                    </Button>
                </FormItem>

                {loading && batchMode && (
                    <FormItem id="progresslabel" top="Прогресс">
                        <Progress aria-labelledby="progresslabel" value={progress} />
                    </FormItem>
                )}
            </FormLayoutGroup>
        </Group>
    );
};

export default TikTokBatchUploader;