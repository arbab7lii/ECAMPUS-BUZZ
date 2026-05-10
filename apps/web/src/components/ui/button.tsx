"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--radius-pill)] text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-glow)] hover:brightness-110",
        secondary:
          "bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]",
        ghost: "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]",
        outline:
          "border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-5",
        lg: "h-12 px-6"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
