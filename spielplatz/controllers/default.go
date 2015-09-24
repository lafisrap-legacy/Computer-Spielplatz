package controllers

import (
	"github.com/astaxie/beego"
	_ "github.com/lavisrap/Computer-Spielplatz/spielplatz/models"
	"html/template"
)

//////////////////////////////////////////////////
// Main Application Types
//
// User is the basic structure for user information
type User struct {
	Id    int    `form:"-"`
	Name  string `form:"name"`
	Pwd   string `form:"password"`
	Email string `form:"name"`
}

type Art struct {
	Name string
	Size string
	File string
}

//////////////////////////////////////////////////
// Main Controllers (Root, Login, Error)
//

/////////////////////////////
// RootController serves the document root (/)
type RootController struct {
	beego.Controller
}

//////////////////////////////
// LoginController serves the login redirction page
type LoginController struct {
	beego.Controller
}

///////////////////////////////
// ErrorController serves all weg errors
type ErrorController struct {
	beego.Controller
}

///////////////////////////////////////////////////////
// RootController functions
//
// Prepare is not used
func (c *RootController) Prepare() {
}

///////////////////////////////
// Get
func (c *RootController) Get() {
	v := c.GetSession("computerspielplatzID")
	if v == nil {
		c.SetSession("computerspielplatzID", int(1))
		c.Data["Topic"] = 0
	} else {
		c.SetSession("computerspielplatzID", v.(int)+1)
		c.Data["Topic"] = v.(int)
		if v.(int) > 5 {
			//c.Abort("404")
		}
	}

	c.Data["Arts"] = []Art{{
		Name: "Programmieren",
		Size: "lg",
		File: "programmieren.html",
	}, {
		Name: "Grafik & Animation",
		Size: "lg",
		File: "grafik.html",
	}, {
		Name: "Sound & Music",
		Size: "lg",
		File: "sound.html",
	}, {
		Name: "Texte",
		Size: "lg",
		File: "texte.html",
	}, {
		Name: "Spiele erfinden",
		Size: "lg",
		File: "erfinden.html",
	}, {
		Name: "Spiel-Steuerung",
		Size: "lg",
		File: "steuerung.html",
	}, {
		Name: "Hacken (Freestyle)",
		Size: "lg",
		File: "hacken.html",
	}}
	c.Data["xsrfdata"] = template.HTML(c.XsrfFormHtml())
	c.Data["Title"] = "Computer-Spielplatz"
	c.TplNames = "index.html"
}

//////////////////////////////////////////////////////////
// LoginController functions
//
// Get
func (c *LoginController) Get() {
	c.Data["xsrfdata"] = template.HTML(c.XsrfFormHtml())
	c.TplNames = "login.html"
}

///////////////////////////////////
// Post
func (c *LoginController) Post() {
	u := User{}
	if err := c.ParseForm(&u); err != nil {
		c.TplNames = "login.html"
	} else {
		c.Data["xsrfdata"] = template.HTML(c.XsrfFormHtml())
		c.Data["Title"] = u.Name
		c.Data["Topic"] = u.Pwd
		c.TplNames = "index.html"
	}
}

/////////////////////////////////////////////////////////////
// Error Controller functions
//
//
// Error 404
func (c *ErrorController) Error404() {
	beego.Trace("This is a trace ...")
	beego.Error("This is an Errorr ...")
	c.Data["content"] = "page not found"
	c.TplNames = "404.html"
}

////////////////////////////////////
// Error 501
func (c *ErrorController) Error501() {
	c.Data["content"] = "internal server error"
	c.TplNames = "501.html"
}

////////////////////////////////////
// Database Error
func (c *ErrorController) ErrorDB() {
	c.Data["content"] = "database is now down"
	c.TplNames = "dberror.html"
}
