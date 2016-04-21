package controllers

import (
	"code.google.com/p/go.net/websocket"
	"encoding/base64"
	"encoding/json"
	_ "errors"
	"fmt"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/session"
	"github.com/lafisrap/Computer-Spielplatz-Gitbase/spielplatz/models"
	"image"
	"image/png"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
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
	Session session.Store

	Command    string
	returnChan chan Data

	FileType     string
	FileName     string
	FileNames    []string
	FileProjects []string
	TimeStamps   []int64
	CodeFiles    []string
	Images       []string
	SortedBy     string
	Range        Range

	Overwrite bool
}

type SourceFile struct {
	TimeStamp int64
	Code      string
	Project   string
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

	address := beego.AppConfig.String("httpaddr")
	dir := beego.AppConfig.String("websockets::dir")
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

	fmt.Println("--- Spielplatz connector started on ", address+":"+port, ". Listening ...")

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
		case "readDir":
			data = readDir(s, message.FileType)
		case "readSourceFiles":
			data = readSourceFiles(s, message.FileNames, message.FileProjects, message.FileType)
		case "writeSourceFiles":
			data = writeSourceFiles(s, message.FileNames, message.CodeFiles, message.TimeStamps, message.Images, message.Overwrite)
		case "deleteSourceFiles":
			data = deleteSourceFiles(s, message.FileNames)
		default:
			beego.Error("Unknown command:", message.Command)
		}

		data["Id"] = message.Id

		message.returnChan <- data
	}
}

func writeSourceFiles(s session.Store, fileNames []string, codeFiles []string, timeStamps []int64, Images []string, overwrite bool) Data {

	// if user is not logged in return
	if s.Get("UserName") == nil {
		return Data{}
	}

	T := models.T
	name := s.Get("UserName").(string)
	dir := beego.AppConfig.String("userdata::location") + name + "/pjs/"
	savedFiles := []string{}
	savedTimeStamps := []int64{}
	outdatedFiles := []string{}
	outdatedTimeStamps := []int64{}

	for i := 0; i < len(fileNames); i++ {
		var (
			file    *os.File
			imgFile *os.File
			err     error
		)
		/////////////////////////////////////////
		// Make sure the filename has an *.js-Ending
		if fileNames[i][len(fileNames[i])-3:] != ".js" {
			beego.Warning("Codefile should have a *.js suffix (" + fileNames[i] + ")")
			fileNames[i] += ".js"
		}

		fileName := dir + fileNames[i]

		/////////////////////////////////////////
		// Don't overwrite if file exists
		fileStat, err := os.Stat(fileName)
		if !overwrite {
			if !os.IsNotExist(err) {
				beego.Warning("no such file or directory:", fileName)
				return Data{
					"Error": T["websockets_file_exists"],
				}
			}
		} else if err == nil {
			time := fileStat.ModTime().UnixNano() / int64(time.Millisecond)
			if i < len(timeStamps) && time > timeStamps[i] {
				outdatedFiles = append(outdatedFiles, fileNames[i])
				outdatedTimeStamps = append(outdatedTimeStamps, time)
				continue
			}
		}

		/////////////////////////////////////////
		// Create/overwrite file
		if file, err = os.Create(fileName); err != nil {
			beego.Error("Cannot create or overwrite file", fileName)
			return Data{}
		}
		defer file.Close()
		_, err = file.Write([]byte(codeFiles[i]))

		////////////////////////////////////////
		// Record timestamps for web app
		if err == nil {
			fileStat, _ = file.Stat()
			savedFiles = append(savedFiles, fileNames[i])
			savedTimeStamps = append(savedTimeStamps, fileStat.ModTime().UnixNano()/int64(time.Millisecond))
		} else {
			beego.Error("Cannot write to file", fileName)
			return Data{}
		}

		////////////////////////////////////////
		// Write image file
		imageReader := base64.NewDecoder(base64.StdEncoding, strings.NewReader(Images[i]))
		pngImage, _, err := image.Decode(imageReader)
		if err != nil {
			beego.Error(err)
		}
		if imgFile, err = os.Create(fileName[0:len(fileName)-3] + ".png"); err != nil {
			beego.Error("Cannot create or overwrite file (", err, ")")
			return Data{}
		}
		defer imgFile.Close()
		png.Encode(imgFile, pngImage)
	}

	return Data{
		"SavedTimeStamps":    savedTimeStamps,
		"SavedFiles":         savedFiles,
		"OutdatedTimeStamps": outdatedTimeStamps,
		"OutdatedFiles":      outdatedFiles,
	}
}

