
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RedButtonProps extends ButtonProps {
  children: React.ReactNode;
}

const RedButton = React.forwardRef<HTMLButtonElement, RedButtonProps>(
  ({ disabled, className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          disabled ? "border-red-600 bg-red-700/20 opacity-60 cursor-not-allowed hover:bg-red-700/20" :
            "bg-red-600 hover:bg-red-700 text-white",
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

RedButton.displayName = "RedButton";

export default RedButton;
