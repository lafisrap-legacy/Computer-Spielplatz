package controllers

import (
	"errors"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/session"
	"github.com/lavisrap/Computer-Spielplatz/spielplatz/models"
	"html/template"
)

var globalSessions *session.Manager

//////////////////////////////////////////////////
// Main Session Types
//
type Session struct {
	UserId string
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

//////////////////////////////
// LoginController serves the logout redirction page
type LogoutController struct {
	beego.Controller
}

//////////////////////////////
// SignupController serves the signup redirction page
type SignupController struct {
	beego.Controller
}

//////////////////////////////
// LiveEditorController brings the Khan-Academy Live-Editor to life
type LiveEditorController struct {
	beego.Controller
}

//////////////////////////////
// LiveEditorController brings the Khan-Academy Live-Editor to life
type LiveEditorBuildController struct {
	beego.Controller
}

///////////////////////////////
// ErrorController serves all weg errors
type ErrorController struct {
	beego.Controller
}

///////////////////////////////////////////////////////
// init function
func init() {
	globalSessions, _ = session.NewManager("memory", `{"cookieName":"computerspielplatzID", "enableSetCookie,omitempty": true, "gclifetime":3600, "maxLifetime": 3600, "secure": false, "sessionIDHashFunc": "sha1", "sessionIDHashKey": "", "cookieLifeTime": 3600, "providerConfig": ""}`)
	go globalSessions.GC()
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

	w := c.Ctx.ResponseWriter
	r := c.Ctx.Request

	s, _ := globalSessions.SessionStart(w, r)
	defer s.SessionRelease(w)

	c.Data["UserName"] = s.Get("UserName")
	c.Data["xsrfdata"] = template.HTML(c.XsrfFormHtml())
	c.TplNames = "index.html"
	setTitleData(c.Data)
}

func setTitleData(data map[interface{}]interface{}) {
	T := models.T

	data["Arts"] = []models.Art{{
		Name: T["arts_programming"],
		Size: "lg",
		File: "programmieren.html",
	}, {
		Name: T["arts_graphics"],
		Size: "lg",
		File: "grafik.html",
	}, {
		Name: T["arts_sound"],
		Size: "lg",
		File: "sound.html",
	}, {
		Name: T["arts_texts"],
		Size: "lg",
		File: "texte.html",
	}, {
		Name: T["arts_gamedesign"],
		Size: "lg",
		File: "erfinden.html",
	}, {
		Name: T["arts_controllers"],
		Size: "lg",
		File: "steuerung.html",
	}, {
		Name: T["arts_hacking"],
		Size: "lg",
		File: "hacken.html",
	}}
	data["Title"] = T["Title"]
	data["Subtitle"] = T["Subtitle"]
}

//////////////////////////////////////////////////////////
// LoginController functions
//
// Get
func (c *LoginController) Get() {
	///////////////////////////////////
	// Session prefix
	w := c.Ctx.ResponseWriter
	r := c.Ctx.Request
	s, _ := globalSessions.SessionStart(w, r)
	defer s.SessionRelease(w)

	c.Data["xsrfdata"] = template.HTML(c.XsrfFormHtml())
	c.TplNames = "login.html"
}

///////////////////////////////////
// Post
func (c *LoginController) Post() {
	///////////////////////////////////
	// Session prefix
	w := c.Ctx.ResponseWriter
	r := c.Ctx.Request
	s, _ := globalSessions.SessionStart(w, r)
	defer s.SessionRelease(w)

	var (
		u   models.User
		err error
	)
	uf := models.UserForm{}
	if err = c.ParseForm(&uf); err == nil {
		if u, err = models.Login(&uf); err == nil {
			s.Set("UserName", u.Name)
			s.Set("Email", u.Email)
			c.Ctx.Redirect(302, "/")
		}
	}

	c.Data["Error"] = err.Error()
	c.Data["xsrfdata"] = template.HTML(c.XsrfFormHtml())
	c.TplNames = "login.html"
}

//////////////////////////////////////////////////////////
// LoginController functions
//
// Get
func (c *LogoutController) Get() {
	///////////////////////////////////
	// Session prefix
	w := c.Ctx.ResponseWriter
	r := c.Ctx.Request
	s, _ := globalSessions.SessionStart(w, r)
	defer s.SessionRelease(w)

	s.Delete("UserName")
	s.Delete("Email")

	c.Ctx.Redirect(302, "/")
}

//////////////////////////////////////////////////////////
// SignupController functions
//
// Get
func (c *SignupController) Get() {
	c.Data["xsrfdata"] = template.HTML(c.XsrfFormHtml())
	c.TplNames = "signup.html"
}

///////////////////////////////////
// Post
func (c *SignupController) Post() {
	///////////////////////////////////
	// Session prefix
	w := c.Ctx.ResponseWriter
	r := c.Ctx.Request
	s, _ := globalSessions.SessionStart(w, r)
	defer s.SessionRelease(w)

	var (
		u   models.User
		err error
	)
	T := models.T
	uf := models.UserForm{}
	if err = c.ParseForm(&uf); err == nil {
		if uf.Pwd == uf.Pwd2 {
			if u, err = models.Signup(&uf); err == nil {
				s.Set("UserName", u.Name)
				s.Set("Email", u.Email)

				c.Ctx.Redirect(302, "/")
			} else {
				c.Data["Name"] = uf.Name
				c.Data["Pwd"] = uf.Pwd
			}
		} else {
			c.Data["Name"] = uf.Name
			err = errors.New(T["signup_passwords_dont_match"])
		}
	}

	c.Data["Error"] = err.Error()
	c.TplNames = "signup.html"
	c.Data["xsrfdata"] = template.HTML(c.XsrfFormHtml())
}

//////////////////////////////////////////////////////////
// LiveEditorController functions
//
// Get
func (c *LiveEditorController) Get() {
	file := c.Ctx.Input.Param(":file")

	c.Data["xsrfdata"] = template.HTML(c.XsrfFormHtml())

	if file != "" {
		c.TplNames = "live-editor/demos/simple/" + c.Ctx.Input.Param(":file")
	} else {
		c.TplNames = "live-editor/demos/simple/index.html"
	}
}

//////////////////////////////////////////////////////////
// LiveEditorBuildController functions
//
// Get
func (c *LiveEditorBuildController) Get() {
	beego.Trace("This is my filename: ", c.Ctx.Input.Param(":file"))
	c.Data["xsrfdata"] = template.HTML(c.XsrfFormHtml())
	c.TplNames = "live-editor/build/js/" + c.Ctx.Input.Param(":file")
}

/////////////////////////////////////////////////////////////
// Error Controller functions
//
// Error 404
func (c *ErrorController) Error404() {
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
