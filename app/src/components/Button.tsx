import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

const base = "btn";

function classes(variant: Variant, size: Size, className?: string) {
  return [base, `btn-${variant}`, `btn-${size}`, className].filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
};

export function Button({ variant = "primary", size = "md", icon, className, children, ...rest }: ButtonProps) {
  return (
    <button className={classes(variant, size, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

type LinkButtonProps = LinkProps & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
};

export function LinkButton({ variant = "primary", size = "md", icon, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link className={classes(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

export function AnchorButton({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: Size; icon?: ReactNode }) {
  return (
    <a className={classes(variant, size, className)} {...rest}>
      {icon}
      {children}
    </a>
  );
}
