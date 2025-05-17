import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService'; // authService yolunuzu kontrol edin

// Auth context'ini oluştur
const AuthContext = createContext();

// Provider bileşenini oluştur
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Kullanıcı bilgilerini (rol dahil) tutacak state
  const [loading, setLoading] = useState(true); // Hem başlangıçtaki kimlik doğrulama yüklemesi hem de login sırasındaki yükleme için
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Uygulama yüklendiğinde kullanıcının zaten giriş yapıp yapmadığını kontrol et
  useEffect(() => {
    const initAuth = () => {
      setLoading(true); // Başlangıçta yükleme durumunu true yap
      try {
        const savedToken = localStorage.getItem('token');
        const savedUserJson = localStorage.getItem('user'); // JSON string olarak kaydedilmiş kullanıcı bilgisi

        if (savedToken && savedUserJson) {
          try {
            const parsedUser = JSON.parse(savedUserJson);
            // parsedUser objesinin içinde userType alanının olduğundan emin ol
            // (login fonksiyonunda bu alan ekleniyor)
            if (parsedUser && parsedUser.userType) {
              setUser(parsedUser);
              setIsAuthenticated(true);
            } else {
              // Eğer userType yoksa, eski bir kayıttır veya hatalıdır, temizle
              console.warn("localStorage'daki kullanıcı objesinde userType bulunamadı.");
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
              setIsAuthenticated(false);
            }
          } catch (e) {
            console.error("localStorage'dan kullanıcı verisi okunurken hata:", e);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.error("Auth başlatma hatası:", err);
        setError(err.message);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false); // Yükleme tamamlandı
      }
    };

    initAuth();
  }, []); // Sadece component mount olduğunda çalışır

  // Login fonksiyonu - API servisini kullanarak giriş yapar
  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const userDataFromService = await authService.login(username, password);
      
      console.log("authService.login'den dönen userData:", userDataFromService); 

      // Koşulu userDataFromService.roles var mı ve boş değil mi diye kontrol et
      if (userDataFromService && userDataFromService.jwToken && userDataFromService.roles && userDataFromService.roles.length > 0) {
        
        // user state'i ve localStorage için user objesini oluştur
        // userType olarak roller dizisindeki ilk rolü ata
        const userToStore = {
          ...userDataFromService,
          userType: userDataFromService.roles[0] // İlk rolü userType olarak ata
        };
        
        setUser(userToStore);
        setIsAuthenticated(true);

        localStorage.setItem('user', JSON.stringify(userToStore)); // userType içeren objeyi kaydet
        localStorage.setItem('token', userDataFromService.jwToken);

        return userToStore; // userType içeren objeyi döndür
      } else {
        console.error("Beklenen formatta olmayan userData (jwToken veya roles eksik/boş):", userDataFromService);
        throw new Error('Giriş bilgileri eksik veya hatalı. Token veya rol bilgisi alınamadı.');
      }
    } catch (err) {
      console.error("Login hatası:", err);
      setError(err.response?.data?.message || err.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw err; 
    } finally {
      setLoading(false);
    }
  };

  // Logout fonksiyonu
  const logout = () => {
    setLoading(true); 
    // authService.logout(); // Eğer backend'de bir logout endpoint'i varsa ve token invalidation yapıyorsa
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setError(null); 
    setLoading(false);
    navigate('/login', { replace: true }); 
  };

  // Context ile paylaşılacak değerler
  const value = {
    user, // Bu obje artık userType alanını içerecek (örn: user.userType)
    loading, 
    error,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Auth context'ini kullanmak için özel bir hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { 
    throw new Error('useAuth hook\'u bir AuthProvider içinde kullanılmalıdır');
  }
  return context;
};

export default AuthContext;
