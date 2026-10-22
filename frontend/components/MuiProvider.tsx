'use client';

import * as React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: { mode: 'light', primary: { main: '#1976d2' } },
  shape: { borderRadius: 10 },
});

export default function MuiProvider({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider>;
}
