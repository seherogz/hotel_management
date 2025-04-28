// Frontend/src/components/CheckIn/CheckInPage.js

import React, { useState, useEffect, useCallback, useMemo } from 'react'; // useMemo import edildi
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
  TablePagination // Pagination import edildiğinden emin olun
} from '@mui/material';
import {
  Search as SearchIcon,
  Event as EventIcon,
  LocationOn as LocationOnIcon,
  CheckCircleOutline as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  InfoOutlined as InfoOutlinedIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format, parseISO, isValid } from 'date-fns';
import { enUS } from 'date-fns/locale';

// Servis fonksiyonlarını import et
import { getCheckInReservations, performCheckIn } from '../../services/reservationService';

const CheckIn = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [reservations, setReservations] = useState([]); // API'den gelen ham veri
  const [loading, setLoading] = useState(false);
  const [checkingInId, setCheckingInId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0); // Backend'den gelen toplam

  // API'den veri çekme fonksiyonu (artık searchTerm göndermiyor)
  const fetchReservations = useCallback(async () => {
    if (!isValid(selectedDate)) {
        toast.error("Invalid date selected.");
        return;
    }
    setLoading(true);
    try {
      // Servis fonksiyonunu arama terimi olmadan çağır
      const apiResponse = await getCheckInReservations({
        checkInDate: selectedDate,
        pageNumber: page + 1,
        pageSize: rowsPerPage
      });
      setReservations(apiResponse.data || []);
      setTotalCount(apiResponse.totalCount || 0);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "An error occurred while fetching reservations.";
      toast.error(errorMessage);
      console.error("Error fetching reservations:", error);
      setReservations([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  // searchTerm bağımlılıktan çıkarıldı
  }, [selectedDate, page, rowsPerPage]);

  useEffect(() => {
    // selectedDate geçerliyse fetchReservations'ı çağır
    if(isValid(selectedDate)) {
        fetchReservations();
    } else {
        // Başlangıçta geçersizse bugüne dön (önlem olarak)
        setSelectedDate(new Date());
    }
  }, [fetchReservations, selectedDate]); // fetchReservations ve selectedDate bağımlılıkları

  // Frontend Filtreleme Mantığı
  const filteredReservations = useMemo(() => {
    if (!searchTerm) {
      return reservations; // Arama yoksa tümünü döndür
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return reservations.filter(rez =>
      // Müşteri Adı kontrolü
      (rez.customerName && rez.customerName.toLowerCase().includes(lowerCaseSearchTerm)) ||
      // Oda Bilgisi kontrolü
      (rez.roomInfo && rez.roomInfo.toLowerCase().includes(lowerCaseSearchTerm)) ||
      // Rezervasyon ID kontrolü (string'e çevirerek)
      (rez.reservationId && rez.reservationId.toString().includes(lowerCaseSearchTerm))
      // Gerekirse reservationCode da eklenebilir:
      // || (rez.reservationCode && rez.reservationCode.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [reservations, searchTerm]); // reservations veya searchTerm değiştiğinde yeniden hesapla


  // --- Event Handlers (handleDateChange, handleCheckIn, handleChangePage, handleChangeRowsPerPage - Değişiklik Yok) ---
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
      }
  };

  const handleSearchChange = (event) => {
      setSearchTerm(event.target.value);
      // Frontend filtrelemede sayfayı sıfırlamaya gerek yok
  };

   const handleCheckIn = async (reservationId) => {
      setCheckingInId(reservationId);
      try {
          const result = await performCheckIn(reservationId);
          if (result.success) {
              toast.success(result.message || 'Check-in successful.');
              fetchReservations(); // Mevcut sayfayı yenile
          } else {
              throw new Error(result.message || 'Check-in failed.');
          }
      } catch (error) {
          const errorMessage = error.message || "An error occurred during check-in.";
          toast.error(errorMessage);
          console.error("Error during check-in:", error);
      } finally {
          setCheckingInId(null);
      }
  };

  const handleChangePage = (event, newPage) => {
      setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
  };

  // --- Yardımcı Fonksiyonlar (formatDate, getStatusChip - Önceki haliyle aynı, sadece tarih formatlıyor) ---
  const formatDate = (dateString) => {
      if (!dateString) return '-';
      try {
          const dateObj = dateString instanceof Date ? dateString : parseISO(dateString);
          return isValid(dateObj) ? format(dateObj, 'dd.MM.yyyy', { locale: enUS }) : '-';
      } catch (e) { console.error("Error formatting date:", e); return dateString; }
  };
  const getStatusChip = (status) => {
      if (!status) return null;
      let color = 'default'; let label = status; let icon = <InfoOutlinedIcon />;
      switch (status.toLowerCase()) {
          case 'pending': color = 'warning'; label = 'Pending'; icon = <EventIcon />; break;
          case 'checked-in': color = 'success'; label = 'Checked-in'; icon = <CheckCircleIcon />; break;
          default: color = 'default'; label = status; break;
      }
      return (<Tooltip title={label} arrow><Chip icon={icon} label={label} color={color} size="small" variant="outlined" sx={{ '& .MuiChip-icon': { ml: 0.5 }, '& .MuiChip-label': { mr: 0.5 } }} /></Tooltip>);
  };
  // Başlık için tarih formatlama
  const formatTitleDate = (date) => {
      if (isValid(date)) { return format(date, 'MMMM dd, yyyy', { locale: enUS }); } // Basitleştirilmiş format
      return "Invalid Date";
  }
  // Renk sabitleri
  const buttonBackgroundColor = '#3f2b7b';
  const buttonHoverColor = '#2c1d5e';


  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Check-in Process
      </Typography>

      {/* Filtreleme bölümü */}
      <Paper sx={{ p: 2, mb: 3, overflow: 'hidden' }} elevation={2} variant="outlined">
         <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField fullWidth label="Search Reservations" variant="outlined" placeholder="ID, Name, Room Info..." value={searchTerm} onChange={handleSearchChange} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>), }} size="small" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Check-in Date" type="date" value={isValid(selectedDate) ? format(selectedDate, 'yyyy-MM-dd') : ''} onChange={handleDateChange} fullWidth size="small" InputLabelProps={{ shrink: true, }} />
          </Grid>
        </Grid>
      </Paper>

      {/* Bölüm başlığı */}
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        Expected Check-ins for {formatTitleDate(selectedDate)}
        {!loading && ` (${totalCount} total on this date)`}
      </Typography>

      {/* Tablo */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }} elevation={2}>
        <TableContainer sx={{ maxHeight: { xs: '60vh', md: 'calc(100vh - 400px)' } }}>
          <Table stickyHeader aria-label="expected check-ins table">
            {/* TableHead */}
             <TableHead> <TableRow sx={{ '& th': { backgroundColor: buttonBackgroundColor, color: 'common.white', fontWeight: '600' } }}> <TableCell>Res. ID</TableCell> <TableCell>Customer Name</TableCell> <TableCell>Room Info</TableCell> <TableCell>Check-in Date</TableCell> <TableCell>Check-out Date</TableCell> <TableCell align="center">Status</TableCell> <TableCell align="center">Action</TableCell> </TableRow> </TableHead>
            <TableBody>
              {loading ? (
                 <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Stack spacing={1} alignItems="center"><CircularProgress /><Typography variant="body2">Loading reservations...</Typography></Stack></TableCell></TableRow>
              ) : filteredReservations.length === 0 ? ( // Filtrelenmiş listeyi kontrol et
                 <TableRow><TableCell colSpan={7} sx={{ py: 4 }}><Alert severity="info" icon={<InfoOutlinedIcon fontSize="inherit" />}>
                     {searchTerm
                        ? `No reservations found matching "${searchTerm}" on this page for ${formatTitleDate(selectedDate)}.` // Arama terimi varsa mesajı güncelle
                        : `No expected check-ins found for ${formatTitleDate(selectedDate)}.`}
                 </Alert></TableCell></TableRow>
              ) : (
                // Artık filteredReservations'ı map ediyoruz
                filteredReservations.map((rez) => (
                  <TableRow key={rez.reservationId} hover sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}>
                    <TableCell sx={{ fontWeight: '500' }}>{rez.reservationId}</TableCell>
                    <TableCell>{rez.customerName}</TableCell>
                    <TableCell>
                       <Stack direction="row" alignItems="center" spacing={0.5}>
                         <Tooltip title="Room" arrow><LocationOnIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} /></Tooltip>
                         <Typography variant="body2">{rez.roomInfo}</Typography>
                       </Stack>
                    </TableCell>
                    <TableCell>{formatDate(rez.checkInDate)}</TableCell>
                    <TableCell>{formatDate(rez.checkOutDate)}</TableCell>
                    <TableCell align="center">{getStatusChip(rez.status)}</TableCell>
                    <TableCell align="center">
                       {rez.status?.toLowerCase() === 'pending' ? (
                         <Button
                           variant="contained"
                           size="small"
                           startIcon={checkingInId === rez.reservationId ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                           onClick={() => handleCheckIn(rez.reservationId)}
                           disabled={loading || checkingInId !== null}
                           sx={{ backgroundColor: buttonBackgroundColor, color: '#ffffff', textTransform: 'none', '&:hover': { backgroundColor: buttonHoverColor, }, }}
                         >
                           Check-in
                         </Button>
                       ) : rez.status?.toLowerCase() === 'checked-in' ? ( getStatusChip(rez.status) ) : ( '-' )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination hala backend'den gelen totalCount'a göre çalışır */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default CheckIn; // Component adının CheckInPage olduğundan emin olun