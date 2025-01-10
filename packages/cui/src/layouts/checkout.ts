import { Layout } from "@/layouts/base"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ParentComponent } from "@textjs/core"
import { Stack } from "@textjs/core/components"

interface CheckoutLayoutProps {
  current: "cart" | "shipping" | "payment" | "confirm" | "final"
}

export const CheckoutLayout = ParentComponent<CheckoutLayoutProps>(
  ({ children, current }) => {
    return Layout(
      Stack({
        gap: 1,
        children: [
          Breadcrumbs({
            current,
            steps: ["cart", "shipping", "payment", "confirmation"],
          }),
          ...children,
        ],
      }),
    )
  },
)
