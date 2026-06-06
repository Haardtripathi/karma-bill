import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb",
      dark: "#1d4ed8",
      contrastText: "#ffffff"
    },
    secondary: {
      main: "#a855f7",
      dark: "#7e22ce",
      contrastText: "#ffffff"
    },
    success: {
      main: "#16803c"
    },
    warning: {
      main: "#d97706"
    },
    error: {
      main: "#dc2626"
    },
    text: {
      primary: "#0f172a",
      secondary: "#667085"
    },
    background: {
      default: "#f6f8fb",
      paper: "#ffffff"
    },
    divider: "#dce3ec"
  },
  shape: {
    borderRadius: 6
  },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    fontSize: 13,
    button: {
      textTransform: "none",
      fontWeight: 700,
      letterSpacing: 0
    },
    h1: { letterSpacing: 0 },
    h2: { letterSpacing: 0 },
    h3: { letterSpacing: 0 }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minWidth: 320
        }
      }
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff"
        },
        notchedOutline: {
          borderColor: "#dce3ec"
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#334155",
          fontWeight: 650
        }
      }
    }
  }
});
