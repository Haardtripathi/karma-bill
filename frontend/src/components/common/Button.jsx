import MuiButton from "@mui/material/Button";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "../../lib/utils.js";

const buttonVariants = cva("btn", {
  variants: {
    variant: {
      primary: "btn-primary",
      secondary: "btn-secondary",
      ghost: "btn-ghost",
      danger: "btn-danger",
      success: "btn-success",
      warning: "btn-warning"
    },
    size: {
      default: "",
      sm: "btn-sm",
      icon: "btn-icon"
    }
  },
  defaultVariants: {
    variant: "primary",
    size: "default"
  }
});

const muiVariant = {
  primary: "contained",
  secondary: "outlined",
  ghost: "text",
  danger: "contained",
  success: "contained",
  warning: "contained"
};

const muiColor = {
  primary: "primary",
  secondary: "primary",
  ghost: "primary",
  danger: "error",
  success: "success",
  warning: "warning"
};

const Button = forwardRef(function Button({ children, variant = "primary", size = "default", type = "button", className = "", ...props }, ref) {
  const inferredSize = className.includes("btn-icon") ? "icon" : className.includes("btn-sm") ? "sm" : size;

  return (
    <MuiButton
      ref={ref}
      type={type}
      variant={muiVariant[variant] || muiVariant.primary}
      color={muiColor[variant] || muiColor.primary}
      className={cn(buttonVariants({ variant, size: inferredSize }), className)}
      {...props}
    >
      {children}
    </MuiButton>
  );
});

export default Button;
