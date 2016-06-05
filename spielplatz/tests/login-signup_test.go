package tests

import (
	"io/ioutil"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"regexp"
	"strconv"
	"testing"
)

var (
	loops    int            = 100
	regXsrf  *regexp.Regexp = regexp.MustCompile("name=\"websocketstoken\"\\svalue=\"([^\\s]+)\"")
	regTitle *regexp.Regexp = regexp.MustCompile("\\<h1\\>CYPHERPUNK Computer-Spielplatz\\<\\/h1\\>")
	regToken *regexp.Regexp = regexp.MustCompile("WebSocketsToken\\:\\s+\"([^\\s]+)\"")
)

func TestLoginSignup(t *testing.T) {

	ret := make(chan bool, loops)
	for i := 0; i < loops; i++ {
		go signup(t, "Autotester"+strconv.Itoa(i), ret)
	}

	for i := 0; i < loops; i++ {
		<-ret
	}

	for i := 0; i < loops; i++ {
		go login(t, "Autotester"+strconv.Itoa(i), ret)
	}

	for i := 0; i < loops; i++ {
		<-ret
	}
}

func signup(t *testing.T, name string, ret chan bool) {
	var xsrf string

	response, err := http.Get("http://localhost:8080/signup")
	if err != nil {
		panic(err)
	} else {
		defer response.Body.Close()
		buffer, _ := ioutil.ReadAll(response.Body)
		xsrf = regXsrf.FindStringSubmatch(string(buffer))[1]
	}

	options := cookiejar.Options{PublicSuffixList: nil}
	jar, _ := cookiejar.New(&options)
	c := &http.Client{Jar: jar}
	u, _ := url.Parse("http://localhost:8080/signup")
	c.Jar.SetCookies(u, response.Cookies())

	data := url.Values{}
	data.Set("name", name)
	data.Add("password", "111222")
	data.Add("password2", "111222")
	data.Add("groupcode", "AllesWirdGut")
	data.Add("websocketstoken", xsrf)
	response, err = c.PostForm("http://localhost:8080/signup", data)
	if err != nil {
		panic(err)
	} else {
		defer response.Body.Close()
		buffer, _ := ioutil.ReadAll(response.Body)
		title := regTitle.FindString(string(buffer))
		if title != "<h1>CYPHERPUNK Computer-Spielplatz</h1>" {
			t.Error("Title is not correct:", title, ". Should be: <h1>CYPHERPUNK Computer-Spielplatz</h1>")
		}
	}

	ret <- true
}

func login(t *testing.T, name string, ret chan bool) {
	var xsrf string

	response, err := http.Get("http://localhost:8080/login")
	if err != nil {
		panic(err)
	} else {
		defer response.Body.Close()
		buffer, _ := ioutil.ReadAll(response.Body)
		xsrf = regXsrf.FindStringSubmatch(string(buffer))[1]
	}

	options := cookiejar.Options{PublicSuffixList: nil}
	jar, _ := cookiejar.New(&options)
	c := &http.Client{Jar: jar}
	u, _ := url.Parse("http://localhost:8080/login")
	c.Jar.SetCookies(u, response.Cookies())

	data := url.Values{}
	data.Set("name", name)
	data.Add("password", "111222")
	data.Add("websocketstoken", xsrf)
	data.Add("_dest", "live-editor")
	response, err = c.PostForm("http://localhost:8080/login", data)
	if err != nil {
		panic(err)
	} else {
		defer response.Body.Close()
		buffer, _ := ioutil.ReadAll(response.Body)
		token := regToken.FindStringSubmatch(string(buffer))
		if token == nil || token[1] != xsrf {
			t.Error("WebSocketsToken of ", name, "is incorrect:", token, ". Should be", xsrf)
		}
	}

	ret <- true
}
