import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Box,
  CircularProgress,
  Avatar,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
  HourglassEmpty as PendingIcon,
  PlayCircleOutline as InProgressIcon,
  CheckCircle as CompletedIcon,
  Warning as OverdueIcon,
  PauseCircleOutline as OnHoldIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import api from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [teams, setTeams] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [evaluationDialog, setEvaluationDialog] = useState(false);
  const [taskToEvaluate, setTaskToEvaluate] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    supervisor: '',
    team: '',
    task_type: '',
    priority: 'medium',
    status: 'pending',
    due_date: '',
    start_date: '',
    estimated_hours: '',
    actual_hours: '',
  });
  const [evaluationData, setEvaluationData] = useState({
    rating: 3,
    criteria: 'overall',
    feedback: '',
    evaluated_employee: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
    fetchSupervisors();
    fetchTeams();
    fetchTaskTypes();
    fetchStatistics();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks/');
      setTasks(response.data);
    } catch (error) {
      toast.error('حدث خطأ في تحميل المهام');
    } finally {
      setLoading(false);
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

  const fetchSupervisors = async () => {
    try {
      const response = await api.get('/auth/supervisors/');
      setSupervisors(response.data);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await api.get('/auth/teams/');
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchTaskTypes = async () => {
    try {
      const response = await api.get('/tasks/types/');
      setTaskTypes(response.data);
    } catch (error) {
      console.error('Error fetching task types:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/tasks/statistics/');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleOpenDialog = (task = null) => {
    if (task) {
      setSelectedTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        assigned_to: task.assigned_to?.id || '',
        supervisor: task.supervisor?.id || '',
        team: task.team?.id || '',
        task_type: task.task_type?.id || '',
        priority: task.priority,
        status: task.status || 'pending',
        due_date: task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm") : '',
        start_date: task.start_date ? format(new Date(task.start_date), "yyyy-MM-dd'T'HH:mm") : '',
        estimated_hours: task.estimated_hours || '',
        actual_hours: task.actual_hours || '',
      });
    } else {
      setSelectedTask(null);
      setFormData({
        title: '',
        description: '',
        assigned_to: '',
        supervisor: '',
        team: '',
        task_type: '',
        priority: 'medium',
        status: 'pending',
        due_date: '',
        start_date: '',
        estimated_hours: '',
        actual_hours: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTask(null);
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        assigned_to: formData.assigned_to || null,
        supervisor: formData.supervisor || null,
        team: formData.team || null,
        task_type: formData.task_type || null,
        start_date: formData.start_date || null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        actual_hours: formData.actual_hours ? parseFloat(formData.actual_hours) : null,
      };

      if (selectedTask) {
        await api.put(`/tasks/${selectedTask.id}/`, submitData);
        toast.success('تم تحديث المهمة بنجاح');
      } else {
        await api.post('/tasks/', submitData);
        toast.success('تم إنشاء المهمة بنجاح');
      }
      handleCloseDialog();
      fetchTasks();
      fetchStatistics();
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
    if (window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      try {
        await api.delete(`/tasks/${id}/`);
        toast.success('تم حذف المهمة بنجاح');
        fetchTasks();
        fetchStatistics();
      } catch (error) {
        toast.error('حدث خطأ في حذف المهمة');
      }
    }
  };

  const handleOpenEvaluation = (task) => {
    setTaskToEvaluate(task);
    setEvaluationData({
      rating: 3,
      criteria: 'overall',
      feedback: '',
      evaluated_employee: task.assigned_to?.id || '',
    });
    setEvaluationDialog(true);
  };

  const handleEvaluate = async () => {
    try {
      await api.post('/tasks/evaluations/', {
        task: taskToEvaluate.id,
        rating: evaluationData.rating,
        criteria: evaluationData.criteria,
        feedback: evaluationData.feedback,
        evaluated_employee: evaluationData.evaluated_employee || taskToEvaluate.assigned_to?.id,
      });
      toast.success('تم تقييم المهمة بنجاح');
      setEvaluationDialog(false);
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.error || 'حدث خطأ في التقييم');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'default',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'error',
      on_hold: 'warning',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'default',
      medium: 'info',
      high: 'warning',
      urgent: 'error',
    };
    return colors[priority] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'قيد الانتظار',
      in_progress: 'قيد التنفيذ',
      completed: 'مكتمل',
      cancelled: 'ملغي',
      on_hold: 'معلق',
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      low: 'منخفض',
      medium: 'متوسط',
      high: 'عالي',
      urgent: 'عاجل',
    };
    return labels[priority] || priority;
  };

  const statCards = [
    { label: 'إجمالي المهام', value: statistics.total_tasks || 0, icon: <AssignmentIcon />, color: '#1A3A5C', bg: '#EBF0F7' },
    { label: 'قيد الانتظار', value: statistics.pending_tasks || 0, icon: <PendingIcon />, color: '#f5a623', bg: '#FFF8E8' },
    { label: 'قيد التنفيذ', value: statistics.in_progress_tasks || 0, icon: <InProgressIcon />, color: '#2A6496', bg: '#EBF3FC' },
    { label: 'مكتملة', value: statistics.completed_tasks || 0, icon: <CompletedIcon />, color: '#28a745', bg: '#E8F5E9' },
    { label: 'متأخرة', value: statistics.overdue_tasks || 0, icon: <OverdueIcon />, color: '#dc3545', bg: '#FDEAEA' },
    { label: 'معلقة', value: statistics.on_hold_tasks || 0, icon: <OnHoldIcon />, color: '#f5a623', bg: '#FFF8E8' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="#1A3A5C">
            لوحة تحكم المدير
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            نظرة عامة على المهام والإحصائيات
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ px: 3, py: 1.2 }}
        >
          مهمة جديدة
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {statCards.map((stat, idx) => (
          <Grid item xs={6} sm={4} md={2} key={idx}>
            <Card sx={{ border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: stat.bg,
                      color: stat.color,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700} color={stat.color}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tasks Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={600} color="#1A3A5C">
            قائمة المهام
          </Typography>
          <Chip label={`${tasks.length} مهمة`} size="small" variant="outlined" />
        </Box>
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F7F9FC' }}>
                <TableCell sx={{ fontWeight: 600, color: '#1A3A5C' }}>العنوان</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1A3A5C' }}>المكلف</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1A3A5C' }}>الفريق</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1A3A5C' }}>الحالة</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1A3A5C' }}>الأولوية</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1A3A5C' }}>تاريخ الانتهاء</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1A3A5C' }}>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} sx={{ '&:hover': { bgcolor: '#EEF4FF' } }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {task.title}
                    </Typography>
                    {task.task_type_name && (
                      <Chip
                        label={task.task_type_name}
                        size="small"
                        sx={{
                          mt: 0.5,
                          bgcolor: task.task_type_color || '#1A3A5C',
                          color: 'white',
                          fontSize: '0.65rem',
                          height: 20,
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {task.assigned_to ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: '#2A6496' }}>
                          {(task.assigned_to_name || '?')[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontSize="0.8rem">
                            {task.assigned_to_name}
                          </Typography>
                          {task.supervisor_name && (
                            <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                              المشرف: {task.supervisor_name}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.team_name ? (
                      <Chip label={task.team_name} size="small" variant="outlined" color="primary" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(task.status)}
                      color={getStatusColor(task.status)}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getPriorityLabel(task.priority)}
                      color={getPriorityColor(task.priority)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {task.due_date ? (
                      <Box>
                        <Typography variant="body2" fontSize="0.8rem">
                          {format(new Date(task.due_date), 'yyyy-MM-dd HH:mm', { locale: ar })}
                        </Typography>
                        {task.is_overdue && (
                          <Chip label="متأخرة" color="error" size="small" variant="outlined" sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }} />
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="عرض">
                        <IconButton size="small" onClick={() => navigate(`/admin/tasks/${task.id}`)} sx={{ color: '#2A6496' }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="تعديل">
                        <IconButton size="small" onClick={() => handleOpenDialog(task)} sx={{ color: '#f5a623' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {task.status === 'completed' && (
                        <Tooltip title="تقييم">
                          <IconButton size="small" onClick={() => handleOpenEvaluation(task)} sx={{ color: '#28a745' }}>
                            <AssessmentIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="حذف">
                        <IconButton size="small" onClick={() => handleDelete(task.id)} sx={{ color: '#dc3545' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3 }} />
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                      لا توجد مهام حالياً
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create/Edit Task Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: '#1A3A5C' }}>
          {selectedTask ? 'تعديل المهمة' : 'مهمة جديدة'}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <TextField
            fullWidth
            label="العنوان"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="الوصف"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={4}
            required
          />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="نوع المهمة"
                value={formData.task_type || ''}
                onChange={(e) => setFormData({ ...formData, task_type: e.target.value || null })}
                margin="normal"
              >
                <MenuItem value="">لا يوجد</MenuItem>
                {taskTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="الحالة"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                margin="normal"
              >
                <MenuItem value="pending">قيد الانتظار</MenuItem>
                <MenuItem value="in_progress">قيد التنفيذ</MenuItem>
                <MenuItem value="completed">مكتمل</MenuItem>
                <MenuItem value="on_hold">معلق</MenuItem>
                <MenuItem value="cancelled">ملغي</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="تعيين إلى"
                value={formData.assigned_to || ''}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value || null })}
                margin="normal"
              >
                <MenuItem value="">لا يوجد</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.username})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="المشرف"
                value={formData.supervisor || ''}
                onChange={(e) => setFormData({ ...formData, supervisor: e.target.value || null })}
                margin="normal"
              >
                <MenuItem value="">لا يوجد</MenuItem>
                {supervisors.map((sup) => (
                  <MenuItem key={sup.id} value={sup.id}>
                    {sup.first_name} {sup.last_name} ({sup.username})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="الفريق"
                value={formData.team || ''}
                onChange={(e) => setFormData({ ...formData, team: e.target.value || null })}
                margin="normal"
              >
                <MenuItem value="">لا يوجد</MenuItem>
                {teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="الأولوية"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                margin="normal"
              >
                <MenuItem value="low">منخفض</MenuItem>
                <MenuItem value="medium">متوسط</MenuItem>
                <MenuItem value="high">عالي</MenuItem>
                <MenuItem value="urgent">عاجل</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="تاريخ البدء"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="تاريخ الانتهاء"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الساعات المقدرة"
                type="number"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                margin="normal"
                inputProps={{ min: 0, step: 0.5 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الساعات الفعلية"
                type="number"
                value={formData.actual_hours}
                onChange={(e) => setFormData({ ...formData, actual_hours: e.target.value })}
                margin="normal"
                inputProps={{ min: 0, step: 0.5 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">إلغاء</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ px: 4 }}>حفظ</Button>
        </DialogActions>
      </Dialog>

      {/* Evaluation Dialog */}
      <Dialog open={evaluationDialog} onClose={() => setEvaluationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: '#1A3A5C' }}>تقييم المهمة</DialogTitle>
        <Divider />
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="الموظف المقيم"
                value={evaluationData.evaluated_employee || ''}
                onChange={(e) => setEvaluationData({ ...evaluationData, evaluated_employee: e.target.value })}
                margin="normal"
              >
                <MenuItem value="">اختر الموظف</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.username})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="المعيار"
                value={evaluationData.criteria}
                onChange={(e) => setEvaluationData({ ...evaluationData, criteria: e.target.value })}
                margin="normal"
              >
                <MenuItem value="overall">التقييم العام</MenuItem>
                <MenuItem value="quality">الجودة</MenuItem>
                <MenuItem value="speed">السرعة</MenuItem>
                <MenuItem value="communication">التواصل</MenuItem>
                <MenuItem value="problem_solving">حل المشاكل</MenuItem>
                <MenuItem value="teamwork">العمل الجماعي</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="التقييم"
                value={evaluationData.rating}
                onChange={(e) => setEvaluationData({ ...evaluationData, rating: parseInt(e.target.value) })}
                margin="normal"
              >
                <MenuItem value={1}>ضعيف جداً (1)</MenuItem>
                <MenuItem value={2}>ضعيف (2)</MenuItem>
                <MenuItem value={3}>متوسط (3)</MenuItem>
                <MenuItem value={4}>جيد (4)</MenuItem>
                <MenuItem value={5}>ممتاز (5)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات"
                value={evaluationData.feedback}
                onChange={(e) => setEvaluationData({ ...evaluationData, feedback: e.target.value })}
                margin="normal"
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEvaluationDialog(false)} color="inherit">إلغاء</Button>
          <Button onClick={handleEvaluate} variant="contained" sx={{ px: 4 }}>حفظ التقييم</Button>
        </DialogActions>
      </Dialog>

      <ToastContainer position="top-left" rtl={true} />
    </Container>
  );
};

export default AdminDashboard;
