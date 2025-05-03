import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box,
  TextField,
  Avatar,
  Chip,
  Button,
  InputAdornment,
  TablePagination,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import customerService from '../../services/customerService';
import styles from './CustomerInfo.module.css';
import AddCustomerModal from './AddCustomerModal';
import CustomerDetailsModal from './CustomerDetailsModal';

// Helper function for customer status chips
const getStatusChipProps = (status) => {
  switch (status?.toLowerCase()) {
    case 'vip':
      return { label: 'VIP', color: 'error' }; // Red
    case 'standard':
      return { label: 'Standard', color: 'default' }; // Gray
    default:
      return { label: status || 'Unknown', color: 'default' }; // Gray
  }
};

// Function to create avatar letters from customer's full name
const getAvatarLetters = (fullName) => {
  if (!fullName) return "??";
  
  const names = fullName.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// Function to generate random color for avatar
const getAvatarColor = (name) => {
  const colors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', 
    '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
    '#009688', '#4CAF50', '#8BC34A', '#CDDC39', 
    '#FFC107', '#FF9800', '#FF5722', '#795548'
  ];
  
  if (!name) return colors[0];
  
  // Name-based deterministic color selection
  const charCode = name.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
};

const CustomerInfo = () => {
  const [customers, setCustomers] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Delete Dialog State
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    customerId: null,
    customerName: ''
  });

  // Customer Details Modal State
  const [detailsModal, setDetailsModal] = useState({
    open: false,
    customerId: null
  });

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerService.getAllCustomers(page + 1, rowsPerPage);
      setCustomers(response.data || []);
      setTotalCustomers(response.totalCount || 0);
    } catch (err) {
      setError(err.message || 'An error occurred while loading customer information.');
      console.error(err);
      setCustomers([]);
      setTotalCustomers(0);
    } finally {
      setLoading(false);
    }
  };
  const handleChangePage = (event, newPage) => {
    setPage(newPage); // Set new page (data will be fetched again with useEffect)
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Return to first page when rows per page changes (data will be fetched again with useEffect)
  };
  useEffect(() => {
    fetchCustomers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) {
      return customers;
    }
    return customers.filter(customer =>
      (customer.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.idNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.status?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.id?.toString() || '').includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleViewDetails = (customer) => {
    setDetailsModal({
      open: true,
      customerId: customer.id
    });
  };

  const handleCloseDetailsModal = () => {
    setDetailsModal({
      open: false,
      customerId: null
    });
  };

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleCustomerAdded = () => {
    fetchCustomers();
    setSnackbar({
      open: true,
      message: 'Customer added successfully',
      severity: 'success'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  const handleOpenDeleteDialog = (customerId, customerName) => {
    setDeleteDialog({
      open: true,
      customerId,
      customerName
    });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      customerId: null,
      customerName: ''
    });
  };

  const handleDeleteCustomer = async () => {
    try {
      await customerService.deleteCustomer(deleteDialog.customerId);
      
      // Başarılı silme işlemi sonrası yapılacaklar
      handleCloseDeleteDialog();
      fetchCustomers(); // Müşteri listesini yenile
      
      setSnackbar({
        open: true,
        message: 'Customer deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      
      setSnackbar({
        open: true,
        message: `Delete error: ${error.message}`,
        severity: 'error'
      });
      
      handleCloseDeleteDialog();
    }
  };

  return (
    <Paper sx={{ margin: '24px', padding: '24px', borderRadius: '8px', overflow: 'hidden' }} elevation={2}>
      {/* Title and Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', margin: 0 }}>
          Customer Information
        </Typography>
        <Button
          variant="contained"
          onClick={handleOpenModal}
          sx={{ 
            backgroundColor: '#3f2b7b', 
            color: 'white',
            '&:hover': { 
              backgroundColor: '#33235f' 
            },
            borderRadius: '8px',
            padding: '8px 16px'
          }}
        >
          ADD CUSTOMER
        </Button>
      </Box>

      {/* Search Box */}
      <Box sx={{ marginBottom: '32px' }}>
        <TextField
          placeholder="Search Customer (Name, Email, Phone, Address, ID Number)"
          variant="outlined"
          fullWidth
          size="medium"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ 
            backgroundColor: '#f5f5f5',
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px'
            }
          }}
        />
      </Box>

      {loading && (
        <Box className={styles.loadingBox}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error" className={styles.errorBox}>{error}</Alert>}

      {!loading && !error && (
        <>
          {/* Subtitle */}
          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', marginBottom: '16px' }}>
            Customer List
          </Typography>
          
          <TableContainer component={Box} sx={{ borderRadius: '8px', overflow: 'hidden' }}>
            <Table aria-label="customer table">
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Full Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      {searchTerm ? 'No customers found matching your search.' : 'No customer records found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => {
                    const avatarLetters = getAvatarLetters(customer.fullName);
                    const avatarColor = getAvatarColor(customer.fullName);
                    const chipProps = getStatusChipProps(customer.status);
                    
                    return (
                      <TableRow 
                        key={customer.id} 
                        hover 
                        sx={{ 
                          '&:hover': { backgroundColor: '#f9f9f9' },
                          borderBottom: '1px solid #eee'
                        }}
                      >
                        {/* Full Name and ID Cell */}
                        <TableCell className={styles.nameCell}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: avatarColor,
                                marginRight: '12px',
                                width: 40,
                                height: 40
                              }}
                            >
                              {avatarLetters}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: '500' }}>
                                {customer.fullName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {customer.idNumber}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        
                        {/* Contact Information */}
                        <TableCell>
                          <Typography variant="body2">
                            {customer.phone}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {customer.email}
                          </Typography>
                        </TableCell>
                        
                        {/* Status */}
                        <TableCell>
                          <Chip 
                            label={chipProps.label} 
                            color={chipProps.color} 
                            size="small" 
                            sx={{ 
                              borderRadius: '16px',
                              fontWeight: 'medium'
                            }} 
                          />
                        </TableCell>
                        
                        {/* Action Button */}
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleViewDetails(customer)}
                              sx={{ 
                                borderRadius: '8px',
                                borderColor: '#3f2b7b',
                                color: '#3f2b7b',
                                '&:hover': {
                                  borderColor: '#33235f',
                                  backgroundColor: 'rgba(63, 43, 123, 0.04)'
                                }
                              }}
                            >
                              DETAILS
                            </Button>
                            <Tooltip title="Delete Customer">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleOpenDeleteDialog(customer.id, customer.fullName)}
                                sx={{
                                  border: '1px solid #d32f2f',
                                  borderRadius: '8px',
                                  padding: '4px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(211, 47, 47, 0.04)'
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
             component="div" // Usually used as div
             count={totalCustomers} // Total number of customers
             page={page} // Current page
             onPageChange={handleChangePage} // Page change function
             rowsPerPage={rowsPerPage} // Rows per page
             onRowsPerPageChange={handleChangeRowsPerPage} // Row number change function
             rowsPerPageOptions={[5, 10, 25, 50]} // Options (optional)
             sx={{ borderTop: '1px solid rgba(224, 224, 224, 1)', marginTop: 'auto' }} // Style
           />
        </>
      )}

      {/* Add Customer Modal Component */}
      <AddCustomerModal 
        open={openModal} 
        onClose={handleCloseModal} 
        onSuccess={handleCustomerAdded} 
      />

      {/* Customer Details Modal Component */}
      <CustomerDetailsModal
        open={detailsModal.open}
        onClose={handleCloseDetailsModal}
        customerId={detailsModal.customerId}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Customer
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete <strong>{deleteDialog.customerName}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDeleteDialog} 
            sx={{ color: '#3f2b7b' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteCustomer} 
            variant="contained" 
            color="error" 
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for success/error messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default CustomerInfo;