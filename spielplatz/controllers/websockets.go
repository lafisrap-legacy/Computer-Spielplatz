package controllers

import (
	"code.google.com/p/go.net/websocket"
	"encoding/base64"
	"encoding/json"
	"errors"
	_ "errors"
	"fmt"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/config"
	"github.com/astaxie/beego/session"
	"github.com/lafisrap/Computer-Spielplatz/spielplatz/models"
	"github.com/libgit2/git2go"
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

	CodeFiles     []string
	Commit        string
	FileNames     []string
	FileName      string
	FileType      string
	Images        []string
	MessageId     int64
	MessageIds    []int64
	Overwrite     bool
	ProjectNames  []string
	ProjectName   string
	ResourceFiles []string
	TimeStamps    []int64
	UserName      string
	UserNames     []string
}

type SourceFile struct {
	TimeStamp int64
	Code      string
	Project   string
	Rights    []string
	Users     []string
	Status    SourceStatus
}

type SourceStatus int

const (
	STATUS_OK SourceStatus = iota
	STATUS_UNCOMMITTED
)

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

		if err != nil {
			beego.Error("Websockets error: ", err.Error(), message)
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
			data = readSourceFiles(s, message.FileNames, message.ProjectNames, message.FileType)
		case "writeSourceFiles":
			data = writeSourceFiles(s, message.FileNames, message.ProjectName, message.FileType, message.CodeFiles, message.TimeStamps, message.Images, message.Overwrite)
		case "renameSourceFile":
			data = renameSourceFile(s, message.FileNames, message.FileType)
		case "deleteSourceFiles":
			data = deleteSourceFiles(s, message.FileNames, message.ProjectNames)
		case "initProject":
			data = initProject(s, message.ProjectName, message.FileType, message.FileNames, message.CodeFiles, message.ResourceFiles, message.Images)
		case "writeProject":
			data = writeProject(s, message.ProjectName, message.FileType, message.FileNames, message.CodeFiles, message.TimeStamps, message.ResourceFiles, message.Images, message.Commit)
		case "cloneProject":
			data = cloneProject(s, message.ProjectName)
		case "fetchProject":
			data, _ = fetchProject(s, message.ProjectName)
		case "readPals":
			data = readPals(s)
		case "sendInvitations":
			data = sendInvitations(s, message.ProjectName, message.UserNames)
		case "readNewMessages":
			data = readNewMessages(s, message.MessageIds)
		case "deleteMessage":
			data = deleteMessage(s, message.MessageId)
		default:
			beego.Error("Unknown command:", message.Command)
		}

		data["Id"] = message.Id

		message.returnChan <- data
	}
}

func writeSourceFiles(s session.Store, fileNames []string, project string, fileType string, codeFiles []string, timeStamps []int64, Images []string, overwrite bool) Data {

	// if user is not logged in return
	if s.Get("UserName") == nil {
		return Data{}
	}

	T := models.T
	name := s.Get("UserName").(string)
	var dir string
	if project != "" {
		dir = beego.AppConfig.String("userdata::location") + name + "/" + beego.AppConfig.String("userdata::projects") + "/" + project + "/" + fileType + "/"
	} else {
		dir = beego.AppConfig.String("userdata::location") + name + "/" + fileType + "/"
	}
	savedFiles := []string{}
	savedTimeStamps := []int64{}
	outdatedFiles := []string{}
	outdatedTimeStamps := []int64{}

	for i := 0; i < len(fileNames); i++ {
		var (
			file *os.File
			err  error
		)
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
			// Look if the file changed on disk since last writing
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
		// Create image file
		createImageFile(Images[i], fileName)
	}

	return Data{
		"SavedTimeStamps":    savedTimeStamps,
		"SavedFiles":         savedFiles,
		"OutdatedTimeStamps": outdatedTimeStamps,
		"OutdatedFiles":      outdatedFiles,
	}
}

