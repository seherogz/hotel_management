// src/components/common/NotAllowed.js
import React from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'; // Veya başka bir uygun ikon

const NotAllowed = () => {
  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="calc(80vh - 64px)" // TopBar yüksekliğini çıkarabilirsiniz
        textAlign="center"
      >
        <Paper elevation={3} sx={{ padding: { xs: 3, sm: 5 }, borderRadius: 2 }}>
          <LockOutlinedIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You do not have permission to access this page.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotAllowed;