package controllers

import (
	"errors"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/session"
	"github.com/lavisrap/Computer-Spielplatz/spielplatz/models"
	"html/template"
	"os"
	"time"
)

var globalSessions *session.Manager

//////////////////////////////////////////////////
// Main Session Types
//
type Session struct {
	UserId string
}

type SessionXsrfStruct struct {
	Session   session.SessionStore
	Timestamp time.Time
}

type SessionXsrf map[string]SessionXsrfStruct

//////////////////////////////////////////////////
// Global Session Variables
var SessionXsrfTable SessionXsrf

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
//
type PtestController struct {
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

	SessionXsrfTable = make(SessionXsrf)
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

	s := c.StartSession()

	//c.Data["Sid"] = s.SessionID()
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
		Page: "live-editor.html",
	}, {
		Name: T["arts_graphics"],
		Size: "lg",
		File: "grafik.html",
		Page: "#",
	}, {
		Name: T["arts_sound"],
		Size: "lg",
		File: "sound.html",
		Page: "#",
	}, {
		Name: T["arts_texts"],
		Size: "lg",
		File: "texte.html",
		Page: "#",
	}, {
		Name: T["arts_gamedesign"],
		Size: "lg",
		File: "erfinden.html",
		Page: "#",
	}, {
		Name: T["arts_controllers"],
		Size: "lg",
		File: "steuerung.html",
		Page: "#",
	}, {
		Name: T["arts_hacking"],
		Size: "lg",
		File: "hacken.html",
		Page: "#",
	}}
	data["LoginLogin"] = T["login_login"]
	data["LoginSignup"] = T["login_signup"]
	data["LoginLogout"] = T["login_logout"]
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
	c.Data["Destination"] = "/" + c.Ctx.Input.Param(":dest")
	c.TplNames = "login.html"
}

///////////////////////////////////
// Post
func (c *LoginController) Post() {
	///////////////////////////////////
	// Session prefix
	s := c.StartSession()

	var (
		u   models.User
		err error
	)
	uf := models.UserForm{}
	dest := c.Ctx.Input.Query("_dest")
	if dest == "" {
		dest = "/"
	}
	if err = c.ParseForm(&uf); err == nil {
		if u, err = models.Login(&uf); err == nil {
			s.Set("UserName", u.Name)
			s.Set("Email", u.Email)
			c.Ctx.Redirect(302, dest)
			return
		}
	}

	c.Data["Error"] = err.Error()
	c.Data["xsrfdata"] = template.HTML(c.XsrfFormHtml())
	c.Data["Destination"] = dest
	c.TplNames = "login.html"
}

//////////////////////////////////////////////////////////
// LoginController functions
//
// Get
func (c *LogoutController) Get() {

	s := c.StartSession()

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
	c.Data["Destination"] = "/" + c.Ctx.Input.Param(":dest")
	c.TplNames = "signup.html"
}

///////////////////////////////////
// Post
func (c *SignupController) Post() {
	s := c.StartSession()

	var (
		u   models.User
		err error
	)
	T := models.T
	uf := models.UserForm{}
	dest := c.Ctx.Input.Query("_dest")
	beego.Trace("Destination:", dest)
	if dest == "" {
		dest = "/"
	}
	if err = c.ParseForm(&uf); err == nil {
		if uf.Pwd == uf.Pwd2 {
			if u, err = models.Signup(&uf); err == nil {
				s.Set("UserName", u.Name)
				s.Set("Email", u.Email)

				c.setupAccount(u.Name)
				c.Ctx.Redirect(302, dest)
				return
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
	c.Data["Destination"] = dest
	c.Data["xsrfdata"] = template.HTML(c.XsrfFormHtml())
}

func (c *SignupController) setupAccount(userName string) {

	dir := beego.AppConfig.String("userdata::location") + userName + "/" + beego.AppConfig.String("userdata::jsfiles")
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		beego.Error("Cannot create directory.")
	}
}

//////////////////////////////////////////////////////////
// LiveEditorController functions
//
// Get
func (c *LiveEditorController) Get() {
	T := models.T
	s := c.StartSession()

	c.Data["UserName"] = s.Get("UserName")
	c.Data["ControlBarLabel"] = T["control_bar_label"]
	c.Data["ControlBarSave"] = T["control_bar_save"]
	c.Data["ControlBarSaveAs"] = T["control_bar_save_as"]
	c.Data["ControlBarSaved"] = T["control_bar_saved"]
	c.Data["ControlBarVersion"] = T["control_bar_version"]
	c.Data["ControlBarHistory"] = T["control_bar_history"]
	c.Data["ControlBarNew"] = T["control_bar_new"]
	c.Data["ControlBarDelete"] = T["control_bar_delete"]
	c.Data["ControlBarNewFile"] = T["control_bar_new_file"]
	c.Data["ControlBarNoUser"] = T["control_bar_no_user"]
	c.Data["ControlBarAllFiles"] = T["control_bar_all_files"]
	c.Data["ControlBarFileDelete"] = T["control_bar_file_delete"]
	c.Data["ControlBarModalYes"] = T["control_bar_modal_yes"]
	c.Data["ControlBarModalNo"] = T["control_bar_modal_no"]
	c.Data["ControlBarModalFileExists"] = T["control_bar_modal_file_exists"]
	c.Data["ControlBarModalFileOutdated"] = T["control_bar_modal_file_outdated"]
	c.Data["ControlBarModalFileDeleteS"] = T["control_bar_modal_file_delete_s"]
	c.Data["ControlBarModalFileDeleteP"] = T["control_bar_modal_file_delete_p"]
	c.Data["ControlBarModalAlreadyOpenS"] = T["control_bar_modal_already_open_s"]
	c.Data["ControlBarModalAlreadyOpenP"] = T["control_bar_modal_already_open_p"]
	c.Data["ControlBarModalCodefileTitle"] = T["control_bar_modal_codefile_title"]
	c.Data["ControlBarModalDelete"] = T["control_bar_modal_delete"]
	c.Data["ControlBarModalCancel"] = T["control_bar_modal_cancel"]
	c.Data["ControlBarModalOpen"] = T["control_bar_modal_open"]
	c.Data["LoginLogin"] = T["login_login"]
	c.Data["LoginSignup"] = T["login_signup"]
	c.Data["LoginLogout"] = T["login_logout"]
	c.Data["xsrfdata"] = template.HTML(c.XsrfFormHtml())

	file := c.Ctx.Input.Param(":file")
	if file != "" {
		c.TplNames = "external/" + c.Ctx.Input.Param(":file")
	} else {
		//c.TplNames = "live-editor.html"
		c.TplNames = "live-editor.html"
	}
}

func (c *LiveEditorController) StartSession() session.SessionStore {

	if c.CruSession == nil {
		c.CruSession = c.Ctx.Input.CruSession
	}

	SessionXsrfTable[c.XsrfToken()] = SessionXsrfStruct{
		Session:   c.CruSession,
		Timestamp: time.Now(),
	}

	beego.Trace("SessionXsrfTable: ", SessionXsrfTable)

	return c.CruSession
}

//////////////////////////////////////////////////////////
// LiveEditorBuildController functions
//
// Get
func (c *LiveEditorBuildController) Get() {
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
