import React, { useState, useEffect } from 'react'
import { Group, Header, SimpleCell, Avatar, Spinner, Placeholder, Div, Button } from '@vkontakte/vkui'
import { Icon56UserCircleOutline, Icon28AddOutline } from '@vkontakte/icons'
import { useAccounts } from '../Contexts/AccountsContext'
import AccountModal from './AccountModal'

const Main = () => {
  const { accounts, loading } = useAccounts()
  const [activeModal, setActiveModal] = useState(null)

  useEffect(() => {
    if (!loading && accounts.length === 0) {
      setActiveModal('add-account')
    }
  }, [loading, accounts.length])

  if (loading) {
    return (
      <Group>
        <Div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
          <Spinner />
        </Div>
      </Group>
    )
  }

  return (
    <>

        <Group header={<Header size="s">Управление аккаунтами</Header>}>
        
        {accounts.length > 0 && (
          accounts.map(acc => (
            <SimpleCell
              key={acc.id}
              before={<Avatar src={acc.photo_200} size={48} />}
              subtitle={`ID: ${acc.id}`}
            >
              {`${acc.first_name} ${acc.last_name}`}
            </SimpleCell>
          ))
        )}

          <Div>
            <Button 
              onClick={() => setActiveModal('add-account')} 
              size="m" 
              before={<Icon28AddOutline />} 
              stretched 
              mode="secondary"
            >
              Добавить аккаунт
            </Button>
          </Div>
        </Group>


      {accounts.length > 0 && (
        <Group>
          <Placeholder icon={<Icon56UserCircleOutline />}>
            Всего аккаунтов: {accounts.length}
          </Placeholder>
        </Group>
      )}

      <AccountModal activeModal={activeModal} setActiveModal={setActiveModal} />
    </>
  )
}

export default Main