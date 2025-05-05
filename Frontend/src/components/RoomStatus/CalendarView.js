// src/components/RoomStatus/CalendarView.js

import React, { useState, useMemo, useCallback } from 'react';
// Gerekli date-fns fonksiyonları
import {
    format,
    addDays,
    startOfWeek,
    endOfWeek,
    startOfMonth, // Callback için kullanılabilir
    endOfMonth,   // Callback için kullanılabilir
    addWeeks,
    subWeeks,
    isSameMonth, // Hücre stilini ayarlamak için (artık çok kritik değil)
    isEqual,    // goToCurrentWeek kontrolü için
    parseISO,   // API'den gelen tarihi parse etmek için
    startOfDay  // isToday kontrolü için
} from 'date-fns';
import { tr } from 'date-fns/locale'; // Türkçe locale
import { FaChevronLeft, FaChevronRight, FaCalendarAlt } from 'react-icons/fa'; // İkonlar
import styles from './CalendarView.module.css'; // Doğru CSS modülü

// --- Helper Fonksiyonlar ---

// Tarihi 'yyyy-MM-dd' formatına çevirir (API yanıtındaki date ile eşleştirmek için)
const formatDateKey = (date) => {
    try {
        // Gelenin Date objesi olduğundan emin ol
        const dateObj = (date instanceof Date) ? date : parseISO(String(date));
        return format(dateObj, 'yyyy-MM-dd');
    } catch (e) {
        console.error("formatDateKey error:", date, e);
        return null;
    }
};

// Verilen tarihin bugün olup olmadığını kontrol eder
const isToday = (date) => {
    try {
        const dateObj = (date instanceof Date) ? date : parseISO(String(date));
        // Zamanı sıfırlayarak sadece gün karşılaştırması yap
        const todayStart = startOfDay(new Date());
        const dateStart = startOfDay(dateObj);
        return isEqual(todayStart, dateStart); // isEqual günleri karşılaştırır
    } catch (e) {
        console.error("isToday error:", date, e);
        return false;
    }
};

// Haftalık aralığı formatlayan helper (örn: "28 Nis - 04 May 2025")
const formatWeekRange = (startDate) => {
    // Başlangıç tarihi geçerli bir Date objesi değilse hata mesajı döndür
    if (!startDate || !(startDate instanceof Date) || isNaN(startDate.getTime())) {
        console.warn("formatWeekRange geçersiz başlangıç tarihi aldı:", startDate);
        return "Tarih Aralığı Belirsiz";
    }
    try {
        // Haftanın son gününü hesapla (Pazar)
        const endDate = endOfWeek(startDate, { locale: tr, weekStartsOn: 1 });
        // Başlangıç ve bitişi formatla
        const startFormat = format(startDate, 'd MMM', { locale: tr });
        const endFormat = format(endDate, 'd MMM yyyy', { locale: tr }); // Yılı sona ekle
        return `${startFormat} - ${endFormat}`;
    } catch (e) {
        console.error("formatWeekRange error:", startDate, e);
        return "Hata";
    }
};


