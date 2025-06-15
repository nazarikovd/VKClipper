import React, { useState } from 'react';
import {
    Group,
    Placeholder,
    Button,
    Textarea,
    Snackbar,
    Alert,
    FormItem,
    FormLayoutGroup,
    Text
} from '@vkontakte/vkui';
import { Icon56KeyOutline, Icon16Done } from '@vkontakte/icons';

const CookieAuth = ({ api, onSuccess }) => {
    const [cookie, setCookie] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [popout, setPopout] = React.useState(null);

    const closePopout = () => {
        setPopout(null);
    };

    const showHint = () => {
        setPopout(
            <Alert

                actions={[
                    { title: 'Открыть vk.com', mode: 'none', action: () => { window.open("https://vk.com/id0", "_blank") } }
                ]}
                onClose={closePopout}
                title="Как получить куки"
                description={<><Text> </Text><Text>1. Откройте VK.com и авторизуйтесь</Text>
                    <Text> </Text>
                    <Text>2. Нажмите F12 → вкладка Network</Text>
                    <Text> </Text>
                    <Text>3. Введите в фильтр "token"</Text>
                    <Text> </Text>
                    <Text>4. Нажмите F5 (обновить страницу)</Text>
                    <Text> </Text>
                    <Text>5. Найдите запрос ?act=web_token и нажмите на него</Text>
                    <Text> </Text>
                    <Text>6. Скопируйте Cookie: из вкладки Headers → Response Headers</Text>
                </>}

            />,
        );
    };


    const handleSubmit = async () => {
        if (!cookie.trim()) {
            setError('Введите cookie');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.call('account.setCookie', {
                cookie: cookie.trim()
            });

            if (response.error) {
                throw new Error(response.error.error_msg);
            }

            setSuccess(true);
            onSuccess()
            // Можно добавить редирект или обновление состояния приложения
        } catch (err) {
            setError(err.message || 'Ошибка авторизации');
        } finally {
            setLoading(false);
        }
    };

    return (

        <Group style={{ minHeight: '300px' }}>
            {popout}
            <Placeholder
                icon={<Icon56KeyOutline width={56} height={56} />}
                header="Авторизация по Cookie"
            //action="Скопируйте cookie с vk.com"
            >

                Авторизация

            </Placeholder>
            <FormLayoutGroup>
                <FormItem top="Cookie">
                    <Textarea

                        grow={false}
                        rows={3}
                        type="text"
                        value={cookie}
                        onChange={(e) => setCookie(e.target.value)}
                        placeholder="remixsid=..."

                    />
                </FormItem>
                <FormItem>
                    <Button
                        size="l"
                        onClick={handleSubmit}
                        disabled={loading}
                        stretched
                    >
                        Войти
                    </Button>
                </FormItem>
                <FormItem>
                    <Button
                        size="l"
                        onClick={showHint}
                        stretched
                        mode="link"
                        appearance="accent-invariable"
                    >
                        Как получить cookie?
                    </Button>
                </FormItem>
            </FormLayoutGroup>
            {error && (
                <Snackbar
                    onClose={() => setError(null)}
                    before={<Icon16Done fill="var(--vkui--color_icon_negative)" />}
                >
                    {error}
                </Snackbar>
            )}

            {success && (
                <Snackbar
                    onClose={() => setSuccess(false)}
                    before={<Icon16Done fill="var(--vkui--color_icon_positive)" />}
                >
                    Успешная авторизация!
                </Snackbar>
            )}
        </Group>
    );
};

export default CookieAuth;