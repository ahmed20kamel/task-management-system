import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  HourglassEmpty as PendingIcon,
  PlayCircleOutline as InProgressIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import api from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EmployeeDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      await fetchTasks();
      await fetchStatistics();
    };
    loadData();
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTasks = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/tasks/', { params });
      setTasks(response.data);
    } catch (error) {
      toast.error('حدث خطأ في تحميل المهام');
    } finally {
      setLoading(false);
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

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}/`, { status: newStatus });
      toast.success('تم تحديث حالة المهمة بنجاح');
      fetchTasks();
      fetchStatistics();
    } catch (error) {
      toast.error('حدث خطأ في تحديث الحالة');
    }
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

  const getPriorityLabel = (priority) => {
    const labels = {
      low: 'منخفض',
      medium: 'متوسط',
      high: 'عالي',
      urgent: 'عاجل',
    };
    return labels[priority] || priority;
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const statCards = [
    { label: 'إجمالي المهام', value: statistics.total_tasks || 0, icon: <AssignmentIcon />, color: '#1A3A5C', bg: '#EBF0F7' },
    { label: 'قيد الانتظار', value: statistics.pending_tasks || 0, icon: <PendingIcon />, color: '#f5a623', bg: '#FFF8E8' },
    { label: 'قيد التنفيذ', value: statistics.in_progress_tasks || 0, icon: <InProgressIcon />, color: '#2A6496', bg: '#EBF3FC' },
    { label: 'مكتملة', value: statistics.completed_tasks || 0, icon: <CheckCircleIcon />, color: '#28a745', bg: '#E8F5E9' },
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
            لوحة تحكم الموظف
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            متابعة المهام المسندة إليك
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>فلترة حسب الحالة</InputLabel>
          <Select
            value={statusFilter}
            label="فلترة حسب الحالة"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">الكل</MenuItem>
            <MenuItem value="pending">قيد الانتظار</MenuItem>
            <MenuItem value="in_progress">قيد التنفيذ</MenuItem>
            <MenuItem value="completed">مكتمل</MenuItem>
            <MenuItem value="cancelled">ملغي</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {statCards.map((stat, idx) => (
          <Grid item xs={6} sm={3} key={idx}>
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
            مهامي
          </Typography>
          <Chip label={`${tasks.length} مهمة`} size="small" variant="outlined" />
        </Box>
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F7F9FC' }}>
                <TableCell sx={{ fontWeight: 600, color: '#1A3A5C' }}>العنوان</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1A3A5C' }}>الحالة</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1A3A5C' }}>الأولوية</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1A3A5C' }}>تاريخ الانتهاء</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1A3A5C' }}>التقييم</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1A3A5C' }}>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow
                  key={task.id}
                  sx={{
                    '&:hover': { bgcolor: '#EEF4FF' },
                    bgcolor: isOverdue(task.due_date) && task.status !== 'completed' ? '#FFF5F5' : 'inherit',
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{task.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={task.status}
                      size="small"
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      sx={{ minWidth: 130, fontSize: '0.8rem' }}
                    >
                      <MenuItem value="pending">قيد الانتظار</MenuItem>
                      <MenuItem value="in_progress">قيد التنفيذ</MenuItem>
                      <MenuItem value="completed">مكتمل</MenuItem>
                    </Select>
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
                    <Box>
                      <Typography variant="body2" fontSize="0.8rem">
                        {task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd HH:mm', { locale: ar }) : '—'}
                      </Typography>
                      {isOverdue(task.due_date) && task.status !== 'completed' && (
                        <Chip label="متأخرة" color="error" size="small" variant="outlined" sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {task.evaluation ? (
                      <Box>
                        <Chip label={`${task.evaluation.rating}/5`} color="primary" size="small" />
                        {task.evaluation.feedback && (
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                            {task.evaluation.feedback}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                        لا يوجد تقييم
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="عرض التفاصيل">
                        <IconButton size="small" onClick={() => navigate(`/dashboard/tasks/${task.id}`)} sx={{ color: '#2A6496' }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {task.status === 'pending' && (
                        <Tooltip title="بدء العمل">
                          <IconButton
                            size="small"
                            onClick={() => handleStatusChange(task.id, 'in_progress')}
                            sx={{ color: '#28a745' }}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
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

      <ToastContainer position="top-left" rtl={true} />
    </Container>
  );
};

export default EmployeeDashboard;
