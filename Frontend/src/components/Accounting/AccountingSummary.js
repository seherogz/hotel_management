import React from 'react';
import { Box, Typography } from '@mui/material';

const AccountingSummary = ({ financialSummary }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        mb: 3, 
        // border: '1px solid #e0e0e0',  // Kenarlığı kaldırabiliriz, gap yeterli ayrımı sağlar
        // borderRadius: '4px', 
        // overflow: 'hidden',         // Overflow'a da gerek kalmayabilir
        gap: 2 // <<< Öğeler arasına boşluk ekler (MUI spacing unit, genelde 16px)
        // bgcolor: 'background.paper' // İsteğe bağlı, arka plan rengi kalabilir
      }}
    >
      {/* Kutuları ayrı Paper bileşenleri olarak yapmak daha yaygındır */}
      {/* Ama mevcut yapıyı koruyarak devam edelim */}

      <Box 
        sx={{ 
          flex: '1 1 23%', // Gap eklediğimiz için flex-basis'i biraz azaltabiliriz (%25 yerine)
          p: 3, 
          // borderRight: '1px solid #e0e0e0', // <<< Kaldırıldı
          minWidth: { xs: 'calc(100% - 16px)', sm: 'calc(50% - 8px)', md: 'calc(25% - 12px)' }, // Gap'i hesaba katmak için minWidth ayarı
          bgcolor: 'background.paper', // Arka planı her kutuya ayrı ayrı verelim
          borderRadius: '4px', // Köşe yuvarlamayı her kutuya ayrı ayrı verelim
          border: '1px solid #e0e0e0' // Kenarlığı her kutuya ayrı ayrı verelim (opsiyonel)
        }}
      >
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Daily Income
        </Typography>
        <Typography variant="h4" color="success.main" sx={{ fontWeight: 'medium', mb: 1 }}>
          {financialSummary.dailyIncome.toLocaleString('tr-TR')} ₺
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString('tr-TR')}
        </Typography>
      </Box>

      <Box 
        sx={{ 
          flex: '1 1 23%', 
          p: 3, 
          // borderRight: '1px solid #e0e0e0', // <<< Kaldırıldı
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
          {financialSummary.dailyExpense.toLocaleString('tr-TR')} ₺
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString('tr-TR')}
        </Typography>
      </Box>

      <Box 
        sx={{ 
          flex: '1 1 23%', 
          p: 3, 
          // borderRight: '1px solid #e0e0e0', // <<< Kaldırıldı
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
          {financialSummary.weeklyIncome.toLocaleString('tr-TR')} ₺
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last 7 days
        </Typography>
      </Box>

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
          Weekly Expense
        </Typography>
        <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'medium', mb: 1 }}>
          {financialSummary.pendingPayments.toLocaleString('tr-TR')} ₺
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last 7 days
        </Typography>
      </Box>
    </Box>
  );
};

export default AccountingSummary;