import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider,
  Card,
  CardContent,
  Alert,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  LinearProgress,
  Tabs,
  Tab,
  Rating,
} from '@mui/material';
import { 
  ArrowBack, 
  Edit, 
  Assessment, 
  Comment as CommentIcon,
  Image as ImageIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../context/AuthContext';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [evaluationDialog, setEvaluationDialog] = useState(false);
  const [imageUploadDialog, setImageUploadDialog] = useState(false);
  const [commentDialog, setCommentDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [formData, setFormData] = useState({});
  const [evaluationData, setEvaluationData] = useState({ 
    rating: 3, 
    criteria: 'overall',
    feedback: '',
    evaluated_employee: '',
  });
  const [commentText, setCommentText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchTask();
    fetchComments();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTask = async () => {
    try {
      const response = await api.get(`/tasks/${id}/`);
      setTask(response.data);
      setFormData({
        title: response.data.title,
        description: response.data.description,
        priority: response.data.priority,
        due_date: response.data.due_date ? format(new Date(response.data.due_date), "yyyy-MM-dd'T'HH:mm") : '',
        status: response.data.status,
      });
    } catch (error) {
      toast.error('حدث خطأ في تحميل المهمة');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/tasks/${id}/comments/`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/tasks/${id}/`, formData);
      toast.success('تم تحديث المهمة بنجاح');
      setEditDialog(false);
      fetchTask();
    } catch (error) {
      toast.error('حدث خطأ في التحديث');
    }
  };

  const handleEvaluate = async () => {
    try {
      await api.post('/tasks/evaluations/', {
        task: id,
        rating: evaluationData.rating,
        criteria: evaluationData.criteria,
        feedback: evaluationData.feedback,
        evaluated_employee: evaluationData.evaluated_employee || task?.assigned_to?.id,
      });
      toast.success('تم تقييم المهمة بنجاح');
      setEvaluationDialog(false);
      fetchTask();
    } catch (error) {
      toast.error('حدث خطأ في التقييم');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      const data = {
        content: commentText,
        parent: replyingTo?.id || null,
      };
      await api.post(`/tasks/${id}/comments/`, data);
      toast.success('تم إضافة التعليق بنجاح');
      setCommentText('');
      setReplyingTo(null);
      setCommentDialog(false);
      fetchComments();
    } catch (error) {
      toast.error('حدث خطأ في إضافة التعليق');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التعليق؟')) {
      try {
        await api.delete(`/tasks/comments/${commentId}/`);
        toast.success('تم حذف التعليق بنجاح');
        fetchComments();
      } catch (error) {
        toast.error('حدث خطأ في حذف التعليق');
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (selectedImage?.caption) {
        formData.append('caption', selectedImage.caption);
      }

      await api.post(`/tasks/${id}/images/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('تم رفع الصورة بنجاح');
      setImageUploadDialog(false);
      setSelectedImage(null);
      fetchTask();
    } catch (error) {
      toast.error('حدث خطأ في رفع الصورة');
    } finally {
      setUploadingImage(false);
    }
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

  const getPriorityLabel = (priority) => {
    const labels = {
      low: 'منخفض',
      medium: 'متوسط',
      high: 'عالي',
      urgent: 'عاجل',
    };
    return labels[priority] || priority;
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

  const getCriteriaLabel = (criteria) => {
    const labels = {
      quality: 'الجودة',
      speed: 'السرعة',
      communication: 'التواصل',
      problem_solving: 'حل المشاكل',
      teamwork: 'العمل الجماعي',
      overall: 'التقييم العام',
    };
    return labels[criteria] || criteria;
  };

  const renderComment = (comment, level = 0) => (
    <ListItem
      key={comment.id}
      sx={{
        pl: level * 4,
        borderLeft: level > 0 ? '2px solid' : 'none',
        borderColor: 'divider',
        mb: 1,
      }}
    >
      <ListItemAvatar>
        <Avatar src={comment.user_avatar} alt={comment.user_name}>
          {comment.user_name?.[0]}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" fontWeight={500}>
              {comment.user_full_name || comment.user_name}
            </Typography>
            {comment.edited && (
              <Chip label="تم التعديل" size="small" variant="outlined" />
            )}
            <Typography variant="caption" color="text.secondary">
              {format(new Date(comment.created_at), 'yyyy-MM-dd HH:mm', { locale: ar })}
            </Typography>
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {comment.content}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button
                size="small"
                startIcon={<ReplyIcon />}
                onClick={() => {
                  setReplyingTo(comment);
                  setCommentDialog(true);
                }}
              >
                رد
              </Button>
              {(user.id === comment.user || user.is_admin) && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            {comment.replies && comment.replies.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {comment.replies.map((reply) => renderComment(reply, level + 1))}
              </Box>
            )}
          </Box>
        }
      />
    </ListItem>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!task) {
    return null;
  }

  const canEdit = user.is_admin || (user.is_employee && task.status !== 'completed');
  const canEvaluate = (user.is_admin || user.is_supervisor) && task.status === 'completed';
  
  // Check if user can comment (anyone involved in the task)
  const canComment = user.is_admin || 
    user.is_supervisor || 
    task.assigned_to?.id === user.id ||
    (task.team && task.team.members?.some(m => m.id === user.id));

  return (
    <Container maxWidth="lg">
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        {t('task.back')}
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {task.title}
            </Typography>
            {task.task_type && (
              <Chip
                label={task.task_type_name}
                sx={{
                  mt: 1,
                  bgcolor: task.task_type_color || 'primary.main',
                  color: 'white',
                }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {canEdit && (
              <Button
                startIcon={<Edit />}
                onClick={() => setEditDialog(true)}
                variant="outlined"
                color="warning"
              >
                {t('task.edit')}
              </Button>
            )}
            {canEvaluate && (
              <Button
                startIcon={<Assessment />}
                variant="contained"
                onClick={() => {
                  setEvaluationData({
                    rating: 3,
                    criteria: 'overall',
                    feedback: '',
                    evaluated_employee: task.assigned_to?.id || '',
                  });
                  setEvaluationDialog(true);
                }}
                sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
              >
                {t('task.evaluate')}
              </Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('task.description')}
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {task.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('task.status')}
                    </Typography>
                    <Chip 
                      label={getStatusLabel(task.status)} 
                      color={getStatusColor(task.status)}
                      sx={{ mb: 2 }} 
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('task.priority')}
                    </Typography>
                    <Chip 
                      label={getPriorityLabel(task.priority)} 
                      color={getPriorityColor(task.priority)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('task.createdAt')}
                </Typography>
                <Typography variant="body1">
                  {format(new Date(task.created_at), 'yyyy-MM-dd HH:mm', { locale: ar })}
                </Typography>
                {task.start_date && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                      {t('task.startDate')}
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(task.start_date), 'yyyy-MM-dd HH:mm', { locale: ar })}
                    </Typography>
                  </>
                )}
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                  {t('task.dueDate')}
                </Typography>
                <Typography variant="body1" color={task.is_overdue ? 'error.main' : 'inherit'}>
                  {format(new Date(task.due_date), 'yyyy-MM-dd HH:mm', { locale: ar })}
                </Typography>
                {task.is_overdue && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {t('task.isOverdue')}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                {task.assigned_to && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('task.assignedTo')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar src={task.assigned_to_avatar}>
                        {task.assigned_to_name?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {task.assigned_to_name}
                        </Typography>
                        {task.supervisor_name && (
                          <Typography variant="caption" color="text.secondary">
                            المشرف: {task.supervisor_name}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </>
                )}
                {task.team_name && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('task.team')}
                    </Typography>
                    <Chip label={task.team_name} color="info" variant="outlined" />
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {task.progress_percentage !== undefined && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('task.progress')}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={task.progress_percentage} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {task.progress_percentage}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {task.evaluations && task.evaluations.length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('task.evaluation')}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" gutterBottom>
                      {t('evaluation.averageRating')}: {task.average_rating?.toFixed(1) || 0} / 5
                    </Typography>
                    <Rating value={task.average_rating || 0} readOnly precision={0.1} />
                  </Box>
                  {task.evaluations.map((evaluation) => (
                    <Box key={evaluation.id} sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip
                          label={evaluation.criteria_display || getCriteriaLabel(evaluation.criteria)}
                          size="small"
                          color="info"
                        />
                        <Rating value={evaluation.rating} readOnly size="small" />
                      </Box>
                      {evaluation.feedback && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {evaluation.feedback}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        {format(new Date(evaluation.evaluated_at), 'yyyy-MM-dd HH:mm', { locale: ar })}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Tabs for Comments and Images */}
      <Paper sx={{ p: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CommentIcon />
                {t('task.comments')} ({task.comments_count || comments.length})
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ImageIcon />
                {t('task.images')} ({task.images?.length || 0})
              </Box>
            } 
          />
        </Tabs>

        {tabValue === 0 && (
          <Box>
            {canComment && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<CommentIcon />}
                  onClick={() => setCommentDialog(true)}
                  sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                >
                  {t('task.addComment')}
                </Button>
              </Box>
            )}

            {comments.length > 0 ? (
              <List>
                {comments.map((comment) => renderComment(comment))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CommentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  {t('task.noComments')}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            {canComment && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => setImageUploadDialog(true)}
                  sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                >
                  {t('task.uploadImage')}
                </Button>
              </Box>
            )}

            {task.images && task.images.length > 0 ? (
              <ImageList cols={3} gap={8}>
                {task.images.map((image) => (
                  <ImageListItem key={image.id}>
                    <img
                      src={image.image_url}
                      alt={image.caption || task.title}
                      loading="lazy"
                      style={{ borderRadius: 8, cursor: 'pointer' }}
                      onClick={() => window.open(image.image_url, '_blank')}
                    />
                    {image.caption && (
                      <ImageListItemBar
                        title={image.caption}
                        subtitle={`رفع بواسطة: ${image.uploaded_by_name}`}
                      />
                    )}
                  </ImageListItem>
                ))}
              </ImageList>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ImageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  {t('task.noImages')}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('task.edit')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('task.title')}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label={t('task.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={4}
            required
          />
          {user.is_admin && (
            <TextField
              fullWidth
              select
              label={t('task.status')}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              margin="normal"
            >
              <MenuItem value="pending">{t('task.statusPending')}</MenuItem>
              <MenuItem value="in_progress">{t('task.statusInProgress')}</MenuItem>
              <MenuItem value="completed">{t('task.statusCompleted')}</MenuItem>
              <MenuItem value="on_hold">{t('task.statusOnHold')}</MenuItem>
              <MenuItem value="cancelled">{t('task.statusCancelled')}</MenuItem>
            </TextField>
          )}
          <TextField
            fullWidth
            select
            label={t('task.priority')}
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            margin="normal"
          >
            <MenuItem value="low">{t('task.priorityLow')}</MenuItem>
            <MenuItem value="medium">{t('task.priorityMedium')}</MenuItem>
            <MenuItem value="high">{t('task.priorityHigh')}</MenuItem>
            <MenuItem value="urgent">{t('task.priorityUrgent')}</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label={t('task.dueDate')}
            type="datetime-local"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>{t('task.cancel')}</Button>
          <Button onClick={handleUpdate} variant="contained" sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}>
            {t('task.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Evaluation Dialog */}
      <Dialog open={evaluationDialog} onClose={() => setEvaluationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('task.evaluateTask')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label={t('task.evaluatedEmployee')}
                value={evaluationData.evaluated_employee || ''}
                onChange={(e) => setEvaluationData({ ...evaluationData, evaluated_employee: e.target.value })}
                margin="normal"
              >
                <MenuItem value="">اختر الموظف</MenuItem>
                {task.assigned_to && (
                  <MenuItem value={task.assigned_to.id}>
                    {task.assigned_to_name}
                  </MenuItem>
                )}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label={t('task.criteria')}
                value={evaluationData.criteria}
                onChange={(e) => setEvaluationData({ ...evaluationData, criteria: e.target.value })}
                margin="normal"
              >
                <MenuItem value="overall">{t('evaluation.criteria.overall')}</MenuItem>
                <MenuItem value="quality">{t('evaluation.criteria.quality')}</MenuItem>
                <MenuItem value="speed">{t('evaluation.criteria.speed')}</MenuItem>
                <MenuItem value="communication">{t('evaluation.criteria.communication')}</MenuItem>
                <MenuItem value="problem_solving">{t('evaluation.criteria.problemSolving')}</MenuItem>
                <MenuItem value="teamwork">{t('evaluation.criteria.teamwork')}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label={t('task.rate')}
                value={evaluationData.rating}
                onChange={(e) => setEvaluationData({ ...evaluationData, rating: parseInt(e.target.value) })}
                margin="normal"
              >
                <MenuItem value={1}>{t('evaluation.veryPoor')} (1)</MenuItem>
                <MenuItem value={2}>{t('evaluation.poor')} (2)</MenuItem>
                <MenuItem value={3}>{t('evaluation.medium')} (3)</MenuItem>
                <MenuItem value={4}>{t('evaluation.good')} (4)</MenuItem>
                <MenuItem value={5}>{t('evaluation.excellent')} (5)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('task.feedback')}
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
          <Button onClick={() => setEvaluationDialog(false)}>{t('task.cancel')}</Button>
          <Button onClick={handleEvaluate} variant="contained" sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}>
            {t('task.saveEvaluation')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={commentDialog} onClose={() => {
        setCommentDialog(false);
        setReplyingTo(null);
        setCommentText('');
      }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {replyingTo ? `رد على ${replyingTo.user_name}` : t('task.addComment')}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('task.comments')}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            margin="normal"
            multiline
            rows={6}
            required
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCommentDialog(false);
            setReplyingTo(null);
            setCommentText('');
          }}>
            {t('task.cancel')}
          </Button>
          <Button
            onClick={handleAddComment}
            variant="contained"
            startIcon={<SendIcon />}
            disabled={!commentText.trim()}
            sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            إرسال
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Upload Dialog */}
      <Dialog open={imageUploadDialog} onClose={() => {
        setImageUploadDialog(false);
        setSelectedImage(null);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>{t('task.uploadImage')}</DialogTitle>
        <DialogContent>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="image-upload"
            type="file"
            onChange={handleImageUpload}
          />
          <label htmlFor="image-upload">
            <Button
              variant="contained"
              component="span"
              fullWidth
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              اختر صورة
            </Button>
          </label>
          {uploadingImage && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                جاري الرفع...
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            label="تعليق على الصورة (اختياري)"
            value={selectedImage?.caption || ''}
            onChange={(e) => setSelectedImage({ ...selectedImage, caption: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setImageUploadDialog(false);
            setSelectedImage(null);
          }}>
            {t('task.cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer position="top-left" rtl={true} />
    </Container>
  );
};

export default TaskDetail;
