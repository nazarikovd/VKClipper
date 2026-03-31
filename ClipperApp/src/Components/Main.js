import React from 'react';
import { Group, Header, SimpleCell, Avatar, Spinner, Placeholder, Div } from '@vkontakte/vkui';
import { Icon56UserCircleOutline } from '@vkontakte/icons';  // изменено
import { useAccounts } from '../contexts/AccountsContext';
import AddAccount from './AddAccount';

const Main = () => {
  const { accounts, loading } = useAccounts();

  if (loading) {
    return (
      <Group>
        <Div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
          <Spinner />
        </Div>
      </Group>
    );
  }

  if (accounts.length === 0) {
    return <AddAccount />;
  }

  return (
    <>
      <Group header={<Header size="s">Аккаунты VK</Header>}>
        {accounts.map(acc => (
          <SimpleCell
            key={acc.id}
            before={<Avatar src={acc.photo_200} size={48} />}
            subtitle={`ID: ${acc.id}`}
            indicator="активен"
          >
            {`${acc.first_name} ${acc.last_name}`}
          </SimpleCell>
        ))}
      </Group>
      <Group>
        <Placeholder icon={<Icon56UserCircleOutline />}>
          Всего аккаунтов: {accounts.length}
        </Placeholder>
      </Group>
    </>
  );
};

export default Main;