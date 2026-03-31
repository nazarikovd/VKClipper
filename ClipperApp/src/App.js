import * as React from 'react';
import { AppRoot } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';
import { AccountsProvider } from './contexts/AccountsContext';
import EpicComponent from './Epic';

const App = () => (
  <AppRoot>
    <AccountsProvider>
      <EpicComponent />
    </AccountsProvider>
  </AppRoot>
);

export default App;