package tui

import (
	"fmt"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	terminal "github.com/terminaldotshop/terminal-sdk-go"
)

type ordersState struct {
	selected int
	// deleting *int
}

func (m model) nextOrder() (model, tea.Cmd) {
	next := m.state.orders.selected + 1
	max := len(m.orders) - 1
	if next > max {
		next = max
	}

	m.state.orders.selected = next
	return m, nil
}

func (m model) previousOrder() (model, tea.Cmd) {
	next := m.state.orders.selected - 1
	if next < 0 {
		next = 0
	}

	m.state.orders.selected = next
	return m, nil
}

func (m model) OrdersUpdate(msg tea.Msg) (model, tea.Cmd) {
	m.state.footer.commands = []footerCommand{
		{key: "↑/↓", value: "navigate"},
		{key: "esc", value: "back"},
	}

	cmds := []tea.Cmd{}

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "j", "down", "tab":
			return m.nextOrder()
		case "k", "up", "shift+tab":
			return m.previousOrder()
		}
	}

	return m, tea.Batch(cmds...)
}

func (m model) formatOrderItem(orderItem terminal.OrderItem) string {
	var product *terminal.Product
	// var variant *terminal.ProductVariant
	for _, p := range m.products {
		for _, v := range p.Variants {
			if v.ID == orderItem.ProductVariantID {
				product = &p
				// variant = &v
			}
		}
	}

	return fmt.Sprintf("%dx %s", orderItem.Quantity, product.Name)
}

func (m model) formatOrder(order terminal.Order, totalWidth int, index int) string {
	orderNumber := fmt.Sprintf("Order #%d", index)
	price := fmt.Sprintf("$%2v", (order.Amount.Subtotal+order.Amount.Shipping)/100)
	space := totalWidth - lipgloss.Width(
		orderNumber,
	) - lipgloss.Width(price) - 2
	content := lipgloss.JoinHorizontal(
		lipgloss.Top,
		m.theme.TextAccent().Render(orderNumber),
		m.theme.Base().Width(space).Render(),
		m.theme.Base().Render(price),
	)

	lines := []string{}
	lines = append(lines, content)
	for _, item := range order.Items {
		lines = append(lines, m.formatOrderItem(item))
	}

	// if index == m.state.orders.selected && m.state.account.focused {
	// 	lines = append(lines, order.Tracking.Service+" ("+order.Tracking.Number+")")
	// }

	return lipgloss.JoinVertical(lipgloss.Left, lines...)
}

func (m model) OrdersView(totalWidth int, focused bool) string {
	base := m.theme.Base().Render
	// accent := m.theme.TextAccent().Render

	orders := []string{}
	for i, order := range m.orders {
		content := m.formatOrder(order, totalWidth, len(m.orders)-i-1)
		box := m.CreateBoxCustom(
			content,
			focused && i == m.state.orders.selected,
			totalWidth,
		)
		orders = append(orders, box)
	}

	orderList := lipgloss.JoinVertical(lipgloss.Left, orders...)
	if len(orders) == 0 {
		return lipgloss.Place(
			totalWidth,
			m.heightContent,
			lipgloss.Center,
			lipgloss.Center,
			base("no orders found"),
		)
	}

	return m.theme.Base().Render(lipgloss.JoinVertical(
		lipgloss.Left,
		orderList,
	))
}
