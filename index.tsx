import React from 'react';
import ReactDOM from 'react-dom/client';
import { getPlatform } from './utils/platform';
import IOSApp from './ios/IOSApp';
import AndroidApp from './android/AndroidApp';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const renderAppForPlatform = () => {
  const platform = getPlatform();
  switch (platform) {
    case 'ios':
      return <IOSApp />;
    case 'android':
      return <AndroidApp />;
    default:
      // Fallback to the desktop/web version
      return <App />;
  }
};

root.render(
  <React.StrictMode>
    {renderAppForPlatform()}
  </React.StrictMode>
);