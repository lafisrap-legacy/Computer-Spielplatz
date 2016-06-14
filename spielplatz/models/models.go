package models

import (
	"crypto/sha1"
	"encoding/hex"
	"errors"
	"fmt"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/config"
	"github.com/astaxie/beego/orm"
	_ "github.com/go-sql-driver/mysql"
	"github.com/libgit2/git2go"
	"io/ioutil"
	"os"
	"os/exec"
	"strings"
	"time"
)

//////////////////////////////////////////////////
// Main Types
//
// User is the basic structure for user information
type User struct {
	Id     int
	Name   string
	Pwhash string
	Email  string
}

// Groups contain a list of groups
type Groups struct {
	Id   int64
	Name string
	Code string
}

// GroupUser contains a list of User - Group relations
type GroupUser struct {
	Id    int
	User  *User   `orm:"rel(fk)"`
	Group *Groups `orm:"rel(fk)"`
}

// Rights for users
type Rights struct {
	Id    int
	Name  string
	Value string
	User  *User `orm:"rel(fk)"`
}

// Session Token
type SessionToken struct {
	Id        int
	Token     string
	TimeStamp time.Time `orm:"auto_now;type(datetime)"`
	User      *User     `orm:"rel(fk)"`
}

// RightsMap
type RightsMap map[string]string

// Project contains a list of user projects
type Project struct {
	Id         int
	Name       string
	Playground string
	Origin     string
	Gallery    bool
	Forks      int
	Stars      int
}

// ProjectUser contains all project - user relations
type ProjectUser struct {
	Id      int
	Project *Project `orm:"rel(fk)"`
	User    *User    `orm:"rel(fk)"`
	Rights  int64
}

// Stars contains a list of all stars
type Star struct {
	Id      int
	User    *User    `orm:"rel(fk)"`
	Project *Project `orm:"rel(fk)"`
}

// Message contains all messages
type Message struct {
	Id        int64
	User      *User    `orm:"rel(fk)"`
	Project   *Project `orm:"rel(fk)"`
	Subject   string
	Text      string
	Action    MsgAction
	TimeStamp time.Time `orm:"auto_now;type(datetime)"`
}

type MsgData map[string]interface{}

// Message action type
type MsgAction int64
type ProjectRight int64

// UserForm is a struct to collect input data from login and setup
type UserForm struct {
	Name      string `form:"name"`
	Pwd       string `form:"password"`
	Pwd2      string `form:"password2"`
	GroupCode string `form:"groupcode"`
	Token     string `form:"websocketstoken"`
}

// ??
type Art struct {
	Name string
	Size string
	Page string
}

// Action types for messages
const (
	MSG_INVITE MsgAction = iota
	MSG_ACCEPT
	MSG_CHANGE
)

// Project rights
const (
	PRR_WRITE ProjectRight = iota
	PRR_INVITE
	PRR_PUBLISH
	PRR_REVERSE
	PRR_CLEANUP
	PRR_RENAME
	PRR_DISINVITE
	PRR_ADMINISTER
	PRR_DELETE
)

var PRR_NAMES []string = []string{
	"Write", // Has to be first
	"Invite",
	"Publish",
	"Reverse",
	"Cleanup",
	"Rename",
	"Disinvite",
	"Administer",
	"Delete",
}

//////////////////////////////////////////////////
// Global variables
//
var T map[string]string
var TLanguages map[string]map[string]string

const (
	MaxUserPerProject  = 100
	MaxRightsPerUser   = 100
	MaxMessagesPerUser = 100
	MaxGroupsPerUser   = 20
)

//////////////////////////////////////////////////
// init initializes the database and rebuilds the tables from file data
func init() {
	dbuser := beego.AppConfig.String("mysqluser")
	dbpass := beego.AppConfig.String("mysqlpass")
	database := beego.AppConfig.String("mysqldb")

	orm.RegisterDataBase("default", "mysql", dbuser+":"+dbpass+"@/"+database+"?charset=utf8")
	orm.SetMaxIdleConns("default", 30)
	orm.SetMaxOpenConns("default", 30)

	orm.RegisterModel(new(User), new(Project), new(ProjectUser), new(Message), new(Star), new(Groups), new(GroupUser), new(Rights), new(SessionToken))

	// Drop all runtime tables
	o := orm.NewOrm()
	o.Raw("SET FOREIGN_KEY_CHECKS=0;").Exec()
	_, err := o.Raw("TRUNCATE TABLE user;").Exec()
	if err != nil {
		// If table can't be truncated, rebuild all tables (CAUTION: Star and Message db are lost!)
		// This is only for absolute startup
		err := orm.RunSyncdb("default", true, true)
		if err != nil {
			beego.Error(err)
		}
	}
	o.Raw("TRUNCATE TABLE rights;").Exec()
	o.Raw("TRUNCATE TABLE project;").Exec()
	o.Raw("TRUNCATE TABLE project_user;").Exec()
	o.Raw("TRUNCATE TABLE groups;").Exec()
	o.Raw("TRUNCATE TABLE group_user;").Exec()
	o.Raw("SET FOREIGN_KEY_CHECKS=1;").Exec()

	createAllUserDatabaseEntries()
}

