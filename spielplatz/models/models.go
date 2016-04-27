package models

import (
	"crypto/sha1"
	"encoding/hex"
	"errors"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/config"
	"github.com/astaxie/beego/orm"
	_ "github.com/go-sql-driver/mysql"
	"io/ioutil"
	"os"
	"os/exec"
	"strings"
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

// Project contains a list of user projects
type Project struct {
	Id         int
	Name       string
	Playground string
	User       *User `orm:"rel(fk)"`
	ReadOnly   bool
	Origin     string
	Gallery    bool
	Forks      int
	Stars      int
}

// Stars contains a list of all stars
type Star struct {
	Id      int
	User    *User    `orm:"rel(fk)"`
	Project *Project `orm:"rel(fk)"`
}

// Message contains all messages
type Message struct {
	Id      int
	User    *User    `orm:"rel(fk)"`
	Project *Project `orm:"rel(fk)"`
	Text    string
	Action  MsgAction
}

// Message action type
type MsgAction int

// UserForm is a struct to collect input data from login and setup
type UserForm struct {
	Name  string `form:"name"`
	Pwd   string `form:"password"`
	Pwd2  string `form:"password2"`
	Email string `form:"email"`
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

//////////////////////////////////////////////////
// Global variables
//
var T map[string]string
var TLanguages map[string]map[string]string

//////////////////////////////////////////////////
// init initializes the database and rebuilds the tables from file data
func init() {
	dbuser := beego.AppConfig.String("mysqluser")
	dbpass := beego.AppConfig.String("mysqlpass")
	database := beego.AppConfig.String("mysqldb")

	orm.RegisterDataBase("default", "mysql", dbuser+":"+dbpass+"@/"+database+"?charset=utf8")
	orm.SetMaxIdleConns("default", 30)
	orm.SetMaxOpenConns("default", 30)

	orm.RegisterModel(new(User), new(Project), new(Message), new(Star))

	// Drop all runtime tables
	o := orm.NewOrm()
	_, err := o.Raw("TRUNCATE TABLE user;").Exec()
	if err != nil {
		// If table can't be truncated, rebuild all tables (CAUTION: Star db is also lost!)
		err := orm.RunSyncdb("default", true, true)
		if err != nil {
			beego.Error(err)
		}
	}
	o.Raw("TRUNCATE TABLE project;").Exec()
	o.Raw("TRUNCATE TABLE message;").Exec()

	createAllUserDatabaseEntries()
}

//////////////////////////////////////
// CreateAllUserDatabaseEntries builds up the user table in the database
func createAllUserDatabaseEntries() {
	// First drop table
	o := orm.NewOrm()
	o.Raw("TRUNCATE TABLE user").Exec()

	// Walk the main user directory
	dir := beego.AppConfig.String("userdata::location")
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
			} else {
				beego.Error("Couldn't open identity file of user " + userName + "." + err.Error())
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
					project.User = user
					project.ReadOnly, _ = cnf.Bool("ReadOnly")
					project.Origin = cnf.String("Origin")
					project.Gallery, _ = cnf.Bool("Gallery")
					project.Forks = 0
					project.Stars = 0

					CreateProjectDatabaseEntry(project)
					MountResourceFiles(userName, projectName)
				} else {
					beego.Error("Couldn't open project file of user " + userName + " in project " + projectName + ". (" + err.Error() + ")")
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

		res, _ := exec.Command("sh", "-c", "mount | grep "+toDir).Output()
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
func CreateProjectDatabaseEntry(p *Project) error {

	o := orm.NewOrm()
	o.Using("default")

	_, err := o.Insert(p)
	if err != nil {
		beego.Error(err.Error())
		return err
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
func CreateUserInDatabase(uf *UserForm) (User, error) {
	hash := sha1.Sum([]byte(uf.Pwd))
	u := User{
		Name:   uf.Name,
		Pwhash: hex.EncodeToString(hash[:]),
	}
	return u, CreateUserDatabaseEntry(&u)
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
// CreateDirectories
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

	beego.Trace("Creating dirs:", dirs)
	for i := 0; i < len(dirs); i++ {
		if err := os.MkdirAll(dir+"/"+dirs[i], os.ModePerm); err != nil {
			beego.Error("Cannot create directory", dir, dirs[i])
			return err
		}
	}

	return nil
}

//////////////////////////////////////////////////////////
// GetUserName
func GetUser(userName string) (*User, error) {

	o := orm.NewOrm()
	user := new(User)
	user.Name = userName
	err := o.Read(user, "Name")

	beego.Warning("user:", user, userName)
	return user, err
}
