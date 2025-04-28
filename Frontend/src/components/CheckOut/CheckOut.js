// Frontend/src/components/CheckOut/CheckOut.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Alert,
  Tooltip,
  TablePagination
} from '@mui/material';
import {
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationOnIcon,
  CheckCircleOutline as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  InfoOutlined as InfoOutlinedIcon,
  Hotel as HotelIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format, parseISO, isValid } from 'date-fns';
import { enUS } from 'date-fns/locale';

// Gerçek (veya en son güncellenmiş) servis fonksiyonlarını import et
// Bu servis fonksiyonlarının backend'e bağlandığını varsayıyoruz (getCheckOutReservations'dan arama parametresi kaldırıldı)
import { getCheckOutReservations, performCheckOut } from '../../services/reservationService';

// Renk sabitleri
const headerBackgroundColor = '#3f2b7b';
const headerTextColor = '#ffffff';
const checkoutButtonColor = '#3f2b7b';
const checkoutButtonHoverColor = '#2c1d5e';

const CheckOut = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [reservations, setReservations] = useState([]); // API'den gelen ham veri (filtrelenmemiş)
  const [loading, setLoading] = useState(false);
  const [checkingOutId, setCheckingOutId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0); // Backend'den gelen toplam (filtrelenmemiş)

  // API'den veri çekme fonksiyonu (arama terimi göndermez)
  const fetchReservations = useCallback(async () => {
    if (!isValid(selectedDate)) {
        console.error("fetchReservations called with invalid date:", selectedDate);
        toast.error("Invalid date selected. Please refresh or select a valid date.");
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      // Servis fonksiyonunu arama terimi olmadan çağır
      const apiResponse = await getCheckOutReservations({
        checkOutDate: selectedDate,
        pageNumber: page + 1,
        pageSize: rowsPerPage
      });
      setReservations(apiResponse.data || []);
      setTotalCount(apiResponse.totalCount || 0);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "An error occurred while fetching check-out reservations.";
      toast.error(errorMessage);
      console.error("Error fetching check-out reservations:", error);
      setReservations([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, page, rowsPerPage]); // searchTerm bağımlılığı kaldırıldı

  useEffect(() => {
    if(isValid(selectedDate)) {
        fetchReservations();
    } else {
        console.warn("Initial selectedDate is invalid, defaulting to today.");
        setSelectedDate(new Date());
    }
  }, [fetchReservations, selectedDate]);

  // Frontend Filtreleme Mantığı
  const filteredReservations = useMemo(() => {
    if (!searchTerm) {
      return reservations; // Arama yoksa orijinal listeyi döndür
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return reservations.filter(rez =>
      (rez.customerName && rez.customerName.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (rez.roomInfo && rez.roomInfo.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (rez.reservationCode && rez.reservationCode.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (rez.reservationId && rez.reservationId.toString().includes(lowerCaseSearchTerm))
    );
  }, [reservations, searchTerm]);

  // Event Handlers
  const handleDateChange = (event) => {
    const dateString = event.target.value;
    if (dateString) {
      try {
        const [year, month, day] = dateString.split('-').map(Number);
        const newDate = new Date(year, month - 1, day);
        if (isValid(newDate)) {
          setSelectedDate(newDate);
          setPage(0);
        } else {
          toast.warning("Please select a valid date.");
        }
      } catch (error) {
        console.error("Error parsing date:", error);
        toast.error("Date conversion error.");
      }
    } else {
       console.warn("Date field cleared.");
       // Belki bugüne dönebilirsiniz: setSelectedDate(new Date()); setPage(0);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    // Frontend filtreleme olduğu için sayfayı sıfırlamaya gerek yok
  };

  const handleCheckOut = async (reservationId) => {
    setCheckingOutId(reservationId);
    try {
      const result = await performCheckOut(reservationId);
      if (result.success) {
        toast.success(result.message || 'Check-out successful.');
        fetchReservations(); // Mevcut sayfayı yenile
      } else {
        throw new Error(result.message || 'Check-out failed.');
      }
    } catch (error) {
      const errorMessage = error.message || "An error occurred during check-out.";
      toast.error(errorMessage);
      console.error("Error during check-out:", error);
    } finally {
      setCheckingOutId(null);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Helper: Sadece tarih formatlama
  const formatDateOnly = (dateString) => {
    if (!dateString) return '-';
    try {
      const dateObj = dateString instanceof Date ? dateString : parseISO(dateString);
      return isValid(dateObj) ? format(dateObj, 'dd.MM.yyyy', { locale: enUS }) : '-';
    } catch (e) { return dateString; }
  };

  // Helper: Durum Chip'i (label tanımlaması düzeltildi)
  const getStatusChip = (status) => {
     const displayStatus = status || 'Unknown';
     let color = 'default';
     let icon = <InfoOutlinedIcon />;
     let label = displayStatus; // label burada tanımlandı

     if (displayStatus.toLowerCase() === 'staying' || displayStatus.toLowerCase() === 'checked-in') {
         color = 'info';
         label = 'Staying';
         icon = <HotelIcon />;
     } else if (displayStatus.toLowerCase() === 'checked-out') {
         color = 'success';
         label = 'Checked Out';
         icon = <CheckCircleIcon />
     } // Başka durumlar eklenebilir

     return (
         <Tooltip title={label} arrow>
             <Chip
                 icon={icon}
                 label={label}
                 size="small"
                 variant="outlined"
                 color={color}
                 sx={{ color: color !== 'default' ? undefined : 'text.secondary', borderColor: color !== 'default' ? undefined : 'rgba(0, 0, 0, 0.23)' }}
             />
         </Tooltip>
     );
  };

  // Helper: Başlık için güvenli tarih formatlama (format string düzeltildi)
  const formatTitleDate = (date) => {
      if (isValid(date)) {
          // Önceki hatayı önlemek için daha basit/standart format
          return format(date, 'MMMM dd, yyyy', { locale: enUS });
          // Veya: return format(date, 'PP', { locale: enUS }); // date-fns'in lokalize formatı
      }
      return "Invalid Date";
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold' }}>
        Check-Out Process
      </Typography>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 1 }} variant="outlined">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth label="Search Reservation" variant="outlined" placeholder="Code, Name, Room..."
              value={searchTerm} onChange={handleSearchChange}
              InputProps={{
                startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
                sx: { borderRadius: 1 }
              }} size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Check-Out Date" type="date"
              value={isValid(selectedDate) ? format(selectedDate, 'yyyy-MM-dd') : ''}
              onChange={handleDateChange} fullWidth size="small" InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (<InputAdornment position="start"><CalendarIcon /></InputAdornment>),
                sx: { borderRadius: 1 }
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        Expected Check-Outs for {formatTitleDate(selectedDate)}
        {!loading && ` (${totalCount} total on this date)`}
      </Typography>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: 1 }} elevation={0} variant="outlined">
        <TableContainer sx={{ maxHeight: { xs: '60vh', md: 'calc(100vh - 430px)' } }}>
          <Table stickyHeader aria-label="expected check-outs table">
            <TableHead>
              <TableRow sx={{ '& th': { backgroundColor: headerBackgroundColor, color: headerTextColor, fontWeight: '600' } }}>
                <TableCell>Reservation Code</TableCell>
                <TableCell>Customer Name</TableCell>
                <TableCell>Room Info</TableCell>
                <TableCell>Check-In Date</TableCell>
                <TableCell>Check-Out Date</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Stack spacing={1} alignItems="center"><CircularProgress /><Typography variant="body2">Loading reservations...</Typography></Stack></TableCell></TableRow>
              ) : filteredReservations.length === 0 ? ( // Filtrelenmiş listeyi kontrol et
                <TableRow><TableCell colSpan={7} sx={{ py: 4, borderBottom: 'none' }}>
                  <Alert severity="info" icon={<InfoOutlinedIcon fontSize="inherit" />}>
                    {searchTerm
                      ? `No reservations found matching "${searchTerm}" on this page for ${formatTitleDate(selectedDate)}.` // Arama terimi varsa mesajı güncelle
                      : `No expected check-outs found for ${formatTitleDate(selectedDate)}.`}
                  </Alert>
                </TableCell></TableRow>
              ) : (
                // Filtrelenmiş listeyi map et
                filteredReservations.map((rez) => (
                  <TableRow key={rez.reservationId} hover sx={{ '& td': { borderBottom: '1px solid rgba(224, 224, 224, 1)' } }}>
                    <TableCell sx={{ fontWeight: '500' }}>{rez.reservationCode || rez.reservationId}</TableCell>
                    <TableCell>{rez.customerName}</TableCell>
                    <TableCell>
                       <Stack direction="row" alignItems="center" spacing={0.5}>
                         <Tooltip title="Room" arrow><LocationOnIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} /></Tooltip>
                         <Typography variant="body2">{rez.roomInfo}</Typography>
                       </Stack>
                    </TableCell>
                    <TableCell>{formatDateOnly(rez.checkInDate)}</TableCell>
                    <TableCell>{formatDateOnly(rez.checkOutDate)}</TableCell>
                    <TableCell align="center">{getStatusChip(rez.status)}</TableCell>
                    <TableCell align="center">
                      {(rez.status?.toLowerCase() === 'staying' || rez.status?.toLowerCase() === 'checked-in') ? (
                        <Button
                          variant="contained" size="small"
                          startIcon={checkingOutId === rez.reservationId ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                          onClick={() => handleCheckOut(rez.reservationId)}
                          disabled={loading || checkingOutId !== null}
                          sx={{
                            backgroundColor: checkoutButtonColor, color: headerTextColor, textTransform: 'none',
                            borderRadius: 1, boxShadow: 0, '&:hover': { backgroundColor: checkoutButtonHoverColor, boxShadow: 0, },
                          }}
                        >
                          Check-Out
                        </Button>
                      ) : (
                         getStatusChip(rez.status)
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]} component="div"
          count={totalCount} rowsPerPage={rowsPerPage} page={page}
          onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid rgba(224, 224, 224, 1)' }}
        />
      </Paper>
    </Box>
  );
};

export default CheckOut;