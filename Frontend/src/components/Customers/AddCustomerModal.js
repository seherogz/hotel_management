// src/components/Customers/AddCustomerModal.js

import React, { useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  // Grid, // Artık Grid'e ihtiyaç kalmadı
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Paper,
  Box,
  Stack, // Stack import edildi
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon, // Veya PersonOutline
  Email as EmailIcon,   // Veya EmailOutlined
  Phone as PhoneIcon,   // Veya PhoneOutlined
  Home as HomeIcon,     // Veya HomeOutlined
  Flag as FlagIcon,     // Veya FlagOutlined
  Badge as BadgeIcon,   // Veya BadgeOutlined
  CalendarMonth as CalendarIcon, // Veya CalendarMonthOutlined
  Notes as NotesIcon,   // Veya NotesOutlined
  Save as SaveIcon,
  Cancel as CancelIcon, // Veya CancelOutlined
  Stars as StarsIcon   // Veya StarsOutlined
} from '@mui/icons-material';
import customerService from '../../services/customerService';

// Renk paleti (ilk kodundaki gibi)
const colors = {
  primary: '#3f2b7b',
  primaryLight: '#ebe8f4',
  primaryLighter: '#f5f3fa',
};

const AddCustomerModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '',
    status: 'Standard', nationality: '', idNumber: '', notes: '', birthDate: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // handleFormChange, validateForm, handleSubmit, handleClose fonksiyonları aynı...
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    setFormErrors({});

    try {
      const customerData = {
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      };

      // === BirthDate Format Düzeltmesi (toISOString() Kullanımı) ===
      if (customerData.birthDate) {
        // TARAYICIDAN GELEN DEĞERİ KONTROL ET
        console.log("Input'tan gelen birthDate değeri:", formData.birthDate); 
        try {
             const date = new Date(customerData.birthDate);
             if (!isNaN(date.getTime())) {
                 customerData.birthDate = date.toISOString();
             } else {
                 console.warn("Invalid date value received:", formData.birthDate);
                 customerData.birthDate = null;
             }
        } catch(dateError) {
             console.error("Date parsing/formatting error:", dateError);
             customerData.birthDate = null;
        }
      } else {
        console.log("BirthDate input'u boş veya seçilmemiş.");
        customerData.birthDate = null;
      }
      // ============================================================

      console.log("Gönderilen Müşteri Verisi (ISO Date ile):", customerData);

      await customerService.createCustomer(customerData);
      if (onSuccess) onSuccess();
      handleClose();

    } catch (err) {
      console.error('Error adding customer:', err);
      // Hata yönetimi (önceki gibi)
       if (err.response && err.response.data && err.response.data.errors) {
        const backendErrors = err.response.data.errors;
        const newFormErrors = {};
        for (const key in backendErrors) {
          const formKey = key.charAt(0).toLowerCase() + key.slice(1);
          const targetKey = formKey === 'birthDate' ? 'birthDate' : formKey;
          newFormErrors[targetKey] = backendErrors[key].join(', ');
        }
        setFormErrors(newFormErrors);
      } else {
         const errorMessage = err.response?.data?.message || err.message || 'Failed to add customer. Please check the details and try again.';
         setFormErrors({ submit: errorMessage });
      }
    } finally {
      setSubmitting(false);
    }
  };
  const handleClose = () => {
     setFormData({
      firstName: '', lastName: '', email: '', phone: '', address: '',
      status: 'Standard', nationality: '', idNumber: '', notes: '', birthDate: ''
    });
    setFormErrors({});
    if (onClose) onClose();
  };


  // Ortak stil tanımlamaları
  const iconStyle = { color: colors.primary };
  const textFieldStyle = { backgroundColor: 'white' };
  const formSectionStyle = {
    p: 3, mb: 3, backgroundColor: 'white', borderRadius: 2,
    boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.1)',
  };

   // Ortak InputProps
   const commonInputProps = (IconComponent) => ({
    startAdornment: (
      <InputAdornment position="start">
        <IconComponent sx={iconStyle} />
      </InputAdornment>
    ),
    sx: textFieldStyle
  });


  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md" // Maksimum genişlik md olarak kalabilir veya sm yapılabilir
      fullWidth
      PaperProps={{ elevation: 3, sx: { borderRadius: 2 } }}
    >
      {/* Başlık Kısmı (Aynı) */}
      <DialogTitle
        sx={{
          borderBottom: '1px solid #eee', backgroundColor: colors.primary, color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2
        }}
      >
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          <Typography variant="h6" fontWeight="bold"> Add New Customer </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'white' }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* İçerik Kısmı */}
      <DialogContent sx={{ py: 4, px: 3, backgroundColor: colors.primaryLighter }}>
         {formErrors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>{formErrors.submit}</Alert>
        )}

        {/* ===== Personal Information Section (Stack ile Güncellendi) ===== */}
        <Paper elevation={1} sx={{ ...formSectionStyle }}>
            <Typography variant="subtitle1" fontWeight="medium" color="text.secondary" sx={{ mb: 2 }}>
                Personal Information
            </Typography>
            {/* Grid yerine Stack kullanılıyor */}
            <Stack direction="row" spacing={3}>
                <TextField
                    name="firstName" label="First Name" value={formData.firstName} onChange={handleFormChange}
                    required fullWidth error={!!formErrors.firstName} helperText={formErrors.firstName}
                    variant="outlined" InputProps={commonInputProps(PersonIcon)}
                    size="medium"
                    sx={{ flex: 1 }} // Satırda eşit yer kaplaması için
                />
                <TextField
                    name="lastName" label="Last Name" value={formData.lastName} onChange={handleFormChange}
                    required fullWidth error={!!formErrors.lastName} helperText={formErrors.lastName}
                    variant="outlined" InputProps={commonInputProps(PersonIcon)}
                    size="medium"
                    sx={{ flex: 1 }} // Satırda eşit yer kaplaması için
                />
            </Stack>
        </Paper>
        {/* ========================================================== */}


        {/* Contact Details Section (Stack ile güncellenmişti) */}
        <Paper elevation={1} sx={{ ...formSectionStyle }}>
          <Typography variant="subtitle1" fontWeight="medium" color="text.secondary" sx={{ mb: 2 }}>
            Contact Details
          </Typography>
          <Stack spacing={3}>
            <Stack direction="row" spacing={3}>
              <TextField
                name="email" label="Email" type="email" value={formData.email} onChange={handleFormChange}
                fullWidth error={!!formErrors.email} helperText={formErrors.email}
                variant="outlined" InputProps={commonInputProps(EmailIcon)}
                size="medium" sx={{ flex: 1, ...textFieldStyle }}
               />
              <TextField
                name="phone" label="Phone Number" value={formData.phone} onChange={handleFormChange}
                fullWidth error={!!formErrors.phone} helperText={formErrors.phone}
                variant="outlined" InputProps={commonInputProps(PhoneIcon)}
                size="medium" sx={{ flex: 1, ...textFieldStyle }}
              />
            </Stack>
            <TextField
              name="address" label="Address" value={formData.address} onChange={handleFormChange}
              fullWidth multiline rows={1} variant="outlined"
              InputProps={{
                startAdornment: ( <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}> <HomeIcon sx={iconStyle} /> </InputAdornment> )
              }}
               sx={{ backgroundColor: 'white' }}
            />
          </Stack>
        </Paper>

        {/* Additional Information Section (Stack ile güncellenmişti) */}
        <Paper elevation={1} sx={{ ...formSectionStyle, mb: 0 }}>
          <Typography variant="subtitle1" fontWeight="medium" color="text.secondary" sx={{ mb: 2 }}>
            Additional Information
          </Typography>
          <Stack spacing={3}>
            <Stack direction="row" spacing={3}>
              <FormControl fullWidth variant="outlined" size="medium" sx={{ flex: 1 }}>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label" name="status" value={formData.status} onChange={handleFormChange}
                  label="Status" sx={{ backgroundColor: 'white' }}
                  startAdornment={ <InputAdornment position="start"> <StarsIcon sx={iconStyle} /> </InputAdornment> }
                >
                  <MenuItem value="Standard">Standard</MenuItem>
                  <MenuItem value="VIP">VIP</MenuItem>
                </Select>
              </FormControl>
              <TextField
                name="nationality" label="Nationality" value={formData.nationality} onChange={handleFormChange}
                fullWidth variant="outlined" InputProps={commonInputProps(FlagIcon)}
                size="medium" sx={{ flex: 1 }}
              />
            </Stack>
            <Stack direction="row" spacing={3}>
              <TextField
                name="idNumber" label="ID Number" value={formData.idNumber} onChange={handleFormChange}
                fullWidth error={!!formErrors.idNumber} helperText={formErrors.idNumber}
                variant="outlined" InputProps={commonInputProps(BadgeIcon)}
                size="medium" sx={{ flex: 1 }}
               />
              <TextField
                name="birthDate" label="Birth Date" type="date" value={formData.birthDate} onChange={handleFormChange}
                fullWidth variant="outlined" InputLabelProps={{ shrink: true }}
                InputProps={commonInputProps(CalendarIcon)} size="medium" sx={{ flex: 1 }}
               />
            </Stack>
            <TextField
              name="notes" label="Notes" value={formData.notes} onChange={handleFormChange}
              fullWidth multiline rows={3} variant="outlined"
              InputProps={{
                startAdornment: ( <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}> <NotesIcon sx={iconStyle} /> </InputAdornment> )
              }}
               sx={{ backgroundColor: 'white' }}
             />
          </Stack>
        </Paper>

      </DialogContent>

      {/* Butonlar (Aynı) */}
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #eee', justifyContent: 'flex-end' }}>
         <Button
            onClick={handleClose} variant="outlined" startIcon={<CancelIcon />}
            sx={{ borderColor: '#8e8e8e', color: '#8e8e8e', '&:hover': { borderColor: '#6e6e6e', backgroundColor: 'rgba(142, 142, 142, 0.08)' }, borderRadius: '8px', fontWeight: 'bold', px: 3, height: '44px' }}
          > CANCEL </Button>
          <Button
            onClick={handleSubmit} variant="contained" disabled={submitting} startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{ backgroundColor: colors.primary, color: 'white', '&:hover': { backgroundColor: '#33235f' }, borderRadius: '8px', fontWeight: 'bold', px: 3, ml: 2, height: '44px' }}
          > {submitting ? 'ADDING...' : 'ADD CUSTOMER'} </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCustomerModal;