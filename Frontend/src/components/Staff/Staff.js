import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar,
  Grid,
  Chip,
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  CardActions,
  CardHeader,
  CircularProgress,
  Modal,
  Dialog
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ModeEdit as ModeEditIcon,
} from '@mui/icons-material';
import staffService from '../../services/staffService';
import StaffDetailsModal from './StaffDetailsModal';
import CreateStaffModal from './CreateStaffModal';

// Example staff data - will be removed when API connection is established
const staffData = [
  {
    id: 1,
    name: 'John Smith',
    position: 'Receptionist',
    department: 'Front Office',
    email: 'john.smith@hotel.com',
    phone: '0532 123 4567',
    status: 'Active',
    startDate: '15.01.2024',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: 2,
    name: 'Emily Johnson',
    position: 'Housekeeping Supervisor',
    department: 'Housekeeping',
    email: 'emily.johnson@hotel.com',
    phone: '0533 234 5678',
    status: 'Active',
    startDate: '03.02.2024',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  {
    id: 3,
    name: 'Robert Davis',
    position: 'Chef',
    department: 'Kitchen',
    email: 'robert.davis@hotel.com',
    phone: '0535 345 6789',
    status: 'Active',
    startDate: '10.12.2023',
    avatar: 'https://randomuser.me/api/portraits/men/68.jpg'
  },
  {
    id: 4,
    name: 'Sarah Wilson',
    position: 'Waiter',
    department: 'F&B',
    email: 'sarah.wilson@hotel.com',
    phone: '0536 456 7890',
    status: 'Active',
    startDate: '05.11.2023',
    avatar: 'https://randomuser.me/api/portraits/women/17.jpg'
  },
  {
    id: 5,
    name: 'Michael Brown',
    position: 'Security Officer',
    department: 'Security',
    email: 'michael.brown@hotel.com',
    phone: '0537 567 8901',
    status: 'On Leave',
    startDate: '20.09.2023',
    avatar: 'https://randomuser.me/api/portraits/men/55.jpg'
  },
  {
    id: 6,
    name: 'Jessica Taylor',
    position: 'Accounting Specialist',
    department: 'Finance',
    email: 'jessica.taylor@hotel.com',
    phone: '0538 678 9012',
    status: 'Active',
    startDate: '15.08.2023',
    avatar: 'https://randomuser.me/api/portraits/women/63.jpg'
  },
  {
    id: 7,
    name: 'David Miller',
    position: 'Technical Service',
    department: 'Technical',
    email: 'david.miller@hotel.com',
    phone: '0539 789 0123',
    status: 'Active',
    startDate: '01.07.2023',
    avatar: 'https://randomuser.me/api/portraits/men/41.jpg'
  }
];

// Department list
const departments = [
  'All',
  'Front Office',
  'Housekeeping',
  'Kitchen',
  'Security',
  'Finance',
  'Technical',
  'Other Departments'
];

const Staff = () => {
  const [searchText, setSearchText] = useState('');
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [staff, setStaff] = useState([]); // Staff data from API
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [pageNumber, setPageNumber] = useState(1); // Page number
  const [pageSize, setPageSize] = useState(10); // Items per page
  const [totalCount, setTotalCount] = useState(0); // Total staff count
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [openStaffDetails, setOpenStaffDetails] = useState(false);
  const [openCreateStaff, setOpenCreateStaff] = useState(false);

  // Fetch staff data from API
  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      setError(null);
      try {
        // Prepare filters
        const filters = {};
        if (selectedDepartment !== 'All') {
          filters.department = selectedDepartment;
        }
        if (statusFilter !== 'All') {
          filters.status = statusFilter;
        }
        if (searchText) {
          filters.searchTerm = searchText;
        }
        
        // Get staff data from API
        const response = await staffService.getAllStaff(pageNumber, pageSize, filters);
        setStaff(response.data || []);
        setTotalCount(response.totalCount || 0);
        setFilteredStaff(response.data || []);
      } catch (err) {
        console.error('Error fetching staff data:', err);
        setError('Unable to load staff data. Please try again later.');
        // Use example data in case of error
        setStaff(staffData);
        setFilteredStaff(staffData);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [pageNumber, pageSize, selectedDepartment, statusFilter, searchText]);

  // Function for tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Apply department filter based on tab value
    if (newValue === 0) {
      setSelectedDepartment('All');
    } else if (newValue === 1) {
      setSelectedDepartment('Front Office');
    } else if (newValue === 2) {
      setSelectedDepartment('Housekeeping');
    } else if (newValue === 3) {
      setSelectedDepartment('Other Departments');
    }
  };

  // Search function - works with API call, no client-side filtering
  const handleSearch = (e) => {
    setSearchText(e.target.value);
    // useEffect will automatically make a new API call
  };

  // Department filter change
  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    // useEffect will automatically make a new API call
  };

  // Status filter change
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    // useEffect will automatically make a new API call
  };

  // Staff detaylarını açmak için fonksiyon
  const handleOpenStaffDetails = (staffId) => {
    setSelectedStaffId(staffId);
    setOpenStaffDetails(true);
  };

  // Staff detaylarını kapatmak için fonksiyon
  const handleCloseStaffDetails = () => {
    setOpenStaffDetails(false);
  };

  // Yeni personel oluşturma modal'ını açmak için fonksiyon
  const handleOpenCreateStaff = () => {
    setOpenCreateStaff(true);
  };

  // Yeni personel oluşturma modal'ını kapatmak için fonksiyon
  const handleCloseCreateStaff = () => {
    setOpenCreateStaff(false);
  };

  // Yeni personel oluşturulduğunda çağrılan fonksiyon
  const handleStaffCreated = (newStaff) => {
    // Personel listesini yeniden yükle
    refreshStaffList();
  };
  
  // Personel silindiğinde çağrılan fonksiyon
  const handleStaffDeleted = (staffId) => {
    // Personel listesini yeniden yükle
    refreshStaffList();
  };
  
  // Personel listesini yenileme fonksiyonu
  const refreshStaffList = async () => {
    setLoading(true);
    try {
      // Mevcut filtrelerle API'den personel verilerini yükle
      const filters = {};
      if (selectedDepartment !== 'All') {
        filters.department = selectedDepartment;
      }
      if (statusFilter !== 'All') {
        filters.status = statusFilter;
      }
      if (searchText) {
        filters.searchTerm = searchText;
      }
      
      const response = await staffService.getAllStaff(pageNumber, pageSize, filters);
      setStaff(response.data || []);
      setTotalCount(response.totalCount || 0);
      setFilteredStaff(response.data || []);
    } catch (err) {
      console.error('Personel verileri yüklenirken hata:', err);
      setError('Personel verilerini yüklerken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Card view
  const CardView = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress color="primary" />
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ p: 3, bgcolor: '#fff3cd', color: '#856404', borderRadius: 2 }}>
          <Typography>{error}</Typography>
        </Box>
      );
    }

    if (filteredStaff.length === 0) {
      return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fa', color: '#495057', borderRadius: 2, textAlign: 'center' }}>
          <Typography>No staff found.</Typography>
        </Box>
      );
    }

    return (
      <Grid 
        container 
        spacing={3} 
        alignItems="flex-start"
        sx={{ mt: 2 }}
      >
        {filteredStaff.map(staff => (
          <Grid item xs={12} sm={6} md={4} key={staff.id} sx={{ display: 'flex' }}>
            <Card 
              elevation={1}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                borderRadius: 2,
                flexGrow: 1,
              }}
            >
              {/* 1) Header section */}
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: '#6c4bdc', width: 56, height: 56 }}>
                    {staff.name ? staff.name.split(' ').map(n => n[0]).join('') : 
                     staff.firstName && staff.lastName ? 
                     `${staff.firstName.charAt(0)}${staff.lastName.charAt(0)}` : '??'}
                  </Avatar>
                }
                title={
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }} noWrap>
                    {staff.name || `${staff.firstName} ${staff.lastName}`}
                  </Typography>
                }
                subheader={
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {staff.position || staff.role}
                  </Typography>
                }
                action={
                  <Chip 
                    label={staff.status || (staff.isActive ? 'Active' : 'Inactive')} 
                    size="small"
                    color={(staff.status === 'Active' || staff.isActive) ? 'success' : 'warning'}
                  />
                }
                sx={{
                  '& .MuiCardHeader-content': { overflow: 'hidden' }
                }}
              />
    
              {/* 2) Content section */}
              <CardContent sx={{ flex: 1, pt: 1, px: 3, pb: 0 }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Department
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {staff.department}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Start Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {staff.startDate ? new Date(staff.startDate).toLocaleDateString('en-US') : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }} noWrap>
                      {staff.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {staff.phone || staff.phoneNumber || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
    
              {/* 3) Buttons */}
              <CardActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2, pt: 1 }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => handleOpenStaffDetails(staff.id)}
                  sx={{ minWidth: '100px' }}
                >
                  DETAILS
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Table view - can be updated if needed

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        backgroundColor: 'white',
        p: 3,
        borderRadius: 2,
        boxShadow: 'rgba(99, 99, 99, 0.05) 0px 2px 8px 0px'
      }}>
        {/* Title */}
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
          Staff Management
        </Typography>

        {/* Search and Filters */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: { xs: 'wrap', md: 'nowrap' }, gap: 2 }}>
          {/* Search */}
          <TextField
            placeholder="Search staff..."
            variant="outlined"
            fullWidth
            size="medium"
            sx={{ flexGrow: 1 }}
            value={searchText}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />

          {/* Status Filter */}
          <FormControl variant="outlined" sx={{ minWidth: 150 }}>
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select
              labelId="status-select-label"
              id="status-select"
              value={statusFilter}
              onChange={handleStatusChange}
              label="Status"
              size="medium"
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="On Leave">On Leave</MenuItem>
            </Select>
          </FormControl>

          {/* Department Filter */}
          <FormControl variant="outlined" sx={{ minWidth: 180 }}>
            <InputLabel id="department-select-label">Department</InputLabel>
            <Select
              labelId="department-select-label"
              id="department-select"
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              label="Department"
              size="medium"
            >
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* New Staff Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateStaff}
            sx={{ 
              ml: { xs: 0, md: 2 }, 
              py: 1.5, 
              // Smaller padding on small screens, wider on larger screens
              px: { xs: 2, sm: 3, md: 4 },
              // Fixed minimum width
              minWidth: 130,
              borderRadius: '50px',
              backgroundColor: '#6c4bdc',
              '&:hover': { backgroundColor: '#5b3cbf' },
              boxShadow: '0px 4px 10px rgba(108, 75, 220, 0.3)',
              textTransform: 'none',
              fontWeight: 600,
              // Responsive font-size
              fontSize: { xs: '0.75rem', md: '0.9rem' },
              // Line height to prevent overflow
              lineHeight: 1.2,
              // Allow wrapping
              whiteSpace: 'normal',
              textAlign: 'center',
            }}
          >
            NEW STAFF
          </Button>
        </Box>

        {/* Department Tabs */}
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ 
            mb: 2,
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 'medium', minWidth: 'auto', px: 3 },
            '& .Mui-selected': { color: '#6c4bdc', fontWeight: 'bold' },
            '& .MuiTabs-indicator': { backgroundColor: '#6c4bdc' }
          }}
        >
          <Tab label="ALL STAFF" />
          <Tab label="FRONT OFFICE" />
          <Tab label="HOUSEKEEPING" />
          <Tab label="OTHER DEPARTMENTS" />
        </Tabs>

        {/* Staff Information */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Total {totalCount} staff {loading ? 'loading...' : 'found'}
          </Typography>
        </Box>

        {/* Staff List - Card View */}
        <CardView />
        
        {/* Staff Details Modal */}
        <StaffDetailsModal 
          open={openStaffDetails} 
          onClose={handleCloseStaffDetails} 
          staffId={selectedStaffId} 
          onStaffDeleted={handleStaffDeleted}
        />
        
        {/* Create Staff Modal */}
        <CreateStaffModal
          open={openCreateStaff}
          onClose={handleCloseCreateStaff}
          onStaffCreated={handleStaffCreated}
        />
      </Box>
    </Box>
  );
};

export default Staff; 