package models

import (
	"github.com/astaxie/beego"
	"os/exec"
)

func GitClone(url string, dir string) error {

	err := exec.Command("git", "clone", url, dir).Run()

	return err
}

func GitInit(dir string, bare bool) error {

	option := ""
	if bare {
		option = "--bare"
	}

	err := exec.Command("git", "init", option, dir).Run()

	return err
}

func GitAddCommitPush(dir string, message string) {

	add := exec.Command("git", "add", ".")
	add.Dir = dir
	commit := exec.Command("git", "commit", "-m", message)
	commit.Dir = dir
	push := exec.Command("git", "push")
	push.Dir = dir

	_, err := add.Output()
	if err != nil {
		beego.Error(err)
	}
	_, err = commit.Output()
	if err != nil {
		beego.Error(err)
	}
	_, err = push.Output()
	if err != nil {
		beego.Error(err)
	}
}

func GitSetName(name string, email string) error {

	err := exec.Command("git", "config", "user.name", name).Run()
	if err != nil {
		return err
	}

	err = exec.Command("git", "config", "user.email", email).Run()

	return err
}
