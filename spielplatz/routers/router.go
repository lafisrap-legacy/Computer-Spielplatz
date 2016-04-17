package routers

import (
	"encoding/json"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/context"
	"github.com/lafisrap/Computer-Spielplatz-Gitbase/spielplatz/controllers"
	"github.com/lafisrap/Computer-Spielplatz-Gitbase/spielplatz/models"
	"os"
	"strings"
)

// langType represents a language type.
type langType struct {
	Lang, Name string
}

var langTypes []*langType // Languages are supported.

func init() {
	beego.Trace("!Hello World!")
	beego.Router("/", &controllers.RootController{})
	beego.Router("/login/?:dest", &controllers.LoginController{})
	beego.Router("/logout", &controllers.LogoutController{})
	beego.Router("/signup/?:dest", &controllers.SignupController{})
	beego.Router("/live-editor", &controllers.LiveEditorController{})
	beego.Router("/graphics-animation", &controllers.GraphicsController{})
	beego.Router("/external/:file", &controllers.LiveEditorController{})

	beego.SetStaticPath("/build", "bootstrap/live-editor/build")

	var FilterUser = func(ctx *context.Context) {
		_, ok := ctx.Input.Session("uid").(int)
		if !ok {
			ctx.Redirect(302, "/login")
		}
	}

	beego.InsertFilter("/user/:id([0-9]+)", beego.BeforeRouter, FilterUser)

	beego.ErrorController(&controllers.ErrorController{})
	beego.SetLogger("file", `{"filename":"log/spielplatz.log"}`)

	loadLanguages()
}

func loadLanguages() {
	langs := strings.Split(beego.AppConfig.String("lang::types"), "|")
	names := strings.Split(beego.AppConfig.String("lang::names"), "|")
	langTypes = make([]*langType, 0, len(langs))
	for i, v := range langs {
		langTypes = append(langTypes, &langType{
			Lang: v,
			Name: names[i],
		})
	}

	tLanguages := make(map[string]map[string]string)
	for _, lang := range langs {
		t := make(map[string]string)

		configFile, err := os.Open("conf/" + "locale_" + lang + ".json")
		if err != nil {
			beego.Error("opening config file", err.Error())
		}

		jsonParser := json.NewDecoder(configFile)
		if err = jsonParser.Decode(&t); err != nil {
			beego.Error("Error parsing config file: ", err.Error())
		}

		tLanguages[lang] = t
	}

	models.T = tLanguages["de-DE"]
	models.TLanguages = tLanguages
}
