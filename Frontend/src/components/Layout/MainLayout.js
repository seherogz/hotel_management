import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import styles from './MainLayout.module.css';
import { Outlet } from 'react-router-dom'

const MainLayout = ({ children, title }) => {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <TopBar title={title} />
      <main className={styles.mainContent}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        © 2023 Otel Yönetim Sistemi - All rights reserved
      </footer>
    </div>
  );
};

export default MainLayout; 