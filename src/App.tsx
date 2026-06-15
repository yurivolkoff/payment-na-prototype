import { Navigate, Route, Routes } from 'react-router-dom';

import { HomeScreen } from './screens/HomeScreen';
import { OplataScreen } from './screens/OplataScreen';
import { OrgSearchScreen } from './screens/OrgSearchScreen';
import { OrgCardScreen } from './screens/OrgCardScreen';
import { ToastHost } from './components/ui/Toast';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/oplata" element={<OplataScreen />} />
        <Route path="/poisk-organizacii" element={<OrgSearchScreen />} />
        <Route path="/organizaciya/:orgId" element={<OrgCardScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastHost />
    </>
  );
}