//////////////////////////////////////
// CreateAllUserDatabaseEntries builds up the user table in the database
func createAllUserDatabaseEntries() {

	// Read groups from Admin ini file
	dir := beego.AppConfig.String("userdata::location")
	adminIdentityFile := dir + beego.AppConfig.String("userdata::admin") + "/" + beego.AppConfig.String("userdata::spielplatzdir") + "/identity"
	cnf, err := config.NewConfig("ini", adminIdentityFile)
	if err == nil {
		groups, err := cnf.GetSection("groupsdef")
		if err != nil {
			beego.Error(err)
		} else {
			for _, value := range groups {
				index := strings.Index(value, ";")
				if index > 0 {
					name := value[:index]
					code := value[index+1:]
					CreateGroupDatabaseEntry(name, code)
				} else {
					beego.Error("Invalid group definition", value)
				}
			}
		}
	} else {
		beego.Error("Couldn't open identity file of Admin." + err.Error())
	}

	// Walk the main user directory
	files, _ := ioutil.ReadDir(dir)
	for _, f := range files {
		var (
			user     *User
			userName string
		)
		if f.IsDir() == true {

			// Create user entry in database
			userName = f.Name()
			identityFile := dir + userName + "/" + beego.AppConfig.String("userdata::spielplatzdir") + "/identity"
			cnf, err := config.NewConfig("ini", identityFile)
			if err == nil {
				user = new(User)
				user.Name = userName
				user.Pwhash = cnf.String("auth::Pwhash")

				CreateUserDatabaseEntry(user)

				rights, err := cnf.GetSection("rights")
				if err == nil {
					for right, value := range rights {
						CreateRightsDatabaseEntry(user, right, value)
					}
				}
			} else {
				beego.Error("Couldn't open identity file of user " + userName + "." + err.Error())
			}

			// Create user group database entry
			groups := cnf.Strings("groups::member")
			for _, group := range groups {
				if group != "" {
					CreateGroupUserDatabaseEntry(user, group)
				}
			}

			// Walk the projects directory
			projectsDir := dir + userName + "/" + beego.AppConfig.String("userdata::projects") + "/"
			files, _ := ioutil.ReadDir(projectsDir)
			for _, f := range files {
				if f.IsDir() == true {

					var project *Project
					projectName := f.Name()
					projectFile := projectsDir + projectName + "/" + beego.AppConfig.String("userdata::spielplatzdir") + "/project"
					cnf, err := config.NewConfig("ini", projectFile)
					if err == nil {
						project = new(Project)
						project.Name = projectName
						project.Playground = cnf.String("Playground")
						project.Origin = cnf.String("Origin")
						project.Gallery, _ = cnf.Bool("Gallery")
						project.Forks = 0
						project.Stars = 0
					} else {
						beego.Error("Couldn't open project file of user " + userName + " in project " + projectName + ". (" + err.Error() + ")")
					}

					rightsFile := projectsDir + projectName + "/" + beego.AppConfig.String("userdata::spielplatzdir") + "/rights"
					cnf, err = config.NewConfig("ini", rightsFile)
					if err == nil {
						var rights int64
						rightNames, _ := cnf.GetSection("rights")
						for right, value := range rightNames {
							for index, r := range PRR_NAMES {
								if strings.ToLower(r) == right && value == "true" {
									rights |= 1 << uint(index)
								}
							}
						}
						CreateProjectDatabaseEntry(project, user, rights)
						MountResourceFiles(userName, projectName)
					} else {
						beego.Error("Couldn't open rights file of user " + userName + " in project " + projectName + ". (" + err.Error() + ")")
					}
				}
			}
		}
	}
}

/////////////////////////////////////////////////////////////
// MountResourceFiles
func MountResourceFiles(user string, project string) error {

	resources := []string{"image", "sound"}
	for _, res := range resources {
		fromDir := beego.AppConfig.String("userdata::location") +
			user + "/" +
			beego.AppConfig.String("userdata::projects") + "/" +
			project + "/" +
			beego.AppConfig.String("userdata::"+res+"files")
		toDir := beego.AppConfig.String("userdata::location") +
			user + "/" + beego.AppConfig.String("userdata::"+res+"files") + "/" +
			project

		res, _ := exec.Command("sh", "-c", "mount | grep \""+toDir+"\"").Output()
		if len(res) == 0 {

			beego.Trace("MOUNTING resource", res, "of project", project, "from user", user)
			if err := os.MkdirAll(toDir, os.ModePerm); err != nil {
				beego.Error("Cannot create directory", toDir)
			}

			cmd := exec.Command("sudo", "mount", "--bind", fromDir, toDir)
			err := cmd.Run()
			if err != nil {
				beego.Error("Cannot mount --bind ", toDir, err.Error())
			}
		}
	}

	return nil
}

//////////////////////////////////////////////////
// CreateGroupDatabaseEntry creates a user database entry
func CreateGroupDatabaseEntry(name string, code string) error {

	o := orm.NewOrm()
	o.Using("default")
	g := &Groups{
		Name: name,
		Code: code,
	}

	err := o.Read(g, "Name")
	if err == orm.ErrNoRows {
		_, err := o.Insert(g)
		if err != nil {
			beego.Error(err)
		}
	} else {
		beego.Error(err)
	}

	return nil
}

//////////////////////////////////////////////////
// CreateGroupUserDatabaseEntry creates a user database entry
func CreateGroupUserDatabaseEntry(u *User, group string) error {

	o := orm.NewOrm()
	o.Using("default")
	g := &Groups{
		Name: group,
	}
	err := o.Read(g, "Name")
	if err == nil {
		gu := &GroupUser{
			User:  u,
			Group: g,
		}
		_, err := o.Insert(gu)
		if err != nil {
			return err
		}
	} else {
		return err
	}

	return nil
}

//////////////////////////////////////////////////
// CloneProjectDir
func CloneProjectDir(userName string, projectName string) error {
	url := beego.AppConfig.String("userdata::location") + "/" +
		beego.AppConfig.String("userdata::bareprojects") + "/" +
		projectName

	dir := beego.AppConfig.String("userdata::location") +
		userName + "/" +
		beego.AppConfig.String("userdata::projects") + "/" +
		projectName

	options := git.CloneOptions{
		Bare: false,
	}
	_, err := git.Clone(url, dir, &options)
	if err == nil {
		MountResourceFiles(userName, projectName)
	}

	// Create rights file
	rightsFile := dir + "/" + beego.AppConfig.String("userdata::spielplatzdir") + "/rights"
	file, err := os.Create(rightsFile)
	if err != nil {
		beego.Error(err)
		return err
	}
	file.Close()
	cnf, err := config.NewConfig("ini", rightsFile)
	if err != nil {
		beego.Error("Cannot create rights file " + rightsFile + " (" + err.Error() + ")")
		return err
	}
	for _, right := range PRR_NAMES {
		if right == "Write" {
			cnf.Set("rights::"+right, "true")
		} else {
			cnf.Set("rights::"+right, "false")
		}
	}
	cnf.SaveConfigFile(rightsFile)

	// Create database entry
	user, _ := GetUser(userName)
	project := new(Project)
	project.Name = projectName
	err = CreateProjectDatabaseEntry(project, user, 1)

	return err
}

//////////////////////////////////////////////////
// GetGroupsFromDatabase reads the groups of a specific user
func GetGroupsFromDatabase(userName string) []string {
	o := orm.NewOrm()
	o.Using("default") // Using default, you can use other database

	u := &User{
		Name: userName,
	}
	var g []orm.Params

	groups := []string{}

	err := o.Read(u, "Name")
	if err == nil {
		o.QueryTable("group_user").Filter("user", u).Values(&g, "group_id__name")

		for _, params := range g {
			groups = append(groups, params["Group__Name"].(string))
		}
	} else {
		beego.Error(err)
	}

	return groups
}

//////////////////////////////////////////////////
// GetPalsFromDatabase reads the users that are in the group of a user
func GetPalsFromDatabase(userName string) map[string][]string {
	o := orm.NewOrm()
	o.Using("default") // Using default, you can use other database

	u := &User{
		Name: userName,
	}
	var g []orm.Params

	pals := make(map[string][]string)

	err := o.Read(u, "Name")
	if err == nil {
		o.QueryTable("group_user").Filter("user", u).Values(&g, "group_id", "group_id__name")

		for _, params := range g {
			var g1 []orm.Params
			groupId := params["Group__Group"].(int64)
			groupName := params["Group__Name"].(string)
			pals[groupName] = []string{}

			gr := &Groups{
				Id: groupId,
			}

			o.QueryTable("group_user").Filter("group", gr).Values(&g1, "user_id__name")
			for _, params := range g1 {
				palName := params["User__Name"].(string)
				if userName != palName {
					pals[groupName] = append(pals[groupName], palName)
				}
			}
		}
	} else {
		beego.Error(err)
	}

	return pals
}

//////////////////////////////////////////////////
// GetMessagesFromDatabase reads the users that are in the group of a user
func GetMessagesFromDatabase(userName string) []MsgData {
	o := orm.NewOrm()
	o.Using("default") // Using default, you can use other database

	u := &User{
		Name: userName,
	}
	var m []orm.Params

	messages := make([]MsgData, 0, MaxMessagesPerUser)

	err := o.Read(u, "Name")
	if err == nil {
		o.QueryTable("message").Filter("user", u).Values(&m, "id", "project_id__name", "subject", "text", "action", "time_stamp")

		//		beego.Warning("Messages for", userName, m)
		for _, params := range m {
			messages = append(messages, MsgData{
				"Id":          params["Id"].(int64),
				"ProjectName": params["Project__Name"].(string),
				"Subject":     params["Subject"].(string),
				"Text":        params["Text"].(string),
				"Action":      params["Action"].(int64),
				"TimeStamp":   params["TimeStamp"].(time.Time).Unix(),
			})
		}
	} else {
		beego.Error(err)
	}

	return messages
}

//////////////////////////////////////////////////
// GetProjectRightsFromDatabase reads the users that are in the group of a user
func GetProjectRightsFromDatabase(userName string, projectName string) []string {
	o := orm.NewOrm()
	o.Using("default") // Using default, you can use other database

	var r []orm.Params

	rights := make([]string, 0, MaxRightsPerUser)

	o.QueryTable("project_user").Filter("user__name", userName).Filter("project__name", projectName).Values(&r, "rights")

	//	beego.Warning("Rights for", userName, projectName, r)
	rightBits := r[0]["Rights"].(int64)
	for index, right := range PRR_NAMES {
		if rightBits&(1<<uint(index)) > 0 {
			rights = append(rights, right)
		}
	}

	//	beego.Warning("Rights for", userName, rights)
	return rights
}

//////////////////////////////////////////////////
// GetProjectUsersFromDatabase reads the users that are in the group of a user
func GetProjectUsersFromDatabase(projectName string) []string {
	o := orm.NewOrm()
	o.Using("default") // Using default, you can use other database

	var u []orm.Params

	users := make([]string, 0, MaxUserPerProject)

	num, _ := o.QueryTable("project_user").Filter("project__name", projectName).Values(&u, "user__name")

	if num > 0 {
		for _, params := range u {
			users = append(users, params["User__Name"].(string))
		}
	}

	return users
}

func CheckRight(userName string, projectName string, right string) bool {
	rights := GetProjectRightsFromDatabase(userName, projectName)
	ok := false

	for i := 0; i < len(rights); i++ {
		if rights[i] == right {
			ok = true
		}
	}

	return ok
}

//////////////////////////////////////////////////
// DeleteMessageFromDatabase reads the users that are in the group of a user
func DeleteMessageFromDatabase(userName string, messageId int64) error {
	o := orm.NewOrm()
	o.Using("default") // Using default, you can use other database

	u := &User{
		Name: userName,
	}

	var num int64
	err := o.Read(u, "Name")
	if err == nil {
		num, err = o.QueryTable("message").Filter("user", u).Filter("id", messageId).Delete()

		beego.Warning("Deleted", num, "entries. Id =", messageId)
	}

	if err != nil {
		beego.Error(err)
	}
	return err
}

//////////////////////////////////////////////////
// CreateRightsDatabaseEntry creates a user database entry
func CreateRightsDatabaseEntry(u *User, right string, value string) error {

	o := orm.NewOrm()
	o.Using("default")
	r := &Rights{
		Name:  right,
		Value: value,
		User:  u,
	}
	err := o.Read(r, "Name")
	if err == orm.ErrNoRows {
		_, err := o.Insert(r)
		if err != nil {
			beego.Error(err)
		}
	} else if err != nil {
		beego.Error(err)
	}

	return nil
}

//////////////////////////////////////////////////
// GetRightsFromDatabase reads the rights of a specific user
func GetRightsFromDatabase(userName string) *RightsMap {
	o := orm.NewOrm()
	o.Using("default") // Using default, you can use other database

	u := &User{
		Name: userName,
	}
	var r []*Rights
	rm := make(RightsMap, MaxRightsPerUser)

	err := o.Read(u, "Name")
	if err == nil {
		o.QueryTable("rights").Filter("user", u).All(&r)

		for _, value := range r {
			rm[value.Name] = value.Value
		}
	} else {
		beego.Error(err)
	}

	return &rm
}

//////////////////////////////////////////////////
// CreateUserDatabaseEntry creates a user database entry
func CreateUserDatabaseEntry(u *User) error {

	o := orm.NewOrm()
	o.Using("default") // Using default, you can use other database

	err := o.Read(u, "Name")
	if err == orm.ErrNoRows {
		_, err := o.Insert(u)
		if err != nil {
			return errors.New(T["signup_insert_failed"])
		}
	} else {
		return errors.New(T["signup_name_exists"])
	}

	return nil
}

//////////////////////////////////////////////////
// CreateProjectDatabaseEntry creates a project database entry
func CreateProjectDatabaseEntry(p *Project, u *User, rights int64) error {

	o := orm.NewOrm()
	o.Using("default")

	err := o.Read(p, "Name")
	if err == orm.ErrNoRows {
		_, err := o.Insert(p)
		if err != nil {
			beego.Error(err.Error())
			return err
		}
	}

	pu := &ProjectUser{
		Project: p,
		User:    u,
		Rights:  rights,
	}

	_, err = o.Insert(pu)
	if err != nil {
		beego.Error(err.Error())
		return err
	}

	return nil
}

//////////////////////////////////////////////////
// CreateSessionTokenDatabaseEntry creates a project database entry
func CreateSessionTokenDatabaseEntry(token string, userName string) error {

	o := orm.NewOrm()
	o.Using("default")
	u := User{
		Name: userName,
	}

	err := o.Read(&u, "Name")
	if err != nil {
		return err
	}

	t := SessionToken{
		User:  &u,
		Token: token,
	}
	_, err = o.Insert(&t)
	if err != nil {
		beego.Error(err.Error())
		return err
	}

	return nil
}

//////////////////////////////////////////////////
// GetUserFromSessionToken return the user of a session token or empty string
func GetUserFromSessionToken(token string) (string, bool) {

	o := orm.NewOrm()
	o.Using("default")

	var g []orm.Params

	num, _ := o.QueryTable("session_token").Filter("token", token).Values(&g, "user__name")
	if num > 0 {
		return g[0]["User__Name"].(string), true
	} else {
		return "", false
	}
}

//////////////////////////////////////////////////
// RemoveSessionToken removes a session token
func RemoveSessionToken(token string) error {

	o := orm.NewOrm()
	o.Using("default")

	num, err := o.QueryTable("session_token").Filter("token", token).Delete()
	if num == 1 {
		return nil
	} else {
		return err
	}
}

func CreateInvitationMessages(userName string, projectName string, userNames []string, subject string, message string) error {

	subject = fmt.Sprintf(subject, projectName)
	message = fmt.Sprintf(message, projectName, userName)
	project, _ := GetProject(projectName)

	o := orm.NewOrm()
	o.Using("default")

	for _, userName := range userNames {
		user, _ := GetUser(userName)
		m := &Message{
			User:    user,
			Project: project,
			Subject: subject,
			Text:    message,
			Action:  MSG_INVITE,
		}

		err := o.Read(m, "User", "Project", "Action")
		if err == orm.ErrNoRows {
			_, err := o.Insert(m)
			if err != nil {
				beego.Error(err)
				return err
			}
		}
	}

	return nil
}

//////////////////////////////////////////////////
// AddProjectStar add a star to a project
// This function is not correct!
func AddProjectStar(s Star) error {

	o := orm.NewOrm()
	o.Using("default") // Using default, you can use other database

	err := o.Read(&s, "User", "Project")
	if err == orm.ErrNoRows {
		_, err := o.Insert(&s)
		if err != nil {
			return err
		}
	} else {
		return err
	}

	return nil
}

//////////////////////////////////////////////////
// CreateUserInDatabase reads user form and calls CreateUserDatabaseEntry
func CreateUserInDatabase(uf *UserForm) (User, string, error) {
	// Check group code
	group := Groups{
		Code: uf.GroupCode,
	}
	o := orm.NewOrm()
	o.Using("default")
	err := o.Read(&group, "Code")
	if err == orm.ErrNoRows {
		return User{}, "", errors.New("group code wrong")
	} else if err != nil {
		return User{}, "", err
	}

	hash := sha1.Sum([]byte(uf.Pwd))
	user := User{
		Name:   uf.Name,
		Pwhash: hex.EncodeToString(hash[:]),
	}

	err = CreateUserDatabaseEntry(&user)
	if err != nil {
		return User{}, "", err
	}

	beego.Warning("Group found:", group)
	err = CreateGroupUserDatabaseEntry(&user, group.Name)
	if err != nil {
		return user, "", err
	}

	return user, group.Name, nil
}

//////////////////////////////////////////////////
// AuthenticateUser authenticates a user
func AuthenticateUser(uf *UserForm) (User, error) {

	u := User{
		Name: uf.Name,
	}

	o := orm.NewOrm()
	o.Using("default")

	err := o.Read(&u, "Name")
	if err == nil {
		// check password
		hash := sha1.Sum([]byte(uf.Pwd))
		str := hex.EncodeToString(hash[:])
		beego.Trace(hash, str)
		if str != u.Pwhash {
			return User{}, errors.New(T["login_password_incorrect"])
		}
	} else if err == orm.ErrNoRows {
		return User{}, errors.New(T["login_password_incorrect"])
	}

	return u, nil
}

/////////////////////////////////////////////////////
// CreateDirectories creates directories with one .gitignore file in it (then they are added by git even if empty)
func CreateDirectories(dir string, base bool) error {

	dirs := strings.Split(beego.AppConfig.String("userdata::codefiles"), ",")
	dirs = append(dirs, beego.AppConfig.String("userdata::soundfiles"))
	dirs = append(dirs, beego.AppConfig.String("userdata::imagefiles"))
	dirs = append(dirs, beego.AppConfig.String("userdata::jsonfiles"))
	dirs = append(dirs, beego.AppConfig.String("userdata::spielplatzdir"))

	// A project directory is only contained in a base directory
	if base == true {
		dirs = append(dirs, beego.AppConfig.String("userdata::projects"))
	}

	for i := 0; i < len(dirs); i++ {
		if err := os.MkdirAll(dir+"/"+dirs[i], os.ModePerm); err != nil {
			beego.Error("Cannot create directory", dir, dirs[i])
			return err
		}

		CreateTextFile(dir+"/"+dirs[i]+"/.gitignore", "")
	}

	return nil
}

/////////////////////////////////////////////////////
// CreateTextFile creates a text file
func CreateTextFile(name string, text string) (err error) {
	out, err := os.Create(name)
	if err != nil {
		return
	}
	defer func() {
		cerr := out.Close()
		if err == nil {
			err = cerr
		}
	}()

	if _, err = out.Write([]byte(text)); err != nil {
		return
	}
	err = out.Sync()
	return
}

//////////////////////////////////////////////////////////
// GetUser
func GetUser(userName string) (*User, error) {

	o := orm.NewOrm()
	user := new(User)
	user.Name = userName
	err := o.Read(user, "Name")

	return user, err
}

//////////////////////////////////////////////////////////
// GetProject
func GetProject(projectName string) (*Project, error) {

	o := orm.NewOrm()
	project := new(Project)
	project.Name = projectName
	err := o.Read(project, "Name")

	return project, err
}

