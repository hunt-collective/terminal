package tui

import (
	"fmt"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/log"
	"github.com/terminaldotshop/terminal-sdk-go"
	"github.com/terminaldotshop/terminal/go/pkg/api"
)

type confirmState struct {
	submitting bool
	error      string
}

func (m model) ConfirmSwitch() (model, tea.Cmd) {
	m = m.SwitchPage(confirmPage)
	m.state.confirm.error = ""
	m.state.confirm.submitting = false
	m.state.footer.commands = []footerCommand{
		{key: "esc", value: "back"},
		{key: "enter", value: "next"},
	}
	return m, nil
}

func (m model) ConfirmUpdate(msg tea.Msg) (model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "esc":
			return m.PaymentSwitch()
		case "enter":
			m.state.confirm.submitting = true
			return m, func() tea.Msg {
				if m.IsSubscribing() {
					m.subscription.Quantity = terminal.Int(1)
					m.subscription.Frequency = terminal.F(terminal.SubscriptionFrequencyFixed)
					params := terminal.SubscriptionNewParams{Subscription: m.subscription}
					subscription, err := m.client.Subscription.New(m.context, params)
					if err != nil {
						return VisibleError{
							message: api.GetErrorMessage(err),
						}
						// return err
					}
					return subscription
				} else {
					order, err := m.client.Cart.Convert(m.context)
					if err != nil {
						return VisibleError{
							message: api.GetErrorMessage(err),
						}
					}
					return order.Data
				}
			}
		}
	case VisibleError:
		m.state.confirm.submitting = false
		m.state.payment.error = msg.message
		log.Error(msg.message)
		return m.ShippingSwitch()
	case terminal.Order:
		return m.FinalSwitch()
	case *terminal.SubscriptionNewResponse:
		return m.FinalSwitch()
	}
	return m, nil
}

func (m model) ConfirmView() string {
	if m.state.confirm.submitting {
		return m.theme.Base().Width(m.widthContent).Render("submitting order...")
	}

	card := m.GetSelectedCard()
	address := m.GetSelectedAddress()

	view := strings.Builder{}

	if m.IsSubscribing() {
		view.WriteString(
			m.theme.TextAccent().
				Render(m.state.subscribe.product.Name + ": " + m.state.subscribe.product.Variants[m.state.subscribe.selected].Name),
		)
		view.WriteString("\nMonthly Subscription\n")
		view.WriteString("\n")
	}
	view.WriteString(address.Name + "\n")
	view.WriteString(address.Street1 + "\n")
	if address.Street2 != "" {
		view.WriteString(address.Street2 + "\n")
	}
	view.WriteString(
		address.City + ", " + address.Province + ", " + address.Country + " " + address.Zip + "\n",
	)
	if !m.IsSubscribing() {
		view.WriteString("\n")
		view.WriteString(m.cart.Shipping.Service + "\n")
		if m.cart.Shipping.Timeframe != "" {
			view.WriteString(m.cart.Shipping.Timeframe + "\n")
		}
	}
	view.WriteString("\n")
	view.WriteString(fmt.Sprintf("CC: %s", formatLast4(card.Last4)) + "\n")
	var subtotal int
	var shipping int
	if m.IsSubscribing() {
		subtotal = int(m.state.subscribe.product.Variants[m.state.subscribe.selected].Price)
		shipping = 0
	} else {
		subtotal = int(m.cart.Amount.Subtotal)
		shipping = int(m.cart.Amount.Shipping)
	}
	total := subtotal + shipping

	view.WriteString(fmt.Sprintf("Subtotal: %s", formatUSD(subtotal)) + "\n")
	view.WriteString(fmt.Sprintf("Shipping: %s", formatUSD(shipping)) + "\n")
	view.WriteString(
		m.theme.TextAccent().
			Render(fmt.Sprintf("Total:    %s", formatUSD(total)) + "\n"),
	)
	view.WriteString("\n")
	view.WriteString(m.theme.TextHighlight().Render("press enter to confirm") + "\n")
	view.WriteString("\n")
	view.WriteString(m.theme.TextError().Render(m.state.confirm.error))

	return m.theme.Base().Render(view.String())
}

func formatUSD(cents int) string {
	dollars := cents / 100
	remainingCents := cents % 100
	return fmt.Sprintf("$%d.%02d", dollars, remainingCents)
}
