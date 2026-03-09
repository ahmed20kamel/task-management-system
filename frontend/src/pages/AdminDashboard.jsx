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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  Visibility as VisibilityIcon,
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
        <Typography variant="h4">لوحة تحكم المدير</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          مهمة جديدة
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom>
                إجمالي المهام
              </Typography>
              <Typography variant="h4" color="inherit">
                {statistics.total_tasks || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom>
                قيد الانتظار
              </Typography>
              <Typography variant="h4" color="inherit">
                {statistics.pending_tasks || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom>
                قيد التنفيذ
              </Typography>
              <Typography variant="h4" color="inherit">
                {statistics.in_progress_tasks || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom>
                مكتملة
              </Typography>
              <Typography variant="h4" color="inherit">
                {statistics.completed_tasks || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom>
                متأخرة
              </Typography>
              <Typography variant="h4" color="inherit">
                {statistics.overdue_tasks || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                معلقة
              </Typography>
              <Typography variant="h4" color="warning.main">
                {statistics.on_hold_tasks || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>العنوان</TableCell>
              <TableCell>النوع</TableCell>
              <TableCell>المكلف</TableCell>
              <TableCell>الفريق</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>الأولوية</TableCell>
              <TableCell>تاريخ الانتهاء</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {task.title}
                  </Typography>
                  {task.task_type && (
                    <Chip 
                      label={task.task_type_name} 
                      size="small" 
                      sx={{ 
                        mt: 0.5, 
                        bgcolor: task.task_type_color || 'primary.main',
                        color: 'white',
                        fontSize: '0.7rem',
                        height: '20px'
                      }} 
                    />
                  )}
                </TableCell>
                <TableCell>
                  {task.task_type ? (
                    <Chip 
                      label={task.task_type_name} 
                      size="small" 
                      sx={{ bgcolor: task.task_type_color || 'primary.main', color: 'white' }} 
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {task.assigned_to ? (
                    <Box>
                      <Typography variant="body2">
                        {task.assigned_to_name || `${task.assigned_to?.first_name || ''} ${task.assigned_to?.last_name || ''}`}
                      </Typography>
                      {task.supervisor_name && (
                        <Typography variant="caption" color="text.secondary">
                          المشرف: {task.supervisor_name}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {task.team_name ? (
                    <Chip label={task.team_name} size="small" color="info" variant="outlined" />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(task.status)}
                    color={getStatusColor(task.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={getPriorityLabel(task.priority)}
                    color={getPriorityColor(task.priority)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {task.due_date ? (
                    <Box>
                      <Typography variant="body2">
                        {format(new Date(task.due_date), 'yyyy-MM-dd HH:mm', { locale: ar })}
                      </Typography>
                      {task.is_overdue && (
                        <Typography variant="caption" color="error">
                          متأخرة
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => navigate(`/admin/tasks/${task.id}`)} color="primary">
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDialog(task)} color="warning">
                      <EditIcon />
                    </IconButton>
                    {task.status === 'completed' && (
                      <IconButton size="small" onClick={() => handleOpenEvaluation(task)} sx={{ color: 'secondary.main' }}>
                        <AssessmentIcon />
                      </IconButton>
                    )}
                    <IconButton size="small" onClick={() => handleDelete(task.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Task Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedTask ? 'تعديل المهمة' : 'مهمة جديدة'}</DialogTitle>
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
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
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
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
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
        <DialogActions>
          <Button onClick={handleCloseDialog}>إلغاء</Button>
          <Button onClick={handleSubmit} variant="contained">حفظ</Button>
        </DialogActions>
      </Dialog>

      {/* Evaluation Dialog */}
      <Dialog open={evaluationDialog} onClose={() => setEvaluationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>تقييم المهمة</DialogTitle>
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
        <DialogActions>
          <Button onClick={() => setEvaluationDialog(false)}>إلغاء</Button>
          <Button onClick={handleEvaluate} variant="contained">حفظ التقييم</Button>
        </DialogActions>
      </Dialog>

      <ToastContainer position="top-left" rtl={true} />
    </Container>
  );
};

export default AdminDashboard;

