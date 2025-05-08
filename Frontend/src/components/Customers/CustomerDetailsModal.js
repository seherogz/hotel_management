// src/components/Customers/CustomerDetailsModal.js

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  CircularProgress,
  Box,
  IconButton,
  Tabs,
  Tab,
  Grid, // Grid hala kullanılıyor
  Paper,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  TablePagination,
  Stack, // Stack kullanıldı (Personal Info iç düzeni için)
  Button, // Button eklendi
  TextField // TextField eklendi
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Flag as FlagIcon,
  CreditCard as CreditCardIcon,
  Note as NoteIcon,
  Cake as CakeIcon,
  Edit as EditIcon, // EditIcon eklendi
  Save as SaveIcon, // SaveIcon eklendi
} from '@mui/icons-material';
import { format } from 'date-fns'; // date-fns import edildiğinden emin olun
import customerService from '../../services/customerService';
import { useTheme } from '@mui/material/styles'; // Temayı kullanmak için

// TabPanel component (Aynı)
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}> {/* Sekme içeriği için üst padding */}
          {children}
        </Box>
      )}
    </div>
  );
}

// Reservation Status Chip (Aynı)
const getReservationStatusChip = (status) => {
  let color = 'default';
  switch (status?.toLowerCase()) {
    case 'completed': color = 'success'; break;
    case 'pending': color = 'warning'; break;
    case 'cancelled': color = 'error'; break;
    case 'checked-in': color = 'info'; break;
    default: color = 'default';
  }
  return { label: status || 'Unknown', color };
};

// Date Formatting functions (Aynı)
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try { return format(new Date(dateString), 'MMM dd, yy HH:mm'); } // yy eklendi
  catch (error) { console.error('Date formatting error:', error); return dateString; }
};
const formatDateOnly = (dateString) => {
  if (!dateString) return 'N/A';
  try { return format(new Date(dateString), 'MMM dd, yyyy'); } // yy yerine yyyy
  catch (error) { console.error('Date formatting error:', error); return dateString; }
};
const formatBirthDate = (dateString) => {
  if (!dateString) return 'N/A';
  try { return format(new Date(dateString), 'dd MMMM yyyy'); } // yyyy eklendi
  catch (error) { console.error('Date formatting error:', error); return dateString; }
};

// Müşteri bilgilerini görüntülemek için yardımcı fonksiyonlar
const formatName = (fullName) => {
  if (!fullName) return { firstName: 'N/A', lastName: 'N/A' };
  const parts = fullName.split(' ');
  return {
    firstName: parts[0] || 'N/A',
    lastName: parts.slice(1).join(' ') || 'N/A'
  };
};

