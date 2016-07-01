package controllers

import (
	"encoding/json"
	"errors"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/config"
	"github.com/astaxie/beego/session"
	"github.com/astaxie/beego/utils"
	"github.com/lafisrap/Computer-Spielplatz/spielplatz/models"
	"os"
	"path/filepath"
	"regexp"
	"sync"
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
	Session   *session.Store
	Timestamp time.Time
}

type SessionXsrf struct {
	sync.RWMutex
	Tokens map[string]SessionXsrfStruct
}

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
	RootController
}

//////////////////////////////
// LoginController serves the logout redirction page
type LogoutController struct {
	RootController
}

//////////////////////////////
// SignupController serves the signup redirction page
type SignupController struct {
	RootController
}

//////////////////////////////
// SignupController serves the signup redirction page
type CPGController struct {
	RootController
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
	RootController
}

//////////////////////////////
// LiveEditorController brings the Khan-Academy Live-Editor to life
type LiveEditorBuildController struct {
	RootController
}

///////////////////////////////
// ErrorController serves all weg errors
type ErrorController struct {
	RootController
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
var imageRegexp *regexp.Regexp = regexp.MustCompile(`images\/([^\/]+\/|)([^\.]+)\.png`)
var soundRegexp *regexp.Regexp = regexp.MustCompile(`sounds\/([^\/]+\/|)([^\.]+)\.mp3`)

///////////////////////////////////////////////////////
// init function
func init() {
	globalSessions, _ = session.NewManager("memory", `{"cookieName":"computerspielplatzID", "enableSetCookie,omitempty": true, "gclifetime":3600, "maxLifetime": 3600, "secure": false, "sessionIDHashFunc": "sha1", "sessionIDHashKey": "", "cookieLifeTime": 3600, "providerConfig": ""}`)
	go globalSessions.GC()

	SessionXsrfTable.Tokens = make(map[string]SessionXsrfStruct)
}

///////////////////////////////////////////////////////
// getWebSocketsToken function
func (c *RootController) getWebSocketsToken() string {

	if token := c.GetSession("WebSocketsToken"); token != nil {
		return token.(string)
	}

	token := string(utils.RandomCreateBytes(32))

	SessionXsrfTable.Lock()
	defer SessionXsrfTable.Unlock()
	s := c.StartSession()
	SessionXsrfTable.Tokens[token] = SessionXsrfStruct{
		Session:   &s,
		Timestamp: time.Now(),
	}

	c.SetSession("WebSocketsToken", token)

	return token
}

///////////////////////////////////////////////////////
// setUserSessionData function
func (c *RootController) setUserSessionData(userName string) string {
	c.SetSession("UserName", userName)
	c.SetSession("Rights", models.GetRightsFromDatabase(userName))
	c.SetSession("Groups", models.GetGroupsFromDatabase(userName))
	c.SetSession("LoginTime", time.Now().UnixNano()/int64(time.Millisecond))

	token := c.getWebSocketsToken()
	err := models.CreateSessionTokenDatabaseEntry(token, userName)
	if err != nil {
		beego.Error(err)
	}

	return token
}

///////////////////////////////////////////////////////
// recoverUserSession function
func (c *RootController) recoverUserSession(wstoken string) string {
	userName := ""
	var ok bool

	if userName, ok = models.GetUserFromSessionToken(wstoken); ok {
		c.setUserSessionData(userName)
	}

	return userName
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

	c.Data["UserName"] = c.GetSession("UserName")
	c.Data["LoginTime"] = c.GetSession("LoginTime")
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
		Name: T["arts_tutorials"],
		Size: "lg",
		Page: "#",
	}, {
		Name: T["arts_challenges"],
		Size: "lg",
		Page: "#",
	}, {
		Name: T["arts_edugames"],
		Size: "lg",
		Page: "#",
	}}
	data["LoginLogin"] = T["login_login"]
	data["LoginSignup"] = T["login_signup"]
	data["LoginLogout"] = T["login_logout"]
	data["Title"] = T["Title"]
	data["Subtitle"] = T["Subtitle"]
}

