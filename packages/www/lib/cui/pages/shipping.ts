import type Terminal from '@terminaldotshop/sdk'
import type { Model } from '../app'
import { createPage, styles } from '../render'
import { Box, Center, Flex, Stack, Text } from '../components'
import { CheckoutLayout } from '../layouts/checkout'

export type ShippingState = {
  selected: number
  view: 'form' | 'list'
}

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
        Text(address.street1, styles.gray),
        Flex([
          Text(address.city + ',', styles.gray),
          Text(address.province + ',', styles.gray),
          Text(address.country, styles.gray),
        ]),
        Text(address.zip, styles.gray),
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
  return Center('Not implemented, yet')
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
      children: [
        state.view === 'list'
          ? ShippingList(model, state)
          : ShippingForm(model, state),
      ],
    })
  },
  update: (msg, model) => {
    if (msg.type !== 'browser:keydown') return

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
          model.state.shipping.view = 'form'
          return { state: model.state.shipping }
        }
        return { message: { type: 'app:navigate', page: 'payment' } }
    }
  },
})
