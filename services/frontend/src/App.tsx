import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/context/auth-store';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ToolsPage } from '@/pages/ToolsPage';
import { LendingsPage } from '@/pages/LendingsPage';
import { NeighborhoodsPage } from '@/pages/NeighborhoodsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AdminPage } from '@/pages/AdminPage';
import { SUPPORTED_LANGS } from '@/hooks/useLocalizedNavigate';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Admin-only route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Component that syncs URL language to i18n
function LanguageSync({ children }: { children: React.ReactNode }) {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (lang && SUPPORTED_LANGS.includes(lang) && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  // If invalid language, redirect to English version
  if (lang && !SUPPORTED_LANGS.includes(lang)) {
    const pathWithoutLang = location.pathname.replace(`/${lang}`, '') || '/';
    return <Navigate to={pathWithoutLang} replace />;
  }

  return <>{children}</>;
}

// Routes for non-English languages (de, es, fr)
function LocalizedRoutes() {
  return (
    <LanguageSync>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route
            path="tools"
            element={
              <ProtectedRoute>
                <ToolsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="lendings"
            element={
              <ProtectedRoute>
                <LendingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="neighborhoods"
            element={
              <ProtectedRoute>
                <NeighborhoodsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </LanguageSync>
  );
}

function AppContent() {
  const { checkAuth } = useAuthStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Set language to English for root routes
  useEffect(() => {
    const pathname = window.location.pathname;
    const firstSegment = pathname.split('/').filter(Boolean)[0];
    if (!firstSegment || !SUPPORTED_LANGS.includes(firstSegment)) {
      if (i18n.language !== 'en') {
        i18n.changeLanguage('en');
      }
    }
  }, [i18n]);

  return (
    <Routes>
      {/* English routes (no prefix) */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/tools"
          element={
            <ProtectedRoute>
              <ToolsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lendings"
          element={
            <ProtectedRoute>
              <LendingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/neighborhoods"
          element={
            <ProtectedRoute>
              <NeighborhoodsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
      </Route>

      {/* Localized routes (de, es, fr) */}
      <Route path="/:lang/*" element={<LocalizedRoutes />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
