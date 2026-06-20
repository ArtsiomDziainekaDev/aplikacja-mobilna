import { Theme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    // Add custom theme properties here if needed
  }
  interface ThemeOptions {
    // Add custom theme options here if needed
  }
}

declare module '*.ts' {
  const content: Theme;
  export default content;
} 