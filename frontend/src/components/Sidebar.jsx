import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 260;

const Sidebar = ({ open, onClose, mobile }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const menuItems = [
    {
      text: t('dashboard.admin'),
      icon: <DashboardIcon />,
      path: '/admin',
      roles: ['admin'],
    },
    {
      text: t('dashboard.employee'),
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: ['employee'],
    },
    {
      text: t('dashboard.newTask'),
      icon: <AssignmentIcon />,
      path: user?.role === 'admin' ? '/admin' : '/dashboard',
      roles: ['admin', 'supervisor'],
    },
    {
      text: t('team.title'),
      icon: <PeopleIcon />,
      path: '/admin/teams',
      roles: ['admin', 'supervisor'],
    },
    {
      text: t('evaluation.review'),
      icon: <AssessmentIcon />,
      path: '/admin/ratings',
      roles: ['admin', 'supervisor'],
    },
    {
      text: 'الملف الشخصي',
      icon: <PersonIcon />,
      path: '/profile',
      roles: ['admin', 'supervisor', 'employee'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });

  const handleNavigation = (path) => {
    navigate(path);
    if (mobile) {
      onClose();
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Company Logo and Name */}
      <Box
        sx={{
          p: 3,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          component="img"
          src="/logo.svg"
          alt="Company Logo"
          sx={{
            width: 60,
            height: 60,
            bgcolor: 'white',
            borderRadius: '50%',
            p: 1,
            border: '2px solid white',
          }}
        />
        <Typography variant="h6" fontWeight={600} align="center">
          Norka Solution
        </Typography>
        <Typography variant="caption" align="center" sx={{ opacity: 0.9 }}>
          نظام إدارة المهام
        </Typography>
      </Box>

      <Divider />

      {/* User Info */}
      <Box sx={{ p: 2, bgcolor: 'grey.100' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            src={user?.avatar_url || user?.avatar}
            sx={{ width: 48, height: 48 }}
          >
            {user?.first_name?.[0] || user?.username[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Chip
              label={
                user?.role === 'admin'
                  ? t('auth.admin')
                  : user?.role === 'supervisor'
                  ? t('auth.supervisor')
                  : t('auth.employee')
              }
              size="small"
              color={user?.role === 'admin' ? 'error' : user?.role === 'supervisor' ? 'secondary' : 'primary'}
              sx={{ height: 20, fontSize: '0.7rem', mt: 0.5 }}
            />
          </Box>
        </Box>
        {user?.position && (
          <Typography variant="caption" color="text.secondary" display="block">
            {user.position}
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Menu Items */}
      <List sx={{ flex: 1, pt: 1 }}>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => handleNavigation(item.path)}
              sx={{
                '&.Mui-selected': {
                  bgcolor: '#2A6496',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#1A3A5C',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  bgcolor: 'rgba(42,100,150,0.08)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path) ? 'white' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Footer */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          © Norka Solution 2026
        </Typography>
      </Box>
    </Box>
  );

  if (mobile) {
    return (
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderLeft: 'none',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;

