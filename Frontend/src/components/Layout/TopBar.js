import React from 'react';
import { FaUserCircle, FaDoorOpen, FaUserPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // useAuth hook'unu import et
import styles from './TopBar.module.css';

const TopBar = ({ title }) => {
  const { user, logout } = useAuth(); // user bilgisini AuthContext'ten al
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const handleCreateUser = () => {
    navigate('/register'); // Yönlendirme aynı kalır
  };

  // Butonun gösterilmesi için izin verilen rolleri tanımla
  const allowedRolesForCreateUser = ['SuperAdmin', 'Admin'];

  // Kullanıcının rolünün izin verilen roller arasında olup olmadığını kontrol et
  // user objesinin ve user.role özelliğinin var olduğundan emin ol
  const checkRoles = (userRoles) => {
    if (!userRoles) return false;
    // Hem tekil string hem de dizi formatını ele alalım
    const rolesToCheck = Array.isArray(userRoles) ? userRoles : [userRoles];
    // Rollerin string olduğundan ve izin verilen listede olduğundan emin olalım
    return rolesToCheck.some(role => typeof role === 'string' && allowedRolesForCreateUser.includes(role));
  };

  // Olası tüm rol property isimlerini kontrol et (role, roles, Role, Roles)
  const canCreateUser = user && (
    checkRoles(user.role) ||    // Standart 'role'
    checkRoles(user.roles) ||   // Standart 'roles' dizisi
    checkRoles(user.Role) ||    // PascalCase 'Role'
    checkRoles(user.Roles)     // PascalCase 'Roles' dizisi
  );

  // Debug - rollerle ilgili bilgileri konsola yazdır
  console.log('Current user:', user);
  console.log('Checking user.role:', user?.role);
  console.log('Checking user.roles:', user?.roles);
  console.log('Checking user.Role:', user?.Role);
  console.log('Checking user.Roles:', user?.Roles);
  console.log('Can create user:', canCreateUser);

  return (
    <div className={styles.topBar}>
      <div className={styles.pageTitle}>{title}</div>
      <div className={styles.rightSection}>

        {/* Kullanıcı Kaydı Oluştur butonunu sadece yetkili roller için göster */}
        {canCreateUser && (
          <button
            className={styles.createUserButton}
            onClick={handleCreateUser}
            title="Kullanıcı Kaydı Oluştur"
          >
            <FaUserPlus />
            <span>Kullanıcı Kaydı Oluştur</span>
          </button>
        )}

        {/* User Info ve Logout kısımları aynı kalır */}
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            <FaUserCircle />
          </div>
          <div className={styles.userName}>
            {user ? (user.fullName || user.userName || user.email) : 'Guest User'}
          </div>
        </div>
        <button
          className={styles.logoutButton}
          onClick={handleLogout}
          title="Logout"
        >
          <FaDoorOpen />
        </button>
      </div>
    </div>
  );
};

export default TopBar;