//////////////////////////////////////////////////////////
// GitAddCommitPush
func GitAddCommitPush(userName string, dir string, message string, firstCommit bool) error {

	///////////////////////////////////////////////////////////////////////
	// Add
	//
	// 1 Open repository
	repo, err := git.OpenRepository(dir)
	if err != nil {
		beego.Error("OpenRepository - ", err)
	}

	// 2 Retrieve index
	index, err := repo.Index()
	if err != nil {
		beego.Error("Index - ", err)
	}

	// 3 Remember if we had conflicts before we added everything to the index
	indexHadConflicts := index.HasConflicts()

	// 4 Add everything to the index
	err = index.AddAll([]string{}, git.IndexAddDefault, nil)
	if err != nil {
		beego.Error("AddAll - ", err)
	}

	// 5 Write the index (so git knows about it)
	err = index.Write()
	if err != nil {
		beego.Error("Write - ", err)
	}

	// 6 Write the current index tree to the repo
	treeId, err := index.WriteTreeTo(repo)
	if err != nil {
		beego.Error("WriteTreeTo - ", err)
	}

	/////////////////////////////////////////////////////////////////////////////////////////////
	// Commit
	//
	// 1 Retrieve the tree we just wrote (git's reference of it that it made in the last step)
	tree, err := repo.LookupTree(treeId)
	if err != nil {
		beego.Error("LookupTree - ", err)
	}

	// 2 Create a signature
	sig := &git.Signature{
		Name:  userName,
		Email: userName + "@" + beego.AppConfig.String("userdata::emailserver"),
		When:  time.Now(),
	}

	// 3 Get or create remote
	remote, err := repo.Remotes.Lookup("origin")
	if err != nil {
		remote, err = repo.Remotes.Create("origin", repo.Path())
		if err != nil {
			beego.Error("CreateRemote - ", err)
		}
	}

	// 4 Determine if this is a first commit ...
	if firstCommit == true {

		// 4a ... then create a new one
		_, err = repo.CreateCommit("HEAD", sig, sig, message, tree)

	} else {

		// 4b ... or retrieve current head
		currentBranch, err := repo.Head()
		if err != nil {
			beego.Error("Head - ", err)
		}

		// 5 Read the remote branch
		remoteBranch, err := repo.References.Lookup("refs/remotes/origin/master")
		if err != nil {
			beego.Error("Fetch 2 - ", err)
		}

		// 6 Retrieve current commit
		currentTip, err := repo.LookupCommit(currentBranch.Target())
		if err != nil {
			beego.Error("LookupCommit - ", err)
		}

		// 7 Create a new one on top
		currentCommit, err := repo.CreateCommit("HEAD", sig, sig, message, tree, currentTip)
		if err != nil {
			beego.Error("CreateCommit - ", err)
		}

		////////////////////////////////////////////////////////////////////////////////////
		// Merge commit (in case of -- now hopefully resolved -- conflicts)
		//
		// 1 If there were conflicts, do the merge commit
		if indexHadConflicts == true {

			// 2 Retrieve the local commit
			localCommit, err := repo.LookupCommit(currentCommit)
			if err != nil {
				beego.Error("Fetch 11 - ", err)
			}

			// 3 Retrieve the remote commit
			remoteCommit, err := repo.LookupCommit(remoteBranch.Target())
			if err != nil {
				beego.Error("Fetch 12 - ", err)
			}

			// 4 Create a new one
			repo.CreateCommit("HEAD", sig, sig, "Merge commit", tree, localCommit, remoteCommit)

			// 5 Clean up
			repo.StateCleanup()
		}

		///////////////////////////////////////////////////////////////////////////////////
		// Pull (Fetch and Merge)
		//
		// 1 Fetch it
		err = remote.Fetch([]string{}, nil, "")
		if err != nil {
			beego.Error("Fetch 1 - ", err)
		}

		// 2 Read the remote branch
		remote, err = repo.Remotes.Lookup("origin")
		remoteBranch, err = repo.References.Lookup("refs/remotes/origin/master")
		if err != nil {
			beego.Error("Fetch 2 - ", err)
		}

		// 3 Perform an annotated commit
		annotatedCommit, err := repo.AnnotatedCommitFromRef(remoteBranch)
		if err != nil {
			beego.Error("Fetch 3 - ", err)
		}

		// 4 Do the merge analysis
		mergeHeads := make([]*git.AnnotatedCommit, 1)
		mergeHeads[0] = annotatedCommit
		analysis, _, err := repo.MergeAnalysis(mergeHeads)
		if err != nil {
			beego.Error("Fetch 4 - ", err)
		}

		// 5 Check if something happend
		if analysis&git.MergeAnalysisUpToDate == 0 && analysis&git.MergeAnalysisNormal != 0 {

			// 6 Yes! First just merge changes
			if err := repo.Merge([]*git.AnnotatedCommit{annotatedCommit}, nil, nil); err != nil {
				beego.Error("Fetch 5 - ", err)
			}

			// 7 Retrieve the index after that treatment
			index, err := repo.Index()
			if err != nil {
				beego.Error("Fetch 6 - ", err)
			}

			// 8 Check for conflicts
			if index.HasConflicts() {
				beego.Warning("Conflicts occured while merging project repository in", dir, "(User:", userName+")")
				// 8a There are not automaticly solvable conflicts ... give them back to the user
				err = index.Write()
				if err != nil {
					beego.Error("Write - ", err)
				}

				return errors.New("Conflicts")
			}

			// 9 Write the new tree
			treeId, err := index.WriteTree()
			if err != nil {
				beego.Error("Fetch 9 - ", err)
			}

			// 10 Retrieve the new tree
			tree, err := repo.LookupTree(treeId)
			if err != nil {
				beego.Error("Fetch 10 - ", err)
			}

			// 11 Retrieve the local commit
			localCommit, err := repo.LookupCommit(currentCommit)
			if err != nil {
				beego.Error("Fetch 11 - ", err)
			}

			// 12 Retrieve the remote commit
			remoteCommit, err := repo.LookupCommit(remoteBranch.Target())
			if err != nil {
				beego.Error("Fetch 12 - ", err)
			}

			// 13 Create a new one
			repo.CreateCommit("HEAD", sig, sig, "Merge commit", tree, localCommit, remoteCommit)

			// 14 Clean up
			repo.StateCleanup()

		} else if analysis&git.MergeAnalysisFastForward != 0 {
			beego.Warning("Git Merge: Fast Forward")
			// 15 Get remote tree
			remoteTree, err := repo.LookupTree(remoteBranch.Target())
			if err != nil {
				return err
			}

			// 16 Checkout
			if err := repo.CheckoutTree(remoteTree, nil); err != nil {
				return err
			}

			// 17 Get current branch
			branch, err := repo.References.Lookup("refs/heads/master")
			if err != nil {
				return err
			}

			// 18 Point branch to the object
			branch.SetTarget(remoteBranch.Target(), "")
			if _, err := currentBranch.SetTarget(remoteBranch.Target(), ""); err != nil {
				return err
			}
		}
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////
	// Push
	err = remote.Push([]string{"refs/heads/master"}, nil)
	if err != nil {
		beego.Error("Push - ", err)
	}

	return err
}

func AnnotatedPull(repo *git.Repository, sig *git.Signature) error {

	// 1 Get remote
	remote, err := repo.Remotes.Lookup("origin")
	if err != nil {
		return errors.New("LookupRemote - " + err.Error())
	}

	// 2 Fetch it (pull without merge)
	err = remote.Fetch([]string{}, nil, "")
	if err != nil {
		return errors.New("Fetch 1 - " + err.Error())
	}

	// 3 Read the remote branch
	remoteBranch, err := repo.References.Lookup("refs/remotes/origin/master")
	if err != nil {
		return errors.New("Fetch 2 - " + err.Error())
	}

	// 3 Perform an annotated commit
	annotatedCommit, err := repo.AnnotatedCommitFromRef(remoteBranch)
	if err != nil {
		beego.Error("Fetch 3 - ", err)
	}

	// 4 Do the merge analysis
	mergeHeads := make([]*git.AnnotatedCommit, 1)
	mergeHeads[0] = annotatedCommit
	analysis, _, err := repo.MergeAnalysis(mergeHeads)
	if err != nil {
		beego.Error("Fetch 4 - ", err)
	}
	// Check if something happend
	if analysis&git.MergeAnalysisUpToDate != 0 {
		return nil

	} else if analysis&git.MergeAnalysisNormal != 0 {

		// 5 Yes! First just merge changes
		if err := repo.Merge([]*git.AnnotatedCommit{annotatedCommit}, nil, nil); err != nil {
			return err
		}

		// 6 Retrieve the index after that treatment
		index, err := repo.Index()
		if err != nil {
			beego.Error("Fetch 6 - ", err)
		}

		// 7 Check for conflicts
		if index.HasConflicts() {
			// 7a There are not automaticly solvable conflicts ... give them back to the user
			beego.Trace("Conflicts! Write new index and return.", index)
			err = index.Write()
			if err != nil {
				beego.Error("Write - ", err)
			}

			return errors.New("Conflicts")
		}

		// 8 Write the new tree
		treeId, err := index.WriteTree()
		if err != nil {
			beego.Error("Fetch 8 - ", err)
		}

		// 9 Retrieve the new tree
		tree, err := repo.LookupTree(treeId)
		if err != nil {
			beego.Error("Fetch 9 - ", err)
		}

		// 10 Get Current Head
		head, err := repo.Head()
		if err != nil {
			beego.Error("Fetch 10 - ", err)
		}

		// 11 Retrieve the local commit
		localCommit, err := repo.LookupCommit(head.Target())
		if err != nil {
			beego.Error("Fetch 11 - ", err)
		}

		// 12 Retrieve the remote commit
		remoteCommit, err := repo.LookupCommit(remoteBranch.Target())
		if err != nil {
			beego.Error("Fetch 12 - ", err)
		}

		// 13 Create a new one
		_, err = repo.CreateCommit("HEAD", sig, sig, "Merge commit", tree, localCommit, remoteCommit)
		if err != nil {
			beego.Error("Fetch 13 - ", err)
		}

		// 14 Clean up
		repo.StateCleanup()
	}

	return nil
}
