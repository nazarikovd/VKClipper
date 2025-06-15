import React, { useState } from 'react';
import {
    Group,
    FormLayoutGroup,
    FormItem,
    Textarea,
    Button,
    FormStatus,
    Input,
    Progress,
    Header,
    ButtonGroup
} from '@vkontakte/vkui';
import {
    Icon16Search,
    Icon16Clear,
    Icon16CopyOutline
} from '@vkontakte/icons';

const TikTokScrap = ({ api }) => {
    const [tag, setTag] = useState('');
    const [resultLinks, setResultLinks] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setResultLinks('');

        try {
            if (!tag.trim()) {
                throw new Error('Введите тег для поиска');
            }

            // Удаляем # если пользователь его ввел
            const cleanTag = tag.replace(/^#/, '');

            const response = await api.call('links.getByTag', {
                tag: cleanTag
            });

            if (!response || !response.links) {
                throw new Error(response?.error || 'Ошибка при получении ссылок');
            }

            setResultLinks(response.links.join('\n'));

        } catch (err) {
            setError(err.message || 'Нет ссылок');
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setTag('');
        setResultLinks('');
        setError(null);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(resultLinks)
        handleClear()
    };

    return (
        <>
            <Group header={<Header size="s">Парсинг видео с хештега</Header>}>
                <FormLayoutGroup>
                    {error && (
                        <FormItem>
                            <FormStatus title="Ошибка" mode="error">
                                {error}
                            </FormStatus>
                        </FormItem>
                    )}

                    <FormItem top="Тег для поиска">
                        <Input
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            placeholder="random"
                            disabled={loading}
                            before="#"
                        />
                    </FormItem>

                    <FormItem>
                        <Button
                            size="l"
                            stretched
                            onClick={handleSubmit}
                            disabled={loading || !tag.trim()}
                            before={loading ? null : <Icon16Search />}
                        >
                            {loading ? 'Ищем...' : 'Найти видео по тегу'}
                        </Button>
                    </FormItem>

                    {loading && (
                        <FormItem id="progresslabel" top="Прогресс">
                            <Progress aria-labelledby="progresslabel"/>
                        </FormItem>
                    )}
                </FormLayoutGroup>
            </Group >
            {resultLinks && (
                <Group header={<Header size="s">Найденные ссылки • {resultLinks.split("\n").length}</Header>}>
                    <FormLayoutGroup>

                        <>
                            <FormItem>
                                <Textarea
                                    grow={false}
                                    rows={8}
                                    value={resultLinks}
                                    readOnly
                                    placeholder="Здесь появятся найденные ссылки..."
                                />
                            </FormItem>
                            <FormItem>
                                <ButtonGroup stretched>
                                    <Button
                                        size="l"
                                        stretched
                                        mode="primary"
                                        onClick={handleCopy}
                                        before={<Icon16CopyOutline />}
                                    >
                                        Скопировать
                                    </Button>
                                    <Button
                                        size="l"

                                        mode="secondary"
                                        onClick={handleClear}
                                        before={<Icon16Clear />}
                                    >

                                    </Button>
                                </ButtonGroup>
                            </FormItem>
                        </>

                    </FormLayoutGroup>
                </Group>
            )}
        </>
    );
};

export default TikTokScrap;