'use strict';
var offi = 0; // offset index
function SketchLine(_numberOfVertices, _easeFactor, _speedFactor, _colors) {

    this.numberOfVertices = _numberOfVertices;
    this.easeFactor = _easeFactor;
    this.speedFactor = _speedFactor;
    this.colors = _colors;

    this.curveVertices = [];
    this.distances = [];
    this.endPoints = [];

    this.colorIndex = 0;

    for (var i = 0; i < this.numberOfVertices; i++) {
        this.curveVertices[i] = createVector(mouseOffsets[offi].mouseX + sensorX , mouseOffsets[offi].mouseY + sensorY);
        this.distances[i] = createVector(0, 0);
        this.endPoints[i] = createVector(0, 0);
    }
	
	
}

SketchLine.prototype.update = function() {
    this.colorIndex = (this.colorIndex < this.colors.length) ? this.colorIndex + 1 : 0;
	
	sensorX += velocityX;
	sensorY += velocityY;
	
	// Make sure it is contained within bounds
	if (sensorX < 0) {
		sensorX = canvas.width;
		releaseLines();
		addLines();
	}
	if (sensorX > canvas.width) {
		sensorX = 0;
		releaseLines();
		addLines();
	}
	
	if (sensorY < 0) {
		sensorY = canvas.height;
		releaseLines();
		addLines();
	}
	if (sensorY > canvas.height) {
		sensorY = 0;
		releaseLines();
		addLines();
	}
	
	
	sensorY = min(max(0, sensorY), canvas.height);
	
    for (var i = 0; i < this.numberOfVertices; i++) {
        this.distances[i].x = (i === 0) ? (mouseOffsets[offi].mouseX + Math.random()*100) + sensorX - this.curveVertices[0].x : this.curveVertices[i - 1].x - this.curveVertices[i].x;
        this.distances[i].y = (i === 0) ? (mouseOffsets[offi].mouseY + Math.random()*100) + sensorY - this.curveVertices[0].y : this.curveVertices[i - 1].y - this.curveVertices[i].y;
        this.distances[i].mult(this.easeFactor);
        this.endPoints[i].add(this.distances[i]);
        this.curveVertices[i].add(this.endPoints[i]);
        this.endPoints[i].mult(this.speedFactor);
    }
	
	offi += 1;
	if (offi >= mouseOffsets.length)
		offi = 0
};

SketchLine.prototype.render = function() {
    art.beginShape();
    for (var i = 0; i < this.numberOfVertices; i++) {
        art.noFill();
        art.strokeWeight(1);
        var c = colors[this.colorIndex]
        art.stroke(c[0], c[1], c[2], 30);
        art.curveVertex(this.curveVertices[i].x, this.curveVertices[i].y);
    }
    art.endShape();
};
