import * as React from 'react';
import {
  usePlatform, useAdaptivityConditionalRender, SplitLayout, SplitCol,
  Panel, PanelHeader, Group, Cell, Epic, View, Tabbar, TabbarItem, PanelHeaderBack
} from '@vkontakte/vkui';
import {
  Icon28ClipOutline, Icon28Users3Outline, Icon28ClockOutline,
  Icon28ArticleOutline, Icon28ChainOutline, Icon28PlayCards2Outline
} from '@vkontakte/icons';
import '@vkontakte/vkui/dist/vkui.css';
import Main from './Components/Main';
import Groups from './Components/Groups';
import TikTok from './Components/TikTok';
import Queue from './Components/Queue';
import Logs from './Components/Logs';
import api from './Components/API';
import TikTokScrap from './Components/TikTokScrap';
import { useAccounts } from './contexts/AccountsContext';

const EpicComponent = () => {
  const { accounts, loading } = useAccounts();
  const platform = usePlatform();
  const { viewWidth } = useAdaptivityConditionalRender();
  const [activeStory, setActiveStory] = React.useState('main');
  const noop = () => setActiveStory('main');
  const activeStoryStyles = { backgroundColor: 'var(--vkui--color_background_secondary)', borderRadius: 8 };
  const onStoryChange = (e) => setActiveStory(e.currentTarget.dataset.story);
  const hasHeader = platform !== 'vkcom';
  const isAuthorized = !loading && accounts.length > 0;

  return (
    <SplitLayout header={hasHeader && <PanelHeader delimiter="none">VK Clipper</PanelHeader>} center>
      {viewWidth.tabletPlus && (
        <SplitCol className={viewWidth.tabletPlus.className} fixed width={280} maxWidth={280}>
          <Panel>
            {hasHeader && <PanelHeader />}
            <Group>
              <Cell data-story="main" onClick={onStoryChange} before={<Icon28ClipOutline />} style={activeStory === 'main' ? activeStoryStyles : undefined}>Clipper</Cell>
              <Cell data-story="groups" onClick={onStoryChange} before={<Icon28Users3Outline />} disabled={!isAuthorized} style={activeStory === 'groups' ? activeStoryStyles : undefined}>Группы</Cell>
              <Cell data-story="tiktok" onClick={onStoryChange} before={<Icon28PlayCards2Outline />} disabled={!isAuthorized} style={activeStory === 'tiktok' ? activeStoryStyles : undefined}>TikTok</Cell>
              <Cell data-story="tiktokscrap" onClick={onStoryChange} before={<Icon28ChainOutline />} disabled={!isAuthorized} style={activeStory === 'tiktokscrap' ? activeStoryStyles : undefined}>Scrap</Cell>
              <Cell data-story="queue" onClick={onStoryChange} before={<Icon28ClockOutline />} disabled={!isAuthorized} style={activeStory === 'queue' ? activeStoryStyles : undefined}>Очередь</Cell>
              <Cell data-story="profile" onClick={onStoryChange} before={<Icon28ArticleOutline />} disabled={!isAuthorized} style={activeStory === 'profile' ? activeStoryStyles : undefined}>Лог</Cell>
            </Group>
          </Panel>
        </SplitCol>
      )}

      <SplitCol width="100%" maxWidth="560px" stretchedOnMobile autoSpaced>
        <Epic activeStory={activeStory} tabbar={viewWidth.tabletMinus && (
          <Tabbar className={viewWidth.tabletMinus.className}>
            <TabbarItem onClick={onStoryChange} selected={activeStory === 'main'} data-story="main" label="Clipper"><Icon28ClipOutline /></TabbarItem>
            <TabbarItem onClick={onStoryChange} selected={activeStory === 'groups'} data-story="groups" label="Группы" disabled={!isAuthorized}><Icon28Users3Outline /></TabbarItem>
            <TabbarItem onClick={onStoryChange} selected={activeStory === 'tiktok'} data-story="tiktok" label="TikTok" disabled={!isAuthorized}><Icon28PlayCards2Outline /></TabbarItem>
            <TabbarItem onClick={onStoryChange} selected={activeStory === 'tiktokscrap'} data-story="tiktokscrap" label="Scrap" disabled={!isAuthorized}><Icon28ChainOutline /></TabbarItem>
            <TabbarItem onClick={onStoryChange} selected={activeStory === 'queue'} data-story="queue" label="Очередь" disabled={!isAuthorized}><Icon28ClockOutline /></TabbarItem>
            <TabbarItem onClick={onStoryChange} selected={activeStory === 'profile'} data-story="profile" label="Логи" disabled={!isAuthorized}><Icon28ArticleOutline /></TabbarItem>
          </Tabbar>
        )}>
          <View id="main" activePanel="main"><Panel id="main"><PanelHeader>Статус</PanelHeader><Main /></Panel></View>
          <View id="groups" activePanel="groups"><Panel id="groups"><PanelHeader before={<PanelHeaderBack onClick={noop} />}>Группы</PanelHeader><Groups api={api} /></Panel></View>
          <View id="queue" activePanel="queue"><Panel id="queue"><PanelHeader before={<PanelHeaderBack onClick={noop} />}>Очередь</PanelHeader><Queue api={api} /></Panel></View>
          <View id="tiktok" activePanel="tiktok"><Panel id="tiktok"><PanelHeader before={<PanelHeaderBack onClick={noop} />}>TikTok</PanelHeader><TikTok api={api} /></Panel></View>
          <View id="tiktokscrap" activePanel="tiktokscrap"><Panel id="tiktokscrap"><PanelHeader before={<PanelHeaderBack onClick={noop} />}>Scrap</PanelHeader><TikTokScrap api={api} /></Panel></View>
          <View id="profile" activePanel="profile"><Panel id="profile"><PanelHeader before={<PanelHeaderBack onClick={noop} />}>Логи</PanelHeader><Logs api={api} /></Panel></View>
        </Epic>
      </SplitCol>
    </SplitLayout>
  );
};

export default EpicComponent;