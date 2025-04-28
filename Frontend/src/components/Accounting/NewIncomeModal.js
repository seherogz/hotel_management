import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, Box
} from '@mui/material';
// Opsiyonel: DatePicker kullanmak isterseniz ilgili importları açın
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import trLocale from 'date-fns/locale/tr';

// Başlangıç state'i (yeni ekleme için)
const initialState = {
  incomeNumber: '', // Kullanıcıdan alınıyor
  date: new Date().toISOString(),
  customerName: '',
  roomNumber: '',
  amount: ''
};

// initialData prop'u eklendi (varsayılanı null)
const NewIncomeModal = ({ open, onClose, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const isEditing = Boolean(initialData); // initialData varsa düzenleme modundayız

  // Modal açıldığında veya initialData değiştiğinde formu ayarla
  useEffect(() => {
    if (open) {
      if (isEditing) {
        // Düzenleme modu: initialData ile formu doldur
        setFormData({
          incomeNumber: initialData.incomeNumber || '', // incomeNumber düzenlenemez varsaydık
          // Tarihi YYYY-MM-DD formatına çevir (HTML type="date" için)
          date: initialData.date ? new Date(initialData.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
          customerName: initialData.customerName || '',
          roomNumber: initialData.roomNumber || '',
          amount: initialData.amount !== undefined ? initialData.amount : ''
        });
      } else {
        // Ekleme modu: Formu sıfırla (tarihi bugüne ayarla)
        setFormData({
            ...initialState,
            date: new Date().toISOString().substring(0, 10) // Sadece YYYY-MM-DD
          });
      }
      setErrors({}); // Hataları temizle
    }
  }, [open, initialData, isEditing]); // initialData değişince de tetiklenir

  // Input değişikliklerini handle etme
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Input değiştiğinde ilgili hatayı temizle
    if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Basit form validasyonu
  const validateForm = () => {
      let tempErrors = {};
      // Income Number sadece yeni eklerken zorunlu ve kontrol ediliyor
      if (!isEditing && !formData.incomeNumber) {
          tempErrors.incomeNumber = "Income number is required.";
      }
      // Müşteri adı her zaman zorunlu
      if (!formData.customerName) {
           tempErrors.customerName = "Customer name is required.";
      }
      // Tutar her zaman zorunlu ve pozitif sayı olmalı
      if (formData.amount === '' || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
          tempErrors.amount = "Amount must be a positive number.";
      }
      // Tarih kontrolü eklenebilir
      if (!formData.date) {
          tempErrors.date = "Date is required.";
      }
      setErrors(tempErrors);
      return Object.keys(tempErrors).length === 0; // Hata yoksa true
  }

  // Formu gönderme
  const handleSubmit = (event) => {
    event.preventDefault(); // Formun varsayılan gönderme davranışını engelle
     if (!validateForm()) return; // Validasyon başarısızsa işlemi durdur

     // API'nin tarihi ISO string olarak beklediğini varsayarak dönüştür
     // (Eğer type="date" inputu YYYY-MM-DD veriyorsa)
     const dateToSend = formData.date ? new Date(formData.date).toISOString() : null;

    // onSubmit prop'u ile veriyi parent bileşene (Accounting.js) gönder
    // Amount'u sayıya çevir, tarihi formatla
    onSubmit({
      ...formData, // incomeNumber, customerName, roomNumber içerir
      date: dateToSend,
      amount: Number(formData.amount)
    });
  };

  return (
    // Dialog başlığı ve buton yazısı isEditing durumuna göre değişir
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Income' : 'Add New Income'}</DialogTitle>
      <DialogContent>
        {/* Form elemanları */}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            {/* Income Number (Düzenlemede pasif) */}
            <Grid item xs={12} sm={6}>
              <TextField
                required={!isEditing} // Sadece eklerken zorunlu
                fullWidth
                id="incomeNumber"
                label="Income Number"
                name="incomeNumber"
                value={formData.incomeNumber}
                onChange={handleChange}
                error={!!errors.incomeNumber}
                helperText={errors.incomeNumber}
                autoFocus={!isEditing} // Sadece eklemede autofocus
                disabled={isEditing} // Düzenlemede değiştirilemez
                InputLabelProps={{ shrink: true }} // Etiketin her zaman yukarıda kalması için
              />
            </Grid>
             {/* Date */}
             <Grid item xs={12} sm={6}>
               <TextField
                required // Tarih genellikle zorunludur
                fullWidth
                id="date"
                label="Date"
                name="date"
                type="date" // HTML5 date input
                value={formData.date} // YYYY-MM-DD formatında
                onChange={handleChange}
                error={!!errors.date}
                helperText={errors.date}
                InputLabelProps={{ shrink: true }} // Tarih seçici için önemli
               />
            </Grid>
            {/* Customer Name */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="customerName"
                label="Customer Name"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                error={!!errors.customerName}
                helperText={errors.customerName}
                autoFocus={isEditing} // Düzenlemede burası odaklansın
              />
            </Grid>
            {/* Room Number */}
            <Grid item xs={12} sm={6}>
              <TextField
                 fullWidth id="roomNumber" label="Room Number" name="roomNumber"
                 value={formData.roomNumber} onChange={handleChange}
              />
            </Grid>
            {/* Amount */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="amount"
                label="Amount"
                name="amount"
                type="number" // Sayısal giriş
                value={formData.amount}
                onChange={handleChange}
                error={!!errors.amount}
                helperText={errors.amount}
                InputProps={{ startAdornment: <Box component="span" sx={{ mr: 1 }}>₺</Box> }}
              />
            </Grid>
          </Grid>
           {/* Form submit butonu DialogActions içinde */}
        </Box>
      </DialogContent>
      {/* Dialog Butonları */}
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {/* Submit butonu */}
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {isEditing ? 'Save Changes' : 'Add Income'} {/* Buton yazısı değişir */}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewIncomeModal;