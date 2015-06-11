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
    canvas = createCanvas(975, 700);
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
	
	console.log('subscribing to the local data stream...');
	var evtSrc = new EventSource("/v1/simulator/stream");
    evtSrc.onmessage = new_data_from_sensor;
}

var nmousepressed;
var sensorX = 0;
var sensorY = 0;
var max_sensor6 = 0;
var max_sensor4 = 0;
var min_sensor6 = 10000;
var min_sensor4 = 10000;


var sensor6_window = []
var sensor4_window = []
var sensor4_sum = 0;
var sensor6_sum = 0;
var window_size = 60;


function new_data_from_sensor(e)
{
   var jsonData = JSON.parse(e.data);
   var sensor6 = jsonData.values[0].value.measurments.sensor5;
   var sensor4 = jsonData.values[0].value.measurments.sensor4;
   
  
   //max_sensor6 = max(sensor6, max_sensor6);
   //max_sensor4 = max(sensor4, max_sensor4);
   //min_sensor6 = min(sensor6, min_sensor6);
   //min_sensor4 = min(sensor4, min_sensor4);

   sensor4_sum += sensor4;
   sensor6_sum += sensor6;
   
   sensor4_window.push(sensor4);
   sensor6_window.push(sensor6);
   
   if (sensor4_window.length > window_size)
   {
		sensor4_sum -= sensor4_window.shift()
		sensor6_sum -= sensor6_window.shift()
   }
   
   var sensor4_mean = sensor4_sum / sensor4_window.length;
   var sensor6_mean = sensor6_sum / sensor6_window.length;
   min_sensor4 = Math.min.apply(null, sensor4_window);
   min_sensor6 = Math.min.apply(null, sensor6_window);
   max_sensor4 = Math.max.apply(null, sensor4_window);
   max_sensor6 = Math.max.apply(null, sensor6_window);
   
   console.log('sensor4_mean: ' + sensor4_mean);
   console.log('sensor6_mean: ' + sensor6_mean);
   console.log('window length: ' + sensor4_window.length);
   
   if (sensor4 <= sensor4_mean)
      sensorX = (sensor4) / (sensor4_mean) * (canvas.width/2);	
   else
      sensorX = ((sensor4 - sensor4_mean) / (max_sensor4 - sensor4_mean) * (canvas.width/2) + (canvas.width/2)) * 0.8
	  
   if (sensor6 <= sensor6_mean)
      sensorY = (sensor6) / (sensor6_mean) * (canvas.height/2);	
   else
      sensorY = ((sensor6 - sensor6_mean) / (max_sensor6 - sensor6_mean) * (canvas.height/2) + (canvas.height/2)) * 0.8

   console.log('sensorX: ' + sensorX);
   console.log('sensorY: ' + sensorY);

   
   
  // sensorX = (sensor4 - min_sensor4) / (max_sensor4 - min_sensor4 + 0.00001) * canvas.width;
  // sensorY = (sensor6 - min_sensor6) / (max_sensor6 - min_sensor6 + 0.00001) * canvas.height; 
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
	releaseLines()
	addLines()
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
