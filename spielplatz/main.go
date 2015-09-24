package main

import (
	"fmt"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/orm"
	_ "github.com/go-sql-driver/mysql"
	"github.com/lavisrap/Computer-Spielplatz/spielplatz/models"
	_ "github.com/lavisrap/Computer-Spielplatz/spielplatz/routers"
)

func init() {
	orm.RegisterDriver("mysql", orm.DR_MySQL)
	orm.RegisterDataBase("default", "mysql", "root:MJl0xkPdwf+3@/beego?charset=utf8")
	orm.SetMaxIdleConns("default", 30)
	orm.SetMaxOpenConns("default", 30)
}

func main() {
	o := orm.NewOrm()
	o.Using("default") // Using default, you can use other database

	user := models.User{Name: "slene"}

	err := o.Read(&user, "Name")

	if err == orm.ErrNoRows {
		fmt.Println("No rows.")
	} else if err == orm.ErrMissPK {
		fmt.Println("No pk.")
	} else {
		fmt.Println(user.Id, user.Name, user.Profile)
		user.Name = "Michael"
		o.Update(&user)
	}

	var users []*models.User
	qs := o.QueryTable("user").Filter("profile__age", 29)
	_, err = qs.All(&users)
	for i := 0; i < len(users); i++ {
		u := *users[i]
		fmt.Println(i, u, u.Profile.Age)
	}

	beego.SessionOn = true
	beego.Run()
}
