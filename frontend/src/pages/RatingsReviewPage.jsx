import React, { useState, useEffect } from 'react';
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
  Box,
  Avatar,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Rating,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const RatingsReviewPage = () => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeRatings, setEmployeeRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [criteriaFilter, setCriteriaFilter] = useState('all');

  useEffect(() => {
    fetchEmployees();
    fetchEvaluations();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeRatings(selectedEmployee);
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/auth/employees/');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluations = async () => {
    try {
      const response = await api.get('/tasks/evaluations/');
      setEvaluations(response.data);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    }
  };

  const fetchEmployeeRatings = async (employeeId) => {
    try {
      const response = await api.get(`/tasks/employees/${employeeId}/ratings/`);
      setEmployeeRatings(response.data);
    } catch (error) {
      console.error('Error fetching employee ratings:', error);
    }
  };

  const getCriteriaLabel = (criteria) => {
    const labels = {
      quality: t('evaluation.criteria.quality'),
      speed: t('evaluation.criteria.speed'),
      communication: t('evaluation.criteria.communication'),
      problem_solving: t('evaluation.criteria.problemSolving'),
      teamwork: t('evaluation.criteria.teamwork'),
      overall: t('evaluation.criteria.overall'),
    };
    return labels[criteria] || criteria;
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'success';
    if (rating >= 3) return 'warning';
    return 'error';
  };

  const filteredEvaluations = criteriaFilter === 'all' 
    ? evaluations 
    : evaluations.filter(e => e.criteria === criteriaFilter);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t('evaluation.review')}
        </Typography>
      </Box>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="جميع التقييمات" />
        <Tab label="تقييمات الموظفين" />
      </Tabs>

      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>تصفية حسب المعيار</InputLabel>
              <Select
                value={criteriaFilter}
                onChange={(e) => setCriteriaFilter(e.target.value)}
                label="تصفية حسب المعيار"
              >
                <MenuItem value="all">الكل</MenuItem>
                <MenuItem value="overall">التقييم العام</MenuItem>
                <MenuItem value="quality">الجودة</MenuItem>
                <MenuItem value="speed">السرعة</MenuItem>
                <MenuItem value="communication">التواصل</MenuItem>
                <MenuItem value="problem_solving">حل المشاكل</MenuItem>
                <MenuItem value="teamwork">العمل الجماعي</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>المهمة</TableCell>
                  <TableCell>الموظف المقيم</TableCell>
                  <TableCell>المعيار</TableCell>
                  <TableCell>التقييم</TableCell>
                  <TableCell>قيم بواسطة</TableCell>
                  <TableCell>تاريخ التقييم</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEvaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {evaluation.task_title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar 
                          src={evaluation.evaluated_employee_avatar} 
                          sx={{ width: 32, height: 32 }}
                        >
                          {evaluation.evaluated_employee_name?.[0]}
                        </Avatar>
                        <Typography variant="body2">
                          {evaluation.evaluated_employee_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={evaluation.criteria_display || getCriteriaLabel(evaluation.criteria)} 
                        size="small" 
                        color="info"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating value={evaluation.rating} readOnly size="small" />
                        <Chip
                          label={evaluation.rating}
                          size="small"
                          color={getRatingColor(evaluation.rating)}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar 
                          src={evaluation.evaluated_by_avatar} 
                          sx={{ width: 32, height: 32 }}
                        >
                          {evaluation.evaluated_by_name?.[0]}
                        </Avatar>
                        <Typography variant="body2">
                          {evaluation.evaluated_by_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {format(new Date(evaluation.evaluated_at), 'yyyy-MM-dd HH:mm', { locale: ar })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  اختر موظف
                </Typography>
                {employees.map((employee) => (
                  <Box
                    key={employee.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      cursor: 'pointer',
                      borderRadius: 2,
                      bgcolor: selectedEmployee === employee.id ? 'primary.light' : 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => setSelectedEmployee(employee.id)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={employee.avatar_url}>
                        {employee.first_name?.[0] || employee.username[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {employee.first_name} {employee.last_name} ({employee.username})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('evaluation.averageRating')}: {employee.average_rating?.toFixed(1) || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {selectedEmployee && employeeRatings ? (
              <Card>
                <CardContent>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" gutterBottom>
                      {employeeRatings.employee.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                      <Box>
                        <Typography variant="h4" color="primary.main">
                          {employeeRatings.employee.average_rating?.toFixed(1) || 0}
                        </Typography>
                        <Rating 
                          value={employeeRatings.employee.average_rating || 0} 
                          readOnly 
                          precision={0.1}
                          size="large"
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {t('evaluation.totalEvaluations')}: {employeeRatings.employee.total_evaluations}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    {t('evaluation.criteriaStats')}
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {Object.entries(employeeRatings.criteria_stats || {}).map(([criteria, stats]) => (
                      <Grid item xs={12} md={6} key={criteria}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                              {stats.display}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                              <Rating value={stats.average || 0} readOnly size="small" />
                              <Typography variant="h6">
                                {stats.average?.toFixed(1) || 0}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {stats.count} {t('evaluation.totalEvaluations')}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    التقييمات الأخيرة
                  </Typography>
                  {employeeRatings.recent_evaluations && employeeRatings.recent_evaluations.length > 0 ? (
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>المهمة</TableCell>
                            <TableCell>المعيار</TableCell>
                            <TableCell>التقييم</TableCell>
                            <TableCell>التاريخ</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {employeeRatings.recent_evaluations.map((evaluation) => (
                            <TableRow key={evaluation.id}>
                              <TableCell>{evaluation.task_title}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={evaluation.criteria_display || getCriteriaLabel(evaluation.criteria)} 
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Rating value={evaluation.rating} readOnly size="small" />
                              </TableCell>
                              <TableCell>
                                {format(new Date(evaluation.evaluated_at), 'yyyy-MM-dd', { locale: ar })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      لا توجد تقييمات
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      اختر موظف لعرض تقييماته
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default RatingsReviewPage;

