
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RedButtonProps extends ButtonProps {
  children: React.ReactNode;
}

const RedButton = React.forwardRef<HTMLButtonElement, RedButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "bg-red-600 hover:bg-red-700 text-white",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

RedButton.displayName = "RedButton";

export default RedButton;
