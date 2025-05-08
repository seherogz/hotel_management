import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  IconButton,
  Switch,
  FormControlLabel,
  CircularProgress,
  Divider,
  Alert,
  Paper,
  InputAdornment,
  OutlinedInput
} from '@mui/material';
import { 
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  Save as SaveIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  BadgeOutlined as BadgeIcon,
  WorkOutline as WorkIcon,
  CalendarToday as CalendarIcon,
  MonetizationOn as MoneyIcon,
  BusinessCenter as BusinessIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import staffService from '../../services/staffService';
import { tr as trLocale } from 'date-fns/locale';

// Theme colors - StaffDetailsModal ile aynı temayı kullanıyoruz
const themeColors = {
  primary: '#6c4bdc',
  primaryLight: '#8b71e8',
  primaryDark: '#5b3cbf',
  secondary: '#f3f0ff',
  accent: '#e8def8',
  lightGray: '#f8f9fa',
  border: '#e0e0e0',
  text: '#424242',
  labelText: '#555555'
};

// Departman listesi
const departments = [
  'Front Office',
  'Housekeeping',
  'Kitchen',
  'Security',
  'Finance',
  'Technical',
  'Other'
];

/**
 * Yeni personel oluşturmak için modal bileşeni
 * 
 * @param {Object} props - Bileşen özellikleri
 * @param {boolean} props.open - Modal'ın açık olup olmadığı
 * @param {Function} props.onClose - Modal kapatma fonksiyonu
 * @param {Function} props.onStaffCreated - Personel oluşturulduğunda çağrılacak callback
 */
const CreateStaffModal = ({ open, onClose, onStaffCreated }) => {
  // Form state'i
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    department: '',
    role: '',
    salary: '',
    startDate: null,
    isActive: true
  });

  // Validation errors
  const [errors, setErrors] = useState({});
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
  // API error message
  const [apiError, setApiError] = useState(null);
  
  // Form field değişikliklerini handle et
  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    
    // Hata mesajını temizle
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null
      });
    }
  };
  
  // Switch değişikliğini handle et
  const handleSwitchChange = (event) => {
    setFormData({
      ...formData,
      isActive: event.target.checked
    });
  };
  
  // Tarih değişikliğini handle et
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      startDate: date
    });
    
    // Hata mesajını temizle
    if (errors.startDate) {
      setErrors({
        ...errors,
        startDate: null
      });
    }
  };
  
  // Form doğrulama
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    
    if (!formData.role) {
      newErrors.role = 'Role/Position is required';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (formData.salary && isNaN(Number(formData.salary))) {
      newErrors.salary = 'Salary must be a number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Form gönderimi
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setApiError(null);
    
    try {
      // Form verilerini API isteği için hazırla
      const staffData = {
        ...formData,
        salary: formData.salary ? Number(formData.salary) : null,
        // Tarih formatını backend'in beklediği formata dönüştür (eğer gerekiyorsa)
        startDate: formData.startDate ? formData.startDate.toISOString() : null
      };
      
      // API isteği gönder
      const response = await staffService.createStaff(staffData);
      
      // Modal'ı kapat ve parent komponente bildirimi gönder
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        department: '',
        role: '',
        salary: '',
        startDate: null,
        isActive: true
      });
      
      if (onStaffCreated) {
        onStaffCreated(response);
      }
      
      onClose();
    } catch (error) {
      console.error('Personel oluşturulurken hata:', error);
      setApiError(error.message || 'Failed to create staff. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Modal'ı kapat
  const handleClose = () => {
    // Formu sıfırla
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      department: '',
      role: '',
      salary: '',
      startDate: null,
      isActive: true
    });
    setErrors({});
    setApiError(null);
    
    onClose();
  };

  // Text field için ortak stil
  const textFieldStyle = {
    width: '100%', // TextField'in kök FormControl elementinin genişliği
    '.MuiOutlinedInput-root': { // Doğrudan çerçeveli input alanını hedefler
      borderRadius: '8px',
      width: '100%' // Çerçeveli input alanının da %100 genişlikte olmasını sağla
    },
  };
  
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { 
          borderRadius: '12px',
          boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 3,
          bgcolor: 'white',
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonAddIcon sx={{ mr: 1.5, color: themeColors.primary }} />
          <Typography variant="h5" sx={{ fontWeight: '600', color: themeColors.text }}>
            Create New Staff
          </Typography>
        </Box>
        <IconButton 
          onClick={handleClose} 
          size="medium"
          sx={{ 
            color: 'rgba(0,0,0,0.6)', 
            bgcolor: themeColors.lightGray,
            '&:hover': { bgcolor: '#eeeeee' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {/* API Error Message */}
        {apiError && (
          <Alert severity="error" sx={{ m: 3, mb: 0 }}>
            {apiError}
          </Alert>
        )}
        
        {/* Form */}
        <Box sx={{ p: 3 }}>
          {/* Personal Information Section */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
            <Typography variant="h6" sx={{ mb: 3, color: themeColors.primary, fontWeight: '600', display: 'flex', alignItems: 'center' }}>
              <BadgeIcon sx={{ mr: 1.5 }} /> Personal Information
            </Typography>
            
            <Grid container spacing={3}>
              {/* First Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name *"
                  value={formData.firstName}
                  onChange={handleChange('firstName')}
                  fullWidth
                  variant="outlined"
                  error={Boolean(errors.firstName)}
                  helperText={errors.firstName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon fontSize="small" sx={{ color: themeColors.labelText }} />
                      </InputAdornment>
                    )
                  }}
                  sx={textFieldStyle}
                />
              </Grid>
              
              {/* Last Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name *"
                  value={formData.lastName}
                  onChange={handleChange('lastName')}
                  fullWidth
                  variant="outlined"
                  error={Boolean(errors.lastName)}
                  helperText={errors.lastName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon fontSize="small" sx={{ color: themeColors.labelText }} />
                      </InputAdornment>
                    )
                  }}
                  sx={textFieldStyle}
                />
              </Grid>
              
              {/* Email */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email *"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  fullWidth
                  variant="outlined"
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon fontSize="small" sx={{ color: themeColors.labelText }} />
                      </InputAdornment>
                    )
                  }}
                  sx={textFieldStyle}
                />
              </Grid>
              
              {/* Phone */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number *"
                  value={formData.phoneNumber}
                  onChange={handleChange('phoneNumber')}
                  fullWidth
                  variant="outlined"
                  error={Boolean(errors.phoneNumber)}
                  helperText={errors.phoneNumber}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon fontSize="small" sx={{ color: themeColors.labelText }} />
                      </InputAdornment>
                    )
                  }}
                  sx={textFieldStyle}
                />
              </Grid>
            </Grid>
          </Paper>
          
          {/* Employment Information Section */}
          <Paper sx={{ p: 3, borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
            <Typography variant="h6" sx={{ mb: 3, color: themeColors.primary, fontWeight: '600', display: 'flex', alignItems: 'center' }}>
              <WorkIcon sx={{ mr: 1.5 }} /> Employment Information
            </Typography>
            
            {/* İlk satır: Department ve Position yan yana */}
            <Grid container spacing={3} sx={{ mb: 2 }}>
              {/* Department */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Department *"
                  value={formData.department}
                  onChange={handleChange('department')}
                  fullWidth
                  variant="outlined"
                  error={Boolean(errors.department)}
                  helperText={errors.department}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon fontSize="small" sx={{ color: themeColors.labelText }} />
                      </InputAdornment>
                    ),
                    sx: {
                      height: '56px', // Input alanlarının sabit yüksekliği
                      width: '100%' // Tam genişlik
                    }
                  }}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          borderRadius: '8px',
                          boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.15)',
                        }
                      }
                    }
                  }}
                  sx={{
                    ...textFieldStyle,
                    width: '100%', // Tam genişlik
                    '.MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%' // Seçim alanı tam genişlik
                    },
                    '.MuiInputBase-root': {
                      width: '100%' // Input kök elementi tam genişlik
                    },
                    '.MuiOutlinedInput-notchedOutline': {
                      width: '100%' // Çerçeve tam genişlik
                    }
                  }}
                >
                  <MenuItem value="" disabled>
                    <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                      Select a department
                    </Typography>
                  </MenuItem>
                  {departments.map((department) => (
                    <MenuItem key={department} value={department}>
                      {department}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Role/Position */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Role/Position *"
                  value={formData.role}
                  onChange={handleChange('role')}
                  fullWidth
                  variant="outlined"
                  error={Boolean(errors.role)}
                  helperText={errors.role}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <WorkIcon fontSize="small" sx={{ color: themeColors.labelText }} />
                      </InputAdornment>
                    ),
                    sx: {
                      height: '56px', // Input alanlarının sabit yüksekliği
                    }
                  }}
                  sx={textFieldStyle}
                />
              </Grid>
            </Grid>

            {/* İkinci satır: Start Date ve Salary yan yana */}
            <Grid container spacing={3}>
              {/* Start Date */}
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} locale={trLocale}>
                  <DatePicker
                    label="Start Date *"
                    value={formData.startDate}
                    onChange={handleDateChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={Boolean(errors.startDate)}
                        helperText={errors.startDate}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarIcon fontSize="small" sx={{ color: themeColors.labelText }} />
                            </InputAdornment>
                          ),
                          sx: {
                            height: '56px', // Input alanlarının sabit yüksekliği
                          }
                        }}
                        sx={textFieldStyle}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              
              {/* Salary */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Salary"
                  value={formData.salary}
                  onChange={handleChange('salary')}
                  fullWidth
                  type="number"
                  variant="outlined"
                  error={Boolean(errors.salary)}
                  helperText={errors.salary}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon fontSize="small" sx={{ color: themeColors.labelText }} />
                        <Typography sx={{ ml: 0.5, color: themeColors.labelText }}>₺</Typography>
                      </InputAdornment>
                    ),
                    sx: {
                      height: '56px', // Input alanlarının sabit yüksekliği
                    }
                  }}
                  sx={textFieldStyle}
                />
              </Grid>
              
              {/* Status */}
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  p: 2, 
                  bgcolor: formData.isActive ? 'rgba(46, 125, 50, 0.08)' : 'rgba(211, 47, 47, 0.04)', 
                  borderRadius: '8px',
                  border: formData.isActive ? '1px solid rgba(46, 125, 50, 0.2)' : '1px solid rgba(211, 47, 47, 0.2)'
                }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={handleSwitchChange}
                        color="success"
                      />
                    }
                    label={
                      <Typography sx={{ 
                        fontWeight: '500', 
                        color: formData.isActive ? '#2e7d32' : '#d32f2f'
                      }}>
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </Typography>
                    }
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 3, 
        bgcolor: themeColors.lightGray,
        borderTop: '1px solid #e0e0e0',
        justifyContent: 'flex-end'
      }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          size="large"
          sx={{ 
            mr: 2,
            minWidth: 120,
            borderRadius: '8px',
            borderColor: themeColors.primary, 
            color: themeColors.primary,
            fontWeight: '600',
            '&:hover': {
              borderColor: themeColors.primaryDark,
              backgroundColor: 'rgba(108, 75, 220, 0.04)'
            }
          }}
        >
          CANCEL
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          sx={{ 
            minWidth: 120,
            borderRadius: '8px',
            backgroundColor: themeColors.primary,
            '&:hover': { backgroundColor: themeColors.primaryDark },
            boxShadow: '0px 4px 12px rgba(108, 75, 220, 0.25)',
            fontWeight: '600'
          }}
        >
          SAVE
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateStaffModal; 