package main

import (
	"github.com/astaxie/beego"
	_ "github.com/lavisrap/Computer-Spielplatz/spielplatz/routers"
)

func init() {
}

func main() {
	beego.SessionOn = true
	beego.Run()
}
