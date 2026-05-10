import * as React from "react";
import { cn } from "@/lib/utils";

function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.75)] backdrop-blur-xl",
        className
      )}
      {...props}
    />
  );
}

function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 md:p-6", className)} {...props} />;
}

export { Card, CardContent };
