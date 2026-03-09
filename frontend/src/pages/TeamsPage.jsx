import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Box,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TeamsPage = () => {
  const { t } = useTranslation();
  const [teams, setTeams] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leader: '',
  });

  useEffect(() => {
    fetchTeams();
    fetchSupervisors();
    fetchEmployees();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await api.get('/auth/teams/');
      setTeams(response.data);
    } catch (error) {
      toast.error('حدث خطأ في تحميل الفرق');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await api.get('/auth/supervisors/');
      setSupervisors(response.data);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/auth/employees/');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleOpenDialog = (team = null) => {
    if (team) {
      setSelectedTeam(team);
      setFormData({
        name: team.name,
        description: team.description || '',
        leader: team.leader?.id || '',
      });
    } else {
      setSelectedTeam(null);
      setFormData({
        name: '',
        description: '',
        leader: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTeam(null);
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        leader: formData.leader || null,
      };

      if (selectedTeam) {
        await api.put(`/auth/teams/${selectedTeam.id}/`, submitData);
        toast.success('تم تحديث الفريق بنجاح');
      } else {
        await api.post('/auth/teams/', submitData);
        toast.success('تم إنشاء الفريق بنجاح');
      }
      handleCloseDialog();
      fetchTeams();
    } catch (error) {
      const errorMsg = error.response?.data;
      if (typeof errorMsg === 'object' && !errorMsg.error) {
        const firstError = Object.values(errorMsg)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError || 'حدث خطأ');
      } else {
        toast.error(errorMsg?.error || 'حدث خطأ');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الفريق؟')) {
      try {
        await api.delete(`/auth/teams/${id}/`);
        toast.success('تم حذف الفريق بنجاح');
        fetchTeams();
      } catch (error) {
        toast.error('حدث خطأ في حذف الفريق');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{t('team.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
        >
          {t('team.newTeam')}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {teams.map((team) => (
          <Grid item xs={12} md={6} lg={4} key={team.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {team.name}
                    </Typography>
                    {team.leader_name && (
                      <Chip
                        label={`قائد: ${team.leader_name}`}
                        size="small"
                        color="primary"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenDialog(team)} color="warning">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(team.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                {team.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {team.description}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    {team.members_count || 0} {t('team.members')}
                  </Typography>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('team.members')}:
                  </Typography>
                  {team.members && team.members.length > 0 ? (
                    <List dense>
                      {team.members.slice(0, 3).map((member) => (
                        <ListItem key={member.id}>
                          <ListItemAvatar>
                            <Avatar src={member.avatar_url} alt={member.username}>
                              {member.first_name?.[0] || member.username[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${member.first_name || ''} ${member.last_name || ''}`.trim() || member.username}
                            secondary={member.position || member.role}
                          />
                        </ListItem>
                      ))}
                      {team.members.length > 3 && (
                        <ListItem>
                          <ListItemText
                            primary={`+${team.members.length - 3} ${t('team.members')} أخرى`}
                            primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                          />
                        </ListItem>
                      )}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {t('team.noMembers')}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {teams.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('team.noTeams')}
          </Typography>
        </Box>
      )}

      {/* Create/Edit Team Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedTeam ? t('team.editTeam') : t('team.newTeam')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('team.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label={t('team.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={4}
          />
          <TextField
            fullWidth
            select
            label={t('team.leader')}
            value={formData.leader || ''}
            onChange={(e) => setFormData({ ...formData, leader: e.target.value || null })}
            margin="normal"
          >
            <MenuItem value="">{t('task.notAssigned')}</MenuItem>
            {supervisors.map((sup) => (
              <MenuItem key={sup.id} value={sup.id}>
                {sup.first_name} {sup.last_name} ({sup.username})
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('task.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}>
            {t('task.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer position="top-left" rtl={true} />
    </Container>
  );
};

export default TeamsPage;

