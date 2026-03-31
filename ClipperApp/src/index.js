import React from 'react';
import App from './App';

import { createRoot } from 'react-dom/client';
import {

  ConfigProvider,
  AdaptivityProvider,

} from '@vkontakte/vkui';

const container = document.getElementById('root');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(
  <ConfigProvider>
    <AdaptivityProvider>
      <App />
    </AdaptivityProvider>
  </ConfigProvider>
);

