package models

import (
	"crypto/sha1"
	"encoding/hex"
	"errors"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/orm"
	_ "github.com/go-sql-driver/mysql"
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

type UserForm struct {
	Name  string `form:"name"`
	Pwd   string `form:"password"`
	Pwd2  string `form:"password2"`
	Email string `form:"email"`
}

type Art struct {
	Name string
	Size string
	Page string
}

type File struct {
	Id       int
	Filename string
	User     *User `orm:"rel(one)"` // OneToOne relation
}

type Fork struct {
	Id       int
	OrigFile *File `orm:"rel(one)"`
	DestFile *File `orm:"rel(one)"` // OneToOne relation
}

//////////////////////////////////////////////////
// Global variables
//

var T map[string]string
var TLanguages map[string]map[string]string

func init() {
	dbuser := beego.AppConfig.String("mysqluser")
	dbpass := beego.AppConfig.String("mysqlpass")
	database := beego.AppConfig.String("mysqldb")

	orm.RegisterDriver("mysql", orm.DR_MySQL)
	orm.RegisterDataBase("default", "mysql", dbuser+":"+dbpass+"@/"+database+"?charset=utf8")
	orm.SetMaxIdleConns("default", 30)
	orm.SetMaxOpenConns("default", 30)

	orm.RegisterModel(new(User))
	orm.RegisterModel(new(File))
	orm.RegisterModel(new(Fork))
}

func Login(uf *UserForm) (User, error) {

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

func Signup(uf *UserForm) (User, error) {

	u := User{
		Name: uf.Name,
	}

	o := orm.NewOrm()
	o.Using("default") // Using default, you can use other database

	err := o.Read(&u, "Name")
	if err == orm.ErrNoRows {
		hash := sha1.Sum([]byte(uf.Pwd))
		u.Pwhash = hex.EncodeToString(hash[:])
		_, err := o.Insert(&u)
		if err != nil {
			return User{}, errors.New(T["signup_insert_failed"])
		}
	} else {
		return User{}, errors.New(T["signup_name_exists"])
	}

	return u, nil
}
