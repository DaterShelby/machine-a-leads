import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-slate-950",
  {
    variants: {
      variant: {
        default:
          "border border-slate-600 bg-slate-800 text-slate-50 hover:bg-slate-700",
        secondary:
          "border border-slate-600 bg-slate-900 text-slate-300 hover:bg-slate-800",
        destructive:
          "border border-red-600 bg-red-900/20 text-red-400 hover:bg-red-900/30",
        outline: "border border-slate-600 text-slate-50",
        success:
          "border border-green-600 bg-green-900/20 text-green-400 hover:bg-green-900/30",
        warning:
          "border border-yellow-600 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={badgeVariants({ variant, className })} {...props} />
  )
}

export { Badge, badgeVariants }
