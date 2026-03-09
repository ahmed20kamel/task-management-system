import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Avatar,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  IconButton,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Visibility,
  VisibilityOff,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProfilePage = () => {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    bio: '',
  });
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile/');
      setUser(response.data);
      setFormData({
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        position: response.data.position || '',
        bio: response.data.bio || '',
      });
    } catch (error) {
      toast.error('حدث خطأ في تحميل الملف الشخصي');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await api.put('/auth/profile/update/', formData);
      setUser(response.data.user || response.data);
      updateUser(response.data.user || response.data);
      setEditing(false);
      toast.success('تم تحديث الملف الشخصي بنجاح');
    } catch (error) {
      const errorMsg = error.response?.data;
      if (typeof errorMsg === 'object' && !errorMsg.error) {
        const firstError = Object.values(errorMsg)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError || 'حدث خطأ');
      } else {
        toast.error(errorMsg?.error || 'حدث خطأ في التحديث');
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      position: user.position || '',
      bio: user.bio || '',
    });
    setEditing(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.put('/auth/profile/update/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUser(response.data.user || response.data);
      updateUser(response.data.user || response.data);
      toast.success('تم تحديث الصورة الشخصية بنجاح');
    } catch (error) {
      toast.error('حدث خطأ في رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    try {
      await api.post('/auth/change-password/', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      toast.success('تم تغيير كلمة المرور بنجاح');
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
      setChangingPassword(false);
    } catch (error) {
      const errorMsg = error.response?.data;
      toast.error(errorMsg?.error || errorMsg?.old_password?.[0] || 'حدث خطأ في تغيير كلمة المرور');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        الملف الشخصي
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Picture Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                <Avatar
                  src={user.avatar_url || user.avatar}
                  sx={{ width: 150, height: 150, mb: 2, border: '4px solid', borderColor: 'primary.main' }}
                >
                  {user.first_name?.[0] || user.username[0]}
                </Avatar>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="avatar-upload"
                  type="file"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                <label htmlFor="avatar-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    disabled={uploading}
                    sx={{ mb: 1 }}
                  >
                    {uploading ? 'جاري الرفع...' : 'تغيير الصورة الشخصية'}
                  </Button>
                </label>
                <Typography variant="h5" sx={{ mt: 2, fontWeight: 600 }}>
                  {user.first_name} {user.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.position || t('auth.employee')}
                </Typography>
                <Chip
                  label={user.role === 'admin' ? t('auth.admin') : user.role === 'supervisor' ? t('auth.supervisor') : t('auth.employee')}
                  color={user.role === 'admin' ? 'error' : user.role === 'supervisor' ? 'warning' : 'primary'}
                  sx={{ mt: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Personal Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>
                  المعلومات الشخصية
                </Typography>
                {!editing ? (
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => setEditing(true)}
                    variant="outlined"
                    sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                  >
                    تعديل
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      variant="contained"
                      sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
                    >
                      حفظ
                    </Button>
                    <Button
                      startIcon={<CancelIcon />}
                      onClick={handleCancel}
                      variant="outlined"
                      color="error"
                    >
                      إلغاء
                    </Button>
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="اسم المستخدم"
                    value={user.username}
                    disabled
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('auth.email')}
                    value={editing ? formData.email : user.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('auth.firstName')}
                    value={editing ? formData.first_name : user.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('auth.lastName')}
                    value={editing ? formData.last_name : user.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('auth.phone')}
                    value={editing ? formData.phone : user.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="الوظيفة"
                    value={editing ? formData.position : user.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="نبذة عنك"
                    value={editing ? formData.bio : user.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!editing}
                    multiline
                    rows={4}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics */}
        {user.average_rating !== undefined && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  الإحصائيات
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary.main" fontWeight={600}>
                        {user.average_rating?.toFixed(1) || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        متوسط التقييم
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main" fontWeight={600}>
                        {user.total_tasks_completed || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        المهام المكتملة
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main" fontWeight={600}>
                        {user.total_tasks_pending || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        المهام قيد الانتظار
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Change Password */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>
                  تغيير كلمة المرور
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setChangingPassword(!changingPassword);
                    if (changingPassword) {
                      setPasswordData({
                        old_password: '',
                        new_password: '',
                        confirm_password: '',
                      });
                    }
                  }}
                >
                  {changingPassword ? 'إلغاء' : 'تغيير كلمة المرور'}
                </Button>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {changingPassword && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="كلمة المرور الحالية"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.old_password}
                      onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="كلمة المرور الجديدة"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="تأكيد كلمة المرور"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handleChangePassword}
                      fullWidth
                      sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                    >
                      حفظ كلمة المرور الجديدة
                    </Button>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ToastContainer position="top-left" rtl={true} />
    </Container>
  );
};

export default ProfilePage;

