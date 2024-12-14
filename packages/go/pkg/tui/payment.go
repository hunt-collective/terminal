package tui

import (
	"fmt"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/huh"
	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/log"
	"github.com/stripe/stripe-go/v78"
	terminal "github.com/terminaldotshop/terminal-sdk-go"
	"github.com/terminaldotshop/terminal/go/pkg/api"
	"github.com/terminaldotshop/terminal/go/pkg/tui/validate"
)

type paymentView = int

const (
	paymentListView paymentView = iota
	paymentFormView
)

type paymentInput struct {
	number string
	month  string
	year   string
	zip    string
}

type paymentState struct {
	selected   int
	deleting   *int
	view       paymentView
	input      paymentInput
	form       *huh.Form
	submitting bool
	error      string
}

type SelectedCardUpdatedMsg struct {
	cardID string
}

func (m model) GetSelectedCard() *terminal.Card {
	if m.IsSubscribing() {
		for _, card := range m.cards {
			if card.ID == m.subscription.CardID.Value {
				return &card
			}
		}
		return nil
	}

	for _, card := range m.cards {
		if card.ID == m.cart.CardID {
			return &card
		}
	}
	return nil
}

func (m model) PaymentSwitch() (model, tea.Cmd) {
	if m.IsCartEmpty() && !m.IsSubscribing() {
		return m, nil
	}
	m = m.SwitchPage(paymentPage)
	m.state.footer.commands = []footerCommand{
		{key: "esc", value: "back"},
		{key: "↑/↓", value: "cards"},
		{key: "x/del", value: "remove"},
		{key: "enter", value: "select"},
	}
	m.state.payment.submitting = false
	m.state.payment.form = huh.NewForm(
		huh.NewGroup(
			huh.NewInput().
				Title("name").
				Key("name").
				Value(&m.user.Name).
				Validate(validate.NotEmpty("name")),
			huh.NewInput().
				Title("email address").
				Key("email").
				Value(&m.user.Email).
				Validate(
					validate.Compose(
						validate.NotEmpty("email address"),
						validate.EmailValidator,
					),
				),
			huh.NewInput().
				Title("card number").
				Key("number").
				Value(&m.state.payment.input.number).
				Validate(validate.CcnValidator),
		),
		huh.NewGroup(
			huh.NewInput().
				Title("expiry month").
				Key("month").
				Value(&m.state.payment.input.month).
				Validate(
					validate.Compose(
						validate.NotEmpty("expiry month"),
						validate.IsDigits("expiry month"),
						validate.MustBeLen(2, "expiry month"),
					),
				),
			huh.NewInput().
				Title("expiry year").
				Key("year").
				Value(&m.state.payment.input.year).
				Validate(
					validate.Compose(
						validate.NotEmpty("expiry year"),
						validate.IsDigits("expiry year"),
						validate.MustBeLen(2, "expiry year"),
					),
				),
			huh.NewInput().
				Title("cvc number").
				Key("cvc").
				Validate(
					validate.Compose(
						validate.NotEmpty("cvc"),
						validate.IsDigits("cvc"),
						validate.WithinLen(3, 4, "cvc"),
					),
				),
			huh.NewInput().
				Title("zip").
				Key("zip").
				Value(&m.state.payment.input.zip).
				Validate(
					validate.Compose(
						validate.NotEmpty("zip"),
					),
				),
		),
	).
		WithTheme(m.theme.Form()).
		WithShowHelp(false)

	m.state.payment.view = paymentListView
	if len(m.cards) == 0 {
		m.state.payment.view = paymentFormView
	}

	m = m.updatePaymentForm()
	return m, m.state.payment.form.Init()
}

type VisibleError struct {
	message string
}

func getCleanCardNumber(cardNumber string) string {
	var cleanNumber strings.Builder
	for _, char := range cardNumber {
		if char >= '0' && char <= '9' {
			cleanNumber.WriteRune(char)
		}
	}
	return cleanNumber.String()
}

func formatLast4(last4 string) string {
	hiddenPart := "**** **** **** "
	return hiddenPart + last4
}

func formatExpiration(expiration terminal.CardExpiration) string {
	return fmt.Sprintf("%02d/%02d", expiration.Month, expiration.Year%100)
}

func (m model) updatePaymentForm() model {
	if m.size == small {
		m.state.payment.form = m.state.payment.form.
			WithLayout(huh.LayoutStack).
			WithWidth(m.widthContent)
	} else {
		m.state.payment.form = m.state.payment.form.
			WithLayout(huh.LayoutColumns(2)).
			WithWidth(m.widthContent)
	}

	return m
}

