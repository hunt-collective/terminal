import { Fragment } from 'react/jsx-runtime'

type BreadcrumbsProps = {
  steps: string[]
  current: string
}

export const Breadcrumbs = ({ current, steps }: BreadcrumbsProps) => (
  <div className="flex gap-1 text-gray">
    {steps.map((step, index) => (
      <Fragment>
        <span className={{ 'text-white': step === current }}>{step}</span>
        {index < steps.length - 1 && <span>/</span>}
      </Fragment>
    ))}
  </div>
)