func setProjectBarData(data map[interface{}]interface{}) {
	T := models.T

	data["ProjectBarAdministrate"] = T["project_bar_administrate"]
	data["ProjectBarAllFiles"] = T["project_bar_all_files"]
	data["ProjectBarDisinvite"] = T["project_bar_disinvite"]
	data["ProjectBarGalleryOff"] = T["project_bar_gallery_off"]
	data["ProjectBarGalleryOn"] = T["project_bar_gallery_on"]
	data["ProjectBarInvite"] = T["project_bar_invite"]
	data["ProjectBarMail"] = T["project_bar_mail"]
	data["ProjectBarMessage"] = T["project_bar_message"]
	data["ProjectBarModalAlreadyOpenP"] = T["project_bar_modal_already_open_p"]
	data["ProjectBarModalAlreadyOpenS"] = T["project_bar_modal_already_open_s"]
	data["ProjectBarModalCancel"] = T["project_bar_modal_cancel"]
	data["ProjectBarModalCodefileTitle"] = T["project_bar_modal_codefile_title"]
	data["ProjectBarModalConflicts2"] = T["project_bar_modal_conflicts_2"]
	data["ProjectBarModalConflicts"] = T["project_bar_modal_conflicts"]
	data["ProjectBarModalDelete"] = T["project_bar_modal_delete"]
	data["ProjectBarModalFileChanged2"] = T["project_bar_modal_file_changed_2"]
	data["ProjectBarModalFileChanged"] = T["project_bar_modal_file_changed"]
	data["ProjectBarModalFileDeleteP"] = T["project_bar_modal_file_delete_p"]
	data["ProjectBarModalFileDeleteS"] = T["project_bar_modal_file_delete_s"]
	data["ProjectBarModalFileExists"] = T["project_bar_modal_file_exists"]
	data["ProjectBarModalFileExists2"] = T["project_bar_modal_file_exists_2"]
	data["ProjectBarModalProjectExists"] = T["project_bar_modal_project_exists"]
	data["ProjectBarModalProjects"] = T["project_bar_modal_projects"]
	data["ProjectBarModalProjectExists2"] = T["project_bar_modal_project_exists_2"]
	data["ProjectBarModalFilename"] = T["project_bar_modal_filename"]
	data["ProjectBarModalFileOutdated"] = T["project_bar_modal_file_outdated"]
	data["ProjectBarModalInvite"] = T["project_bar_modal_invite"]
	data["ProjectBarModalInvite2"] = T["project_bar_modal_invite_2"]
	data["ProjectBarModalInviteOk"] = T["project_bar_modal_invite_ok"]
	data["ProjectBarModalNo"] = T["project_bar_modal_no"]
	data["ProjectBarModalOk"] = T["project_bar_modal_ok"]
	data["ProjectBarModalOpen"] = T["project_bar_modal_open"]
	data["ProjectBarModalBadConnection"] = T["project_bar_modal_bad_connection"]
	data["ProjectBarModalBadConnection2"] = T["project_bar_modal_bad_connection_2"]
	data["ProjectBarModalNewSession"] = T["project_bar_modal_new_session"]
	data["ProjectBarModalNewSession2"] = T["project_bar_modal_new_session_2"]
	data["ProjectBarModalProjectInit2"] = T["project_bar_modal_project_init_2"]
	data["ProjectBarModalProjectInitOk"] = T["project_bar_modal_project_init_ok"]
	data["ProjectBarModalProjectInit"] = T["project_bar_modal_project_init"]
	data["ProjectBarModalProjectSave2"] = T["project_bar_modal_project_save_2"]
	data["ProjectBarModalProjectSaveOk"] = T["project_bar_modal_project_save_ok"]
	data["ProjectBarModalOpenNewProject"] = T["project_bar_modal_open_new_project"]
	data["ProjectBarModalAlreadyMember"] = T["project_bar_modal_already_member"]
	data["ProjectBarModalAlreadyMember2"] = T["project_bar_modal_already_member_2"]
	data["ProjectBarModalOpenNewProject2"] = T["project_bar_modal_open_new_project_2"]
	data["ProjectBarModalProjectSave"] = T["project_bar_modal_project_save"]
	data["ProjectBarModalSaveFilename2"] = T["project_bar_modal_save_filename_2"]
	data["ProjectBarModalSaveFilename"] = T["project_bar_modal_save_filename"]
	data["ProjectBarModalSave"] = T["project_bar_modal_save"]
	data["ProjectBarModalSoundTitle"] = T["project_bar_modal_sound_title"]
	data["ProjectBarModalYes"] = T["project_bar_modal_yes"]
	data["ProjectBarModalRestartEditor"] = T["project_bar_modal_restart_editor"]
	data["ProjectBarModalRestartEditor2"] = T["project_bar_modal_restart_editor_2"]
	data["ProjectBarNewFile"] = T["project_bar_new_file"]
	data["ProjectBarNew"] = T["project_bar_new"]
	data["ProjectBarNoUser"] = T["project_bar_no_user"]
	data["ProjectBarOpen"] = T["project_bar_open"]
	data["ProjectBarOtherVersion"] = T["project_bar_modal_other_version"]
	data["ProjectBarOrganize"] = T["project_bar_organize"]
	data["ProjectBarProject"] = T["project_bar_project"]
	data["ProjectBarRename"] = T["project_bar_rename"]
	data["ProjectBarRestart"] = T["project_bar_restart"]
	data["ProjectBarSaveAs"] = T["project_bar_save_as"]
	data["ProjectBarSaved"] = T["project_bar_saved"]
	data["ProjectBarSaveProject"] = T["project_bar_save_project"]
	data["ProjectBarSaveTemplate"] = T["project_bar_saveTemplate"]
	data["ProjectBarSave"] = T["project_bar_save"]
	data["ProjectBarTransfer"] = T["project_bar_transfer"]
	data["ProjectBarFileChanged"] = T["project_bar_file_changed"]
}

