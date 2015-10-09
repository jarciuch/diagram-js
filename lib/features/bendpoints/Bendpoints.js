'use strict';

var domEvent = require('min-dom/lib/event'),
    BendpointUtil = require('./BendpointUtil');

var BENDPOINT_CLS = BendpointUtil.BENDPOINT_CLS;

var getApproxIntersection = require('../../util/LineIntersection').getApproxIntersection,
    geometry = require('../../util/Geometry');


/**
 * A service that adds editable bendpoints to connections.
 */
function Bendpoints(injector, eventBus, canvas, interactionEvents, bendpointMove, bendpointParallelMove) {

  function getConnectionIntersection(waypoints, event) {
    var localPosition = BendpointUtil.toCanvasCoordinates(canvas, event),
        intersection = getApproxIntersection(waypoints, localPosition);

    if(intersection && intersection.index > 0) {
      var idx = intersection.index,
          wp0 = waypoints[idx - 1],
          wp1 = waypoints[idx];

      intersection.mid = geometry.getMidPoint(wp0, wp1);
      intersection.orientation = geometry.getOrientation(wp0, wp1);
      return intersection;
    }
  }

  function activateBendpointMove(event, connection) {
    var waypoints = connection.waypoints,
        intersection = getConnectionIntersection(waypoints, event),
        floating = getBendpointsContainer(connection, true).select('.floating');

    if (!intersection) {
      return;
    }

    if(floating.hasClass("center")) {
      bendpointParallelMove.start(event, connection, intersection.index);
    } else {
      bendpointMove.start(event, connection, intersection.index, !intersection.bendpoint);
    }
  }

  function getBendpointsContainer(element, create) {

    var layer = canvas.getLayer('overlays'),
        gfx = layer.select('.djs-bendpoints[data-element-id=' + element.id + ']');

    if (!gfx && create) {
      gfx = layer.group().addClass('djs-bendpoints').attr('data-element-id', element.id);

      domEvent.bind(gfx.node, 'mousedown', function(event) {
        activateBendpointMove(event, element);
      });
    }

    return gfx;
  }

  function createBendpoints(gfx, connection) {
    connection.waypoints.forEach(function(p, idx) {
      BendpointUtil.addBendpoint(gfx).translate(p.x, p.y);
    });

    // add floating bendpoint
    BendpointUtil.addBendpoint(gfx, "floating");
  }

  function clearBendpoints(gfx) {
    gfx.selectAll('.' + BENDPOINT_CLS).forEach(function(s) {
      s.remove();
    });
  }

  function addBendpoints(connection) {
    var gfx = getBendpointsContainer(connection);

    if (!gfx) {
      gfx = getBendpointsContainer(connection, true);
      createBendpoints(gfx, connection);
    }

    return gfx;
  }

  function updateBendpoints(connection) {

    var gfx = getBendpointsContainer(connection);

    if (gfx) {
      clearBendpoints(gfx);
      createBendpoints(gfx, connection);
    }
  }

  eventBus.on('connection.changed', function(event) {
    updateBendpoints(event.element);
  });

  eventBus.on('connection.remove', function(event) {
    var gfx = getBendpointsContainer(event.element);
    if (gfx) {
      gfx.remove();
    }
  });

  eventBus.on('element.marker.update', function(event) {

    var element = event.element,
        bendpointsGfx;

    if (!element.waypoints) {
      return;
    }

    bendpointsGfx = addBendpoints(element);
    bendpointsGfx[event.add ? 'addClass' : 'removeClass'](event.marker);
  });

  eventBus.on('element.mousemove', function(event) {

    var element = event.element,
        waypoints = element.waypoints,
        bendpointsGfx,
        floating,
        intersection;

    if (waypoints) {

      bendpointsGfx = getBendpointsContainer(element, true);
      floating = bendpointsGfx.select('.floating');

      if (!floating) {
        return;
      }

      intersection = getConnectionIntersection(waypoints, event.originalEvent);

      if (intersection) {
        var p = intersection.point,
            mid = intersection.mid,
            xDelta = Math.abs(p.x - mid.x),
            yDelta = Math.abs(p.y - mid.y),
            parallelMovementAllowed = intersection.orientation !== "diagonal";

        floating.removeClass("center");
        floating.removeClass("diagonal");
        floating.removeClass("vertical");
        floating.removeClass("horizontal");
        floating.addClass(intersection.orientation);

        if (parallelMovementAllowed && xDelta < 10 && yDelta < 10) {
          floating.addClass("center");
          floating.translate(mid.x, mid.y);

        } else {
          floating.translate(p.x, p.y);
        }
      }
    }
  });

  eventBus.on('element.mousedown', function(event) {

    var originalEvent = event.originalEvent,
        element = event.element,
        waypoints = element.waypoints;

    if (!waypoints) {
      return;
    }

    activateBendpointMove(originalEvent, element, waypoints);
  });

  eventBus.on('selection.changed', function(event) {
    var newSelection = event.newSelection,
        primary = newSelection[0];

    if (primary && primary.waypoints) {
      addBendpoints(primary);
    }
  });

  eventBus.on('element.hover', function(event) {
    var element = event.element;

    if (element.waypoints) {
      addBendpoints(element);

      interactionEvents.registerEvent(event.gfx.node, 'mousemove', 'element.mousemove');
    }
  });

  eventBus.on('element.out', function(event) {
    interactionEvents.unregisterEvent(event.gfx.node, 'mousemove', 'element.mousemove');
  });
}

Bendpoints.$inject = [
  'injector', 'eventBus', 'canvas',
  'interactionEvents', 'bendpointMove','bendpointParallelMove'
];

module.exports = Bendpoints;
