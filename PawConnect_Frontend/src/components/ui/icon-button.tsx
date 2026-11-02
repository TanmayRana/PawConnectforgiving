import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  "aria-label": string;
}

function IconButton({
  className,
  variant = "ghost",
  size = "md",
  "aria-label": ariaLabel,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn(
        buttonVariants({ variant, size: size === "sm" ? "icon-sm" : size === "lg" ? "icon-lg" : "icon" }),
        "p-0",
        className
      )}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  );
}

export { IconButton };