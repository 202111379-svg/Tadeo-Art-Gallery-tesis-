import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';

import { GalleryApp } from './GalleryApp';
import { store } from './store/store';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <GalleryApp />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
