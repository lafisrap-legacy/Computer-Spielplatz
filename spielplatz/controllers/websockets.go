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
	Range     Range
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
	beego.Trace("... waiting for return data ...")
	select {
	case data := <-returnChan:
		fmt.Println("Got message back!", data)
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
			//data = readJSFiles(s, message.FileNames)
		case "readJSDir":
			//data = readJSDir(s)
		case "writeJSFiles":
			data = writeJSFiles(s, message.FileNames, message.CodeFiles)
		case "commitJSFiles":
			//data = commitJSFiles(s, message.FileNames)
		case "getPrevJSFiles":
			//data = getArchivedJSFiles(s, message.FileName, message.Range)
		default:
			beego.Error("Unknown command:", message.Command)
		}

		beego.Trace("Received message: ", message)
		data["Id"] = message.Id

		message.returnChan <- data
	}
}

func writeJSFiles(s session.SessionStore, fileNames []string, codeFiles []string) Data {

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
			num  int
		)
		/////////////////////////////////////////
		// Create/overwrite file
		fileName := dir + fileNames[i]
		if file, err = os.Create(fileName); err != nil {
			beego.Error("Cannot create or overwrite file")
			return Data{}
		}
		defer file.Close()
		num, err = file.Write([]byte(codeFiles[i]))
		beego.Trace("I wrote the file!", num, err)

		////////////////////////////////////////
		// Write to database if not already there
		u := models.User{Name: name}
		f := models.File{}
		o := orm.NewOrm()

		err = o.Read(&u, "Name")
		if err == nil {
			err = o.QueryTable(f).Filter("filename", fileName).Filter("user_id", u.Id).One(&f)
			if err == orm.ErrMultiRows {
				beego.Error("Returned Multi Rows Not One")
			}
			if err == orm.ErrNoRows {
				beego.Trace("File", fileName, "not found in database. Inserting new.")
				f := models.File{Filename: fileNames[i], User: &u}
				_, err = o.Insert(&f)
				if err != nil {
					beego.Error("Couldn't insert file.")
				}
			}
		}
	}
	return Data{}
}