func readSourceFiles(s session.Store, fileNames []string, fileProjects []string, fileType string) Data {

	// if user is not logged in return
	if s.Get("UserName") == nil {
		return Data{}
	}

	name := s.Get("UserName").(string)
	dir := beego.AppConfig.String("userdata::location") + name + "/"
	codeFiles := make(map[string]SourceFile)

	beego.Trace("fileNames", fileNames, "Length:", len(fileNames))
	for i := 0; i < len(fileNames); i++ {
		var (
			file *os.File
			err  error
		)

		/////////////////////////////////////////
		// Read file
		var fileName string
		project := fileProjects[i]
		if project != "" {
			fileName = dir + beego.AppConfig.String("userdata::projects") + "/" + project + "/" + fileType + "/" + fileNames[i]
		} else {
			fileName = dir + fileType + "/" + fileNames[i]
		}
		beego.Trace(project, fileType, fileNames[i])

		if file, err = os.Open(fileName); err != nil {
			beego.Error("Cannot open file", fileName)
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

		codeFiles[fileNames[i]] = SourceFile{
			TimeStamp: fileInfo.ModTime().UnixNano() / int64(time.Millisecond),
			Code:      string(codeFile),
			Project:   project,
		}
	}

	beego.Trace("Codefiles loaded:", codeFiles)

	return Data{
		"CodeFiles": codeFiles,
	}
}

func readDir(s session.Store, fileType string) Data {

	data := Data{}
	sourceFiles := make(map[string]SourceFile)
	userName := s.Get("UserName")

	// if user is not logged in return
	if userName == nil {
		return data
	}

	// First search in the main directory
	name := userName.(string)
	dir := beego.AppConfig.String("userdata::location") + name + "/" + fileType

	files, err := ioutil.ReadDir(dir)
	if err != nil {
		beego.Error(err)
		return data
	}

	for _, f := range files {
		name := f.Name()
		if name[len(name)-len(fileType):] == fileType {
			sourceFiles[name] = SourceFile{
				TimeStamp: f.ModTime().UnixNano() / int64(time.Millisecond),
				Project:   "",
			}
		}
	}

	// Then read all projects and look into the dir of the specified filetype (e.g. pjs)
	dir = beego.AppConfig.String("userdata::location") + name + "/" + beego.AppConfig.String("userdata::projects")
	projects, err := ioutil.ReadDir(dir)
	if err != nil {
		beego.Error(err)
		return data
	}

	for _, p := range projects {

		var dir2 string
		if p.IsDir() == true {
			project := p.Name()
			dir2 = dir + "/" + p.Name() + "/" + fileType
			files, _ := ioutil.ReadDir(dir2)

			for _, f := range files {
				name := f.Name()
				if name[len(name)-len(fileType):] == fileType {
					sourceFiles[name] = SourceFile{
						TimeStamp: f.ModTime().UnixNano() / int64(time.Millisecond),
						Project:   project,
					}
				}
			}
		}
	}

	data["Files"] = sourceFiles

	return data
}

func deleteSourceFiles(s session.Store, fileNames []string) Data {

	// if user is not logged in return
	if s.Get("UserName") == nil {
		return Data{}
	}

	name := s.Get("UserName").(string)
	dir := beego.AppConfig.String("userdata::location") + name + "/pjs/"

	for i := 0; i < len(fileNames); i++ {
		/////////////////////////////////////////
		// Remove js and png file
		fileName := dir + fileNames[i]

		if err := os.Remove(fileName); err != nil {
			beego.Error("Cannot remove file")
			return Data{
				"Error": "I cannot remove " + fileName + ".",
			}
		}
		if err := os.Remove(fileName[0:len(fileName)-3] + ".png"); err != nil {
			beego.Error("Cannot remove file")
			return Data{
				"Error": "I cannot remove " + fileName[0:len(fileName)-3] + ".png.",
			}
		}
	}
	return Data{}
}
