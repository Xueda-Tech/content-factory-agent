import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const spinnerVariants = cva("animate-spin text-muted-foreground", {
  variants: {
    size: {
      sm: "size-4",
      default: "size-6",
      lg: "size-10",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

const labelVariants = cva("text-muted-foreground", {
  variants: {
    size: {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
}

function LoadingSpinner({
  className,
  size,
  label,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      data-slot="loading-spinner"
      role="status"
      aria-label={label ?? "Loading"}
      className={cn("flex flex-col items-center justify-center gap-2", className)}
      {...props}
    >
      <svg
        className={cn(spinnerVariants({ size }))}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {label && (
        <span className={cn(labelVariants({ size }))}>{label}</span>
      )}
      <span className="sr-only">Loading</span>
    </div>
  )
}

export { LoadingSpinner, spinnerVariants }