func renameSourceFile(s session.Store, fileNames []string, fileType string) Data {

	// if user is not logged in return
	if s.Get("UserName") == nil {
		return Data{}
	}

	name := s.Get("UserName").(string)
	dir := beego.AppConfig.String("userdata::location") + name + "/" + fileType + "/"

	_, err := os.Stat(dir + "/" + fileNames[1])
	if !os.IsNotExist(err) {
		return Data{
			"Error": "file exists",
		}
	}

	err = os.Rename(dir+"/"+fileNames[0], dir+"/"+fileNames[1])
	if err != nil {
		return Data{
			"Error": "cannot rename file",
		}
	}
	// Also rename associated pngs
	for i := 0; i < 2; i++ {
		fileNames[i] = fileNames[i][:strings.LastIndex(fileNames[i], ".")] + ".png"
	}
	beego.Warning("Renaming", fileNames[0], "to", fileNames[1])
	err = os.Rename(dir+"/"+fileNames[0], dir+"/"+fileNames[1])
	if err != nil {
		return Data{
			"Error": "cannot rename file",
		}
	}

	return Data{}
}

func readSourceFiles(s session.Store, fileNames []string, fileProjects []string, fileType string) Data {

	// if user is not logged in return
	if s.Get("UserName") == nil {
		return Data{}
	}

	name := s.Get("UserName").(string)
	dir := beego.AppConfig.String("userdata::location") + name + "/"
	codeFiles := make(map[string]SourceFile)

	for i := 0; i < len(fileNames); i++ {
		var (
			file *os.File
			err  error
		)

		/////////////////////////////////////////
		// Fetch project
		project := fileProjects[i]
		status := STATUS_OK
		if project != "" {
			_, err := fetchProject(s, project)

			if err != nil {
				beego.Warning("Error message:", err.Error())
				switch err.Error() {
				case "uncommitted changes":
					beego.Warning("Uncommitted changes detected!", err)
					status = STATUS_UNCOMMITTED
				}
			}

			beego.Warning("Fetching result: ", err)
		}

		/////////////////////////////////////////
		// Read file
		var fileName string
		if project != "" {
			fileName = dir + beego.AppConfig.String("userdata::projects") + "/" + project + "/" + fileType + "/" + fileNames[i]
		} else {
			fileName = dir + fileType + "/" + fileNames[i]
		}

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

		rights := []string{}
		users := []string{}
		if project != "" {
			rights = models.GetProjectRightsFromDatabase(name, project)
			users = models.GetProjectUsersFromDatabase(project)
		}

		codeFiles[fileNames[i]] = SourceFile{
			TimeStamp: fileInfo.ModTime().UnixNano() / int64(time.Millisecond),
			Code:      string(codeFile),
			Project:   project,
			Rights:    rights,
			Users:     users,
			Status:    status,
		}
	}

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

func deleteSourceFiles(s session.Store, fileNames []string, projectNames []string) Data {

	// if user is not logged in return
	if s.Get("UserName") == nil {
		return Data{}
	}

	name := s.Get("UserName").(string)
	dir := beego.AppConfig.String("userdata::location") + name

	for i := 0; i < len(fileNames); i++ {
		/////////////////////////////////////////
		// Remove js and png file
		fileType := fileNames[i][strings.LastIndex(fileNames[i], ".")+1:]
		var fileName string
		if projectNames != nil && projectNames[i] != "" {
			fileName = dir + "/" + beego.AppConfig.String("userdata::projects") + "/" + projectNames[i] + "/" + fileType + "/" + fileNames[i]
		} else {
			fileName = dir + "/" + fileType + "/" + fileNames[i]
		}
		if err := os.Remove(fileName); err != nil {
			beego.Error("Cannot remove file", fileName, "(", err.Error(), ")")
		}
		fileName = fileName[:strings.LastIndex(fileName, ".")] + ".png"
		if err := os.Remove(fileName); err != nil {
			beego.Error("Cannot remove file", fileName, "(", err.Error(), ")")
		}

		beego.Warning("Removing file", fileName)
	}
	return Data{}
}

func initProject(s session.Store, projectName string, fileType string, fileNames []string, codeFiles []string, resourceFiles []string, images []string) Data {

	beego.Trace("Entering initProject", projectName, fileNames, resourceFiles)
	// if user is not logged in return
	if s.Get("UserName") == nil {
		beego.Error("No user name available.")
		return Data{}
	}
	if projectName == "" {
		beego.Error("No project name available.")
		return Data{}
	}

	userName := s.Get("UserName").(string)
	userDir := beego.AppConfig.String("userdata::location") + userName
	projectDir := userDir + "/" + beego.AppConfig.String("userdata::projects") + "/" + projectName
	bareDir := beego.AppConfig.String("userdata::location") + beego.AppConfig.String("userdata::bareprojects") + "/" + projectName

	////////////////////////////////////////////////////////////////////7
	// Everything, that has to be done for init a project
	_, err := os.Stat(bareDir)
	if !os.IsNotExist(err) {
		return Data{
			"Error": "project exists",
		}
	}

	// Create new directory
	if err := os.MkdirAll(bareDir, os.ModePerm); err != nil {
		beego.Error("Cannot create directory", bareDir)
	}

	// Initialize as bare git directory
	_, err = git.InitRepository(bareDir, true)
	if err != nil {
		beego.Error("Cannot init git directory", bareDir, "(", err.Error(), ")")
	}

	// Clone it to own project directory
	options := git.CloneOptions{
		Bare: false,
	}
	_, err = git.Clone(bareDir, projectDir, &options)
	if err != nil {
		beego.Error("Cannot clone git directory", bareDir, "into", projectDir, "(", err.Error(), ")")
	}

	// err = models.GitSetName(userName, userName+"@"+beego.AppConfig.String("userdata::emailserver"))

	// Create project directories
	models.CreateDirectories(projectDir, false)

	// Write source files to new project directory
	timeStamps := []int64{0}
	fileName := []string{projectName + "." + fileType}
	data := writeSourceFiles(s, fileName, projectName, fileType, codeFiles, timeStamps, images, false)

	// Create .gitignore file with .spielplatz/project in it
	models.CreateTextFile(projectDir+"/"+".gitignore", beego.AppConfig.String("userdata::spielplatzdir")+"/rights")

	// Copy resource files
	for i := 0; i < len(resourceFiles); i++ {
		resType := resourceFiles[i][strings.LastIndex(resourceFiles[i], ".")+1:]
		filename := resourceFiles[i][strings.LastIndex(resourceFiles[i], "/")+1:]
		dir := "."

		switch resType {
		case "png":
			dir = beego.AppConfig.String("userdata::imagefiles")
		case "mp3":
			dir = beego.AppConfig.String("userdata::soundfiles")
		}
		err = copyFileContents(userDir+"/"+dir+"/"+resourceFiles[i], projectDir+"/"+dir+"/"+filename)
		if err != nil {
			beego.Error("Cannot copy resource file", resourceFiles[i], "from", userDir, "to", projectDir, "(", err.Error(), ")")
		}
	}

	// Mount resource directories
	models.MountResourceFiles(userName, projectName)

	// Create project config file
	projectFile := projectDir + "/" + beego.AppConfig.String("userdata::spielplatzdir") + "/project"
	file, err := os.Create(projectFile)
	if err != nil {
		beego.Error(err)
	}
	file.Close()
	cnf, err := config.NewConfig("ini", projectFile)
	if err != nil {
		beego.Error("Cannot create project file " + projectFile + " (" + err.Error() + ")")
	}
	cnf.Set("Playground", beego.AppConfig.String("userdata::name"))
	cnf.Set("Origin", "none")
	cnf.Set("Gallery", "false")
	cnf.SaveConfigFile(projectFile)

	// Create rights file
	rightsFile := projectDir + "/" + beego.AppConfig.String("userdata::spielplatzdir") + "/rights"
	file, err = os.Create(rightsFile)
	if err != nil {
		beego.Error(err)
	}
	file.Close()
	cnf, err = config.NewConfig("ini", rightsFile)
	if err != nil {
		beego.Error("Cannot create rights file " + rightsFile + " (" + err.Error() + ")")
	}
	for _, right := range models.PRR_NAMES {
		cnf.Set("rights::"+right, "true")
	}
	cnf.SaveConfigFile(rightsFile)

	// Add all rights as return values
	data["Rights"] = models.PRR_NAMES

	// Create database entry
	user, _ := models.GetUser(userName)
	project := new(models.Project)
	project.Name = projectName
	project.Playground = beego.AppConfig.String("userdata::location")
	project.Origin = "none"
	project.Gallery = false
	project.Forks = 0
	project.Stars = 0
	models.CreateProjectDatabaseEntry(project, user, int64(1<<uint(len(models.PRR_NAMES)))-1)

	// Add, commit and push
	err = models.GitAddCommitPush(userName, projectDir, beego.AppConfig.String("userdata::firstcommit"), true)
	if err != nil {
		beego.Error(err)
	}

	// Remove old files, if any
	if fileNames[0] != "" {
		deleteSourceFiles(s, fileNames, nil)
	}

	return data
}

func writeProject(s session.Store, projectName string, fileType string, fileNames []string, codeFiles []string, timeStamps []int64, resourceFiles []string, images []string, commit string) Data {

	// if user is not logged in return
	userName := ""
	if s.Get("UserName") != nil {
		userName = s.Get("UserName").(string)
	}
	if userName == "" {
		beego.Error("No user name available.")
		return Data{}
	}
	if projectName == "" {
		beego.Error("No project name available.")
		return Data{}
	}

	// Check for rights
	if ok := models.CheckRight(userName, projectName, "Write"); !ok {
		return Data{
			"Error": "Unsufficient rights for project " + projectName + ".",
		}
	}

	userDir := beego.AppConfig.String("userdata::location") + userName
	projectDir := userDir + "/" + beego.AppConfig.String("userdata::projects") + "/" + projectName

	// Write source files to new project directory
	fileName := []string{projectName + "." + fileType}
	data := writeSourceFiles(s, fileName, projectName, fileType, codeFiles, timeStamps, images, true)

	if len(data["OutdatedFiles"].([]string)) > 0 {
		return data
	}

	// Copy resource files
	for i := 0; i < len(resourceFiles); i++ {
		resProject := resourceFiles[i][:strings.Index(resourceFiles[i], "/")]
		resType := resourceFiles[i][strings.LastIndex(resourceFiles[i], ".")+1:]
		filename := resourceFiles[i][strings.LastIndex(resourceFiles[i], "/")+1:]
		dir := "."

		if resProject == projectName {
			continue
		}

		switch resType {
		case "png":
			dir = beego.AppConfig.String("userdata::imagefiles")
		case "mp3":
			dir = beego.AppConfig.String("userdata::soundfiles")
		}
		err := copyFileContents(userDir+"/"+dir+"/"+resourceFiles[i], projectDir+"/"+dir+"/"+filename)
		if err != nil {
			beego.Error("Cannot copy resource file", resourceFiles[i], "from", userDir, "to", projectDir, "(", err.Error(), ")")
		}
	}

	// Add, commit and push
	if err := models.GitAddCommitPush(userName, projectDir, commit, false); err != nil {
		if err.Error() == "Conflicts" {
			data["Conflicts"] = "Solve conflicts."
		} else {
			beego.Error("Add, commit, push: ", err.Error())
		}
	}

	return data
}

func cloneProject(s session.Store, projectName string) Data {

	// if user is not logged in return
	userName := ""
	if s.Get("UserName") != nil {
		userName = s.Get("UserName").(string)
	}
	if userName == "" {
		beego.Error("No user name available.")
		return Data{}
	}
	beego.Warning("Entering cloneProject with", userName, "and", projectName)
	if projectName == "" {
		beego.Error("No project name available.")
		return Data{}
	}

	// Check for rights
	// Maybe add a token check here, otherwise manipulated clients can clone any project

	models.CloneProjectDir(userName, projectName)
	return Data{
		"ProjectName": projectName,
	}
}

func fetchProject(s session.Store, projectName string) (Data, error) {

	// if user is not logged in return
	userName := ""
	if s.Get("UserName") != nil {
		userName = s.Get("UserName").(string)
	}
	if userName == "" {
		return Data{}, errors.New("No user name available.")
	}
	if projectName == "" {
		return Data{}, errors.New("No project name available.")
	}

	userDir := beego.AppConfig.String("userdata::location") + userName
	projectDir := userDir + "/" + beego.AppConfig.String("userdata::projects") + "/" + projectName

	beego.Warning("Doing git fetch with", projectDir)

	// 1 Open repository
	repo, err := git.OpenRepository(projectDir)
	if err != nil {
		return Data{}, errors.New("OpenRepository - " + err.Error())
	}

	// 2 Create a signature
	sig := &git.Signature{
		Name:  userName,
		Email: userName + "@" + beego.AppConfig.String("userdata::emailserver"),
		When:  time.Now(),
	}

	err = models.AnnotatedPull(repo, sig)
	if err != nil {
		if strings.Index(err.Error(), "uncommitted change") != -1 {
			e := errors.New("uncommitted changes")
			return Data{
				"Error": e.Error(),
			}, e
		}

		return Data{
			"Error": err.Error(),
		}, err
	}

	return Data{}, nil
}

func readPals(s session.Store) Data {
	// Read own groups
	userName := ""
	if s.Get("UserName") != nil {
		userName = s.Get("UserName").(string)
	}
	if userName == "" {
		beego.Error("No user name available.")
		return Data{}
	}

	return Data{
		"Pals": models.GetPalsFromDatabase(userName),
	}
}

func sendInvitations(s session.Store, projectName string, userNames []string) Data {

	T := models.T
	userName := ""
	if s.Get("UserName") != nil {
		userName = s.Get("UserName").(string)
	}
	if userName == "" {
		beego.Error("No user name available.")
		return Data{}
	}

	models.CreateInvitationMessages(userName, projectName, userNames, T["project_bar_modal_invite_subject"], T["project_bar_modal_invite_message"])

	return Data{}
}

func readNewMessages(s session.Store, messageIds []int64) Data {

	userName := ""
	if s.Get("UserName") != nil {
		userName = s.Get("UserName").(string)
	}

	if userName == "" {
		beego.Error("No user name available.")
		return Data{}
	}

	messages := models.GetMessagesFromDatabase(userName)

	for i := len(messages) - 1; i >= 0; i-- {
		beego.Warning(len(messages), i)
		for j := 0; j < len(messageIds); j++ {
			beego.Warning(messages[i], j, messageIds[j])
			if messages[i]["Id"] == messageIds[j] {
				messages = append(messages[:i], messages[i+1:]...)
				break
			}
		}
	}

	return Data{
		"Messages": messages,
	}
}

func deleteMessage(s session.Store, messageId int64) Data {

	userName := ""
	if s.Get("UserName") != nil {
		userName = s.Get("UserName").(string)
	}
	if userName == "" {
		beego.Error("No user name available.")
		return Data{}
	}

	err := models.DeleteMessageFromDatabase(userName, messageId)

	if err == nil {
		return Data{}
	} else {
		return Data{
			"Error": err.Error(),
		}
	}
}

func copyFileContents(src, dst string) (err error) {
	in, err := os.Open(src)
	if err != nil {
		return
	}
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return
	}
	defer func() {
		cerr := out.Close()
		if err == nil {
			err = cerr
		}
	}()
	if _, err = io.Copy(out, in); err != nil {
		return
	}
	err = out.Sync()
	return
}

func createImageFile(img string, fileName string) error {

	////////////////////////////////////////
	// Write image file
	var imgFile *os.File
	imageReader := base64.NewDecoder(base64.StdEncoding, strings.NewReader(img))
	pngImage, _, err := image.Decode(imageReader)
	if err != nil {
		beego.Error(err)
	}
	if imgFile, err = os.Create(fileName[0:strings.LastIndex(fileName, ".")] + ".png"); err != nil {
		beego.Error("Cannot create or overwrite file (", err, ")")
	}
	defer imgFile.Close()
	png.Encode(imgFile, pngImage)

	return err
}