func (m model) nextPaymentMethod() (model, tea.Cmd) {
	next := m.state.payment.selected + 1
	max := len(m.cards) // add new
	if next > max {
		next = max
	}

	m.state.payment.selected = next
	return m, nil
}

func (m model) previousPaymentMethod() (model, tea.Cmd) {
	next := m.state.payment.selected - 1
	if next < 0 {
		next = 0
	}

	m.state.payment.selected = next
	return m, nil
}

func (m model) SetCard(cardID string) {
	if m.IsSubscribing() {
		return
	}

	params := terminal.CartSetCardParams{CardID: terminal.F(cardID)}
	_, err := m.client.Cart.SetCard(m.context, params)
	if err != nil {
	}
}

func (m model) choosePaymentMethod() (model, tea.Cmd) {
	if m.state.payment.selected < len(m.cards) { // existing method
		cardID := m.cards[m.state.payment.selected].ID
		return m, func() tea.Msg {
			m.SetCard(cardID)
			return SelectedCardUpdatedMsg{cardID: cardID}
		}
	} else { // new
		m.state.payment.input = paymentInput{}
		m.state.payment.view = paymentFormView
	}

	return m, nil
}

func (m model) paymentListUpdate(msg tea.Msg) (model, tea.Cmd) {
	cmds := []tea.Cmd{}

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "j", "down", "tab":
			if m.state.payment.deleting == nil {
				return m.nextPaymentMethod()
			}
		case "k", "up", "shift+tab":
			if m.state.payment.deleting == nil {
				return m.previousPaymentMethod()
			}
		case "delete", "d", "backspace", "x":
			if m.state.payment.deleting == nil && m.state.payment.selected < len(m.cards) {
				m.state.payment.deleting = &m.state.payment.selected
			}
			return m, nil
		case "y":
			if m.state.payment.deleting != nil {
				m.state.payment.deleting = nil
				m.client.Card.Delete(m.context, m.cards[m.state.payment.selected].ID)
				if len(m.cards)-1 == 0 && m.page == accountPage {
					m.state.account.focused = false
				}
				return m, func() tea.Msg {
					cards, err := m.client.Card.List(m.context)
					if err != nil {
					}
					return cards.Data
				}
			}
			return m, nil
		case "n":
			m.state.payment.deleting = nil
			return m, nil
		case "enter":
			if m.state.payment.deleting == nil {
				return m.choosePaymentMethod()
			}
		case "esc":
			if m.state.payment.deleting != nil {
				m.state.payment.deleting = nil
			} else {
				return m.ShippingSwitch()
			}
		}
	}

	return m, tea.Batch(cmds...)
}

func (m model) paymentFormUpdate(msg tea.Msg) (model, tea.Cmd) {
	cmds := []tea.Cmd{}

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "esc":
			if len(m.cards) == 0 {
				return m.ShippingSwitch()
			}
			m.state.payment.view = paymentListView
			return m, nil
		}
	case *stripe.Token:
		params := terminal.CardNewParams{Token: terminal.F(msg.ID)}
		response, err := m.client.Card.New(m.context, params)

		if err != nil {
			m, cmd := m.PaymentSwitch()
			m.state.payment.view = paymentFormView
			m.state.payment.error = api.GetErrorMessage(err)
			return m, cmd
		}

		cards, _ := m.client.Card.List(m.context)

		m.cards = cards.Data
		return m, func() tea.Msg {
			m.SetCard(response.Data)
			return SelectedCardUpdatedMsg{cardID: response.Data}
		}

	case VisibleError:
		m, cmd := m.PaymentSwitch()
		m.state.payment.view = paymentFormView
		m.state.payment.error = msg.message
		return m, cmd
	}

	m = m.updatePaymentForm()

	next, cmd := m.state.payment.form.Update(msg)
	m.state.payment.form = next.(*huh.Form)
	cmds = append(cmds, cmd)
	if !m.state.payment.submitting && m.state.payment.form.State == huh.StateCompleted {
		m.state.payment.error = ""
		m.state.payment.submitting = true

		form := m.state.payment.form
		m.user.Name = form.GetString("name")
		m.user.Email = form.GetString("email")
		m.state.payment.input = paymentInput{
			number: form.GetString("number"),
			month:  form.GetString("month"),
			year:   form.GetString("year"),
			zip:    form.GetString("zip"),
		}

		return m, tea.Batch(func() tea.Msg {
			result, err := api.StripeCreditCard(&stripe.CardParams{
				Name:       stripe.String(m.user.Name),
				Number:     stripe.String(getCleanCardNumber(m.state.payment.input.number)),
				ExpMonth:   stripe.String(m.state.payment.input.month),
				ExpYear:    stripe.String(m.state.payment.input.year),
				CVC:        stripe.String(form.GetString("cvc")),
				AddressZip: stripe.String(m.state.payment.input.zip),
			})
			if err != nil {
				log.Error(*err)
				return VisibleError{message: *err}
			}
			return result
		}, func() tea.Msg {
			params := terminal.UserUpdateParams{
				Name:  terminal.String(m.user.Name),
				Email: terminal.String(m.user.Email),
			}
			response, err := m.client.User.Update(m.context, params)
			if err != nil {
			}
			return response.Data
		})
	}

	return m, tea.Batch(cmds...)
}

