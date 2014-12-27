(function () {
    var NUM_PARTICLES = 20000;
    var TIME_STEP = 1 / 20;
    var GRAVITY_CONSTANT = 100;

    // speed becomes this percentage of its original speed every second
    var PULLING_DRAG_CONSTANT = 0.96075095702;
    var INERTIAL_DRAG_CONSTANT = 0.73913643334;

    var dragConstant = INERTIAL_DRAG_CONSTANT;

    var returnToStartPower = 0;

    var attractors = {
        mouse: null
    };
    var particles = [];

    var html = '<div class="topbar">Click for gravity.<button class="reset">Reset</button></div><canvas></canvas>';

    var canvas;

    function init($sketchElement, context) {
        canvas = $sketchElement.find("canvas")[0];
        $sketchElement.find(".reset").click(function() {
            for (var i = 0; i < NUM_PARTICLES; i++) {
                particles[i].dx = 0;
                particles[i].dy = 0;
            }
            returnToStartPower = 0.01;
        });

        for( var i = 0; i < NUM_PARTICLES; i++ ) {
            particles[i] = {
                x: i * canvas.width / NUM_PARTICLES,
                y: canvas.height / 2,
                dx: 0,
                dy: 0
            };
        }
    }

    function animate($sketchElement, context) {
        var start = (new Date()).getTime();
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = "white";
        context.beginPath();

        if (returnToStartPower > 0 && returnToStartPower < 1) {
            returnToStartPower *= 1.01;
        }

        for (var i = 0; i < NUM_PARTICLES; i++) {
            var particle = particles[i];
            for (var attractorName in attractors) {
                var attractor = attractors[attractorName];
                if (attractor == null) continue;
                var dx = attractor.x - particle.x;
                var dy = attractor.y - particle.y;
                var length2 = Math.sqrt(dx*dx + dy*dy);
                var forceX = GRAVITY_CONSTANT * dx / length2;
                var forceY = GRAVITY_CONSTANT * dy / length2;

                particle.dx += forceX * TIME_STEP;
                particle.dy += forceY * TIME_STEP;
            }
            particle.dx *= Math.pow(dragConstant, TIME_STEP);
            particle.dy *= Math.pow(dragConstant, TIME_STEP);

            particle.x += particle.dx * TIME_STEP;
            particle.y += particle.dy * TIME_STEP;

            var wantedX = i * canvas.width / NUM_PARTICLES;
            var wantedY = canvas.height / 2;
            if (returnToStartPower > 0) {
                particle.x -= (particle.x - wantedX) * returnToStartPower;
                particle.y -= (particle.y - wantedY) * returnToStartPower;
            }

            context.moveTo(particle.x, particle.y);
            context.lineTo(particle.x + 1, particle.y);
        }
        context.stroke();
        var elapsed = (new Date()).getTime() - start;
    }

    function mousedown(event) {
        attractors["mouse"] = { x: event.offsetX, y : event.offsetY };
        dragConstant = PULLING_DRAG_CONSTANT;
        returnToStartPower = 0;
    }

    function mousemove(event) {
        if (attractors["mouse"]) {
            attractors["mouse"].x = event.offsetX;
            attractors["mouse"].y = event.offsetY;
        }
    }

    function mouseup(event) {
        dragConstant = INERTIAL_DRAG_CONSTANT;
        attractors["mouse"] = null;
    }

    var sketch2 = {
        init: init,
        animate: animate,
        html: html,
        mousedown: mousedown,
        mousemove: mousemove,
        mouseup: mouseup
    };
    initializeSketch(sketch2, "sketch2");
})();