//////////////////////////////////////////////////////////
// LoginController functions
//
// Get
func (c *LoginController) Get() {

	T := models.T
	token := c.getWebSocketsToken()

	beego.Warning("Dest:", c.Ctx.Input.Param(":wstoken"))
	c.Data["Destination"] = "/" + c.Ctx.Input.Param(":dest")
	c.Data["LoginInvitation"] = T["login_invitation"]
	c.Data["LoginInputName"] = T["login_input_name"]
	c.Data["LoginPassword"] = T["login_input_password"]
	c.Data["LoginLoginGo"] = T["login_login_go"]
	c.Data["WebSocketsToken"] = token
	c.Data["Title"] = T["Title"]

	c.TplName = "login.html"
}

///////////////////////////////////
// Post
func (c *LoginController) Post() {
	T := models.T
	token := c.getWebSocketsToken()

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
		beego.Warning("Login by", uf.Name, "with token", uf.Token, "and destination", dest)
		if token != uf.Token {
			err = errors.New("Token missmatch at Login. (Restart the browser ... and inform the Admin) Token1:" + token + "Token2:" + uf.Token)
		} else if u, err = models.AuthenticateUser(&uf); err == nil {

			token = c.setUserSessionData(u.Name)

			c.Ctx.Redirect(302, dest)
			return
		} else {
			err = errors.New(T["login_password_incorrect"])
		}
	}

	c.Data["Error"] = err.Error()
	c.Data["LoginInvitation"] = T["login_invitation"]
	c.Data["LoginInputName"] = T["login_input_name"]
	c.Data["LoginPassword"] = T["login_input_password"]
	c.Data["LoginLoginGo"] = T["login_login_go"]
	c.Data["Destination"] = dest
	c.Data["WebSocketsToken"] = token

	c.TplName = "login.html"
}

