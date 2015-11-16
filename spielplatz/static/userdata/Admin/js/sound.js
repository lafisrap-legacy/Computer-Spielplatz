fill(0, 89, 255);
textSize(31);
text("What does Oh Noes say?", 10, 41);
image(getImage("Spielplatz/OrangerBall"), 100, 100);

mouseClicked = function() {
    playSound(getSound("Spielplatz/Türglocke"));
};
