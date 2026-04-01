import React from 'react';
import { RichCell, Avatar, Button, ButtonGroup, Title, Text } from '@vkontakte/vkui';
import { Icon16CopyOutline, Icon16Delete } from '@vkontakte/icons';

const GroupCell = ({ group, accounts, onDelete }) => {
  const ownerAccount = accounts.find(acc => acc.id === group.owner);
  return (
    <RichCell
      before={<Avatar size={72} src={group.data?.photo_50} />}
      overTitle={`@${group.data?.screen_name || group.screen_name}`}
      afterAlign="center"
      after={group.pending_tasks}
      afterCaption="видео в очереди"
      extraSubtitle={`через ${Math.floor(group.nextRun / 60000)}м.`}
      caption={
        <Text style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Avatar size={20} src={ownerAccount?.photo_50} />
          {ownerAccount ? `${ownerAccount.first_name} ${ownerAccount.last_name}` : `Аккаунт ${group.owner}`}
        </Text>
      }
      actions={
        <ButtonGroup mode="horizontal" gap="s" stretched>
          <Button
            onClick={() => navigator.clipboard.writeText(group.id)}
            size="s"
            mode="outline"
            appearance="neutral"
            before={<Icon16CopyOutline />}
          >
            Скопировать ID
          </Button>
          <Button
            onClick={() => onDelete(group.id)}
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
      <Title level="2">{group.data?.name || group.name}</Title>
    </RichCell>
  );
};

export default GroupCell;