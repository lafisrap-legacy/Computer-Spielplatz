package controllers

import (
	"encoding/json"
	"errors"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/config"
	"github.com/astaxie/beego/session"
	"github.com/lafisrap/Computer-Spielplatz-Gitbase/spielplatz/models"
	"gopkg.in/libgit2/git2go.v22"
	"html/template"
	"os"
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
	Session   session.Store
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
	c.Data["xsrfdata"] = template.HTML(c.XSRFFormHTML())
	c.TplName = "index.html"
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

	T := models.T

	c.Data["xsrfdata"] = template.HTML(c.XSRFFormHTML())
	c.Data["Destination"] = "/" + c.Ctx.Input.Param(":dest")
	beego.Trace("c.Data LoginInvitation = ", T["login_invitation"])
	c.Data["LoginInvitation"] = T["login_invitation"]
	c.Data["LoginInputName"] = T["login_input_name"]
	c.Data["LoginPassword"] = T["login_input_password"]
	c.Data["LoginLoginGo"] = T["login_login_go"]

	c.TplName = "login.html"
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
		if u, err = models.AuthenticateUser(&uf); err == nil {
			s.Set("UserName", u.Name)
			s.Set("Email", u.Email)
			s.Set("LoginTime", time.Now().UnixNano()/int64(time.Millisecond))
			c.Ctx.Redirect(302, dest)
			return
		}
	}

	c.Data["Error"] = err.Error()
	c.Data["xsrfdata"] = template.HTML(c.XSRFFormHTML())
	c.Data["Destination"] = dest
	c.TplName = "login.html"
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
	T := models.T

	if _, ok := c.Data["Destination"]; !ok {
		c.Data["Destination"] = "/" + c.Ctx.Input.Param(":dest")
	}
	c.Data["xsrfdata"] = template.HTML(c.XSRFFormHTML())
	c.Data["SignupInvitation"] = T["signup_invitation"]
	c.Data["SignupInputName"] = T["signup_input_name"]
	c.Data["SignupInputPassword"] = T["signup_input_password"]
	c.Data["SignupInputPassword2"] = T["signup_input_password2"]
	c.Data["SignupSignupGo"] = T["signup_signup_go"]
	c.TplName = "signup.html"
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
	if dest == "" {
		dest = "/"
	}
	if err = c.ParseForm(&uf); err == nil {
		if uf.Pwd == uf.Pwd2 {
			if u, err = models.CreateUserInDatabase(&uf); err == nil {
				s.Set("UserName", u.Name)
				s.Set("LoginTime", time.Now().UnixNano()/int64(time.Millisecond))
				s.Set("Email", u.Email)

				c.createUserDirectory(u)
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
	c.Data["Destination"] = dest
	c.Get()
}

///////////////////////////////////////////////
// Create user directories, for code files and resources
func (c *SignupController) createUserDirectory(user models.User) {

	// Create project directories
	models.CreateDirectories(beego.AppConfig.String("userdata::location")+user.Name, true)

	// Create .spielplatz files
	dir := beego.AppConfig.String("userdata::location") + user.Name + "/" + beego.AppConfig.String("userdata::spielplatzdir") + "/"
	identityFile := dir + "identity"
	file, err := os.Create(identityFile)
	if err != nil {
		beego.Error(err)
	}
	file.Close()
	cnf, err := config.NewConfig("ini", identityFile)
	if err != nil {
		beego.Error("Cannot create identity file in " + dir + " (" + err.Error() + ")")
	}
	cnf.Set("auth::Pwhash", user.Pwhash)
	cnf.SaveConfigFile(identityFile)

	// Clone Admin Spielplatz project
	err = cloneProject(user.Name, beego.AppConfig.String("userdata::commonproject"))
	if err != nil {
		beego.Error(err)
	}
}

func cloneProject(toUser string, project string) error {
	url := beego.AppConfig.String("userdata::location") + "/" +
		beego.AppConfig.String("userdata::bareprojects") + "/" +
		project

	dir := beego.AppConfig.String("userdata::location") +
		toUser + "/" +
		beego.AppConfig.String("userdata::projects") + "/" +
		project

	options := git.CloneOptions{
		Bare: false,
	}
	_, err := git.Clone(url, dir, &options)
	if err == nil {
		models.MountResourceFiles(toUser, project)
	}
	return err
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
		c.TplName = "external/" + c.Ctx.Input.Param(":file")
	} else {
		c.Data["UserName"] = userName
		c.Data["LoginTime"] = s.Get("LoginTime")
		c.Data["LiveEditorHeaderPjs"] = T["live_editor_header_pjs"]
		c.Data["LiveEditorHeaderHTML"] = T["live_editor_header_html"]

		c.Data["ProjectBarAdministrate"] = T["project_bar_administrate"]
		c.Data["ProjectBarAllFiles"] = T["project_bar_all_files"]
		c.Data["ProjectBarDisinvite"] = T["project_bar_disinvite"]
		c.Data["ProjectBarGalleryOff"] = T["project_bar_gallery_off"]
		c.Data["ProjectBarGalleryOn"] = T["project_bar_gallery_on"]
		c.Data["ProjectBarInvite"] = T["project_bar_invite"]
		c.Data["ProjectBarMail"] = T["project_bar_mail"]
		c.Data["ProjectBarMessage"] = T["project_bar_message"]
		c.Data["ProjectBarModalAlreadyOpenP"] = T["project_bar_modal_already_open_p"]
		c.Data["ProjectBarModalAlreadyOpenS"] = T["project_bar_modal_already_open_s"]
		c.Data["ProjectBarModalCancel"] = T["project_bar_modal_cancel"]
		c.Data["ProjectBarModalCodefileTitle"] = T["project_bar_modal_codefile_title"]
		c.Data["ProjectBarModalConflicts2"] = T["project_bar_modal_conflicts_2"]
		c.Data["ProjectBarModalConflicts"] = T["project_bar_modal_conflicts"]
		c.Data["ProjectBarModalDelete"] = T["project_bar_modal_delete"]
		c.Data["ProjectBarModalFileChanged2"] = T["project_bar_modal_file_changed_2"]
		c.Data["ProjectBarModalFileChanged"] = T["project_bar_modal_file_changed"]
		c.Data["ProjectBarModalFileDeleteP"] = T["project_bar_modal_file_delete_p"]
		c.Data["ProjectBarModalFileDeleteS"] = T["project_bar_modal_file_delete_s"]
		c.Data["ProjectBarModalFileExists"] = T["project_bar_modal_file_exists"]
		c.Data["ProjectBarModalFilename"] = T["project_bar_modal_filename"]
		c.Data["ProjectBarModalFileOutdated"] = T["project_bar_modal_file_outdated"]
		c.Data["ProjectBarModalNo"] = T["project_bar_modal_no"]
		c.Data["ProjectBarModalOk"] = T["project_bar_modal_ok"]
		c.Data["ProjectBarModalOpen"] = T["project_bar_modal_open"]
		c.Data["ProjectBarModalProjectInit2"] = T["project_bar_modal_project_init_2"]
		c.Data["ProjectBarModalProjectInitOk"] = T["project_bar_modal_project_init_ok"]
		c.Data["ProjectBarModalProjectInit"] = T["project_bar_modal_project_init"]
		c.Data["ProjectBarModalProjectSave2"] = T["project_bar_modal_project_save_2"]
		c.Data["ProjectBarModalProjectSaveOk"] = T["project_bar_modal_project_save_ok"]
		c.Data["ProjectBarModalProjectSave"] = T["project_bar_modal_project_save"]
		c.Data["ProjectBarModalSaveFilename2"] = T["project_bar_modal_save_filename_2"]
		c.Data["ProjectBarModalSaveFilename"] = T["project_bar_modal_save_filename"]
		c.Data["ProjectBarModalSave"] = T["project_bar_modal_save"]
		c.Data["ProjectBarModalSoundTitle"] = T["project_bar_modal_sound_title"]
		c.Data["ProjectBarModalYes"] = T["project_bar_modal_yes"]
		c.Data["ProjectBarNewFile"] = T["project_bar_new_file"]
		c.Data["ProjectBarNew"] = T["project_bar_new"]
		c.Data["ProjectBarNoUser"] = T["project_bar_no_user"]
		c.Data["ProjectBarOpen"] = T["project_bar_open"]
		c.Data["ProjectBarOtherVersion"] = T["project_bar_modal_other_version"]
		c.Data["ProjectBarOrganize"] = T["project_bar_organize"]
		c.Data["ProjectBarProject"] = T["project_bar_project"]
		c.Data["ProjectBarRename"] = T["project_bar_rename"]
		c.Data["ProjectBarRestart"] = T["project_bar_restart"]
		c.Data["ProjectBarSaveAs"] = T["project_bar_save_as"]
		c.Data["ProjectBarSaved"] = T["project_bar_saved"]
		c.Data["ProjectBarSaveProject"] = T["project_bar_save_project"]
		c.Data["ProjectBarSaveTemplate"] = T["project_bar_saveTemplate"]
		c.Data["ProjectBarSave"] = T["project_bar_save"]
		c.Data["ProjectBarTransfer"] = T["project_bar_transfer"]
		c.Data["LoginLogin"] = T["login_login"]
		c.Data["LoginSignup"] = T["login_signup"]
		c.Data["LoginLogout"] = T["login_logout"]

		c.Data["WebsocketsAddress"] = "ws://" + beego.AppConfig.String("httpaddr") + ":" + beego.AppConfig.String("websockets::port") + beego.AppConfig.String("websockets::dir")
		c.Data["xsrfdata"] = template.HTML(c.XSRFFormHTML())

		setTitleData(c.Data)

		c.TplName = "live-editor.html"
	}
}

//////////////////////////////////////////////////////////
// getImageInfo retrieves a list of all images for one particular user
func (c *CPGController) getImageInfo(userName string) string {
	dir := beego.AppConfig.String("userdata::location") + userName + "/" + beego.AppConfig.String("userdata::imagefiles") + "/"

	imageInfo := make([]imageGroup, 0, 21)

	imageInfo = append(imageInfo, imageGroup{
		GroupName: "/",
		Images:    []string{},
	})
	err := filepath.Walk(dir, func(path string, f os.FileInfo, err error) error {
		matches := imageRegexp.FindSubmatch([]byte(path))
		if matches != nil {
			folder := string(matches[1])
			file := string(matches[2])
			found := false
			var i int

			for i = 0; i < len(imageInfo); i++ {
				if folder == imageInfo[i].GroupName {
					found = true
					break
				}
			}
			if !found {
				imageInfo = append(imageInfo, imageGroup{
					GroupName: folder,
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
	dir := beego.AppConfig.String("userdata::location") + userName + "/" + beego.AppConfig.String("userdata::soundfiles") + "/"
	soundInfo := make([]soundGroup, 0, 21)

	err := filepath.Walk(dir, func(path string, f os.FileInfo, err error) error {
		matches := soundRegexp.FindSubmatch([]byte(path))
		if matches != nil {
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

func (c *LiveEditorController) StartSession() session.Store {

	if c.CruSession == nil {
		c.CruSession = c.Ctx.Input.CruSession
	}

	SessionXsrfTable[c.XSRFToken()] = SessionXsrfStruct{
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
	c.Data["xsrfdata"] = template.HTML(c.XSRFFormHTML())
	c.TplName = "live-editor/build/js/" + c.Ctx.Input.Param(":file")
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
	c.Data["GraphicsHeaderGraphics"] = T["graphics_header_graphics"]
	c.Data["GraphicsHeaderAnimations"] = T["graphics_header_animations"]
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
	c.Data["xsrfdata"] = template.HTML(c.XSRFFormHTML())

	setTitleData(c.Data)
	c.TplName = "graphics-animation.html"
}

/////////////////////////////////////////////////////////////
// Error Controller functions
//
// Error 404
func (c *ErrorController) Error404() {
	c.Data["content"] = "page not found"
	c.TplName = "404.html"
}

////////////////////////////////////
// Error 501
func (c *ErrorController) Error501() {
	c.Data["content"] = "internal server error"
	c.TplName = "501.html"
}

////////////////////////////////////
// Database Error
func (c *ErrorController) ErrorDB() {
	c.Data["content"] = "database is now down"
	c.TplName = "dberror.html"
}
