import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { DataProvider, useData } from './contexts/DataContext.jsx';
import TabBar from './components/TabBar.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ScanPage from './pages/ScanPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import LibraryPage from './pages/LibraryPage.jsx';
import CollectionsPage from './pages/CollectionsPage.jsx';
import CollectionDetailPage from './pages/CollectionDetailPage.jsx';
import BookDetailPage from './pages/BookDetailPage.jsx';
import BookEditPage from './pages/BookEditPage.jsx';
import ManualAddPage from './pages/ManualAddPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import Loader from './components/Loader.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

function Gate() {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <AuthPage />;
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  );
}

function Shell() {
  const location = useLocation();
  const { error } = useData();
  const hideTabs = /^\/(book|edit|add|collection)\//.test(location.pathname);

  if (error) return <DataError error={error} />;

  return (
    <div className="min-h-full flex flex-col">
      <main className="flex-1 pb-24">
        <Routes>
          <Route path="/" element={<Navigate to="/library" replace />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/find" element={<SearchPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collection/:id" element={<CollectionDetailPage />} />
          <Route path="/book/:id" element={<BookDetailPage />} />
          <Route path="/edit/:id" element={<BookEditPage />} />
          <Route path="/add/manual" element={<ManualAddPage />} />
          <Route path="/add/from-scan" element={<ManualAddPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/library" replace />} />
        </Routes>
      </main>
      {!hideTabs && <TabBar />}
    </div>
  );
}

function DataError({ error }) {
  const isPermission = error?.code === 'permission-denied';
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 gap-4 bg-cream">
      <div className="text-[20px] font-bold">Can't reach your library</div>
      {isPermission ? (
        <div className="text-[14px] text-ash max-w-sm">
          Firestore is rejecting reads. Deploy the security rules:
          <pre className="mt-3 text-left text-[12px] bg-white border border-hairline rounded-lg p-3 overflow-x-auto">{`firebase deploy --only firestore:rules`}</pre>
        </div>
      ) : (
        <div className="text-[14px] text-ash max-w-sm font-mono break-words">
          {error?.code || error?.message || 'Unknown error'}
        </div>
      )}
      <button onClick={() => location.reload()} className="ios-button-secondary">
        Retry
      </button>
    </div>
  );
}
