// Profile.js
import React from 'react';
import {
    Group,
    Header,
    SimpleCell,
    Avatar,
    Div,
    Title,
    Card,
    CardGrid,
    InfoRow,
    Button,
    ButtonGroup,
    Spinner,
    Placeholder,
} from '@vkontakte/vkui';
import {
    Icon28UserOutline,
    Icon28UsersOutline,
    Icon28ClipOutline,
    Icon28HistoryBackwardOutline,
    Icon28ErrorOutline,
    Icon28SettingsOutline,
    Icon28RefreshOutline
} from '@vkontakte/icons';

const Profile = ({ userData, stats, isLoading, onRefresh }) => {
    return (
        <>
            <Group header={<Header size="s">Профиль бота</Header>}>

                <SimpleCell
                    before={userData.photo_200 ?
                        <Avatar src={userData.photo_200} size={72} /> :
                        <Avatar size={72}><Icon28UserOutline /></Avatar>
                    }
                    subtitle={userData.domain ? `@${userData.domain}` : `ID${userData.id}`}

                >
                    <Title level="2">
                        {`${userData.first_name} ${userData.last_name}`}
                    </Title>
                </SimpleCell>

                <Div>
                    <ButtonGroup stretched>
                        <Button
                            size="m"
                            before={<Icon28RefreshOutline />}
                            onClick={onRefresh}
                            loading={isLoading}
                            stretched
                        >
                            Обновить
                        </Button>
                        <Button
                            size="m"
                            mode="secondary"
                            before={<Icon28SettingsOutline />}
                            stretched
                        >
                            Настройки
                        </Button>
                    </ButtonGroup>
                </Div>
            </Group>

            <Group header={<Header size="s">Статистика</Header>}>
                {isLoading ? (
                    <Div>
                        <Placeholder>
                            <Spinner size="regular" />
                        </Placeholder>
                    </Div>
                ) : (
                    <CardGrid size="m">
                        <Card mode="outline">
                            <SimpleCell before={
                                <Icon28UsersOutline color="white" />
                            }>
                                <InfoRow header="Группы">
                                    {stats.groupsCount || 0}
                                </InfoRow>
                            </SimpleCell>

                        </Card>

                        <Card mode="outline">

                            <SimpleCell before={
                                <Icon28ClipOutline color="white" />
                            }>
                                <InfoRow header="В очереди">
                                    {stats.queueCount || 0}
                                </InfoRow>
                            </SimpleCell>
                        </Card>

                        <Card mode="outline">

                            <SimpleCell before={
                                <Icon28HistoryBackwardOutline color="white" />
                            }>
                                <InfoRow header="Обработано">
                                    {stats.completedCount || 0}
                                </InfoRow>
                            </SimpleCell>
                        </Card>

                        <Card mode="outline">

                            <SimpleCell before={
                                <Icon28ErrorOutline color="white" />
                            }>
                                <InfoRow header="Ошибки">
                                    {stats.errorsCount || 0}
                                </InfoRow>
                            </SimpleCell>

                        </Card>
                    </CardGrid>
                )}
            </Group>
            {


                stats.nextTask &&
                <Group header={<Header size="s">Следующий клип</Header>}>

                    <SimpleCell

                        before={<Avatar size={28} src={stats.nextTask.img} />}
                        indicator={`Через ${Math.floor(stats.nextRun / 60 / 1000)} мин. ` || '—'}
                        afterAlign="center"
                        beforeAlign="center"

                    >
                        {stats.nextTask.title}
                    </SimpleCell>

                </Group>
            }
            
        </>
    );
};

export default Profile;