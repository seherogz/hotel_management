import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Typography,
  Grid,
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tab,
  Tabs,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  FormControlLabel,
  Switch,
  InputAdornment
} from '@mui/material';
import { 
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  CalendarMonth as CalendarIcon,
  WorkOutline as WorkIcon,
  Business as BusinessIcon,
  Payments as PaymentsIcon,
  AccessTime as AccessTimeIcon,
  Info as InfoIcon,
  Add as AddIcon,
  ScheduleSend as ScheduleSendIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DeleteForever as DeleteForeverIcon
} from '@mui/icons-material';
import staffService from '../../services/staffService';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

// Theme colors
const themeColors = {
  primary: '#6c4bdc',
  primaryLight: '#8b71e8',
  primaryDark: '#5b3cbf',
  secondary: '#f3f0ff',
  accent: '#e8def8'
};

/**
 * Personel detaylarını gösteren modal bileşeni.
 * 
 * @param {Object} props - Bileşen özellikleri
 * @param {boolean} props.open - Modal'ın açık olup olmadığını belirler
 * @param {Function} props.onClose - Modal kapatma fonksiyonu
 * @param {number|null} props.staffId - Gösterilecek personelin ID'si
 * @param {Function} props.onStaffDeleted - Personel silindiğinde çağrılan callback fonksiyonu
 */
