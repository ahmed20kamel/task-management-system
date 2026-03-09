import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import { useTranslation } from 'react-i18next';
import './i18n';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import TaskDetail from './pages/TaskDetail';
import TeamsPage from './pages/TeamsPage';
import RatingsReviewPage from './pages/RatingsReviewPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';

// Get language from localStorage or default to Arabic
const savedLanguage = localStorage.getItem('language') || 'ar';
const isRtl = savedLanguage === 'ar';

const theme = createTheme({
  direction: isRtl ? 'rtl' : 'ltr',
  palette: {
    primary: {
      main: '#1A3A5C',
      light: '#2A6496',
      dark: '#0F2640',
      contrastText: '#fff',
    },
    secondary: {
      main: '#2A6496',
      light: '#4A8AC4',
      dark: '#1A3A5C',
      contrastText: '#fff',
    },
    warning: {
      main: '#f5a623',
      light: '#ffc107',
      dark: '#e65100',
    },
    error: {
      main: '#dc3545',
      light: '#ef5350',
      dark: '#c62828',
    },
    success: {
      main: '#28a745',
      light: '#66bb6a',
      dark: '#1b5e20',
    },
    info: {
      main: '#17a2b8',
      light: '#4fc3f7',
      dark: '#01579b',
    },
    background: {
      default: '#F7F9FC',
      paper: '#ffffff',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#5A6A7A',
    },
  },
  typography: {
    fontFamily: '"Cairo", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 500,
          cursor: 'pointer',
          padding: '8px 20px',
        },
        containedPrimary: {
          backgroundColor: '#2A6496',
          '&:hover': {
            backgroundColor: '#1A3A5C',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '& fieldset': {
            borderColor: '#E0E4EA',
          },
          '&:hover fieldset': {
            borderColor: '#2A6496',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 14,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#EEF4FF !important',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  },
});

function PrivateRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return <div>{t('app.loading')}</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

// Create RTL and LTR caches
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

const cacheLtr = createCache({
  key: 'muiltr',
});

function App() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || localStorage.getItem('language') || 'ar';
  const isRtl = currentLang === 'ar';

  // Select cache based on direction
  const emotionCache = React.useMemo(() => {
    return isRtl ? cacheRtl : cacheLtr;
  }, [isRtl]);

  // Update theme direction based on language
  const currentTheme = React.useMemo(() => createTheme({
    ...theme,
    direction: isRtl ? 'rtl' : 'ltr',
  }), [isRtl]);

  // Set HTML direction and language attributes
  React.useEffect(() => {
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', currentLang);
    document.body.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  }, [isRtl, currentLang]);

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <Register />} />
            
            <Route
              path="/admin/*"
              element={
                <PrivateRoute requireAdmin={true}>
                  <Layout>
                    <Routes>
                      <Route index element={<AdminDashboard />} />
                      <Route path="tasks/:id" element={<TaskDetail />} />
                      <Route path="teams" element={<TeamsPage />} />
                      <Route path="ratings" element={<RatingsReviewPage />} />
                    </Routes>
                  </Layout>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/dashboard/*"
              element={
                <PrivateRoute>
                  <Layout>
                    <Routes>
                      <Route index element={<EmployeeDashboard />} />
                      <Route path="tasks/:id" element={<TaskDetail />} />
                    </Routes>
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </PrivateRoute>
              }
            />
            
            <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;

