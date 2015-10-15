package controllers

import (
	"code.google.com/p/go.net/websocket"
	"encoding/json"
	_ "errors"
	"fmt"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/orm"
	"github.com/astaxie/beego/session"
	"github.com/lavisrap/Computer-Spielplatz/spielplatz/models"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

//////////////////////////////////////////////////////////
// socket represents a socket connection
//
// io.ReadWriter is the standard read/write interface
// done is a channel to stop the socket
//
type socket struct {
	io.ReadWriter
	done chan bool
}

///////////////////////////////////////////////////////////////
// Close adds a Close method to the socket making it a ReadWriteCloser
//
func (s socket) Close() error {
	s.done <- true
	return nil
}

/////////////////////////////////////////////////
// Message defines a websocket message
type Message struct {
	Id      int
	Xsrf    string
	Session session.SessionStore

	Command    string
	returnChan chan Data

	FileName  string
	FileNames []string
	CodeFiles []string
	SortedBy  string
	Range     Range

	Overwrite bool
}

type JSFile struct {
	TimeStamp int64
	Code      string
}

type Range struct {
	IndexFrom int
	IndexTo   int
	DateFrom  time.Time
	DateTo    time.Time
}

// Data is a map for command parameter to and from the controller
type Data map[string]interface{}

func init() {

	doneChan := make(chan bool)

	go StartWebsockets(doneChan)
}

// StartConnector starts up the websocket connector of the bee server
// 	config		settings from config file
// 	commandChan	channel to send commands to the controller
// 	doneChan	channel to signal end or get it signaled
func StartWebsockets(doneChan chan bool) {

	dir := beego.AppConfig.String("websockets::dir")
	address := beego.AppConfig.String("websockets::address")
	port := beego.AppConfig.String("websockets::port")

	beego.Trace("dir:", dir, "address:", address, "port:", port)
	http.Handle(dir, websocket.Handler(func(ws *websocket.Conn) {
		fmt.Println("New socket connection started ...")
		s := socket{ws, make(chan bool)}
		go translateMessages(s)

		encoder := json.NewEncoder(s)
		data := Data{
			"Time": time.Now().UnixNano() / int64(time.Millisecond),
		}
		encoder.Encode(&data)

		<-s.done
		fmt.Println("Socket connection gone ...")
	}))

	fmt.Println("Spielplatz connector started on ", address+":"+port, ". Listening ...")

	err := http.ListenAndServe(address+":"+port, nil)
	if err != nil {
		fmt.Println("Error: " + err.Error())
		doneChan <- true
	}
}

func translateMessages(s socket) {
	decoder := json.NewDecoder(s)
	encoder := json.NewEncoder(s)

	messageChan := make(chan Message)
	go serveMessages(messageChan)

	var err error
	for {
		/////////////////////////////////
		// Decode messages
		var (
			message Message
			sx      SessionXsrfStruct
			ok      bool
		)
		err = decoder.Decode(&message)

		beego.Trace("Incoming message ...", message)
		if err != nil {
			beego.Error("Websockets error: ", err.Error())
			s.done <- true
			return
		}
		if message.Xsrf == "" {
			fmt.Println("Xsrf value missing.")
			s.done <- true
			continue
		}
		if sx, ok = SessionXsrfTable[message.Xsrf]; !ok {
			fmt.Println("Invalid xsrf value.")
			s.done <- true
			continue
		}

		beego.Trace("... processing ...", message)
		message.Xsrf = ""
		message.Session = sx.Session
		message.returnChan = make(chan Data)
		go catchReturn(message.returnChan, encoder)

		messageChan <- message
	}
}

func catchReturn(returnChan chan Data, encoder *json.Encoder) {
	select {
	case data := <-returnChan:
		encoder.Encode(&data)
	}
}

func serveMessages(messageChan chan Message) {
	for {
		message := <-messageChan

		data := make(Data)
		s := message.Session
		switch message.Command {
		case "readJSFiles":
			data = readJSFiles(s, message.FileNames)
		case "readJSDir":
			data = readJSDir(s)
		case "writeJSFiles":
			data = writeJSFiles(s, message.FileNames, message.CodeFiles, message.Overwrite)
		case "deleteJSFiles":
			data = deleteJSFiles(s, message.FileNames)
		case "commitJSFiles":
			//data = commitJSFiles(s, message.FileNames)
		case "getPrevJSFiles":
			//data = getArchivedJSFiles(s, message.FileName, message.Range)
		default:
			beego.Error("Unknown command:", message.Command)
		}

		data["Id"] = message.Id

		message.returnChan <- data
	}
}

func writeJSFiles(s session.SessionStore, fileNames []string, codeFiles []string, overwrite bool) Data {

	// if user is not logged in return
	if s.Get("UserName") == nil {
		return Data{}
	}

	T := models.T
	name := s.Get("UserName").(string)
	dir := beego.AppConfig.String("userdata::location") + name + "/" + beego.AppConfig.String("userdata::jsfiles")
	timeStamps := []int64{}

	for i := 0; i < len(fileNames); i++ {
		var (
			file *os.File
			err  error
		)
		fileName := dir + fileNames[i]

		/////////////////////////////////////////
		// Check if file exists
		if !overwrite {
			if _, err := os.Stat(fileName); !os.IsNotExist(err) {
				beego.Warning("no such file or directory:", fileName)
				return Data{
					"Error": T["websockets_file_exists"],
				}
			}
		}

		/////////////////////////////////////////
		// Create/overwrite file
		if file, err = os.Create(fileName); err != nil {
			beego.Error("Cannot create or overwrite file")
			return Data{}
		}
		defer file.Close()
		_, err = file.Write([]byte(codeFiles[i]))

		////////////////////////////////////////
		// Record timestamps for web app
		fileStat, _ := file.Stat()
		timeStamps = append(timeStamps, fileStat.ModTime().UnixNano()/int64(time.Millisecond))

		////////////////////////////////////////
		// Write to database if not already there
		u := models.User{Name: name}
		f := models.File{}
		o := orm.NewOrm()

		err = o.Read(&u, "Name")
		if err == nil {
			err = o.QueryTable(f).Filter("filename", fileNames[i]).Filter("user_id", u.Id).One(&f)
			if err == orm.ErrMultiRows {
				beego.Error("Returned Multi Rows Not One")
			}
			if err == orm.ErrNoRows {
				beego.Trace("File", fileNames[i], "not found in database. Inserting new.")
				f := models.File{Filename: fileNames[i], User: &u}
				_, err = o.Insert(&f)
				if err != nil {
					beego.Error("Couldn't insert file.")
				}
			}
		}
	}
	return Data{
		"TimeStamps": timeStamps,
	}
}

func readJSFiles(s session.SessionStore, fileNames []string) Data {

	// if user is not logged in return
	if s.Get("UserName") == nil {
		return Data{}
	}

	name := s.Get("UserName").(string)
	dir := beego.AppConfig.String("userdata::location") + name + "/" + beego.AppConfig.String("userdata::jsfiles")
	codeFiles := make(map[string]JSFile)

	for i := 0; i < len(fileNames); i++ {
		var (
			file *os.File
			err  error
		)
		/////////////////////////////////////////
		// Read file
		fileName := dir + fileNames[i]

		if file, err = os.Open(fileName); err != nil {
			beego.Error("Cannot open file")
			return Data{}
		}
		defer file.Close()

		fileInfo, _ := file.Stat()
		fileSize := fileInfo.Size()
		codeFile := make([]byte, fileSize)
		_, err = file.Read(codeFile)

		if err != nil {
			beego.Error("Read error occured.")
			return Data{}
		}

		codeFiles[fileNames[i]] = JSFile{
			TimeStamp: fileInfo.ModTime().UnixNano() / int64(time.Millisecond),
			Code:      string(codeFile),
		}
	}
	return Data{
		"CodeFiles": codeFiles,
	}
}

func readJSDir(s session.SessionStore) Data {

	data := Data{}
	files := make(map[string]JSFile)

	// if user is not logged in return
	if s.Get("UserName") == nil {
		return data
	}

	name := s.Get("UserName").(string)
	dir := beego.AppConfig.String("userdata::location") + name + "/" + beego.AppConfig.String("userdata::jsfiles")

	filepath.Walk(dir, func(path string, f os.FileInfo, err error) error {

		name := f.Name()
		if len(name) > 3 && name[len(name)-3:] == ".js" {
			files[name] = JSFile{
				TimeStamp: f.ModTime().UnixNano() / int64(time.Millisecond),
			}
		}

		return nil
	})

	data["Files"] = files

	beego.Warning("readJSDir", files)
	return data
}

func deleteJSFiles(s session.SessionStore, fileNames []string) Data {

	// if user is not logged in return
	if s.Get("UserName") == nil {
		return Data{}
	}

	name := s.Get("UserName").(string)
	dir := beego.AppConfig.String("userdata::location") + name + "/" + beego.AppConfig.String("userdata::jsfiles")

	for i := 0; i < len(fileNames); i++ {
		var (
			file *os.File
			err  error
		)
		/////////////////////////////////////////
		// Read file
		fileName := dir + fileNames[i]

		if err = os.Remove(fileName); err != nil {
			beego.Error("Cannot remove file")
			return Data{}
		}
		defer file.Close()

		////////////////////////////////////////
		// Clear from database if not already there
		u := models.User{Name: name}
		f := models.File{}
		o := orm.NewOrm()

		err = o.Read(&u, "Name")
		if err == nil {
			num, _ := o.QueryTable(f).Filter("filename", fileNames[i]).Filter("user_id", u.Id).Delete()
			if num != 1 {
				beego.Error("I deleted", num, "occurences of", fileNames[i], "instead of 1.")
			}
		}
	}
	return Data{}
}