func (m model) PaymentUpdate(msg tea.Msg) (model, tea.Cmd) {
	switch msg := msg.(type) {
	case SelectedCardUpdatedMsg:
		if m.IsSubscribing() {
			m.subscription.CardID = terminal.String(msg.cardID)
		} else {
			m.cart.CardID = msg.cardID
		}
		return m.ConfirmSwitch()
	}

	if m.state.payment.view == paymentListView {
		return m.paymentListUpdate(msg)
	} else {
		return m.paymentFormUpdate(msg)
	}
}

func (m model) PaymentView() string {
	if m.state.payment.submitting {
		return m.theme.Base().Width(m.widthContent).Render("verifying payment details...")
	}

	if m.state.payment.view == paymentListView {
		return m.paymentListView()
	} else {
		return m.paymentFormView()
	}
}

func (m model) paymentListView() string {
	base := m.theme.Base().Render
	accent := m.theme.TextAccent().Render
	methods := []string{}
	for i, card := range m.cards {
		number := formatLast4(accent(card.Last4))
		contentWidth := lipgloss.Width(number)

		expir := accent(formatExpiration(card.Expiration))
		brand := base(card.Brand)
		space := contentWidth - lipgloss.Width(brand) - lipgloss.Width(expir)
		expLine := lipgloss.JoinHorizontal(
			lipgloss.Center,
			brand,
			m.theme.Base().Width(space).Render(),
			expir,
		)
		content := lipgloss.JoinVertical(lipgloss.Left, number, expLine)
		if m.state.payment.deleting != nil && *m.state.payment.deleting == i {
			content = accent("are you sure?") + base("\n(y/n)")
		}

		method := m.CreateBox(content, i == m.state.payment.selected)
		methods = append(methods, method)
	}

	newInSshIndex := len(m.cards)
	newInSsh := m.CreateCenteredBox("add payment method", m.state.payment.selected == newInSshIndex)
	methods = append(methods, newInSsh)

	hint := "use selected payment method"
	if m.state.payment.selected == newInSshIndex {
		hint = "create new payment method here"
	}

	return m.theme.Base().Render(lipgloss.JoinVertical(
		lipgloss.Left,
		m.paymentCostsView(),
		lipgloss.JoinVertical(lipgloss.Left, methods...),
		accent("enter ")+base(hint),
	))
}

func (m model) paymentFormView() string {
	return m.theme.Base().Render(lipgloss.JoinVertical(
		lipgloss.Left,
		m.paymentCostsView(),
		"\ncreate new payment method:\n",
		m.state.payment.form.View(),
		m.theme.TextError().Render(m.state.payment.error),
	))
}

func (m model) paymentCostsView() string {
	if m.IsSubscribing() {
		price := m.state.subscribe.product.Variants[m.state.subscribe.selected].Price
		view := strings.Builder{}
		view.WriteString(fmt.Sprintf("Subtotal: %s", formatUSD(int(price))) + "\n")
		view.WriteString(fmt.Sprintf("Shipping: %s", formatUSD(int(0))) + "\n")
		view.WriteString(
			m.theme.TextAccent().
				Render(fmt.Sprintf("Total:    %s", formatUSD(int(price)))),
		)

		return view.String()
	}

	view := strings.Builder{}
	view.WriteString(fmt.Sprintf("Subtotal: %s", formatUSD(int(m.cart.Amount.Subtotal))) + "\n")
	view.WriteString(fmt.Sprintf("Shipping: %s", formatUSD(int(m.cart.Amount.Shipping))) + "\n")
	view.WriteString(
		m.theme.TextAccent().
			Render(fmt.Sprintf("Total:    %s", formatUSD(int(m.cart.Amount.Subtotal+m.cart.Amount.Shipping)))),
	)

	return view.String()
}
