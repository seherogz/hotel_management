import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, Box
} from '@mui/material';
// Opsiyonel: DatePicker kullanmak isterseniz ilgili importları açın

// Başlangıç state'i (yeni ekleme için)
const initialState = {
  expenseNumber: '', // Kullanıcıdan alınıyor
  date: new Date().toISOString().substring(0, 10), // yyyy-MM-dd formatında başla
  category: '',
  description: '',
  amount: ''
};

// initialData prop'u eklendi (varsayılanı null)
const NewExpenseModal = ({ open, onClose, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const isEditing = Boolean(initialData); // initialData varsa düzenleme modundayız

  // Modal açıldığında veya initialData değiştiğinde formu ayarla
  useEffect(() => {
    if (open) {
      if (isEditing) {
        // Düzenleme modu: initialData ile formu doldur
        setFormData({
          expenseNumber: initialData.expenseNumber || '', // expenseNumber düzenlenemez varsaydık
          date: initialData.date ? new Date(initialData.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
          category: initialData.category || '',
          description: initialData.description || '',
          amount: initialData.amount !== undefined ? initialData.amount : ''
        });
      } else {
        // Ekleme modu: Formu sıfırla
        setFormData({
            ...initialState,
            date: new Date().toISOString().substring(0, 10)
          });
      }
      setErrors({}); // Hataları temizle
    }
  }, [open, initialData, isEditing]);

  // Input değişikliklerini handle etme
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Basit form validasyonu
  const validateForm = () => {
      let tempErrors = {};
      // Expense Number sadece yeni eklerken zorunlu
      if (!isEditing && !formData.expenseNumber) {
          tempErrors.expenseNumber = "Expense number is required.";
      }
      // Kategori her zaman zorunlu
      if (!formData.category) {
           tempErrors.category = "Category is required.";
      }
      // Tutar her zaman zorunlu ve pozitif sayı olmalı
      if (formData.amount === '' || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
          tempErrors.amount = "Amount must be a positive number.";
      }
       // Tarih kontrolü
       if (!formData.date) {
          tempErrors.date = "Date is required.";
      }
      // Description zorunlu olmayabilir
      setErrors(tempErrors);
      return Object.keys(tempErrors).length === 0;
  }

  // Formu gönderme
  const handleSubmit = (event) => {
    event.preventDefault();
     if (!validateForm()) return;

     // Tarihi ISO string'e çevir
     const dateToSend = formData.date ? new Date(formData.date).toISOString() : null;

    // onSubmit prop'u ile veriyi parent bileşene gönder
    onSubmit({
      ...formData, // expenseNumber, category, description içerir
      date: dateToSend,
      amount: Number(formData.amount)
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {/* Dialog başlığı ve buton yazısı isEditing durumuna göre değişir */}
      <DialogTitle>{isEditing ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
      <DialogContent>
        {/* Form elemanları */}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            {/* Expense Number (Düzenlemede pasif) */}
            <Grid item xs={12} sm={6}>
              <TextField
                required={!isEditing}
                fullWidth
                id="expenseNumber"
                label="Expense Number"
                name="expenseNumber"
                value={formData.expenseNumber}
                onChange={handleChange}
                error={!!errors.expenseNumber}
                helperText={errors.expenseNumber}
                autoFocus={!isEditing}
                disabled={isEditing} // Düzenlemede değiştirilemez
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
             {/* Date */}
             <Grid item xs={12} sm={6}>
               <TextField
                required
                fullWidth
                id="date"
                label="Date"
                name="date"
                type="date" // HTML5 date input
                value={formData.date} // yyyy-MM-dd formatında
                onChange={handleChange}
                error={!!errors.date}
                helperText={errors.date}
                InputLabelProps={{ shrink: true }}
               />
            </Grid>
            {/* Category */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="category"
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                error={!!errors.category}
                helperText={errors.category}
                autoFocus={isEditing} // Düzenlemede burası odaklansın
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
                type="number"
                value={formData.amount}
                onChange={handleChange}
                error={!!errors.amount}
                helperText={errors.amount}
                InputProps={{ startAdornment: <Box component="span" sx={{ mr: 1 }}>₺</Box> }}
              />
            </Grid>
            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                label="Description"
                name="description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleChange}
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
          {isEditing ? 'Save Changes' : 'Add Expense'} {/* Buton yazısı değişir */}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewExpenseModal;