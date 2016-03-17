package controllers

import (
	"encoding/json"
	"errors"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/session"
	"github.com/lavisrap/Computer-Spielplatz/spielplatz/models"
	"html/template"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
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
// SignupController serves the signup redirction page
type CPGController struct {
	beego.Controller
}

//////////////////////////////
// LiveEditorController brings the Khan-Academy Live-Editor to life
type LiveEditorController struct {
	CPGController
}

//////////////////////////////
// GraphicsController let the user handle graphics and animations
type GraphicsController struct {
	CPGController
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

///////////////////////////////
// imageGroup stores png images of one group
type imageGroup struct {
	GroupName string   `json:"groupName"`
	Readonly  bool     `json:"readonly"`
	Images    []string `json:"images"`
}

///////////////////////////////
// soundGroup stores mp3 files of one group
type soundGroup struct {
	GroupName string   `json:"groupName"`
	Sounds    []string `json:"sounds"`
}
type outputSounds struct {
	ClassName string       `json:"className"`
	Groups    []soundGroup `json:"groups"`
}

///////////////////////////////
// Regexp for detecting filename and folder of image files
var imageRegexp *regexp.Regexp = regexp.MustCompile(`images\/([^\/]+)\/([^\.]+)\.png`)
var soundRegexp *regexp.Regexp = regexp.MustCompile(`sounds\/([^\/]+)\/([^\.]+)\.mp3`)

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
	c.Data["LoginTime"] = s.Get("LoginTime")
	c.Data["xsrfdata"] = template.HTML(c.XsrfFormHtml())
	c.TplNames = "index.html"
	setTitleData(c.Data)
}

func setTitleData(data map[interface{}]interface{}) {
	T := models.T

	data["Arts"] = []models.Art{{
		Name: T["arts_programming"],
		Size: "lg",
		Page: "live-editor",
	}, {
		Name: T["arts_graphics"],
		Size: "lg",
		Page: "graphics-animation",
	}, {
		Name: T["arts_sound"],
		Size: "lg",
		Page: "#",
	}, {
		Name: T["arts_texts"],
		Size: "lg",
		Page: "#",
	}, {
		Name: T["arts_gamedesign"],
		Size: "lg",
		Page: "#",
	}, {
		Name: T["arts_controllers"],
		Size: "lg",
		Page: "#",
	}, {
		Name: T["arts_hacking"],
		Size: "lg",
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
			s.Set("LoginTime", time.Now().UnixNano()/int64(time.Millisecond))
			mountAdminData(u.Name)
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
	s.Delete("LoginTime")
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
				s.Set("LoginTime", time.Now().UnixNano()/int64(time.Millisecond))
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
		beego.Error("Cannot create directory", dir)
	}
	dir = beego.AppConfig.String("userdata::location") + userName + "/" + beego.AppConfig.String("userdata::imagefiles") + beego.AppConfig.String("userdata::examples")
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		beego.Error("Cannot create directory", dir)
	}
	dir = beego.AppConfig.String("userdata::location") + userName + "/" + beego.AppConfig.String("userdata::soundfiles") + beego.AppConfig.String("userdata::examples")
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		beego.Error("Cannot create directory", dir)
	}

	mountAdminData(userName)
}

func mountAdminData(userName string) error {

	adminName := beego.AppConfig.String("userdata::admin")

	if userName == adminName {
		return nil
	}

	resources := []string{"image", "sound"}
	for _, res := range resources {
		dir1 := beego.AppConfig.String("userdata::location") + adminName + "/" + beego.AppConfig.String("userdata::"+res+"files") + beego.AppConfig.String("userdata::examples")
		dir2 := beego.AppConfig.String("userdata::location") + userName + "/" + beego.AppConfig.String("userdata::"+res+"files") + beego.AppConfig.String("userdata::examples")

		_, err := os.Stat(dir2)
		if !os.IsNotExist(err) {
			cmd := exec.Command("sudo", "mount", "--bind", dir1, dir2)
			err := cmd.Run()
			if err != nil {
				beego.Error("Cannot mount --bind ", dir2, err.Error())
			}
			cmd = exec.Command("sudo", "mount", "-o", "remount,ro", dir2)
			err = cmd.Run()
			if err != nil {
				beego.Error("Cannot remount ", dir2, err.Error())
			}
		}
	}

	return nil
}

//////////////////////////////////////////////////////////
// LiveEditorController functions
//
// Get
func (c *LiveEditorController) Get() {
	T := models.T
	s := c.StartSession()
	userName := ""
	userNameForImages := "Admin"

	if s.Get("UserName") != nil {
		userName = s.Get("UserName").(string)
		userNameForImages = userName
	}

	c.Data["AllImages"] = c.getImageInfo(userNameForImages)
	c.Data["OutputSounds"] = c.getSoundInfo(userNameForImages)
	c.Data["UserNameForImages"] = userNameForImages

	file := c.Ctx.Input.Param(":file")
	if file != "" {
		c.TplNames = "external/" + c.Ctx.Input.Param(":file")
	} else {
		c.Data["UserName"] = userName
		c.Data["LoginTime"] = s.Get("LoginTime")
		c.Data["ControlBarLabel"] = T["control_bar_label"]
		c.Data["ControlBarSave"] = T["control_bar_save"]
		c.Data["ControlBarSaveAs"] = T["control_bar_save_as"]
		c.Data["ControlBarSaved"] = T["control_bar_saved"]
		c.Data["ControlBarVersion"] = T["control_bar_version"]
		c.Data["ControlBarHistory"] = T["control_bar_history"]
		c.Data["ControlBarNew"] = T["control_bar_new"]
		c.Data["ControlBarDelete"] = T["control_bar_delete"]
		c.Data["ControlBarRestart"] = T["control_bar_restart"]
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
		c.Data["ControlBarModalFileChanged"] = T["control_bar_modal_file_changed"]
		c.Data["ControlBarModalFileChanged2"] = T["control_bar_modal_file_changed_2"]
		c.Data["ControlBarModalDelete"] = T["control_bar_modal_delete"]
		c.Data["ControlBarModalCancel"] = T["control_bar_modal_cancel"]
		c.Data["ControlBarModalOpen"] = T["control_bar_modal_open"]
		c.Data["ControlBarModalSoundTitle"] = T["control_bar_modal_sound_title"]
		c.Data["LoginLogin"] = T["login_login"]
		c.Data["LoginSignup"] = T["login_signup"]
		c.Data["LoginLogout"] = T["login_logout"]

		c.Data["WebsocketsAddress"] = "ws://" + beego.AppConfig.String("httpaddr") + ":" + beego.AppConfig.String("websockets::port") + beego.AppConfig.String("websockets::dir")
		c.Data["xsrfdata"] = template.HTML(c.XsrfFormHtml())

		setTitleData(c.Data)

		c.TplNames = "live-editor.html"
	}
}

//////////////////////////////////////////////////////////
// getImageInfo retrieves a list of all images for one particular user
func (c *CPGController) getImageInfo(userName string) string {
	dir := beego.AppConfig.String("userdata::location") + userName + "/" + beego.AppConfig.String("userdata::imagefiles")
	admin := userName == beego.AppConfig.String("userdata::admin")
	examples := beego.AppConfig.String("userdata::examples")

	imageInfo := make([]imageGroup, 0, 21)

	imageInfo = append(imageInfo, imageGroup{
		GroupName: "/",
		Readonly:  false,
		Images:    []string{},
	})
	err := filepath.Walk(dir, func(path string, f os.FileInfo, err error) error {
		matches := imageRegexp.FindSubmatch([]byte(path))
		if matches != nil {
			folder := string(matches[1])
			file := string(matches[2])
			found := false
			readonly := false
			var i int

			for i = 0; i < len(imageInfo); i++ {
				if folder == imageInfo[i].GroupName {
					found = true
					break
				}
			}
			beego.Trace("XXXXXXXXXXXXXXXXXXXXXX", admin, folder, examples)
			if !admin && folder == examples {
				readonly = true
			}
			if !found {
				imageInfo = append(imageInfo, imageGroup{
					GroupName: folder,
					Readonly:  readonly,
					Images:    []string{file},
				})
			} else {
				imageInfo[i].Images = append(imageInfo[i].Images, file)
			}
		}
		return nil
	})

	if err == nil {
		ret, _ := json.Marshal(imageInfo)
		return string(ret)
	} else {
		return ""
	}
}

//////////////////////////////////////////////////////////
// getSoundInfo retrieves a list of all sounds for one particular user
func (c *CPGController) getSoundInfo(userName string) string {
	dir := beego.AppConfig.String("userdata::location") + userName + "/" + beego.AppConfig.String("userdata::soundfiles")
	soundInfo := make([]soundGroup, 0, 21)

	beego.Warning(dir)
	err := filepath.Walk(dir, func(path string, f os.FileInfo, err error) error {
		matches := soundRegexp.FindSubmatch([]byte(path))
		beego.Warning("!!!", path)
		if matches != nil {
			beego.Warning("!!!!", matches)
			folder := string(matches[1])
			file := string(matches[2])
			found := false
			var i int

			for i = 0; i < len(soundInfo); i++ {
				if folder == soundInfo[i].GroupName {
					found = true
					break
				}
			}
			if found == false {
				soundInfo = append(soundInfo, soundGroup{
					GroupName: folder,
					Sounds:    []string{file},
				})
			} else {
				soundInfo[i].Sounds = append(soundInfo[i].Sounds, file)
			}
		}
		return nil
	})

	outputSounds := []outputSounds{{
		ClassName: "Sound-Effekte",
		Groups:    soundInfo,
	}}
	if err == nil {
		ret, _ := json.Marshal(outputSounds)
		return string(ret)
	} else {
		return ""
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

//////////////////////////////////////////////////////////
// GraphicsController
//
// Get
func (c *GraphicsController) Get() {
	T := models.T
	s := c.StartSession()
	userName := ""
	userNameForImages := "Admin"

	if s.Get("UserName") != nil {
		userName = s.Get("UserName").(string)
		userNameForImages = userName
	}

	c.Data["AllImages"] = c.getImageInfo(userNameForImages)
	c.Data["OutputSounds"] = c.getSoundInfo(userNameForImages)
	c.Data["UserNameForImages"] = userNameForImages

	c.Data["UserName"] = userName
	c.Data["LoginTime"] = s.Get("LoginTime")
	c.Data["LoginLogin"] = T["login_login"]
	c.Data["LoginSignup"] = T["login_signup"]
	c.Data["LoginLogout"] = T["login_logout"]
	c.Data["GraphicsCommandsImportTitle"] = T["graphics_commands_import_title"]
	c.Data["GraphicsCommandsImportLocal1"] = T["graphics_commands_import_local_1"]
	c.Data["GraphicsCommandsImportLocal2"] = T["graphics_commands_import_local_2"]
	c.Data["GraphicsCommandsImportOpen"] = T["graphics_commands_import_open"]
	c.Data["GraphicsCommandsImportCancel"] = T["graphics_commands_import_cancel"]
	c.Data["GraphicsCommandsExportTitle"] = T["graphics_commands_export_title"]
	c.Data["GraphicsCommandsExportFilename"] = T["graphics_commands_export_filename"]
	c.Data["GraphicsCommandsExportExport"] = T["graphics_commands_export_export"]
	c.Data["GraphicsCommandsExportCancel"] = T["graphics_commands_export_cancel"]
	c.Data["GraphicsCommandsExportNewFolder"] = T["graphics_commands_export_new_folder"]
	c.Data["GraphicsCommandsModalYes"] = T["graphics_commands_modal_yes"]
	c.Data["GraphicsCommandsModalNo"] = T["graphics_commands_modal_no"]
	c.Data["GraphicsCommandsModalLogin1"] = T["graphics_commands_modal_login1"]
	c.Data["GraphicsCommandsModalLogin2"] = T["graphics_commands_modal_login2"]
	c.Data["GraphicsColorizerHue"] = T["graphics_colorizer_hue"]
	c.Data["GraphicsColorizerBrightness"] = T["graphics_colorizer_brightness"]
	c.Data["GraphicsColorizerSaturation"] = T["graphics_colorizer_saturation"]
	c.Data["GraphicsColorizerContrast"] = T["graphics_colorizer_contrast"]
	c.Data["GraphicsColorizerSharpen"] = T["graphics_colorizer_sharpen"]
	c.Data["GraphicsColorizerStackBlur"] = T["graphics_colorizer_stackBlur"]
	c.Data["GraphicsColorizerSepia"] = T["graphics_colorizer_sepia"]
	c.Data["xsrfdata"] = template.HTML(c.XsrfFormHtml())

	setTitleData(c.Data)
	c.TplNames = "graphics-animation.html"
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
