import React, { useState, useEffect } from 'react'
import { Group, Header, SimpleCell, Avatar, Spinner, Placeholder, Div, Button, IconButton, RichCell, ButtonGroup, Title, UsersStack, Skeleton } from '@vkontakte/vkui'
import { Icon56UserCircleOutline, Icon28AddOutline, Icon16Delete, Icon16CopyOutline, Icon20LogoVk } from '@vkontakte/icons'
import { useAccounts } from '../Contexts/AccountsContext'
import AccountModal from './AccountModal'

const Main = ({ api }) => {
  const { accounts, loading, removeAccount, refreshAccounts } = useAccounts()
  const [activeModal, setActiveModal] = useState(null)
  const [groups, setGroups] = useState([])
  const [isLoadingGroups, setLoadingGroups] = useState(true)

  const fetchGroups = async () => {
    try {
      const response = await api.getGroups()
      setGroups(response.response || [])
      console.log(response)
    } catch (err) {
      console.log(err)
    } finally {
      setLoadingGroups(false)
    }
  }

  const open = (domain) => {
    window.open(`https://vk.com/${domain}`, "_blank", "noopener,noreferrer");
  }

  const getAccountGroups = (oid) => {
    return groups.filter((g) => g.owner === oid)
  }


  useEffect(() => {
    if (!loading && accounts.length === 0) {
      setActiveModal('add-account')
    }
  }, [loading, accounts.length])

  useEffect(() => {
    refreshAccounts().then(fetchGroups())
    
  }, [])

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
          {accounts.map(acc => (
            <RichCell
              key={acc.id}
              overTitle={`@${acc.domain}`}
              before={<Avatar size={96} src={acc.photo_200} />}
              bottom={
                isLoadingGroups ? (<Skeleton width="35%" />) : (
                <UsersStack
                  size="m"
                  visibleCount={3}
                  count={getAccountGroups(acc.id).length - 3}
                  photos={
                    getAccountGroups(acc.id).map((g) => {
                      return g.data.photo_50
                    })
                  }
                  >
                                    {
                    getAccountGroups(acc.id).map((g) => {
                      return g.data.name
                    }).slice(0, 3).join(", ")
                  } { getAccountGroups(acc.id).length > 3 && (` и еще ${getAccountGroups(acc.id).length - 3}`)
                  }
                </UsersStack>
                )
              }
              actions={
                <ButtonGroup mode="horizontal" gap="s" stretched>
                  <Button
                    onClick={() => open(acc.domain)}
                    size="s"
                    mode="outline"
                    appearance="neutral"
                    before={<Icon20LogoVk />}
                  >
                  Открыть
                  </Button>
                  <Button
                    onClick={() => removeAccount(acc.id)}
                    size="s"
                    mode="outline"
                    appearance="negative"
                    before={<Icon16Delete />}
                  >
                  Удалить
                  </Button>
                </ButtonGroup>
              }
            >
            {`${acc.first_name} ${acc.last_name}`}
            </RichCell>
          ))}
        </Group>
      )}

      <AccountModal activeModal={activeModal} setActiveModal={setActiveModal} />
    </>
  )
}

export default Main