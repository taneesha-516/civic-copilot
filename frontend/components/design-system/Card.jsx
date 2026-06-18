const variants = {
  default: "bg-surface shadow-card",
  interactive:
    "cursor-pointer bg-surface shadow-card transition duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-elevated",
  bordered: "border-[1.5px] border-border bg-surface shadow-none",
  glass: "border border-white/40 bg-white/70 shadow-card backdrop-blur-md",
};

const paddings = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Card({
  variant = "default",
  header,
  footer,
  padding = "md",
  fullHeight = false,
  className,
  children,
  ...props
}) {
  return (
    <section
      className={cn(
        "rounded-card",
        variants[variant],
        fullHeight && "h-full",
        className,
      )}
      {...props}
    >
      {header ? (
        <div className={cn("border-b border-border", paddings[padding])}>
          {typeof header === "string" ? (
            <h3 className="text-lg font-bold tracking-[-0.02em] text-text-primary">
              {header}
            </h3>
          ) : (
            header
          )}
        </div>
      ) : null}

      <div className={paddings[padding]}>{children}</div>

      {footer ? (
        <div className={cn("border-t border-border", paddings[padding])}>
          {footer}
        </div>
      ) : null}
    </section>
  );
}