// --- CalendarView Bileşeni ---
// Props: rooms, onViewDetails, onReserve, onWeekChange (callback), displayWeekStart (gösterilecek hafta)
const CalendarView = ({ rooms = [], onViewDetails, onReserve, onWeekChange, displayWeekStart }) => {

    // --- State YOK ---
    // Gösterilecek hafta bilgisi prop olarak alınıyor (displayWeekStart)

    // --- Gösterilecek 7 Günü Hesapla (Prop'a göre useMemo ile) ---
    const daysToShow = useMemo(() => {
        // Eğer prop olarak geçerli bir tarih gelmediyse boş dizi döndür
        if (!displayWeekStart || !(displayWeekStart instanceof Date) || isNaN(displayWeekStart.getTime())) {
            console.warn("CalendarView: Geçersiz displayWeekStart prop'u alındı:", displayWeekStart);
            return [];
        }
        const days = [];
        // Prop olarak gelen haftanın başlangıcından itibaren 7 gün ekle
        for (let i = 0; i < 7; i++) {
            days.push(addDays(displayWeekStart, i));
        }
        return days;
    }, [displayWeekStart]); // displayWeekStart prop'u değişince yeniden hesaplanır


    // --- Callback ile Hafta Değişikliğini Bildir ---
    // Navigasyon fonksiyonları içinde bu callback çağrılacak
    const notifyWeekChange = useCallback((newWeekStartDate) => {
        // Prop olarak gelen fonksiyon varsa çağır
        if (onWeekChange) {
            // Üst bileşene yeni haftanın başlangıç ve bitişini bildir
            const newWeekEndDate = endOfWeek(newWeekStartDate, { locale: tr, weekStartsOn: 1 });
            console.log("Yeni hafta aralığı bildiriliyor:", newWeekStartDate, newWeekEndDate);
            onWeekChange(newWeekStartDate, newWeekEndDate);
        }
    }, [onWeekChange]); // onWeekChange prop'u değişirse fonksiyon yeniden oluşur

    // --- Haftalık Navigasyon Fonksiyonları (useCallback ile) ---
    // Butonlar sadece üst bileşeni bilgilendirir, state'i üst bileşen yönetir
    const nextWeek = useCallback(() => {
        if (!displayWeekStart) return; // Geçerli tarih yoksa bir şey yapma
        const nextWeekStartDate = addWeeks(displayWeekStart, 1);
        notifyWeekChange(nextWeekStartDate); // Üst bileşeni bilgilendir
    }, [displayWeekStart, notifyWeekChange]);

    const prevWeek = useCallback(() => {
        if (!displayWeekStart) return;
        const prevWeekStartDate = subWeeks(displayWeekStart, 1);
        notifyWeekChange(prevWeekStartDate);
    }, [displayWeekStart, notifyWeekChange]);

    const goToCurrentWeek = useCallback(() => {
        if (!displayWeekStart) return;
        const todayWeekStart = startOfWeek(new Date(), { locale: tr, weekStartsOn: 1 });
        // Sadece mevcut gösterilen haftadan farklıysa üst bileşeni bilgilendir
        if (!isEqual(startOfDay(displayWeekStart), startOfDay(todayWeekStart))) {
             notifyWeekChange(todayWeekStart);
        }
    }, [displayWeekStart, notifyWeekChange]);


    // --- Status Sınıfını Belirle ---
    // API'den gelen status string'ine göre CSS sınıfı döndürür
    const getStatusClass = (statusString) => {
        const status = statusString || 'Available'; // Default
        switch (status) {
            case 'Occupied': return styles.occupied;
            case 'Maintenance': return styles.maintenance;
            default: return styles.available;
        }
    };

    // --- Olay Yöneticileri (Handlers) ---
    // Takvim hücresine tıklandığında çalışır
    const handleCellClick = (room, dailyStatus) => {
        if (!onViewDetails) return;

        // Tıklanan hücre için durum bilgisi yoksa da modal açılabilir (opsiyonel)
        const clickedDate = dailyStatus ? parseISO(dailyStatus.date) : null; // dailyStatus yoksa tarih null
        if (!clickedDate) {
            console.warn("Tıklanan hücre için tarih bilgisi bulunamadı.");
            // İstersen burada da modal açabilirsin ama sadece oda bilgisiyle
            return;
        }

        try {
            // Modal'a gönderilecek veriyi API yanıtından ve oda bilgisinden oluştur
            const roomForModal = {
                id: room.roomId,
                roomNumber: room.roomNumber,
                roomType: room.roomType,
                pricePerNight: room.pricePerNight,
                // Diğer temel oda bilgileri (room objesinde varsa)
                capacity: room.capacity,
                features: room.features,
                selectedDate: clickedDate.toISOString(),
                displayDate: format(clickedDate, 'dd.MM.yyyy EEEE', { locale: tr }),
                // dailyStatus varsa oradan, yoksa 'Available' al
                computedStatus: dailyStatus?.status || 'Available',
                occupantName: dailyStatus?.occupantName || null,
                currentReservationId: dailyStatus?.reservationId || null,
                occupantIdNumber: dailyStatus?.occupantIdNumber || null, 
                occupantCheckInDate: dailyStatus?.reservationStartDate || null,
                occupantCheckOutDate: dailyStatus?.reservationEndDate || null,
                description: room.description,
                maintenanceIssueDescription: (dailyStatus?.status === 'Maintenance')
                                    ? dailyStatus.maintenanceIssueDescription
                                    : null, // Değilse null ata
    maintenanceCompletionDate: (dailyStatus?.status === 'Maintenance')
                                    ? dailyStatus.maintenanceCompletionDate
                                    : null, // Değilse null ata

            };
            console.log("Modal'a gönderilen veri:", roomForModal);
            onViewDetails(roomForModal); // Üst bileşendeki fonksiyonu çağır
        } catch (error) {
             console.error("Modal verisi oluşturulurken hata:", error, "Gelen dailyStatus:", dailyStatus);
        }
    };

    // Oda numarasına tıklama (Opsiyonel)
    const handleRoomNumberClick = (room) => {
        console.log("Oda numarasına tıklandı:", room);
        // Farklı bir modal veya işlem tetiklenebilir
    };

    // --- Render Fonksiyonları ---

    // Haftanın günlerini gösteren başlık
    const renderHeader = () => {
         if (daysToShow.length === 0) return <div className={styles.daysHeader}><div className={styles.roomHeaderPlaceholder}>Oda</div></div>;
         const headerCells = [];
         for (let i = 0; i < 7; i++) {
             const day = daysToShow[i];
             headerCells.push(
                 <div className={styles.dayHeaderCell} key={i}>
                     {format(day, 'eee', { locale: tr })} {/* Pzt, Sal... */}
                     <span className={styles.headerDayNumber}> {format(day, 'd')}</span> {/* 1, 2... */}
                 </div>
             );
         }
         return (
             <div className={styles.daysHeader}>
                 <div className={styles.roomHeaderPlaceholder}>Oda</div>
                 {headerCells}
             </div>
         );
    };


    // Oda satırlarını ve günlük durum hücrelerini render et
    const renderDays = () => {
        // rooms prop'u boşsa veya yükleniyorsa mesaj göster
        if (!rooms || rooms.length === 0) {
             // isLoading prop'u olmadığı için rooms'un varlığına göre karar ver
             return (
                 <div className={styles.loadingOrEmptyCell}>
                    {rooms === null || rooms === undefined ? "Yükleniyor..." : "Gösterilecek oda verisi bulunamadı."}
                 </div>
             );
         }

        // Odaları map ederek her oda için bir satır oluştur
        return rooms.map(room => (
            <div className={styles.calendarRow} key={room.roomId}>
                {/* Oda Etiketi */}
                <div className={styles.calendarRoomLabel} onClick={() => handleRoomNumberClick(room)}>
                    {room.roomNumber}
                    {room.roomType && <div className={styles.calendarRoomType}>{room.roomType}</div>}
                </div>
                {/* Günlük Durum Hücreleri Konteyneri */}
                <div className={styles.calendarDaysContainer}>
                    {daysToShow.map(day => {
                        const dateKey = formatDateKey(day);
                        // O gün için API'den gelen durumu bul
                        const dailyStatus = room.dailyStatuses?.find(ds => ds.date === dateKey);

                        return (
                            // Tek bir gün/oda hücresi
                            <div
                              key={`${room.roomId}-${dateKey}`}
                              className={`
                                ${styles.roomDayCell}
                                ${getStatusClass(dailyStatus?.status)}
                                {/* Takvim hep aynı haftayı gösterdiği için isSameMonth kontrolü gereksiz */}
                                ${isToday(day) ? styles.todayHighlight : ''}
                              `}
                              onClick={() => handleCellClick(room, dailyStatus)}
                              title={`${room.roomNumber} - ${format(day, 'd MMM', {locale: tr})} - ${dailyStatus?.status || 'Müsait'}`}
                            >
                              {/* Hücre içeriği */}
                              {dailyStatus?.status === 'Occupied' && dailyStatus?.occupantName && (
                                  <span className={styles.cellOccupantName}>{dailyStatus.occupantName}</span>
                              )}
                              {dailyStatus?.status === 'Maintenance' && (
                                  <span className={styles.cellMaintenanceText}>Bakımda</span>
                              )}
                            </div>
                        );
                    })}
                </div>
            </div>
        ));
    }; // renderDays sonu


    // --- Ana Render (JSX) ---
    return (
        <div className={styles.calendarContainer}>
            {/* Navigasyon */}
            <div className={styles.calendarNav}>
                <button onClick={prevWeek} className={styles.navButton} aria-label="Önceki Hafta"><FaChevronLeft /></button>
                <span className={styles.weekRangeLabel}>
                  {/* Haftalık aralığı göster */}
                  {displayWeekStart ? formatWeekRange(displayWeekStart) : "Tarih Aralığı Yükleniyor..."}
                </span>
                <button onClick={nextWeek} className={styles.navButton} aria-label="Sonraki Hafta"><FaChevronRight /></button>
                <button className={styles.todayButton} onClick={goToCurrentWeek}>
                  <FaCalendarAlt /> BU HAFTA
                </button>
            </div>

            {/* Takvim Grid */}
            <div className={styles.calendarGrid}>
                {renderHeader()} {/* Hafta Günleri Başlığı */}
                <div className={styles.calendarGridBody}>
                    {renderDays()}   {/* Oda Satırları */}
                </div>
            </div>
        </div>
    );
};

export default CalendarView;