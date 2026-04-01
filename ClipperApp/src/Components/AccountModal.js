import React from 'react'
import { ModalRoot, ModalPage, ModalPageHeader, Button } from '@vkontakte/vkui'
import { Icon24Dismiss } from '@vkontakte/icons'
import AddAccount from './AddAccount'

const AccountModal = ({ activeModal, setActiveModal }) => {
  return (
    <ModalRoot activeModal={activeModal} onClose={() => setActiveModal(null)}>
      <ModalPage 
        id="add-account" 
        onClose={() => setActiveModal(null)}
        settlingHeight={100}
        header={<ModalPageHeader>Авторизация</ModalPageHeader>}
      >
        <AddAccount onSuccess={() => setActiveModal(null)} />
      </ModalPage>
    </ModalRoot>
  )
}

export default AccountModal