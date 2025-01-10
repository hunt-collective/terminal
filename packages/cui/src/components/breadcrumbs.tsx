import { styles } from "@/styles"
import { Flex, Text } from "@textjs/core/components"

type BreadcrumbsProps = {
  steps: string[]
  current: string
}

export const Breadcrumbs = ({ current, steps }: BreadcrumbsProps) => (
  <Flex gap={1}>
    {steps.map((step, index) => (
      <>
        <Text style={step === current ? styles.white : styles.gray}>
          {step}
        </Text>
        {index < steps.length - 1 && <Text style={styles.gray}>/</Text>}
      </>
    ))}
  </Flex>
)