const StaffDetailsModal = ({ open, onClose, staffId, onStaffDeleted }) => {
  const [staffDetails, setStaffDetails] = useState(null);
  const [staffShifts, setStaffShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shiftsLoading, setShiftsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shiftsError, setShiftsError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [newShift, setNewShift] = useState({
    dayOfTheWeek: 'Monday',
    startTime: '09:00',
    endTime: '17:00'
  });
  const [editingShift, setEditingShift] = useState(null);
  const [editShiftData, setEditShiftData] = useState({
    dayOfTheWeek: '',
    startTime: '',
    endTime: ''
  });
  // Personel bilgilerini düzenleme modu için stateler
  const [isEditing, setIsEditing] = useState(false);
  const [staffFormData, setStaffFormData] = useState({
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
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

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

  // Haftanın günleri
  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  // Tab değiştirme işlemi
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Yeni vardiya bilgisi değiştirme
  const handleShiftChange = (field) => (event) => {
    setNewShift({
      ...newShift,
      [field]: event.target.value
    });
  };

  // Düzenlenen vardiya bilgisi değiştirme
  const handleEditShiftChange = (field) => (event) => {
    setEditShiftData({
      ...editShiftData,
      [field]: event.target.value
    });
  };

  // Vardiya düzenleme moduna geçme
  const handleEditShift = (shift) => {
    setEditingShift(shift.id || shift.dayOfTheWeek);
    setEditShiftData({
      dayOfTheWeek: shift.dayOfTheWeek,
      startTime: shift.startTime || '',
      endTime: shift.endTime || ''
    });
  };

  // Vardiya düzenleme iptal
  const handleCancelEdit = () => {
    setEditingShift(null);
  };

  // Saat formatını TimeSpan'e uygun formata dönüştürür (HH:mm -> HH:mm:ss)
  const formatTimeForApi = (timeString) => {
    if (!timeString) return null;
    return timeString.includes(':') && timeString.split(':').length === 2 
      ? `${timeString}:00` 
      : timeString;
  };

  // Vardiya verilerini API formatına dönüştürür
  const prepareShiftsForApi = (shifts) => {
    return shifts.map(shift => ({
      ...shift,
      startTime: formatTimeForApi(shift.startTime),
      endTime: formatTimeForApi(shift.endTime)
    }));
  };

  // Vardiya güncelleme
  const handleUpdateShift = async (shiftId) => {
    try {
      const updatedShifts = staffShifts.map(shift => {
        if ((shift.id && shift.id === shiftId) || 
            (!shift.id && shift.dayOfTheWeek === shiftId)) {
          return { ...shift, ...editShiftData };
        }
        return shift;
      });
      
      // Tüm vardiyaları içeren API isteği - TimeSpan formatına dönüştür
      await staffService.updateStaffShifts(staffId, prepareShiftsForApi(updatedShifts));
      
      // Başarılı olursa state'i güncelle
      setStaffShifts(updatedShifts);
      setEditingShift(null);
    } catch (error) {
      console.error('Vardiya güncellenirken hata:', error);
      // Hata durumunda kullanıcıya bildirim gösterilebilir
      setShiftsError('Vardiya güncellenirken bir hata oluştu');
    }
  };

  // Vardiya silme
  const handleDeleteShift = async (shiftId) => {
    try {
      // Silinecek vardiyayı dışlayarak yeni bir dizi oluştur
      const updatedShifts = staffShifts.filter(shift => 
        (shift.id && shift.id !== shiftId) || 
        (!shift.id && shift.dayOfTheWeek !== shiftId)
      );
      
      // Güncellenmiş vardiya listesini API'ye gönder - TimeSpan formatına dönüştür
      await staffService.updateStaffShifts(staffId, prepareShiftsForApi(updatedShifts));
      
      // Başarılı olursa state'i güncelle
      setStaffShifts(updatedShifts);
    } catch (error) {
      console.error('Vardiya silinirken hata:', error);
      // Hata durumunda kullanıcıya bildirim gösterilebilir
      setShiftsError('Vardiya silinirken bir hata oluştu');
    }
  };

  // Yeni vardiya ekleme
  const handleAddShift = async () => {
    try {
      let updatedShifts = [...staffShifts];
      const existingShiftIndex = staffShifts.findIndex(
        shift => shift.dayOfTheWeek === newShift.dayOfTheWeek
      );
      
      if (existingShiftIndex >= 0) {
        // Mevcut vardiyayı güncelle
        updatedShifts[existingShiftIndex] = {
          ...updatedShifts[existingShiftIndex],
          ...newShift
        };
      } else {
        // Yeni vardiya ekle
        updatedShifts = [...staffShifts, { ...newShift }];
      }
      
      // Güncellenmiş vardiya listesini API'ye gönder - TimeSpan formatına dönüştür
      await staffService.updateStaffShifts(staffId, prepareShiftsForApi(updatedShifts));
      
      // Başarılı olursa state'i güncelle
      setStaffShifts(updatedShifts);
    } catch (error) {
      console.error('Vardiya eklenirken hata:', error);
      // Hata durumunda kullanıcıya bildirim gösterilebilir
      setShiftsError('Vardiya eklenirken bir hata oluştu');
    }
  };

  // Personel düzenleme modunu aç
  const handleStartEditing = () => {
    if (staffDetails) {
      // Backend'den gelen veriyi form verilerine dönüştür
      setStaffFormData({
        id: staffDetails.id,
        firstName: staffDetails.firstName || (staffDetails.name ? staffDetails.name.split(' ')[0] : ''),
        lastName: staffDetails.lastName || (staffDetails.name ? staffDetails.name.split(' ').slice(1).join(' ') : ''),
        email: staffDetails.email || '',
        phoneNumber: staffDetails.phoneNumber || staffDetails.phone || '',
        department: staffDetails.department || '',
        role: staffDetails.role || staffDetails.position || '',
        salary: staffDetails.salary || '',
        startDate: staffDetails.startDate ? new Date(staffDetails.startDate) : null,
        isActive: staffDetails.isActive || (staffDetails.status === 'Active')
      });
      setIsEditing(true);
    }
  };

  // Personel düzenleme modunu iptal et
  const handleCancelStaffEdit = () => {
    setIsEditing(false);
    setUpdateError(null);
    setUpdateSuccess(false);
  };

  // Form alanlarını güncelleyen fonksiyon
  const handleStaffFormChange = (field) => (event) => {
    setStaffFormData({
      ...staffFormData,
      [field]: event.target.value
    });
  };

  // Switch değişikliğini handle et
  const handleSwitchChange = (event) => {
    setStaffFormData({
      ...staffFormData,
      isActive: event.target.checked
    });
  };

  // Tarih değişikliğini handle et
  const handleDateChange = (date) => {
    setStaffFormData({
      ...staffFormData,
      startDate: date
    });
  };

  // Personel bilgilerini güncelle
  const handleUpdateStaff = async () => {
    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      // Form verilerini API isteği için hazırla
      const staffData = {
        ...staffFormData,
        salary: staffFormData.salary ? Number(staffFormData.salary) : null,
        startDate: staffFormData.startDate ? staffFormData.startDate.toISOString() : null
      };
      
      // API isteği gönder
      await staffService.updateStaff(staffId, staffData);
      
      // Başarılı güncelleme sonrası personel verilerini yeniden yükle
      const updatedStaff = await staffService.getStaffById(staffId);
      setStaffDetails(updatedStaff);
      
      setUpdateSuccess(true);
      setIsEditing(false);
    } catch (error) {
      console.error('Personel güncellenirken hata:', error);
      setUpdateError('Personel bilgileri güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Personel detaylarını API'den alma
  useEffect(() => {
    if (!open || !staffId) return;

    const fetchStaffDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await staffService.getStaffById(staffId);
        setStaffDetails(data);
      } catch (err) {
        console.error('Personel detayları alınırken hata oluştu:', err);
        setError('Personel bilgileri alınamadı. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffDetails();
  }, [open, staffId]);

  // Personel vardiyalarını ayrı API'den alma
  useEffect(() => {
    if (!open || !staffId) return;

    const fetchStaffShifts = async () => {
      setShiftsLoading(true);
      setShiftsError(null);
      try {
        const data = await staffService.getStaffShifts(staffId);
        setStaffShifts(data);
      } catch (err) {
        console.error('Personel vardiyaları alınırken hata oluştu:', err);
        setShiftsError('Vardiya bilgileri alınamadı. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setShiftsLoading(false);
      }
    };

    fetchStaffShifts();
  }, [open, staffId]);

  // Personel silme dialog'ını aç
  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true);
  };

  // Personel silme dialog'ını kapat
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeleteError(null);
  };

  // Personel silme
  const handleDeleteStaff = async () => {
    if (!staffId) return;
    
    setDeleteLoading(true);
    setDeleteError(null);
    
    try {
      // API isteği gönder
      await staffService.deleteStaff(staffId);
      
      // Dialog ve ana modal'ı kapat
      handleCloseDeleteDialog();
      handleClose();
      
      // Başarılı silme sonrası callback'i çağır
      if (onStaffDeleted) {
        onStaffDeleted(staffId);
      }
    } catch (error) {
      console.error('Personel silinirken hata:', error);
      setDeleteError('Personel silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Modal kapatma işlemi
  const handleClose = () => {
    onClose();
    // Modal kapandığında verileri temizle
    setStaffDetails(null);
    setStaffShifts([]);
    setError(null);
    setShiftsError(null);
    setTabValue(0); // Modal kapandığında ilk tab'a dön
    setIsEditing(false); // Düzenleme modunu kapat
    setUpdateError(null); // Güncelleme hatalarını temizle
    setUpdateSuccess(false); // Başarı mesajını temizle
    setDeleteError(null); // Silme hatalarını temizle
  };

  // Tarih formatı
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Personel durum bilgisini getir
  const getStatusChip = (status) => {
    const isActive = status === 'Active' || status === true;
    const isOnLeave = status === 'On Leave';
    
    let color = isActive ? 'success' : isOnLeave ? 'warning' : 'error';
    let label = isActive ? 'Active' : isOnLeave ? 'On Leave' : 'Inactive';
    
    return <Chip label={label} color={color} size="small" />;
  };

  // İlk Tab İçeriği: Temel ve İş Bilgileri - Düzenleme Modunda veya Görüntüleme Modunda
  const renderInformationTab = () => (
    <>
      {/* Başarılı güncelleme mesajı */}
      {updateSuccess && (
        <Alert severity="success" sx={{ mb: 3, mx: 3 }}>
          Staff information has been successfully updated.
        </Alert>
      )}
      
      {/* Güncelleme hatası mesajı */}
      {updateError && (
        <Alert severity="error" sx={{ mb: 3, mx: 3 }}>
          {updateError}
        </Alert>
      )}
      
      {/* Düzenleme Modu Başlık ve Düğmesi */}
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: themeColors.primaryDark }}>
          Staff Information
        </Typography>
        
        {!isEditing ? (
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<EditIcon />} 
              onClick={handleStartEditing}
              sx={{ 
                borderColor: themeColors.primary, 
                color: themeColors.primary,
                '&:hover': { 
                  borderColor: themeColors.primaryDark,
                  backgroundColor: 'rgba(108, 75, 220, 0.04)' 
                },
                mr: 1
              }}
            >
              Edit
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<DeleteIcon />} 
              onClick={handleOpenDeleteDialog}
              sx={{ 
                borderColor: '#d32f2f', 
                color: '#d32f2f',
                '&:hover': { 
                  borderColor: '#b71c1c',
                  backgroundColor: 'rgba(211, 47, 47, 0.04)' 
                }
              }}
            >
              Delete
            </Button>
          </Box>
        ) : (
          <Box>
            <Button 
              variant="outlined" 
              onClick={handleCancelStaffEdit}
              sx={{ 
                mr: 1, 
                borderColor: '#9e9e9e', 
                color: '#616161',
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              startIcon={updateLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleUpdateStaff}
              disabled={updateLoading}
              sx={{ 
                backgroundColor: themeColors.primary,
                '&:hover': { backgroundColor: themeColors.primaryDark }
              }}
            >
              Save
            </Button>
          </Box>
        )}
      </Box>
      
      <Divider sx={{ backgroundColor: themeColors.accent, height: 2 }} />
      
      {isEditing ? (
        // Düzenleme modu
        <Box sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: themeColors.primaryDark }}>
            Basic Information
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* First Name */}
            <Grid item xs={12} md={6}>
              <TextField
                label="First Name"
                value={staffFormData.firstName}
                onChange={handleStaffFormChange('firstName')}
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon fontSize="small" sx={{ color: themeColors.labelText }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Last Name */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Last Name"
                value={staffFormData.lastName}
                onChange={handleStaffFormChange('lastName')}
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon fontSize="small" sx={{ color: themeColors.labelText }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Email */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                type="email"
                value={staffFormData.email}
                onChange={handleStaffFormChange('email')}
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon fontSize="small" sx={{ color: themeColors.labelText }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Phone */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Phone Number"
                value={staffFormData.phoneNumber}
                onChange={handleStaffFormChange('phoneNumber')}
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon fontSize="small" sx={{ color: themeColors.labelText }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
          
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, mt: 3, color: themeColors.primaryDark }}>
            Employment Information
          </Typography>
          
          <Grid container spacing={3}>
            {/* Department */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Department"
                value={staffFormData.department}
                onChange={handleStaffFormChange('department')}
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon fontSize="small" sx={{ color: themeColors.labelText }} />
                    </InputAdornment>
                  ),
                }}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </TextField>
            </Grid>
            
            {/* Role/Position */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Role/Position"
                value={staffFormData.role}
                onChange={handleStaffFormChange('role')}
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WorkIcon fontSize="small" sx={{ color: themeColors.labelText }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Start Date */}
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={staffFormData.startDate}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon fontSize="small" sx={{ color: themeColors.labelText }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            
            {/* Salary */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Salary"
                value={staffFormData.salary}
                onChange={handleStaffFormChange('salary')}
                fullWidth
                type="number"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PaymentsIcon fontSize="small" sx={{ color: themeColors.labelText }} />
                      <Typography sx={{ ml: 0.5, color: themeColors.labelText }}>₺</Typography>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Status */}
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 2, 
                bgcolor: staffFormData.isActive ? 'rgba(46, 125, 50, 0.08)' : 'rgba(211, 47, 47, 0.04)', 
                borderRadius: '8px',
                border: staffFormData.isActive ? '1px solid rgba(46, 125, 50, 0.2)' : '1px solid rgba(211, 47, 47, 0.2)'
              }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={staffFormData.isActive}
                      onChange={handleSwitchChange}
                      color="success"
                    />
                  }
                  label={
                    <Typography sx={{ 
                      fontWeight: '500', 
                      color: staffFormData.isActive ? '#2e7d32' : '#d32f2f'
                    }}>
                      {staffFormData.isActive ? 'Active' : 'Inactive'}
                    </Typography>
                  }
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      ) : (
        // Görüntüleme modu
        <>
          {/* Basic Information */}
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BadgeIcon sx={{ mr: 1, color: themeColors.primary }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: themeColors.primaryDark }}>
                Basic Information
              </Typography>
            </Box>
            
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell component="th" sx={{ border: 'none', pl: 0, width: '20%', verticalAlign: 'top', pt: 1, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BadgeIcon sx={{ mr: 1, fontSize: '1rem', color: themeColors.primary }} />
                      <Typography variant="subtitle2" color="text.secondary">Staff ID</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ border: 'none', width: '30%', verticalAlign: 'top', pt: 1, pb: 1 }}>
                    <Typography variant="body1">{staffDetails.id || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell component="th" sx={{ border: 'none', width: '20%', verticalAlign: 'top', pt: 1, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ mr: 1, fontSize: '1rem', color: themeColors.primary }} />
                      <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ border: 'none', width: '30%', verticalAlign: 'top', pt: 1, pb: 1 }}>
                    <Typography variant="body1">{staffDetails.email || 'N/A'}</Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ border: 'none', pl: 0, width: '20%', verticalAlign: 'top', pt: 1, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneIcon sx={{ mr: 1, fontSize: '1rem', color: themeColors.primary }} />
                      <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ border: 'none', width: '30%', verticalAlign: 'top', pt: 1, pb: 1 }}>
                    <Typography variant="body1">{staffDetails.phone || staffDetails.phoneNumber || 'N/A'}</Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
          
          <Divider sx={{ backgroundColor: themeColors.accent, height: 2 }} />
          
          {/* Employment Information */}
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WorkIcon sx={{ mr: 1, color: themeColors.primary }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: themeColors.primaryDark }}>
                Employment Information
              </Typography>
            </Box>
            
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell component="th" sx={{ border: 'none', pl: 0, width: '20%', verticalAlign: 'top', pt: 1, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarIcon sx={{ mr: 1, fontSize: '1rem', color: themeColors.primary }} />
                      <Typography variant="subtitle2" color="text.secondary">Start Date</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ border: 'none', width: '30%', verticalAlign: 'top', pt: 1, pb: 1 }}>
                    <Typography variant="body1">{formatDate(staffDetails.startDate)}</Typography>
                  </TableCell>
                  <TableCell component="th" sx={{ border: 'none', width: '20%', verticalAlign: 'top', pt: 1, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon sx={{ mr: 1, fontSize: '1rem', color: themeColors.primary }} />
                      <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ border: 'none', width: '30%', verticalAlign: 'top', pt: 1, pb: 1 }}>
                    <Typography variant="body1">{staffDetails.department || 'N/A'}</Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ border: 'none', pl: 0, width: '20%', verticalAlign: 'top', pt: 1, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WorkIcon sx={{ mr: 1, fontSize: '1rem', color: themeColors.primary }} />
                      <Typography variant="subtitle2" color="text.secondary">Position/Role</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ border: 'none', width: '30%', verticalAlign: 'top', pt: 1, pb: 1 }}>
                    <Typography variant="body1">{staffDetails.position || staffDetails.role || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell component="th" sx={{ border: 'none', width: '20%', verticalAlign: 'top', pt: 1, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PaymentsIcon sx={{ mr: 1, fontSize: '1rem', color: themeColors.primary }} />
                      <Typography variant="subtitle2" color="text.secondary">Salary</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ border: 'none', width: '30%', verticalAlign: 'top', pt: 1, pb: 1 }}>
                    <Typography variant="body1">{staffDetails.salary ? `₺${staffDetails.salary.toLocaleString('tr-TR')}` : 'N/A'}</Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </>
      )}
    </>
  );

  // İkinci Tab İçeriği: Vardiya Tablosu
  const renderShiftTab = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccessTimeIcon sx={{ mr: 1, color: themeColors.primary }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: themeColors.primaryDark }}>
            Current Shift Schedule
          </Typography>
        </Box>
      </Box>
      
      {/* Vardiya Ekleme Formu */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4, 
          bgcolor: themeColors.secondary, 
          borderRadius: 2,
          border: `1px solid ${themeColors.accent}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AddIcon sx={{ mr: 1, color: themeColors.primary }} />
          <Typography variant="h6" sx={{ color: themeColors.primaryDark }}>
            Add/Update Shift
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="day-select-label">Day</InputLabel>
              <Select
                labelId="day-select-label"
                id="day-select"
                value={newShift.dayOfTheWeek}
                onChange={handleShiftChange('dayOfTheWeek')}
                label="Day"
              >
                {daysOfWeek.map((day) => (
                  <MenuItem key={day} value={day}>{day}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Start Time"
              type="time"
              value={newShift.startTime}
              onChange={handleShiftChange('startTime')}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="End Time"
              type="time"
              value={newShift.endTime}
              onChange={handleShiftChange('endTime')}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              startIcon={<ScheduleSendIcon />}
              onClick={handleAddShift}
              sx={{ 
                bgcolor: themeColors.primary,
                '&:hover': { bgcolor: themeColors.primaryDark }
              }}
            >
              {staffShifts.some(shift => shift.dayOfTheWeek === newShift.dayOfTheWeek) 
                ? 'Update Shift' : 'Add Shift'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Haftalık Vardiya Planı */}
      {shiftsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress sx={{ color: themeColors.primary }} />
        </Box>
      ) : shiftsError ? (
        <Box sx={{ p: 3, bgcolor: '#fff3cd', color: '#856404', borderRadius: 2, mb: 3 }}>
          <Typography>{shiftsError}</Typography>
        </Box>
      ) : (
        <>
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: themeColors.primaryDark, mb: 2 }}>
            Weekly Schedule
          </Typography>
          
          <Grid container spacing={2}>
            {daysOfWeek.map((day) => {
              // Bu gün için vardiya var mı kontrol et
              const dayShift = staffShifts.find(shift => shift.dayOfTheWeek === day);
              const isEditing = editingShift === (dayShift?.id || day);
              
              return (
                <Grid item xs={12} sm={6} md={4} key={day}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: dayShift ? themeColors.secondary : '#f5f5f5', 
                      borderRadius: 1,
                      border: `1px solid ${dayShift ? themeColors.accent : '#e0e0e0'}`,
                      boxShadow: dayShift ? '0px 2px 5px rgba(0, 0, 0, 0.05)' : 'none',
                      height: '140px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 'medium', 
                        color: dayShift ? themeColors.primaryDark : 'text.secondary'
                      }}>
                        {day}
                      </Typography>
                      
                      {dayShift && !isEditing && (
                        <Box>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditShift(dayShift)}
                            sx={{ color: themeColors.primary, mr: 0.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteShift(dayShift.id || day)}
                            sx={{ color: '#f44336' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                      
                      {isEditing && (
                        <Box>
                          <IconButton 
                            size="small" 
                            onClick={() => handleUpdateShift(dayShift.id || day)}
                            sx={{ color: 'success.main', mr: 0.5 }}
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={handleCancelEdit}
                            sx={{ color: 'text.secondary' }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                    
                    {isEditing ? (
                      <Box sx={{ mt: 1, flex: 1 }}>
                        <Grid container spacing={1}>
                          <Grid item xs={12}>
                            <TextField
                              label="Start Time"
                              type="time"
                              value={editShiftData.startTime}
                              onChange={handleEditShiftChange('startTime')}
                              fullWidth
                              size="small"
                              InputLabelProps={{ shrink: true }}
                              sx={{ mb: 1 }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              label="End Time"
                              type="time"
                              value={editShiftData.endTime}
                              onChange={handleEditShiftChange('endTime')}
                              fullWidth
                              size="small"
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    ) : dayShift ? (
                      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTimeIcon sx={{ mr: 1, fontSize: '0.9rem', color: themeColors.primary }} />
                          <Typography variant="body2">
                            {dayShift.startTime && dayShift.endTime ? 
                              `${dayShift.startTime} - ${dayShift.endTime}` : 
                              'No hours set'}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flex: 1
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                          No shift assigned
                        </Typography>
                        <Button 
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            setNewShift(prev => ({ ...prev, dayOfTheWeek: day }));
                            const element = document.getElementById('day-select');
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          sx={{ 
                            borderColor: themeColors.primary,
                            color: themeColors.primary
                          }}
                        >
                          Add Shift
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Box>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { 
            borderRadius: 2,
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 3,
            pb: 1,
            backgroundColor: themeColors.secondary,
            borderBottom: `4px solid ${themeColors.primaryLight}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InfoIcon sx={{ mr: 1, color: themeColors.primary }} />
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: themeColors.primaryDark }}>
              Staff Details
            </Typography>
          </Box>
          <IconButton 
            onClick={handleClose} 
            size="small"
            sx={{ 
              color: 'white', 
              backgroundColor: themeColors.primary,
              '&:hover': { backgroundColor: themeColors.primaryDark }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress sx={{ color: themeColors.primary }} />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3, bgcolor: '#fff3cd', color: '#856404', borderRadius: 2, m: 3 }}>
              <Typography>{error}</Typography>
            </Box>
          ) : staffDetails ? (
            <Box>
              {/* Header with Avatar and Status */}
              <Box sx={{ p: 3, backgroundColor: themeColors.secondary }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ width: 90, height: 90, bgcolor: themeColors.primary, mr: 3, fontSize: '2rem' }}
                  >
                    {staffDetails.name ? staffDetails.name.split(' ').map(n => n[0]).join('') :
                     staffDetails.firstName && staffDetails.lastName ? 
                     `${staffDetails.firstName.charAt(0)}${staffDetails.lastName.charAt(0)}` : '??'}
                  </Avatar>
                  <Box>
                    <Chip 
                      label={staffDetails.status || (staffDetails.isActive ? 'Active' : 'Inactive')} 
                      color={(staffDetails.status === 'Active' || staffDetails.isActive) ? 'success' : 'warning'}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: themeColors.primaryDark }}>
                      {staffDetails.name || 
                       (staffDetails.firstName && staffDetails.lastName ? 
                        `${staffDetails.firstName} ${staffDetails.lastName}` : 
                        'İsimsiz Personel')}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                      {staffDetails.position || staffDetails.role} ({staffDetails.department})
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  sx={{
                    bgcolor: '#fff',
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 'medium' },
                    '& .Mui-selected': { color: themeColors.primary, fontWeight: 'bold' },
                    '& .MuiTabs-indicator': { backgroundColor: themeColors.primary }
                  }}
                >
                  <Tab 
                    label="Staff Information" 
                    icon={<BadgeIcon sx={{ fontSize: '1.1rem' }} />} 
                    iconPosition="start"
                  />
                  <Tab 
                    label="Shift Schedule" 
                    icon={<AccessTimeIcon sx={{ fontSize: '1.1rem' }} />} 
                    iconPosition="start"
                  />
                </Tabs>
              </Box>
              
              {/* Tab İçerikleri */}
              {tabValue === 0 && renderInformationTab()}
              {tabValue === 1 && renderShiftTab()}
              
            </Box>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No staff selected</Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, backgroundColor: themeColors.secondary }}>
          <Button 
            onClick={handleClose} 
            variant="contained"
            size="large"
            sx={{ 
              minWidth: 100,
              backgroundColor: themeColors.primary,
              '&:hover': { backgroundColor: themeColors.primaryDark },
              boxShadow: '0px 4px 10px rgba(108, 75, 220, 0.3)',
            }}
          >
            CLOSE
          </Button>
        </DialogActions>
      </Dialog>

      {/* Silme Onayı Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 2,
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          <DeleteForeverIcon sx={{ mr: 1 }} />
          Personel Silme Onayı
        </DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText>
            {staffDetails ? (
              <>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <b>{staffDetails.name || `${staffDetails.firstName} ${staffDetails.lastName}`}</b> isimli personeli silmek istediğinizden emin misiniz?
                </Typography>
                <Typography variant="body2" color="error">
                  Bu işlem geri alınamaz ve tüm personel bilgileri silinecektir.
                </Typography>
              </>
            ) : (
              <Typography variant="body1">
                Bu personeli silmek istediğinizden emin misiniz?
              </Typography>
            )}
          </DialogContentText>
          
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Button 
            onClick={handleCloseDeleteDialog}
            sx={{ color: 'text.secondary' }}
          >
            İptal
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={deleteLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteForeverIcon />}
            onClick={handleDeleteStaff}
            disabled={deleteLoading}
          >
            Personeli Sil
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StaffDetailsModal; 