package routers

import (
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/context"
	"github.com/lavisrap/Computer-Spielplatz/spielplatz/controllers"
)

func init() {
	beego.Router("/", &controllers.RootController{})
	beego.Router("/login", &controllers.LoginController{})

	var FilterUser = func(ctx *context.Context) {
		_, ok := ctx.Input.Session("uid").(int)
		if !ok {
			ctx.Redirect(302, "/login")
		}
	}

	beego.InsertFilter("/user/:id([0-9]+)", beego.BeforeRouter, FilterUser)

	beego.ErrorController(&controllers.ErrorController{})
	beego.SetLogger("file", `{"filename":"log/spielplatz.log"}`)
}
