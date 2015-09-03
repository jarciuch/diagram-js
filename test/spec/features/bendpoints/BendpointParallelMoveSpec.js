'use strict';

require('../../../TestHelper');

var canvasEvent = require('../../../util/MockEvents').createCanvasEvent;

/* global bootstrapDiagram, inject */

var bendpointsModule = require('../../../../lib/features/bendpoints'),
    modelingModule = require('../../../../lib/features/modeling'),
    selectModule = require('../../../../lib/features/selection');


describe('features/bendpoints - parallel move', function() {

  beforeEach(bootstrapDiagram({ modules: [ bendpointsModule, modelingModule, selectModule ] }));

  beforeEach(inject(function(dragging) {
    dragging.setOptions({ manual: true });
  }));


  var rootShape, shape1, shape2, connection;

  beforeEach(inject(function(elementFactory, canvas) {

    rootShape = elementFactory.createRoot({
      id: 'root'
    });
    canvas.setRootElement(rootShape);

    shape1 = elementFactory.createShape({
      id: 'shape1', type: 'A',
      x: 100, y: 400,
      width: 200, height: 100
    });
    canvas.addShape(shape1, rootShape);

    shape2 = elementFactory.createShape({
      id: 'shape2', type: 'A',
      x: 600, y: 50,
      width: 100, height: 200
    });
    canvas.addShape(shape2, rootShape);

    connection = elementFactory.createConnection({
      id: 'connection',
      waypoints: [
        { x: 200, y: 450 },
        { x: 400, y: 450 },
        { x: 400, y: 150 },
        { x: 650, y: 150 }
      ],
      source: shape1,
      target: shape2
    });
    canvas.addConnection(connection, rootShape);

  }));

  describe('modeling', function() {

    it('should update first/last bendpoint with original points',
       inject(function(canvas, bendpointParallelMove, dragging) {

      // when first intersection is dragged
      bendpointParallelMove.start(canvasEvent({ x: 275, y: 450 }), connection, 1);
      dragging.move(canvasEvent({ x: 275, y: 430}));
      dragging.end();

      // when last intersection is dragged
      bendpointParallelMove.start(canvasEvent({ x: 425, y: 150 }), connection, 3);
      dragging.move(canvasEvent({ x: 425, y: 210}));
      dragging.end();

      // then
      expect(connection.waypoints[0].original).to.eql({x:200, y:450});
      expect(connection.waypoints[3].original).to.eql({x:650, y:150});
    }));

    it('should move first/last bendpoint to appropriate edges',
       inject(function(canvas, bendpointParallelMove, dragging) {

      // when first intersection is dragged
      bendpointParallelMove.start(canvasEvent({ x: 275, y: 450 }), connection, 1);
      dragging.move(canvasEvent({ x: 275, y: 430}));
      dragging.end();

      // when last intersection is dragged
      bendpointParallelMove.start(canvasEvent({ x: 425, y: 150 }), connection, 3);
      dragging.move(canvasEvent({ x: 425, y: 210}));
      dragging.end();

      // then
      expect(connection.waypoints[0].x).to.eql(300);
      expect(connection.waypoints[0].y).to.eql(430);

      expect(connection.waypoints[3].x).to.eql(600);
      expect(connection.waypoints[3].y).to.eql(210);
    }));

    it('can handle lefties',
       inject(function(canvas, bendpointParallelMove, dragging) {

      // precondition: drag middle to the left
      bendpointParallelMove.start(canvasEvent({ x: 400, y: 200 }), connection, 2);
      dragging.move(canvasEvent({ x: 50, y: 200}));
      dragging.end();

      // when first intersection is dragged
      bendpointParallelMove.start(canvasEvent({ x: 75, y: 450 }), connection, 1);
      dragging.move(canvasEvent({ x: 75, y: 430}));
      dragging.end();

      // then
      expect(connection.waypoints[0].x).to.eql(100);
      expect(connection.waypoints[0].y).to.eql(430);
    }));

    it('can handle righties',
       inject(function(canvas, bendpointParallelMove, dragging) {

      // precondition: drag middle to the left
      bendpointParallelMove.start(canvasEvent({ x: 400, y: 200 }), connection, 2);
      dragging.move(canvasEvent({ x: 750, y: 200}));
      dragging.end();

      // when last intersection is dragged
      bendpointParallelMove.start(canvasEvent({ x: 725, y: 150 }), connection, 3);
      dragging.move(canvasEvent({ x: 725, y: 210}));
      dragging.end();

      // then
      expect(connection.waypoints[3].x).to.eql(700);
      expect(connection.waypoints[3].y).to.eql(210);
    }));

    it('should update upper bendpoint on horizontal movement',
       inject(function(canvas, bendpointParallelMove, dragging) {

      // precondition: drag middle to the left
      bendpointParallelMove.start(canvasEvent({ x: 400, y: 200 }), connection, 2);
      dragging.move(canvasEvent({ x: 620, y: 200}));
      dragging.end();

      // then
      expect(connection.waypoints[2].x).to.eql(620);
    expect(connection.waypoints[2].y).to.eql(250);
    }));

    it('should update lower bendpoint on horizontal movement',
       inject(function(canvas, bendpointParallelMove, dragging) {

      // precondition: drag middle to the left
      bendpointParallelMove.start(canvasEvent({ x: 400, y: 200 }), connection, 2);
      dragging.move(canvasEvent({ x: 280, y: 200}));
      dragging.end();

      // then
      expect(connection.waypoints[0].x).to.eql(280);
      expect(connection.waypoints[0].y).to.eql(400);
      expect(connection.waypoints.length).to.eql(3);
    }));

    it('should enlight with a spiral',
       inject(function(canvas, bendpointParallelMove, dragging) {

      // precondition: lets create a fancy spiral
      var l = [
        // intersection, from position, to position
        [1, {x:275, y:450}, {x:275, y:570}],
        [1, {x:275, y:570}, {x:5,   y:570}],
        [1, {x:15,  y:450}, {x:15,  y:330}],
        [1, {x:150, y:350}, {x:390, y:350}],
        [1, {x:350, y:350}, {x:350, y:560}],
        [1, {x:150, y:330}, {x:15,  y:330}],
        [1, {x:25,  y:450}, {x:25,  y:340}],
      ];

      l.forEach(function(cmd) {
        var i = cmd[0],
            startPosition = cmd[1],
            targetPosition = cmd[2];

        bendpointParallelMove.start(canvasEvent(startPosition), connection, i);
        dragging.move(canvasEvent(targetPosition));
        dragging.end();
      });

      
      expect(connection.waypoints.length).to.eql(11);
    }));
        
    // see issue #367
    it.skip('keeps the other axis',
       inject(function(canvas, bendpointParallelMove, dragging) {

      // precondition: drag last intersection down a bit
      bendpointParallelMove.start(canvasEvent({ x: 425, y: 150 }), connection, 3);
      dragging.move(canvasEvent({ x: 425, y: 210}));
      dragging.end();
      // when: middle intersection is dragged to the left
      //       multiple steps are needed because it needs to pass the shape
      bendpointParallelMove.start(canvasEvent({ x: 400, y: 300 }), connection, 2);
      dragging.move(canvasEvent({ x: 650, y: 300}));
      dragging.move(canvasEvent({ x: 750, y: 300}));
      dragging.end();

      // then: the y axis doesn't change (back to target center)
      expect(connection.waypoints[3].y).to.eql(210);
    }));

  });

});