const CustomerDetailsModal = ({ open, onClose, customerId }) => {
  const theme = useTheme();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0); // Rezervasyonlar için sayfalama state'i
  const [rowsPerPage, setRowsPerPage] = useState(5); // Rezervasyonlar için sayfa başına satır
  const [isEditing, setIsEditing] = useState(false); // Düzenleme modu state'i
  const [editedCustomer, setEditedCustomer] = useState(null); // Düzenleme için kullanılacak kopya

  // handleTabChange, handleChangePage, handleChangeRowsPerPage (Aynı)
  const handleTabChange = (event, newValue) => { setActiveTab(newValue); };
  const handleChangePage = (event, newPage) => { setPage(newPage); };
  const handleChangeRowsPerPage = (event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };

  // Edit butonu için fonksiyon
  const handleEditClick = () => {
    setEditedCustomer({...customer}); // Değişiklikleri saklayacak kopyayı oluştur
    setIsEditing(true);
  };
  
  // Düzenlemeyi iptal etmek için fonksiyon
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedCustomer({...customer}); // Orjinal verilere geri dön
  };
  
  // Form alanlarındaki değişiklikleri izlemek için
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditedCustomer(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Düzenlemeyi kaydetmek için fonksiyon
  const handleSaveEdit = async () => {
    try {
      // API'ye gönderilecek verileri hazırla
      let updatedCustomer = {...editedCustomer};
      
      // firstName ve lastName özel olarak güncellenmeli
      // Boş firstName/lastName alanlıdır yerine fullName'den alınan değerleri kullan
      if (!updatedCustomer.firstName && updatedCustomer.fullName) {
        const nameParts = formatName(updatedCustomer.fullName);
        updatedCustomer.firstName = nameParts.firstName;
      }
      
      if (!updatedCustomer.lastName && updatedCustomer.fullName) {
        const nameParts = formatName(updatedCustomer.fullName);
        updatedCustomer.lastName = nameParts.lastName;
      }
      
      // Alternatif olarak, düzenlenmemiş alanlar için orijinal müşteri verilerini kullan
      updatedCustomer.firstName = updatedCustomer.firstName || customer.firstName || formatName(customer.fullName).firstName;
      updatedCustomer.lastName = updatedCustomer.lastName || customer.lastName || formatName(customer.fullName).lastName;
      
      // API'ye gönderilecek verileri son formata getir
      const customerData = {
        id: customer.id,
        firstName: updatedCustomer.firstName,
        lastName: updatedCustomer.lastName,
        email: updatedCustomer.email || customer.email,
        phone: updatedCustomer.phone || customer.phone,
        address: updatedCustomer.address || customer.address,
        status: updatedCustomer.status || customer.status,
        nationality: updatedCustomer.nationality || customer.nationality,
        idNumber: updatedCustomer.idNumber || customer.idNumber,
        notes: updatedCustomer.notes || customer.notes,
        birthDate: null
      };
      
      // birthDate formatını düzelt - saati 12:00 (öğlen) olarak ayarla
      if (updatedCustomer.birthDate) {
        // Sadece tarih kısmını al ve saati 12:00 (öğlen) olarak ayarla
        // Böylece zaman dilimi farkı olsa bile gün değişimi olmaz
        const dateOnly = new Date(updatedCustomer.birthDate);
        dateOnly.setHours(12, 0, 0, 0); // Saati 12:00 olarak ayarla (00:00 yerine)
        customerData.birthDate = dateOnly.toISOString();
      } else if (customer.birthDate) {
        // Eğer düzenleme yapılmadıysa orijinal tarihi kullan
        customerData.birthDate = customer.birthDate;
      }
      
      // API call to update the customer
      await customerService.updateCustomer(customer.id, customerData);
      
      // Başarılı güncellemeden sonra müşteri verisini güncellenmiş verilerle değiştir
      setCustomer({
        ...customer,
        ...customerData,
        fullName: `${customerData.firstName} ${customerData.lastName}`
      });
      
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating customer:', err);
      setError(err.message || 'Failed to update customer details');
    }
  };

  // useEffect
  useEffect(() => {
      const fetchCustomerDetails = async () => {
          if (!open || !customerId) { setCustomer(null); return; }
          setLoading(true); setError(null);
          try {
              const data = await customerService.getCustomerById(customerId);
              setCustomer(data);
              setEditedCustomer(data); // Düzenleme için kullanılacak kopyayı oluştur
          } catch (err) {
              console.error('Error fetching customer details:', err);
              setError(err.message || 'Failed to load customer details');
          } finally { setLoading(false); }
      };
      fetchCustomerDetails();
  }, [open, customerId]);

  // Müşteri Status Chip (VIP rengi düzeltildi)
  const getStatusChipProps = (status) => {
    switch (status?.toLowerCase()) {
      case 'vip': return { label: 'VIP', color: 'success' }; // Yeşil
      case 'standard': return { label: 'Standard', color: 'primary' }; // Mavi
      default: return { label: status || 'Unknown', color: 'default' };
    }
  };

  // Paginated Reservations (Aynı)
  const paginatedReservations = customer?.reservations
    ? customer.reservations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : [];

  // Avatar initials helper (Aynı)
   const getAvatarLetters = (fullName) => {
    if (!fullName) return "?";
    const names = fullName.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md" // <-- GENİŞLİK "md" OLARAK KORUNDU
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, height: '90vh', maxHeight: 'calc(100% - 64px)' } }} // Max yükseklik eklendi
    >
      <DialogTitle sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        bgcolor: '#3f2b7b', color: 'white', px: 3, py: 1.5
      }}>
        <Typography variant="h6" component="div">
          Customer Details
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {!isEditing ? (
            <IconButton 
              color="inherit" 
              onClick={handleEditClick} 
              aria-label="edit"
              sx={{ mr: 1 }}
            >
              <EditIcon />
            </IconButton>
          ) : (
            <IconButton 
              color="inherit" 
              onClick={handleSaveEdit} 
              aria-label="save"
              sx={{ mr: 1 }}
            >
              <SaveIcon />
            </IconButton>
          )}
          <IconButton edge="end" color="inherit" onClick={isEditing ? handleCancelEdit : onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: theme.palette.grey[50] }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress sx={{ color: '#3f2b7b' }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}> {error} </Alert>
        ) : customer ? (
          <Box>
            {/* Customer Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ width: 60, height: 60, bgcolor: '#3f2b7b', fontSize: '1.5rem', mr: 2 }}>
                {getAvatarLetters(customer.fullName)}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {customer.fullName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                   {customer.status && <Chip {...getStatusChipProps(customer.status)} size="small" sx={{ mr: 1 }} /> }
                  <Typography variant="body2" color="text.secondary">
                    Customer ID: {customer.id}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Tabs Navigation */}
             <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
                 <Tabs
                    value={activeTab} onChange={handleTabChange} textColor="primary"
                     sx={{
                       '& .MuiTab-root': { minWidth: 100, textTransform: 'none', fontSize: '0.9rem' },
                       '& .Mui-selected': { color: '#3f2b7b', fontWeight: 'bold' },
                       '& .MuiTabs-indicator': { backgroundColor: '#3f2b7b' }
                    }}
                 >
                     <Tab label="Personal Info" id="customer-tab-0" aria-controls="customer-tabpanel-0" />
                     <Tab label={`Reservations (${customer.reservations?.length || 0})`} id="customer-tab-1" aria-controls="customer-tabpanel-1" />
                 </Tabs>
             </Box>

            {/* ====== Personal Info Tab ====== */}
            <TabPanel value={activeTab} index={0}>
              <Stack spacing={2.5}> {/* Dikey boşluklar için Stack */}

                {/* Profile Overview */}
                <Paper elevation={0} sx={{ p: 2, bgcolor: theme.palette.background.paper, borderRadius: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon color="action" sx={{ mr: 1.5 }} />
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="body2" color="text.secondary">First Name</Typography>
                          {isEditing ? (
                            <TextField
                              name="firstName"
                              size="small"
                              value={editedCustomer?.firstName || formatName(editedCustomer?.fullName).firstName || ''}
                              onChange={handleFormChange}
                              fullWidth
                              variant="outlined"
                              margin="dense"
                            />
                          ) : (
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {customer.firstName || formatName(customer.fullName).firstName}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon color="action" sx={{ mr: 1.5 }} />
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="body2" color="text.secondary">Last Name</Typography>
                          {isEditing ? (
                            <TextField
                              name="lastName"
                              size="small"
                              value={editedCustomer?.lastName || formatName(editedCustomer?.fullName).lastName || ''}
                              onChange={handleFormChange}
                              fullWidth
                              variant="outlined"
                              margin="dense"
                            />
                          ) : (
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {customer.lastName || formatName(customer.fullName).lastName}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                       <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmailIcon color="action" sx={{ mr: 1.5 }} />
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="body2" color="text.secondary">Email</Typography>
                          {isEditing ? (
                            <TextField
                              name="email"
                              type="email"
                              size="small"
                              value={editedCustomer?.email || ''}
                              onChange={handleFormChange}
                              fullWidth
                              variant="outlined"
                              margin="dense"
                            />
                          ) : (
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{customer.email || 'N/A'}</Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon color="action" sx={{ mr: 1.5 }} />
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="body2" color="text.secondary">Phone</Typography>
                          {isEditing ? (
                            <TextField
                              name="phone"
                              type="tel"
                              size="small"
                              value={editedCustomer?.phone || ''}
                              onChange={handleFormChange}
                              fullWidth
                              variant="outlined"
                              margin="dense"
                            />
                          ) : (
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{customer.phone || 'N/A'}</Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                {/* --- Detay Satırı (ID, Nat, Birth, Address) --- */}
                <Paper elevation={0} sx={{ p: 2, bgcolor: theme.palette.grey[100], borderRadius: 2 }}>
                  <Grid container spacing={2} alignItems="stretch">
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <CreditCardIcon color="action" sx={{ mr: 1.5 }} />
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="caption" color="text.secondary" display="block">ID Number</Typography>
                          {isEditing ? (
                            <TextField
                              name="idNumber"
                              size="small"
                              value={editedCustomer?.idNumber || ''}
                              onChange={handleFormChange}
                              fullWidth
                              variant="outlined"
                              margin="dense"
                            />
                          ) : (
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{customer.idNumber || 'N/A'}</Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                       <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <FlagIcon color="action" sx={{ mr: 1.5 }} />
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="caption" color="text.secondary" display="block">Nationality</Typography>
                          {isEditing ? (
                            <TextField
                              name="nationality"
                              size="small"
                              value={editedCustomer?.nationality || ''}
                              onChange={handleFormChange}
                              fullWidth
                              variant="outlined"
                              margin="dense"
                            />
                          ) : (
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{customer.nationality || 'N/A'}</Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                       <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <CakeIcon color="action" sx={{ mr: 1.5 }} />
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="caption" color="text.secondary" display="block">Birth Date</Typography>
                          {isEditing ? (
                            <TextField
                              name="birthDate"
                              type="date"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                              value={editedCustomer?.birthDate ? new Date(editedCustomer.birthDate).toISOString().split('T')[0] : ''}
                              onChange={handleFormChange}
                              fullWidth
                              variant="outlined"
                              margin="dense"
                            />
                          ) : (
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{formatBirthDate(customer.birthDate)}</Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                       <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <HomeIcon color="action" sx={{ mr: 1.5 }} />
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="caption" color="text.secondary" display="block">Address</Typography>
                          {isEditing ? (
                            <TextField
                              name="address"
                              size="small"
                              value={editedCustomer?.address || ''}
                              onChange={handleFormChange}
                              fullWidth
                              variant="outlined"
                              margin="dense"
                              multiline
                              minRows={2}
                            />
                          ) : (
                          <Typography variant="body2" sx={{ fontWeight: 'medium', wordBreak: 'break-word' }}>{customer.address || 'N/A'}</Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
                {/* --- Detay Satırı Bitiş --- */}

                {/* Notes Section */}
                <Paper elevation={0} sx={{ p: 2, bgcolor: theme.palette.background.paper, borderRadius: 2 }}>
                   <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <NoteIcon color="action" sx={{ mr: 1.5, mt: 0.5 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Notes</Typography>
                  </Box>
                  {isEditing ? (
                    <Box sx={{ pl: 4.5 }}>
                      <TextField
                        name="notes"
                        value={editedCustomer?.notes || ''}
                        onChange={handleFormChange}
                        fullWidth
                        variant="outlined"
                        margin="dense"
                        multiline
                        minRows={3}
                      />
                    </Box>
                  ) : (
                  <Typography variant="body2" sx={{ pl: 4.5 }}> {customer.notes || 'No notes available.'} </Typography>
                  )}
                </Paper>

                {/* Financial Summary */}
                <Paper elevation={1} sx={{ p: 2, bgcolor: '#3f2b7b', color: 'white', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}> Total Spending </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}> ${customer.totalSpending?.toFixed(2) || '0.00'} </Typography>
                  </Box>
                </Paper>
              </Stack>
            </TabPanel>
            {/* ============================================================ */}

            {/* Reservations Tab */}
            <TabPanel value={activeTab} index={1}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#3f2b7b' }}> Reservation History </Typography>
              {customer.reservations?.length > 0 ? (
                <>
                  <TableContainer component={Paper} sx={{ mt: 1, borderRadius: 2, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }} elevation={0}>
                    <Table sx={{ minWidth: 650 }} aria-label="reservations table" size="small">
                      <TableHead sx={{ bgcolor: theme.palette.grey[100] }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Room</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Check In</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Check Out</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="right">Price</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedReservations.map((reservation) => {
                          const statusChip = getReservationStatusChip(reservation.status);
                          return (
                            <TableRow hover key={reservation.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  Rm {reservation.roomNumber}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {reservation.roomType}
                                </Typography>
                              </TableCell>
                              <TableCell>{formatDateOnly(reservation.checkInDate)}</TableCell>
                              <TableCell>{formatDateOnly(reservation.checkOutDate)}</TableCell>
                              <TableCell align="right">${reservation.price?.toFixed(2)}</TableCell>
                              <TableCell><Chip {...statusChip} size="small" /></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div" count={customer.reservations.length}
                    page={page} onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage} onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                    sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 0 }}
                  />
                </>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}> This customer has no reservation history. </Alert>
              )}
            </TabPanel>
          </Box>
        ) : (
           <Alert severity="warning" sx={{ my: 2 }}> No customer data found. </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailsModal;