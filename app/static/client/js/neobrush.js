'use strict';


$(function() {
    $('a.color-source').click(function(event) {
        event.preventDefault();
        $('a.color-source').removeClass('active');
        $(this).addClass('active');
        updateSource($(this).index() + 1);
    });
    $('.preset').click(function(event) {
        event.preventDefault();
        choosePreset($(this).index());
    });
});

var lines = [];
var colors = [];
var src, canvas, art;
var ui = {};

function choosePreset(id) {
    switch (id) {
        case 0:
            ui.numberOfLines.value(100);
            ui.easing.value(0.25);
            ui.easingJitter.value(0.1);
            ui.speed.value(0.3);
            ui.speedJitter.value(0.1);
            ui.vertices.value(8);
            ui.verticesJitter.value(1);
            break;
        case 1:
            ui.numberOfLines.value(11);
            ui.easing.value(0.1);
            ui.easingJitter.value(0);
            ui.speed.value(0.1);
            ui.speedJitter.value(0);
            ui.vertices.value(30);
            ui.verticesJitter.value(1);
            break;
        case 2:
            ui.numberOfLines.value(10);
            ui.easing.value(0.67);
            ui.easingJitter.value(0);
            ui.speed.value(0.18);
            ui.speedJitter.value(0.1);
            ui.vertices.value(25);
            ui.verticesJitter.value(4);
            break;
        case 3:
            ui.numberOfLines.value(25);
            ui.easing.value(0.42);
            ui.easingJitter.value(0.1);
            ui.speed.value(0.45);
            ui.speedJitter.value(0.02);
            ui.vertices.value(8);
            ui.verticesJitter.value(1);
            break;
        case 4:
            ui.numberOfLines.value(200);
            ui.easing.value(0.28);
            ui.easingJitter.value(0.19);
            ui.speed.value(0.12);
            ui.speedJitter.value(0.47);
            ui.vertices.value(11);
            ui.verticesJitter.value(2);
            break;
    }
}

function setup() {
    background(0);
    updateSource(1);
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('neobrush');
	
    art = createGraphics(canvas.width, canvas.height);
    art.background(0);

    ui.numberOfLines = getElement('number-of-lines');
    ui.easing = getElement('easing');
    ui.easingJitter = getElement('easing-jitter');
    ui.speed = getElement('speed');
    ui.speedJitter = getElement('speed-jitter');
    ui.vertices = getElement('vertices');
    ui.verticesJitter = getElement('vertices-jitter');
    ui.clear = getElement('clear');
    ui.clear.mousePressed(clearme);
    ui.save = getElement('save');
    ui.save.mousePressed(saveme);

    ui.preset = getElement('save-preset');
	
	listen_to_sensors();
	
	sensorX = canvas.width / 2;
	sensorY = canvas.height / 2;
	NormalisationFactor = 1.0;
	AmbientLightCutoff = 100;
	velocityX = 0;
	velocityY = 0;
	speed = 100.0 / 6000
	
	if (LOAD_AUDIO)
		load_audio_beat();	
}

var sensorAX = 1;
var sensorAY = 1;

var sensorX;
var sensorY;
var velocityX;
var velocityY;
var speed;

var NormalisationFactor;
var AmbientLightCutoff;

function new_data_from_sensor(e)
{
   var jsonData     = JSON.parse(e.data);
   var sensorNorth  = jsonData.values[0].value.measurments.sensor5 / NormalisationFactor;
   var sensorEast   = jsonData.values[0].value.measurments.sensor3 / NormalisationFactor;
   var sensorWest   = jsonData.values[0].value.measurments.sensor4 / NormalisationFactor;
   var sensorSouth  = jsonData.values[0].value.measurments.sensor6 / NormalisationFactor;

   sensorAX = sensorX / canvas.width;
   sensorAY = sensorY / canvas.height;
        
   
	velocityY = 0;
	if (sensorNorth > AmbientLightCutoff)
	  velocityY -= sensorNorth / 10000;
	else if (sensorSouth > AmbientLightCutoff)
      velocityY += sensorSouth / 10000;	
    
	velocityX = 0;
    if (sensorEast > AmbientLightCutoff)
		velocityX += sensorEast / 10000;
	else if (sensorWest > AmbientLightCutoff)
		velocityX -= sensorWest / 10000;

   console.log('velocityX: ' + velocityX);
   console.log('velocityY: ' + velocityY);

  // sensorX = (sensor4 - min_sensor4) / (max_sensor4 - min_sensor4 + 0.00001) * canvas.width;
  // sensorY = (sensor6 - min_sensor6) / (max_sensor6 - min_sensor6 + 0.00001) * canvas.height; 
  
  // Randomly choose a new colour source
  var randBrushColour = Math.floor(Math.random() * 9) + 1 ;
  //updateSource(randBrushColour);
  console.log('colour source: ' + randBrushColour);
  
  // one in two chance of changing brush stroke
/*   if (Math.random() < 0.1) {
	var randBrushStroke;
	
	if (Math.random() < 0.5)
		randBrushStroke = 4;
	else
		randBrushStroke = 0;
	
	choosePreset(randBrushStroke)
	releaseLines();
    addLines();
  } */
	
  //releaseLines();
  //addLines();  
}

function draw() {
    background(0);
    for (var i = 0; i < lines.length; i++) {
        lines[i].update();
        lines[i].render();
    }
    image(art, 0, 0, canvas.width, canvas.height);
}

function updateSource(index) {
    colors = [];
    src = loadImage('img/source-' + index + '.jpg', function(img) {
        for (var x = 0; x < src.width; x++) {
            for (var y = 0; y < src.height; y++) {
                colors.push(img.get(x, y));
            }
        }
    });
}

function changeBrush()
{


}

function addLines()
{
   for (var i = 0; i < ui.numberOfLines.value(); i++) {
        var easing = ui.easing.value() + random(-ui.easingJitter.value(), ui.easingJitter.value());
        var speed = ui.speed.value() + random(-ui.speedJitter.value(), ui.speedJitter.value());
        var vertices = ui.vertices.value() + random(-ui.verticesJitter.value(), ui.verticesJitter.value());
        var line = new SketchLine(vertices, easing, speed, colors);
        lines.push(line);
    }
}

function releaseLines()
{
   lines = [];
}

function mousePressed() 
{
	releaseLines();
	addLines();
}

function mouseReleased() 
{

}

function clearme() {
    art.background(0);
}

function saveme() {
    art.get().save('png');
}
