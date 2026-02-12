import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { HabitProvider } from './store/HabitContext';
import { SyncProvider } from './store/SyncContext';
import { AuthGuard } from './components/layout/AuthGuard';
import { DashboardPage } from './pages/DashboardPage';
import { RangePage } from './pages/RangePage';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <AuthGuard>
          <SyncProvider>
            <HabitProvider>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/range" element={<RangePage />} />
              </Routes>
            </HabitProvider>
          </SyncProvider>
        </AuthGuard>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
