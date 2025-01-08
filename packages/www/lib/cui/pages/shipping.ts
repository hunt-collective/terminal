import type Terminal from '@terminaldotshop/sdk'
import { Component } from '../component'
import { Box, Center, Flex, Stack, Text } from '../components'
import { CheckoutLayout } from '../layouts/checkout'
import { Form, type FieldConfig, type FormState } from '../components/form'
import { styles } from '../render'
import { useState, useKeydown, useCart, useAddresses } from '../hooks'
import { useRouter } from '../router'

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

const AddressItem = Component<{
  address: Terminal.Address
  selected: boolean
}>((props) => {
  return Box({
    padding: { x: 1, y: 0 },
    border: true,
    borderStyle: {
      color: props.selected ? styles.white : styles.gray,
    },
    children: Stack([
      Text(props.address.name, props.selected ? styles.white : styles.gray),
      Text(props.address.street1, styles.gray),
      Flex({
        gap: 1,
        children: [
          Text(props.address.city + ',', styles.gray),
          Text(props.address.province + ',', styles.gray),
          Text(props.address.country, styles.gray),
        ],
      }),
      Text(props.address.zip, styles.gray),
    ]),
  })
})

export const ShippingPage = Component(() => {
  const { navigate } = useRouter()
  const { data: addresses } = useAddresses()
  const { data: cart } = useCart()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isFormView, setIsFormView] = useState(false)
  const [formState, setFormState] = useState<
    FormState<Terminal.AddressCreateParams>
  >({
    values: {
      name: '',
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

  if (!addresses || !cart) return Text('Loading...', styles.gray)

  // Navigation in list view
  if (!isFormView) {
    useKeydown(['ArrowDown', 'j'], () => {
      setSelectedIndex((prev) => Math.min(prev + 1, addresses.length))
    })

    useKeydown(['ArrowUp', 'k'], () => {
      setSelectedIndex((prev) => Math.max(0, prev - 1))
    })

    useKeydown('Enter', () => {
      if (selectedIndex === addresses.length) {
        setIsFormView(true)
      } else {
        // TODO: Set shipping address and navigate to payment
        navigate('payment')
      }
    })

    useKeydown('Escape', () => navigate('cart'))
  }

  return CheckoutLayout({
    current: 'shipping',
    children: [
      isFormView
        ? Form({
            fields: shippingFields,
            state: formState,
            columns: 2,
            columnGap: 2,
            onChange: (newState) => setFormState(newState),
            onSubmit: () => {
              // TODO: Create address and navigate to payment
              setIsFormView(false)
            },
            onCancel: () => setIsFormView(false),
          })
        : Stack({
            gap: 1,
            children: [
              ...addresses.map((address, index) =>
                AddressItem({
                  address,
                  selected: index === selectedIndex,
                }),
              ),
              Box(Center(Text('add new address', styles.gray)), {
                padding: { x: 1, y: 0 },
                border: true,
                borderStyle: {
                  color:
                    selectedIndex === addresses.length
                      ? styles.white
                      : styles.gray,
                },
              }),
            ],
          }),
    ],
  })
})
