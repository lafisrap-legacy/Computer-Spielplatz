#Create Project - Steps
#
#1. cordova create cordova org.c2064.haengagubbe [project]
#2. cd cordova && cordova platform add android --save
#3. cordova platform add browser --save
#4. cp static/userdata/Admin/bare-projects/cordova/* cordova/www
#5. Merge pjs/[project].pjs with {{ .Program }} in cordova/www/js/game.js
#6. Copy resource files
#7. Remove project names from resource files in game.js
#6. cordova build
#7. cordova build android

USER="$1"
PROJECT="$2"
PROJECT_NO_WHITESPACE="$(echo -e "${PROJECT}" | tr -d '[[:space:]]' | tr -d ,!.)"
PROJECTDIR="$CPGPATH/static/userdata/$USER/projects/$PROJECT/cordova"

if [ "$1" == "" ] || [ "$2" == "" ]; then
	echo Usage: makecordova.sh [USER] [PROJECT]
	echo ... in a Computer Playground context
	exit 1
fi

if [ ! -d $CPGPATH/static/userdata/$USER ]; then
	echo User $USER does not exist.
	exit 2
fi

if [ ! -d "$CPGPATH/static/userdata/$USER/projects/$PROJECT" ]; then
	echo Project $PROJECT does not exist.
	exit 3
fi

echo -e "PROJECT_NO_WHITESPACE='${PROJECT_NO_WHITESPACE}'"

cordova create "$PROJECTDIR" org.c2064.org.$PROJECT_NO_WHITESPACE "$PROJECT"
cd "$PROJECTDIR" && cordova platform add android --save && cordova platform add browser --save
cp -r $CPGPATH/static/userdata/Admin/bare-projects/cordova/* "$PROJECTDIR/www"
cd "$PROJECTDIR" && sed -i "/Programm-Code hier einfügen/ r ../pjs/${PROJECT}.pjs" www/js/game.js
sed -i -E "s/getImage\([\s\/]*[^\/]+\//getImage\(\"/" "$PROJECTDIR/www/js/game.js"
sed -i -E "s/getSound\([\s\/]*[^\/]+\//getSound\(\"/" "$PROJECTDIR/www/js/game.js"

echo -e "Copying images from $PROJECTDIR/../images/* to $PROJECTDIR/www/img"
cd "$PROJECTDIR" && cp ../images/* www/img
cd "$PROJECTDIR" && cp ../sounds/* www/sounds

cordova build
cordova build android
