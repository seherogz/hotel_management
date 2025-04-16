import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt } from 'react-icons/fa';
import styles from './CalendarView.module.css';

const CalendarView = ({ rooms, onViewDetails }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [daysToShow, setDaysToShow] = useState([]);
  const [roomData, setRoomData] = useState([]);

  // Initialize the days to show when component mounts or week changes
  useEffect(() => {
    const days = [];
    for (let i = 0; i < 14; i++) { // Show 2 weeks
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      days.push(day);
    }
    setDaysToShow(days);
  }, [currentWeekStart]);

  // Process room data for easier display
  useEffect(() => {
    if (!rooms || !daysToShow.length) return;

    const processedRooms = rooms.map(room => {
      const roomStatusByDay = {};
      
      daysToShow.forEach(day => {
        roomStatusByDay[formatDateKey(day)] = getRoomStatusForDate(room, day);
      });
      
      return {
        ...room,
        statusByDay: roomStatusByDay
      };
    });
    
    setRoomData(processedRooms);
  }, [rooms, daysToShow]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get the status for a specific room on a specific date
  const getRoomStatusForDate = (room, date) => {
    // Handle maintenance status
    if (room.status === 'Under Maintenance') {
      return {
        status: 'Under Maintenance',
        info: room.maintenance?.issue || 'Bakımda',
        guest: null
      };
    }
    
    // Handle occupied status with check-in/out dates
    if (room.status === 'Occupied' && room.guest) {
      const checkInDate = parseDate(room.guest.checkInDate);
      const checkOutDate = parseDate(room.guest.checkOutDate);
      
      // Check if date falls between check-in and check-out
      if (checkInDate && checkOutDate && date >= checkInDate && date < checkOutDate) {
        return {
          status: 'Occupied',
          info: room.guest.name,
          guest: room.guest,
          checkInDate: room.guest.checkInDate,
          checkOutDate: room.guest.checkOutDate
        };
      }
    }
    
    // Default to available
    return {
      status: 'Available',
      info: 'Müsait',
      guest: null
    };
  };

  // Get the Monday of the current week
  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(d.setDate(diff));
  }

  // Parse date from "DD.MM.YYYY" format
  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    const parts = dateString.split('.');
    if (parts.length !== 3) return null;
    
    return new Date(parts[2], parts[1] - 1, parts[0]);
  };

  // Format date to "DD/MM" format for display
  const formatDateDisplay = (date) => {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  // Format date to "YYYY-MM-DD" for keys
  const formatDateKey = (date) => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };
  
  // Format date to standard ISO string "YYYY-MM-DD"
  const formatISODate = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Format date to "DD.MM.YYYY" format
  const formatDateDMY = (date) => {
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  };

  // Format full date range for display
  const formatDateRange = () => {
    if (!daysToShow.length) return '';
    
    const firstDay = daysToShow[0];
    const lastDay = daysToShow[daysToShow.length - 1];
    
    return `${firstDay.getDate().toString().padStart(2, '0')}.${(firstDay.getMonth() + 1).toString().padStart(2, '0')}.${firstDay.getFullYear()} - ${lastDay.getDate().toString().padStart(2, '0')}.${(lastDay.getMonth() + 1).toString().padStart(2, '0')}.${lastDay.getFullYear()}`;
  };

  // Get day name for display (Mon, Tue, etc.)
  const getDayName = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  // Get status color class
  const getStatusClass = (status) => {
    switch (status) {
      case 'Available':
        return styles.available;
      case 'Occupied':
        return styles.occupied;
      case 'Under Maintenance':
        return styles.maintenance;
      default:
        return styles.available;
    }
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeekStart);
    prevWeek.setDate(currentWeekStart.getDate() - 14); // 2 weeks back
    setCurrentWeekStart(prevWeek);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(currentWeekStart.getDate() + 14); // 2 weeks forward
    setCurrentWeekStart(nextWeek);
  };

  // Go to current week
  const goToToday = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  };

  // Handle cell click with both room and date info
  const handleCellClick = (roomId, date, status) => {
    if (!onViewDetails) return;
    
    // Find the original room object
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    // Create a modified room object with date and status information
    const roomWithDateInfo = {
      ...room,
      selectedDate: formatISODate(date),
      displayDate: formatDateDMY(date),
      
      // Override status based on the cell's status for this specific date
      status: status.status,
      
      // If occupied, include the guest information
      guest: status.status === 'Occupied' ? status.guest : null,
      
      // If under maintenance, include maintenance info
      maintenance: status.status === 'Under Maintenance' 
        ? { issue: status.info } 
        : room.maintenance
    };
    
    onViewDetails(roomWithDateInfo);
  };

  // Handle room name cell click
  const handleRoomNumberClick = (roomId) => {
    if (!onViewDetails) return;
    
    // Find the original room object by ID
    const originalRoom = rooms.find(r => r.id === roomId);
    if (originalRoom) {
      onViewDetails(originalRoom);
    }
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className={styles.calendarContainer}>
      {/* Calendar Navigation */}
      <div className={styles.calendarNavigation}>
        <div className={styles.dateRangeDisplay}>
          <button className={styles.navButton} onClick={goToPreviousWeek}>
            <FaChevronLeft />
          </button>
          <span className={styles.dateRange}>{formatDateRange()}</span>
          <button className={styles.navButton} onClick={goToNextWeek}>
            <FaChevronRight />
          </button>
        </div>
        <button className={styles.todayButton} onClick={goToToday}>
          <FaCalendarAlt /> BUGÜN
        </button>
      </div>

      {/* Calendar Grid */}
      <div className={styles.calendarGridContainer}>
        <table className={styles.calendarTable}>
          <thead>
            <tr className={styles.headerRow}>
              <th className={styles.roomHeader}>Oda / Tarih</th>
              {daysToShow.map((day, index) => (
                <th 
                  key={index} 
                  className={`${styles.dateHeader} ${isToday(day) ? styles.today : ''}`}
                >
                  <div className={styles.dateHeaderContent}>
                    <div className={styles.dayName}>{getDayName(day)}</div>
                    <div className={styles.dayNumber}>{formatDateDisplay(day)}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roomData.map((room) => (
              <tr key={room.id} className={styles.roomRow}>
                <td className={styles.roomCell} onClick={() => handleRoomNumberClick(room.id)}>
                  {room.roomNumber}
                </td>
                {daysToShow.map((day, index) => {
                  const dateKey = formatDateKey(day);
                  const status = room.statusByDay[dateKey];
                  return (
                    <td 
                      key={index} 
                      className={`${styles.statusCell} ${getStatusClass(status?.status)}`}
                      onClick={() => handleCellClick(room.id, day, status)}
                      title={`${room.roomNumber} - ${status?.status || 'Available'} - ${status?.info || ''}`}
                    >
                      <div className={styles.cellContent}>
                        {status?.status === 'Occupied' && (
                          <div className={styles.guestInfo}>{status.info}</div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CalendarView; 