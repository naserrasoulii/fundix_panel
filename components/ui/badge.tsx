import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background",
  {
    variants: {
      variant: {
        default: "border-primary/15 bg-primary/10 text-primary",
        muted: "border-border bg-muted text-muted-foreground",
        outline: "border-border bg-transparent text-foreground",
        success:
          "border-emerald-500/20 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        warning:
          "border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-300",
        danger: "border-rose-500/25 bg-rose-500/15 text-rose-700 dark:text-rose-300"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
