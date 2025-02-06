package main

import (
	"fmt"

	"github.com/terminaldotshop/terminal/go/pkg/tui/qrfefe"
)

func main() {
	fmt.Println("we are selling coffee. coffee -> covfefe -> qr code -> qrfefe. obviously.")
	fmt.Println("pronounced: ker - feffay")

	str, _, err := qrfefe.Generate(1, "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Print(str)
}