//////////////////////////////////////////////////////////
// LoginController functions
//
// Get
func (c *LogoutController) Get() {

	token := c.getWebSocketsToken()

	c.DelSession("UserName")
	c.DelSession("LoginTime")
	c.DestroySession()
	c.Data["WebSocketsToken"] = token

	c.Ctx.Redirect(302, "/")
}

//////////////////////////////////////////////////////////
// SignupController functions
//
// Get
func (c *SignupController) Get() {

	token := c.getWebSocketsToken()

	T := models.T

	if _, ok := c.Data["Destination"]; !ok {
		c.Data["Destination"] = "/" + c.Ctx.Input.Param(":dest")
	}
	c.Data["SignupInvitation"] = T["signup_invitation"]
	c.Data["SignupInputName"] = T["signup_input_name"]
	c.Data["SignupInputPassword"] = T["signup_input_password"]
	c.Data["SignupInputPassword2"] = T["signup_input_password2"]
	c.Data["SignupInputGroupCode"] = T["signup_input_group_code"]
	c.Data["SignupSignupGo"] = T["signup_signup_go"]
	c.Data["WebSocketsToken"] = token

	c.TplName = "signup.html"
}

///////////////////////////////////
// Post
func (c *SignupController) Post() {

	T := models.T
	token := c.getWebSocketsToken()

	var (
		u     models.User
		group string
		err   error
	)
	uf := models.UserForm{}
	dest := c.Ctx.Input.Query("_dest")
	if dest == "" {
		dest = "/"
	}

	if err = c.ParseForm(&uf); err == nil {
		if token != uf.Token {
			err = errors.New("Token missmatch at Signup. (Restart the browser ... and inform the Admin)")
		} else if uf.Pwd == uf.Pwd2 {
			if u, group, err = models.CreateUserInDatabase(&uf); err == nil {

				c.createUserDirectory(u, group)

				token = c.setUserSessionData(u.Name)
				c.Ctx.Redirect(302, dest)
				return
			} else {
				if err.Error() == "group code wrong" {
					err = errors.New(T["signup_group_code_wrong"])
				} else {
					beego.Error(err)
				}

				c.Data["Name"] = uf.Name
				c.Data["GroupCode"] = uf.GroupCode
				c.Data["Pwd1"] = uf.Pwd
				c.Data["Pwd2"] = uf.Pwd2
			}
		} else {
			c.Data["Name"] = uf.Name
			c.Data["GroupCode"] = uf.GroupCode
			c.Data["Pwd1"] = uf.Pwd
			err = errors.New(T["signup_passwords_dont_match"])
		}
	}

	c.Data["Error"] = err.Error()
	c.Data["Destination"] = dest
	c.Data["SignupInvitation"] = T["signup_invitation"]
	c.Data["SignupInputName"] = T["signup_input_name"]
	c.Data["SignupInputPassword"] = T["signup_input_password"]
	c.Data["SignupInputPassword2"] = T["signup_input_password2"]
	c.Data["SignupInputGroupCode"] = T["signup_input_group_code"]
	c.Data["SignupSignupGo"] = T["signup_signup_go"]
	c.Data["WebSocketsToken"] = token

	c.TplName = "signup.html"
}

///////////////////////////////////////////////
// Create user directories, for code files and resources
func (c *SignupController) createUserDirectory(user models.User, group string) {

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
	cnf.Set("rights::NoSpecialRights", "true")
	cnf.Set("groups::member", group)
	cnf.SaveConfigFile(identityFile)

	// Clone Admin Spielplatz project
	err = models.CloneProjectDir(user.Name, beego.AppConfig.String("userdata::commonproject"), true)
	if err != nil {
		beego.Error(err)
	}
}

