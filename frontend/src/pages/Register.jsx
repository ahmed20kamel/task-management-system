import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'employee',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirm) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData);
      const user = result.user || JSON.parse(localStorage.getItem('user') || '{}');
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data;
      if (typeof errorMsg === 'object') {
        const firstError = Object.values(errorMsg)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError || 'حدث خطأ أثناء التسجيل');
      } else {
        setError('حدث خطأ أثناء التسجيل');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1A3A5C 0%, #2A6496 100%)',
        py: 4,
      }}
    >
    <Container maxWidth="sm">
      <Paper elevation={8} sx={{ p: 5, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '14px',
              bgcolor: '#1A3A5C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.5,
              boxShadow: '0 4px 14px rgba(26,58,92,0.3)',
            }}
          >
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>N</Typography>
          </Box>
          <Typography variant="subtitle2" color="#1A3A5C" fontWeight={600}>
            Norka Solution
          </Typography>
        </Box>
        <Typography variant="h5" fontWeight={600} gutterBottom align="center" color="primary.main">
          إنشاء حساب جديد
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="اسم المستخدم"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="البريد الإلكتروني"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="الاسم الأول"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="اسم العائلة"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              margin="normal"
            />
          </Box>
          <TextField
            fullWidth
            select
            label="الدور"
            name="role"
            value={formData.role}
            onChange={handleChange}
            margin="normal"
          >
            <MenuItem value="employee">موظف</MenuItem>
            <MenuItem value="admin">مدير</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="الهاتف"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="كلمة المرور"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="تأكيد كلمة المرور"
            name="password_confirm"
            type="password"
            value={formData.password_confirm}
            onChange={handleChange}
            margin="normal"
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'إنشاء الحساب'}
          </Button>
          <Box textAlign="center">
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="primary">
                لديك حساب بالفعل؟ سجل الدخول
              </Typography>
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
    </Box>
  );
};

export default Register;

