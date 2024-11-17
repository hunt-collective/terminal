package tui

import (
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	terminal "github.com/terminaldotshop/terminal-sdk-go"
	"github.com/terminaldotshop/terminal-sdk-go/option"
	"github.com/terminaldotshop/terminal/go/pkg/api"
	"github.com/terminaldotshop/terminal/go/pkg/resource"
)

type SplashState struct {
	data  bool
	delay bool
}

type UserSignedInMsg struct {
	accessToken string
	client      *terminal.Client
}

type DelayCompleteMsg struct{}

func (m model) LoadCmds() []tea.Cmd {
	cmds := []tea.Cmd{}

	// Make sure the loading state shows for at least a couple seconds
	cmds = append(cmds, tea.Tick(time.Second*2, func(t time.Time) tea.Msg {
		return DelayCompleteMsg{}
	}))

	cmds = append(cmds, func() tea.Msg {
		response, err := m.client.User.Init(m.context)
		if err != nil {
		}
		return response.Result
	})

	return cmds
}

func (m model) IsLoadingComplete() bool {
	return m.state.splash.data &&
		m.state.splash.delay
}

func (m model) SplashInit() tea.Cmd {
	cmd := func() tea.Msg {
		// TODO: error handling
		token, err := api.FetchUserToken(m.fingerprint)
		if err != nil {
		}

		client := terminal.NewClient(
			option.WithBaseURL(resource.Resource.OpenApiWorker.Url),
			option.WithBearerToken(token.AccessToken),
		)

		return UserSignedInMsg{
			accessToken: token.AccessToken,
			client:      client,
		}
	}

	return tea.Batch(m.CursorInit(), cmd)
}

func (m model) SplashUpdate(msg tea.Msg) (model, tea.Cmd) {
	switch msg := msg.(type) {
	case UserSignedInMsg:
		m.client = msg.client
		m.accessToken = msg.accessToken
		return m, tea.Batch(m.LoadCmds()...)
	case DelayCompleteMsg:
		m.state.splash.delay = true
	case terminal.UserInitResponseResult:
		m.state.splash.data = true
	}

	if m.IsLoadingComplete() {
		return m.ShopSwitch()
	}
	return m, nil
}

func (m model) SplashView() string {
	return lipgloss.Place(
		m.viewportWidth,
		m.viewportHeight,
		lipgloss.Center,
		lipgloss.Center,
		m.LogoView(),
	)
}
