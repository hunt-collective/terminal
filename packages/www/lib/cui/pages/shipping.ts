import type Terminal from '@terminaldotshop/sdk'
import type { Model } from '../app'
import { createPage, styles } from '../render'
import { Box, Center, Flex, Stack, Text } from '../components'
import { CheckoutLayout } from '../layouts/checkout'
import {
  Form,
  handleFormUpdate,
  type FieldConfig,
  type FormState,
} from '../components/form'

export type ShippingState = {
  selected: number
  view: 'form' | 'list'
  busy: boolean
  form?: FormState<Terminal.AddressCreateParams>
}

const shippingFields: FieldConfig<Terminal.AddressCreateParams> = {
  name: { label: 'name', required: true },
  street1: { label: 'street 1', required: true },
  street2: { label: 'street 2' },
  city: { label: 'city', required: true },
  province: { label: 'state', required: true },
  country: { label: 'country', required: true },
  phone: { label: 'phone' },
  zip: {
    label: 'postal code',
    required: true,
    validate: (value) => {
      const zipRegex = /^\d{5}(-\d{4})?$/
      return {
        valid: zipRegex.test(value),
        message: !zipRegex.test(value)
          ? 'Enter a valid ZIP code (e.g. 12345 or 12345-6789)'
          : undefined,
      }
    },
  },
}

const initialFormState: (
  model: Model,
) => FormState<Terminal.AddressCreateParams> = (model) => ({
  values: {
    name: model.profile?.user.name || '',
    street1: '',
    street2: '',
    city: '',
    province: '',
    country: '',
    phone: '',
    zip: '',
  },
  errors: {},
})

function updateSelectedItem(model: Model, previous: boolean) {
  let next: number
  if (previous) {
    next = model.state.shipping.selected - 1
  } else {
    next = model.state.shipping.selected + 1
  }

  if (next < 0) {
    next = 0
  }
  const max = model.addresses?.length ?? 0
  if (next > max) {
    next = max
  }

  return next
}

function Address(address: Terminal.Address, selected: boolean) {
  return Box(
    Stack(
      [
        Text(address.name, selected ? styles.white : styles.gray),
        Text(address.street1),
        Flex([
          Text(address.city + ','),
          Text(address.province + ','),
          Text(address.country),
        ]),
        Text(address.zip),
      ],
      styles.gray,
    ),
    {
      padding: { x: 1, y: 0 },
      border: true,
      borderStyle: {
        color: selected ? styles.white : styles.gray,
      },
    },
  )
}

export const ShippingForm = (model: Model, state: ShippingState) => {
  const form = state.form || initialFormState(model)

  return Form({
    fields: shippingFields,
    state: form,
    width: model.dimensions.width,
    columns: 2,
  })
}

export const ShippingList = (model: Model, state: ShippingState) =>
  !model.cart?.items.length
    ? Text('You have no addresses', styles.gray)
    : Stack([
        ...model.addresses.map((item, index) =>
          Address(item, index === state.selected),
        ),
        Box(Center('add new address'), {
          padding: { x: 1, y: 0 },
          border: true,
          borderStyle: {
            color:
              state.selected === model.addresses.length
                ? styles.white
                : styles.gray,
          },
        }),
      ])

export const ShippingPage = createPage({
  name: 'shipping',
  view: (model, state) => {
    return CheckoutLayout({
      model,
      current: 'shipping',
      children: state.busy
        ? Text('calculating shipping costs...', styles.gray)
        : [
            state.view === 'list'
              ? ShippingList(model, state)
              : ShippingForm(model, state),
          ],
    })
  },
  update: (msg, model) => {
    if (msg.type !== 'browser:keydown') return

    // Form view handling
    if (model.state.shipping.view === 'form') {
      const formUpdate = handleFormUpdate(
        msg,
        model.state.shipping.form || initialFormState(model),
        shippingFields,
      )

      if (formUpdate) {
        if (!formUpdate.focusedField) {
          // Form was submitted or cancelled
          if (
            !formUpdate.errors ||
            Object.keys(formUpdate.errors).length === 0
          ) {
            // Form was successfully submitted
            return {
              state: {
                view: 'list' as const,
                form: undefined,
              },
              message: { type: 'app:focus-released' },
            }
          }

          // Form has validation errors
          return {
            state: { form: formUpdate },
          }
        }

        // Normal form update
        return {
          state: { form: formUpdate },
        }
      }
    }

    const { key } = msg.event
    const addresses = model.addresses || []
    const selectedAddress = addresses[model.state.shipping.selected]
    const addNewAddress = model.state.shipping.selected === addresses.length

    switch (key.toLowerCase()) {
      case 'arrowdown':
      case 'j':
        return { state: { selected: updateSelectedItem(model, false) } }

      case 'arrowup':
      case 'k':
        return { state: { selected: updateSelectedItem(model, true) } }

      case 'escape':
        return { message: { type: 'app:navigate', page: 'cart' } }

      case 'enter':
        if (addNewAddress) {
          return {
            state: { view: 'form' as const, form: initialFormState(model) },
            message: { type: 'app:focus-locked' },
          }
        }
        return {
          state: { busy: true },
          command: async () => {
            const client = await model.client()
            await client.cart.setAddress({ addressID: selectedAddress.id })
            const cart = await client.cart.get().then((r) => r.data)
            return [
              { type: 'cart:updated', cart },
              { type: 'app:navigate', page: 'payment' },
            ]
          },
        }
    }
  },
})
