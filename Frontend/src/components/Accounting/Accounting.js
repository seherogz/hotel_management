import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Button,
  IconButton,
  Card,
  CardContent,
  Divider,
  useTheme,
  TextField,
  InputAdornment,
  Menu,
  MenuItem
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import { 
  Search as SearchIcon, 
  MoreVert as MoreVertIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import AccountingSummary from './AccountingSummary';

// Örnek fatura verileri
const invoiceData = [
  { id: 'INV001', date: '24.03.2025', customer: 'Ali Kaya', roomNumber: '104', amount: 3850 },
  { id: 'INV002', date: '23.03.2025', customer: 'Ayşe Yılmaz', roomNumber: '102', amount: 1750 },
  { id: 'INV003', date: '25.03.2025', customer: 'Zeynep Demir', roomNumber: '202', amount: 1900, status: 'Bekliyor' },
  { id: 'INV004', date: '22.03.2025', customer: 'Mustafa Aydın', roomNumber: '204', amount: 1600 },
  { id: 'INV005', date: '21.03.2025', customer: 'Esra Şahin', roomNumber: '301', amount: 1500, status: 'İptal Edildi' },
  { id: 'INV006', date: '20.03.2025', customer: 'Murat Özkan', roomNumber: '304', amount: 1260 },
  { id: 'INV007', date: '19.03.2025', customer: 'Deniz Akın', roomNumber: '305', amount: 3900, status: 'Bekliyor' },
];

// Örnek gelir-gider verileri
const financialSummary = {
  dailyIncome: 12500,
  dailyExpense: 4200,
  weeklyIncome: 78500,
  weeklyExpense: 29800,
  monthlyIncome: 320000,
  monthlyExpense: 115000,
  pendingPayments: 5400
};

// Örnek harcamalar
const expenses = [
  { id: 'EXP001', date: '24.03.2025', category: 'Personel', description: 'Haftalık maaş ödemeleri', amount: 15000 },
  { id: 'EXP002', date: '23.03.2025', category: 'Mutfak', description: 'Gıda tedariği', amount: 8500 },
  { id: 'EXP003', date: '22.03.2025', category: 'Bakım', description: 'Klima bakımı', amount: 2500 },
  { id: 'EXP004', date: '21.03.2025', category: 'Temizlik', description: 'Temizlik malzemeleri', amount: 1800 },
  { id: 'EXP005', date: '20.03.2025', category: 'Elektrik', description: 'Aylık fatura', amount: 7500 },
];

const Accounting = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);

  // Tab değişikliği
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Durum çipi renkleri
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'bekliyor':
        return 'warning';
      case 'iptal edildi':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Accounting
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<FilterListIcon />} 
            sx={{ mr: 1 }}
          >
            Filter
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} // Veya <ArrowUpwardIcon /> kullanabilirsiniz
            color="success" // Gelir için yeşil renk
            sx={{ mr: 1 }} // Sağ tarafa boşluk
            // onClick={handleNewIncomeClick} // Buraya gelir ekleme fonksiyonunu bağlayabilirsiniz
          >
            New Income 
          </Button>

          {/* Yeni Gider Butonu */}
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} // Veya <ArrowDownwardIcon /> kullanabilirsiniz
            color="error" // Gider için kırmızı renk
            // onClick={handleNewExpenseClick} // Buraya gider ekleme fonksiyonunu bağlayabilirsiniz
          >
            New Expense
          </Button>
        </Box>
      </Box>

      {/* Özet kartları için AccountingSummary bileşenini kullanıyoruz */}
      <AccountingSummary financialSummary={financialSummary} />

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<ReceiptIcon />} iconPosition="start" label="Incomes" />
          <Tab icon={<AttachMoneyIcon />} iconPosition="start" label="Expenses" />
        </Tabs>
      </Paper>
      
      {activeTab === 0 && (
        <TableContainer component={Paper}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Last Incomes</Typography>
          </Box>
          <Divider />
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Income No</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Room</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell align="right">Process</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoiceData.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell>{invoice.roomNumber}</TableCell>
                  <TableCell align="right">{invoice.amount.toLocaleString('tr-TR')} ₺</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={handleMenuClick}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {activeTab === 1 && (
        <TableContainer component={Paper}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Last Expenses</Typography>
          </Box>
          <Divider />
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Expense No</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell align="right">Process</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id} hover>
                  <TableCell>{expense.id}</TableCell>
                  <TableCell>{expense.date}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell align="right">{expense.amount.toLocaleString('tr-TR')} ₺</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={handleMenuClick}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Görüntüle</MenuItem>
        <MenuItem onClick={handleMenuClose}>Düzenle</MenuItem>
      </Menu>
    </Box>
  );
};

export default Accounting; 