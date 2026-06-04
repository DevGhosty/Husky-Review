import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-transparent bg-clip-padding font-ui text-sm font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-motion-fast ease-brand outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-55 disabled:hover:translate-y-0 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-husky-purple to-husky-purple-dark text-white shadow-glow hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(75,46,131,0.32)]",
        default:
          "bg-gradient-to-r from-husky-purple to-husky-purple-dark text-white shadow-glow hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(75,46,131,0.32)]",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "border-husky-purple/20 bg-white/[0.9] text-husky-purple shadow-soft hover:-translate-y-0.5 hover:border-husky-gold/70 hover:bg-muted hover:shadow-card aria-expanded:bg-muted aria-expanded:text-husky-purple dark:border-border dark:bg-secondary dark:text-secondary-foreground dark:shadow-none dark:hover:border-primary/40 dark:hover:bg-muted/90 dark:aria-expanded:bg-muted dark:aria-expanded:text-secondary-foreground",
        ghost:
          "text-primary hover:bg-primary/10 hover:text-foreground aria-expanded:bg-primary/10 aria-expanded:text-foreground dark:hover:bg-muted",
        dark:
          "bg-husky-ink text-white shadow-card hover:-translate-y-0.5 hover:bg-husky-purple-dark hover:shadow-premium",
        goldOnDark:
          "bg-husky-gold text-husky-purple shadow-[0_6px_20px_rgba(0,0,0,0.28)] hover:bg-white hover:text-husky-purple hover:shadow-premium disabled:opacity-100 disabled:border disabled:border-white/40 disabled:bg-white/15 disabled:text-white disabled:shadow-none",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-12 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-14 gap-2 px-6 text-base has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