//////////////////////////////////////////////////////////
// LiveEditorController functions
//
// Get
func (c *LiveEditorController) Get() {
	T := models.T
	userName := ""
	userNameForImages := "Admin"

	var rights models.RightsMap

	if c.GetSession("UserName") != nil {
		userName = c.GetSession("UserName").(string)
	}

	// Session recovery
	wsToken := c.GetString("wstoken")
	if userName == "" && wsToken != "" {
		userName = c.recoverUserSession(wsToken)
	}

	if userName != "" {
		userNameForImages = userName

		if val := c.GetSession("Rights"); val != nil {
			rights = *val.(*models.RightsMap)
		}
	}

	c.Data["AllImages"] = c.getImageInfo(userNameForImages)
	c.Data["OutputSounds"] = c.getSoundInfo(userNameForImages)
	c.Data["UserNameForImages"] = userNameForImages

	file := c.Ctx.Input.Param(":file")
	if file != "" {
		c.TplName = "external/" + c.Ctx.Input.Param(":file")
	} else {
		c.Data["UserName"] = userName
		c.Data["LoginTime"] = c.GetSession("LoginTime")
		c.Data["RightInviteToGroups"] = rights["invitetogroups"]
		c.Data["RightAddGroups"] = rights["addgroups"]
		c.Data["LiveEditorHeaderPjs"] = T["live_editor_header_pjs"]
		c.Data["LiveEditorHeaderHTML"] = T["live_editor_header_html"]

		c.Data["LoginLogin"] = T["login_login"]
		c.Data["LoginSignup"] = T["login_signup"]
		c.Data["LoginLogout"] = T["login_logout"]

		c.Data["WebSocketsAddress"] = "ws://" + beego.AppConfig.String("httpaddr") + ":" + beego.AppConfig.String("websockets::port") + beego.AppConfig.String("websockets::dir")
		c.Data["WebSocketsToken"] = c.GetSession("WebSocketsToken")

		setProjectBarData(c.Data)
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

			if folder == "" {
				folder = "/"
			} else {
				folder = folder[:len(folder)-1]
			}

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

			if folder == "" {
				folder = "/"
			} else {
				folder = folder[:len(folder)-1]
			}

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

	s := c.CruSession

	if s == nil {
		s = c.Ctx.Input.CruSession
	}

	return s
}

//////////////////////////////////////////////////////////
// LiveEditorBuildController functions
//
// Get
func (c *LiveEditorBuildController) Get() {
	c.TplName = "live-editor/build/js/" + c.Ctx.Input.Param(":file")
}

//////////////////////////////////////////////////////////
// GraphicsController
// Get
func (c *GraphicsController) Get() {
	T := models.T
	userName := ""
	userNameForImages := "Admin"
	var rights models.RightsMap

	if c.GetSession("UserName") != nil {
		userName = c.GetSession("UserName").(string)
	}

	// Session recovery
	wsToken := c.GetString("wstoken")
	if userName == "" && wsToken != "" {
		userName = c.recoverUserSession(wsToken)
	}

	if userName != "" {
		userNameForImages = userName

		if val := c.GetSession("Rights"); val != nil {
			rights = *val.(*models.RightsMap)
		}
	}

	c.Data["AllImages"] = c.getImageInfo(userNameForImages)
	c.Data["OutputSounds"] = c.getSoundInfo(userNameForImages)
	c.Data["UserNameForImages"] = userNameForImages
	c.Data["RightInviteToGroups"] = rights["invitetogroups"]
	c.Data["RightAddGroups"] = rights["addgroups"]

	c.Data["UserName"] = userName
	c.Data["LoginTime"] = c.GetSession("LoginTime")
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
	c.Data["ProjectBarFileChanged"] = T["project_bar_file_changed"]
	c.Data["ProjectBarNewFile"] = T["project_bar_new_file"]
	c.Data["ProjectBarNoUser"] = T["project_bar_no_user"]
	c.Data["WebSocketsAddress"] = "ws://" + beego.AppConfig.String("httpaddr") + ":" + beego.AppConfig.String("websockets::port") + beego.AppConfig.String("websockets::dir")
	c.Data["WebSocketsToken"] = c.GetSession("WebSocketsToken")

	setProjectBarData(c.Data)
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
