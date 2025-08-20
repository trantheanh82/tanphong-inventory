
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle, XCircle, Info, LucideIcon } from "lucide-react";

const notificationVariants = cva(
  "w-full rounded-lg border-l-4 p-4",
  {
    variants: {
      variant: {
        success: "bg-green-50 border-green-500 text-green-800",
        warning: "bg-yellow-50 border-yellow-500 text-yellow-800",
        error: "bg-red-50 border-red-500 text-red-800",
        info: "bg-blue-50 border-blue-500 text-blue-800",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

const iconVariants = cva(
    "w-6 h-6", 
    {
        variants: {
            variant: {
                success: "text-green-500",
                warning: "text-yellow-500",
                error: "text-red-500",
                info: "text-blue-500",
            }
        },
        defaultVariants: {
            variant: 'info',
        }
    }
);

const iconMap: Record<NonNullable<VariantProps<typeof notificationVariants>['variant']>, LucideIcon> = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

interface NotificationProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof notificationVariants> {
  title: string;
  message: string;
}

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  ({ className, variant, title, message, ...props }, ref) => {
    const Icon = iconMap[variant || 'info'];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(notificationVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
                <Icon className={cn(iconVariants({ variant }))} />
            </div>
            <div className="flex-1">
                <p className="font-bold text-base">{title}</p>
                <p className="text-sm mt-1">{message}</p>
            </div>
        </div>
      </div>
    );
  }
);
Notification.displayName = "Notification";

export { Notification, notificationVariants };
