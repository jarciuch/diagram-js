'use strict';

require('../../../TestHelper');

/* global bootstrapDiagram, inject */


var modelingModule = require('../../../../lib/features/modeling'),
    bendpointsModule = require('../../../../lib/features/bendpoints'),
    rulesModule = require('./rules'),
    interactionModule = require('../../../../lib/features/interaction-events'),
    canvasEvent = require('../../../util/MockEvents').createCanvasEvent;

describe('features/bendpoints', function() {

  beforeEach(bootstrapDiagram({ modules: [ modelingModule, bendpointsModule, interactionModule, rulesModule ] }));


  var rootShape, shape1, shape2, shape3, connection, connection2;

  beforeEach(inject(function(elementFactory, canvas) {

    rootShape = elementFactory.createRoot({
      id: 'root'
    });

    canvas.setRootElement(rootShape);

    shape1 = elementFactory.createShape({
      id: 'shape1',
      type: 'A',
      x: 100, y: 100, width: 300, height: 300
    });

    canvas.addShape(shape1, rootShape);

    shape2 = elementFactory.createShape({
      id: 'shape2',
      type: 'A',
      x: 500, y: 100, width: 100, height: 100
    });

    canvas.addShape(shape2, rootShape);

    shape3 = elementFactory.createShape({
      id: 'shape3',
      type: 'B',
      x: 500, y: 400, width: 100, height: 100
    });

    canvas.addShape(shape3, rootShape);

    connection = elementFactory.createConnection({
      id: 'connection',
      waypoints: [ { x: 250, y: 250 }, { x: 550, y: 250 }, { x: 550, y: 150 } ],
      source: shape1,
      target: shape2
    });

    canvas.addConnection(connection, rootShape);

    connection2 = elementFactory.createConnection({
      id: 'connection2',
      waypoints: [ { x: 250, y: 250 }, { x: 550, y: 450 } ],
      source: shape1,
      target: shape2
    });

    canvas.addConnection(connection2, rootShape);
  }));


  describe('activation', function() {

    it('should show on hover', inject(function(eventBus, canvas, elementRegistry) {

      // given
      var layer = canvas.getLayer('overlays');

      // when
      eventBus.fire('element.hover', { element: connection, gfx: elementRegistry.getGraphics(connection) });


      // then
      // 3 visible + 1 invisible bendpoint are shown
      expect(layer.node.querySelectorAll('.djs-bendpoint').length).to.equal(4);
    }));


    it('should show on select', inject(function(selection, canvas, elementRegistry) {

      // given
      var layer = canvas.getLayer('overlays');

      // when
      selection.select(connection);

      // then
      // 3 visible + 1 invisible bendpoint are shown
      expect(layer.node.querySelectorAll('.djs-bendpoint').length).to.equal(4);
    }));


    it('should not show parallel indicator', inject(function(eventBus, canvas, elementRegistry) {

      // given
      var layer = canvas.getLayer('overlays');

      // when
      eventBus.fire('element.hover', { element: connection, gfx: elementRegistry.getGraphics(connection) });
      eventBus.fire('element.mousemove', {
        element: connection,
        originalEvent: {clientX:300, clientY:250}
      });

      // then: floating bendpoint is shown
      expect(layer.node.querySelectorAll('.floating').length).to.equal(1);
      expect(layer.node.querySelectorAll('.floating.center').length).to.equal(0);
    }));


    it('should show parallel indicator', inject(function(eventBus, canvas, elementRegistry) {

      // given
      var layer = canvas.getLayer('overlays');

      // when
      eventBus.fire('element.hover', { element: connection, gfx: elementRegistry.getGraphics(connection) });

      eventBus.fire('element.mousemove', {
        element: connection,
        originalEvent: canvasEvent({x:391, y:250})
      });

      // then parallel movement indicator is shown
      expect(layer.node.querySelectorAll('.floating').length).to.equal(1);
      expect(layer.node.querySelectorAll('.floating.center').length).to.equal(1);

      // move out of 10px range (square should be hidden)
      eventBus.fire('element.mousemove', {
        element: connection,
        originalEvent: canvasEvent({x:390, y:250})
      });
      expect(layer.node.querySelectorAll('.floating.center').length).to.equal(0);

      // other side of the range (square should be visible)
      eventBus.fire('element.mousemove', {
        element: connection,
        originalEvent: canvasEvent({x:409, y:250})
      });
      expect(layer.node.querySelectorAll('.floating.center').length).to.equal(1);

      // exactly the middle (square should be visible)
      eventBus.fire('element.mousemove', {
        element: connection,
        originalEvent: canvasEvent({x:400, y:250})
      });
      expect(layer.node.querySelectorAll('.floating.center').length).to.equal(1);

    }));
  });
});
