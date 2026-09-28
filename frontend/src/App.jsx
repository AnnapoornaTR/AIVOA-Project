import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import LogDeviationPage from './pages/LogDeviationPage';

function App() {
  return (
    <Provider store={store}>
      <LogDeviationPage />
    </Provider>
  );
}

export default App;
