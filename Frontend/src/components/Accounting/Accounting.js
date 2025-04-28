import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  TextField,
  InputAdornment
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AddIcon from '@mui/icons-material/Add';
import { MoreVert as MoreVertIcon, Search as SearchIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';

// Kullanılan Bileşenler ve Servisler
import AccountingSummary from './AccountingSummary'; //
import NewIncomeModal from './NewIncomeModal'; // Hem ekleme hem düzenleme için
import NewExpenseModal from './NewExpenseModal'; // Hem ekleme hem düzenleme için
// Servis fonksiyonları
import {
  getAccountingSummary,
  getIncomes, // Sayfalama destekleyen fonksiyon
  getExpenses, // Sayfalama destekleyen fonksiyon
  addIncome,
  addExpense,
  deleteIncome, // Silme fonksiyonu
  deleteExpense, // Silme fonksiyonu
  updateIncome, // Güncelleme fonksiyonu
  updateExpense // Güncelleme fonksiyonu
} from '../../services/accountingService'; //

// Gösterilecek kayıt sayısı
const PAGE_SIZE = 100; // <<< 100 olarak güncellendi

const Accounting = () => { //
  // --- State Tanımlamaları ---
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null); // Menüsü açılan satırın ID'si

  // Veri State'leri
  const [incomes, setIncomes] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [summaryData, setSummaryData] = useState({
      dailyIncome: 0,
      dailyExpense: 0,
      weeklyIncome: 0,
      weeklyExpense: 0,
  });

  // Düzenlenen Kayıt State'i
  const [editingRecord, setEditingRecord] = useState(null); // null ise ekleme, dolu ise düzenleme

  // Modal State'leri
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Ekleme/Güncelleme/Silme işlemleri için

  // Filtre State'leri Eklendi
  const [incomeFilter, setIncomeFilter] = useState('');
  const [expenseFilter, setExpenseFilter] = useState('');

  // --- Veri Çekme Fonksiyonları ---
  const fetchIncomesData = () => {
    getIncomes(1, PAGE_SIZE) // Sayfa 1, Boyut 30
      .then(response => {
        const fetchedIncomes = response?.data || [];
        const sortedIncomes = fetchedIncomes.sort((a, b) => b.id - a.id); // ID'ye göre sırala
        setIncomes(sortedIncomes);
      })
      .catch(error => {
         console.error("Error fetching incomes:", error);
         toast.error("Gelirler getirilirken hata oluştu.");
         setIncomes([]);
      });
  };

  const fetchExpensesData = () => {
     getExpenses(1, PAGE_SIZE) // Sayfa 1, Boyut 30
      .then(response => {
        const fetchedExpenses = response?.data || [];
        const sortedExpenses = fetchedExpenses.sort((a, b) => b.id - a.id); // ID'ye göre sırala
        setExpensesData(sortedExpenses);
      })
      .catch(error => {
         console.error("Error fetching expenses:", error);
         toast.error("Giderler getirilirken hata oluştu.");
         setExpensesData([]);
      });
  }

   const fetchSummaryData = () => {
        getAccountingSummary() //
          .then(data => { setSummaryData(data || { dailyIncome: 0, dailyExpense: 0, weeklyIncome: 0, weeklyExpense: 0 }); })
          .catch(error => {
              console.error("Error fetching accounting summary:", error);
              toast.error("Özet verileri getirilirken hata oluştu.");
              setSummaryData({ dailyIncome: 0, dailyExpense: 0, weeklyIncome: 0, weeklyExpense: 0 });
           });
   }

  // --- useEffect (İlk Yükleme) ---
  useEffect(() => {
    fetchSummaryData();
    fetchIncomesData(); // İlk 30 geliri çek
    fetchExpensesData(); // İlk 30 gideri çek
  }, []);

  // --- Modal Açma/Kapatma ---
  const handleOpenIncomeModal = () => {
      setEditingRecord(null); // Yeni ekleme modunda aç
      setIsIncomeModalOpen(true);
  };
  const handleCloseIncomeModal = () => {
      if (!isSubmitting) {
          setIsIncomeModalOpen(false);
          setEditingRecord(null); // Kapatırken düzenleme modunu temizle
      }
  };
   const handleOpenExpenseModal = () => {
       setEditingRecord(null); // Yeni ekleme modunda aç
       setIsExpenseModalOpen(true);
   };
  const handleCloseExpenseModal = () => {
       if (!isSubmitting) {
           setIsExpenseModalOpen(false);
           setEditingRecord(null); // Kapatırken düzenleme modunu temizle
       }
  };

  // --- Submit Handler'ları (Ekleme/Güncelleme) ---
  const handleSubmitIncome = async (formData) => {
    setIsSubmitting(true);
    const isEditing = Boolean(editingRecord);
    const actionVerb = isEditing ? 'updating' : 'adding';
    const recordId = isEditing ? editingRecord.id : null;
    const recordNumber = isEditing ? editingRecord.incomeNumber : formData.incomeNumber; // Mesaj için

    try {
      let result;
      if (isEditing) {
        result = await updateIncome(recordId, formData); // Güncelleme servisi
        toast.success(`Income #${recordNumber} updated successfully!`);
      } else {
        result = await addIncome(formData); // Ekleme servisi
        toast.success(`Income ${result.incomeNumber ? '#' + result.incomeNumber : ''} added successfully!`);
      }
      handleCloseIncomeModal(); // Modalı kapat
      fetchIncomesData();   // Listeyi yenile
      fetchSummaryData();  // Özeti yenile
    } catch (error) {
       console.error(`Error ${actionVerb} income:`, error);
       const errorMessage = error.response?.data?.errors?.[0] || error.response?.data?.message || error.message || `Error ${actionVerb} income.`;
       toast.error(errorMessage);
       // Hata durumunda modal açık kalabilir
    } finally {
       setIsSubmitting(false);
    }
  };

   const handleSubmitExpense = async (formData) => {
    setIsSubmitting(true);
    const isEditing = Boolean(editingRecord);
    const actionVerb = isEditing ? 'updating' : 'adding';
    const recordId = isEditing ? editingRecord.id : null;
    const recordNumber = isEditing ? editingRecord.expenseNumber : formData.expenseNumber; // Mesaj için

    try {
      let result;
      if (isEditing) {
        result = await updateExpense(recordId, formData); // Güncelleme servisi
        toast.success(`Expense #${recordNumber} updated successfully!`);
      } else {
        result = await addExpense(formData); // Ekleme servisi
        toast.success(`Expense ${result.expenseNumber ? '#' + result.expenseNumber : ''} added successfully!`);
      }
      handleCloseExpenseModal(); // Modalı kapat
      fetchExpensesData(); // Gider listesini yenile
      fetchSummaryData(); // Özeti yenile
    } catch (error) {
       console.error(`Error ${actionVerb} expense:`, error);
       const errorMessage = error.response?.data?.errors?.[0] || error.response?.data?.message || error.message || `Error ${actionVerb} expense.`;
       toast.error(errorMessage);
    } finally {
       setIsSubmitting(false);
    }
  };

  // --- Menü Handler Fonksiyonları ---
  const handleMenuClick = (event, rowId) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowId(rowId); // ID'yi state'e kaydet
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowId(null);
  };

  // Edit butonu tıklandığında
  const handleEditClick = () => {
    if (!selectedRowId) return;
    handleMenuClose(); // Menüyü hemen kapat

    let recordToEdit = null;
    if (activeTab === 0) { // Gelirler sekmesi
        recordToEdit = incomes.find(inc => inc.id === selectedRowId);
        if (recordToEdit) {
            setEditingRecord(recordToEdit);
            setIsIncomeModalOpen(true); // Gelir modalını aç (düzenleme modu için)
        }
    } else { // Giderler sekmesi
        recordToEdit = expensesData.find(exp => exp.id === selectedRowId);
        if (recordToEdit) {
            setEditingRecord(recordToEdit);
            setIsExpenseModalOpen(true); // Gider modalını aç (düzenleme modu için)
        }
    }

    if (!recordToEdit) {
        toast.error("Could not find the record to edit.");
        setSelectedRowId(null); // ID'yi temizle
    }
  };

  // Delete butonu tıklandığında
  const handleDeleteClick = async () => {
    if (!selectedRowId) return;

    const itemType = activeTab === 0 ? 'income' : 'expense';
    const itemName = `ID #${selectedRowId}`;
    const currentSelectedId = selectedRowId; // ID'yi kapatmadan önce sakla
    handleMenuClose(); // Menüyü hemen kapat

    if (window.confirm(`Are you sure you want to delete this ${itemType} (${itemName})? This action cannot be undone.`)) {
      setIsSubmitting(true);
      try {
        if (itemType === 'income') {
          await deleteIncome(currentSelectedId);
          toast.success(`Income ${itemName} deleted successfully!`);
          fetchIncomesData(); // Gelir listesini yenile
        } else {
          await deleteExpense(currentSelectedId);
          toast.success(`Expense ${itemName} deleted successfully!`);
          fetchExpensesData(); // Gider listesini yenile
        }
        fetchSummaryData(); // Özeti her durumda yenile
      } catch (error) {
        console.error(`Failed to delete ${itemType} with ID ${currentSelectedId}:`, error);
        const errorMessage = error.response?.data?.message || `Failed to delete ${itemName}.`;
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    }
    // Onay verilse de verilmese de ID'yi temizle (menü kapandı)
    // handleMenuClose içinde zaten yapılıyor.
  };
   // <<< EKSİK FONKSİYON GERİ EKLENDİ ---
   const handleTabChange = (event, newValue) => {
    setActiveTab(newValue); // Aktif sekme state'ini günceller
  };

  // --- Filtre Handler Fonksiyonları Eklendi ---
  const handleIncomeFilterChange = (event) => {
    setIncomeFilter(event.target.value);
  };

  const handleExpenseFilterChange = (event) => {
    setExpenseFilter(event.target.value);
  };

  // --- Yardımcı Fonksiyonlar ---
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch (e) { return dateString; }
  };

  const formatAmount = (amount) => {
    const numericAmount = Number(amount);
    if (amount === null || amount === undefined || isNaN(numericAmount)) {
        return (0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
    }
    return numericAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
  };

  // --- Filtrelenmiş Veriyi Hesapla ---
  const filteredIncomes = incomes.filter(income => {
    const searchTerm = incomeFilter.toLowerCase();
    return (
      (income.incomeNumber?.toLowerCase() || '').includes(searchTerm) ||
      (income.customerName?.toLowerCase() || '').includes(searchTerm) ||
      (income.roomNumber?.toLowerCase() || '').includes(searchTerm) ||
      (formatDate(income.date)?.toLowerCase() || '').includes(searchTerm) || // Tarihe göre de filtrele
      (String(income.amount) || '').includes(searchTerm) // Tutara göre de filtrele
    );
  });

  const filteredExpenses = expensesData.filter(expense => {
    const searchTerm = expenseFilter.toLowerCase();
    return (
      (expense.expenseNumber?.toLowerCase() || '').includes(searchTerm) ||
      (expense.category?.toLowerCase() || '').includes(searchTerm) ||
      (expense.description?.toLowerCase() || '').includes(searchTerm) ||
      (formatDate(expense.date)?.toLowerCase() || '').includes(searchTerm) || // Tarihe göre de filtrele
      (String(expense.amount) || '').includes(searchTerm) // Tutara göre de filtrele
    );
  });

  // --- Render ---
  return (
    <Box>
      {/* Başlık ve Genel Butonlar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Accounting</Typography>
        <Box>
          <Button variant="contained" startIcon={<AddIcon />} color="success" sx={{ mr: 1 }} onClick={handleOpenIncomeModal} disabled={isSubmitting}>New Income</Button>
          <Button variant="contained" startIcon={<AddIcon />} color="error" onClick={handleOpenExpenseModal} disabled={isSubmitting}>New Expense</Button>
        </Box>
      </Box>

      {/* Özet Kartları */}
      <AccountingSummary financialSummary={summaryData} />

      {/* Sekmeler */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth" indicatorColor="primary" textColor="primary">
          <Tab icon={<ReceiptIcon />} iconPosition="start" label={`Incomes (${filteredIncomes.length})`} />
          <Tab icon={<AttachMoneyIcon />} iconPosition="start" label={`Expenses (${filteredExpenses.length})`} />
        </Tabs>
      </Paper>

      {/* Gelirler Tablosu */}
      {activeTab === 0 && (
        <Paper sx={{ mb: 2 }}>
          <TableContainer>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Last Incomes</Typography>
              <TextField
                size="small"
                variant="outlined"
                placeholder="Search Incomes..."
                value={incomeFilter}
                onChange={handleIncomeFilterChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: '300px' }}
              />
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
                  <TableCell align="center">Other</TableCell>{/* Başlık Değişti */}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredIncomes.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center">{incomeFilter ? 'No matching income found.' : 'No income records found.'}</TableCell></TableRow>
                ) : (
                  filteredIncomes.map((income) => (
                    <TableRow key={income.id} hover>
                      <TableCell>{income.incomeNumber}</TableCell>
                      <TableCell>{formatDate(income.date)}</TableCell>
                      <TableCell>{income.customerName}</TableCell>
                      <TableCell>{income.roomNumber}</TableCell>
                      <TableCell align="right">{formatAmount(income.amount)}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={(e) => handleMenuClick(e, income.id)}>
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

       {/* Giderler Tablosu */}
      {activeTab === 1 && (
        <Paper sx={{ mb: 2 }}>
          <TableContainer>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Last Expenses</Typography>
              <TextField
                size="small"
                variant="outlined"
                placeholder="Search Expenses..."
                value={expenseFilter}
                onChange={handleExpenseFilterChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: '300px' }}
              />
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
                  <TableCell align="center">Other</TableCell>{/* Başlık Değişti */}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                   <TableRow><TableCell colSpan={6} align="center">{expenseFilter ? 'No matching expense found.' : 'No expense records found.'}</TableCell></TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} hover>
                      <TableCell>{expense.expenseNumber}</TableCell>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell align="right">{formatAmount(expense.amount)}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={(e) => handleMenuClick(e, expense.id)}>
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Satır İşlem Menüsü */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        MenuListProps={{
            'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem onClick={handleEditClick}>Edit</MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>Delete</MenuItem>
      </Menu>

      {/* Modallar */}
      <NewIncomeModal
        open={isIncomeModalOpen}
        onClose={handleCloseIncomeModal}
        onSubmit={handleSubmitIncome}
        initialData={editingRecord}
      />
      <NewExpenseModal
        open={isExpenseModalOpen}
        onClose={handleCloseExpenseModal}
        onSubmit={handleSubmitExpense}
        initialData={editingRecord}
      />

    </Box>
  );
};

export default Accounting; //