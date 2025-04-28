import React from 'react';
import { Box, Typography } from '@mui/material';

// Sayısal değeri güvenli bir şekilde formatlayan yardımcı fonksiyon
const formatCurrency = (value) => {
  // Değerin null, undefined veya NaN olup olmadığını kontrol et
  const numericValue = Number(value); // Önce sayıya çevirmeyi dene
  if (value === null || value === undefined || isNaN(numericValue)) {
    // Geçersizse, varsayılan olarak 0'ı formatla
    return (0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
  }
  try {
    // Geçerliyse, sayıyı formatla
    return numericValue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
  } catch (error) {
    console.error("Error formatting currency:", error, "Value:", value);
    // Hata durumunda basit bir gösterim sağla
    return `${numericValue.toFixed(2)} TRY`;
  }
};


const AccountingSummary = ({ financialSummary }) => {

  // financialSummary prop'u veya içindeki değerler henüz yoksa
  // bir yükleniyor mesajı veya null döndürmek daha güvenli olabilir.
  // Ancak Accounting.js'de başlangıç değeri olduğu için devam edebiliriz.
  if (!financialSummary) {
      // Veya null döndürerek hiçbir şey göstermeyebiliriz
      return <Typography variant="caption">Özet verileri bekleniyor...</Typography>;
  }


  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        mb: 3,
        gap: 2 // Öğeler arasına boşluk
      }}
    >
      {/* Daily Income */}
      <Box
        sx={{
          flex: '1 1 23%',
          p: 3,
          minWidth: { xs: 'calc(100% - 16px)', sm: 'calc(50% - 8px)', md: 'calc(25% - 12px)' },
          bgcolor: 'background.paper',
          borderRadius: '4px',
          border: '1px solid #e0e0e0'
        }}
      >
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Daily Income
        </Typography>
        <Typography variant="h4" color="success.main" sx={{ fontWeight: 'medium', mb: 1 }}>
           {/* Güvenli formatlama fonksiyonunu kullan */}
           {formatCurrency(financialSummary.dailyIncome)} {/* */}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString('tr-TR')}
        </Typography>
      </Box>

      {/* Daily Expense */}
      <Box
        sx={{
          flex: '1 1 23%',
          p: 3,
          minWidth: { xs: 'calc(100% - 16px)', sm: 'calc(50% - 8px)', md: 'calc(25% - 12px)' },
          bgcolor: 'background.paper',
          borderRadius: '4px',
          border: '1px solid #e0e0e0'
        }}
      >
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Daily Expense
        </Typography>
        <Typography variant="h4" color="error.main" sx={{ fontWeight: 'medium', mb: 1 }}>
           {/* Güvenli formatlama fonksiyonunu kullan */}
           {formatCurrency(financialSummary.dailyExpense)} {/* */}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString('tr-TR')}
        </Typography>
      </Box>

      {/* Weekly Income */}
      <Box
        sx={{
          flex: '1 1 23%',
          p: 3,
          minWidth: { xs: 'calc(100% - 16px)', sm: 'calc(50% - 8px)', md: 'calc(25% - 12px)' },
          bgcolor: 'background.paper',
          borderRadius: '4px',
          border: '1px solid #e0e0e0'
        }}
      >
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Weekly Income
        </Typography>
        <Typography variant="h4" color="success.main" sx={{ fontWeight: 'medium', mb: 1 }}>
           {/* Güvenli formatlama fonksiyonunu kullan */}
           {formatCurrency(financialSummary.weeklyIncome)} {/* */}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last 7 days
        </Typography>
      </Box>

      {/* Weekly Expense (Dikkat: Kodunuzda burada pendingPayments kullanılmıştı, weeklyExpense olmalı) */}
      <Box
        sx={{
          flex: '1 1 23%',
          p: 3,
          minWidth: { xs: 'calc(100% - 16px)', sm: 'calc(50% - 8px)', md: 'calc(25% - 12px)' },
          bgcolor: 'background.paper',
          borderRadius: '4px',
          border: '1px solid #e0e0e0'
        }}
      >
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
           {/* Başlık düzeltildi */}
          Weekly Expense
        </Typography>
        <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'medium', mb: 1 }}>
           {/* Güvenli formatlama ve doğru alan kullanıldı */}
           {formatCurrency(financialSummary.weeklyExpense)} {/* */}
           {/* {formatCurrency(financialSummary.pendingPayments)} // Önceki kodunuzda bu vardı, API'de weeklyExpense var */}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last 7 days
        </Typography>
      </Box>
    </Box>
  );
};

export default AccountingSummary;