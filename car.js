class Car {
    constructor(x, y, width, height, controlType, maxSpeed=3) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.speed = 0;
        this.acceleration = 0.2;
        this.maxSpeed = maxSpeed;
        this.friction = 0.05;
        this.angle = 0;
        this.damaged = false;

        this.useBrain = controlType == "AI";

        if (controlType != "DUMMY") {
            this.sensor = new Sensor();
            this.brain = new NeuralNetwork(
                [this.sensor.rayCount, 8, 4] // Creates NN with one hidden layer (Last layer is controls output)
            );
        }
        this.controls = new Controls(controlType);

        this.carsPassed = 0;
        this.lastTimePassedCar = Date.now();
        this.polygon = this.#createPolygon();
    }

    update(roadBorders, traffic={cars:[], trafficDeleted:0}) {
        if (this.damaged) {
            return;
        }

        this.#move();
        this.polygon = this.#createPolygon();

        // Update number of traffic cars passed
        let numTrafficPassed = traffic.cars.length - traffic.cars.reduce((ahead, t) => ahead += (t.y < this.y), 0) + traffic.trafficDeleted;
        if (this.carsPassed < numTrafficPassed)
        {
            this.carsPassed = numTrafficPassed;
            this.lastTimePassedCar = Date.now();
        }

        let relevantTraffic = traffic.cars.filter(t => distanceBetween(t.x, t.y, this.x, this.y) < this.sensor.rayLength ?? this.height * 2);

        this.damaged = this.#assessDamage(roadBorders, relevantTraffic);

        if (this.sensor) {
            this.sensor.update(this.x, this.y, this.angle, roadBorders, relevantTraffic);
            const offsets = this.sensor.readings.map(
                s => s == null ? 0 : 1 - s.offset
            );
            
            const outputs = NeuralNetwork.feedForward(offsets, this.brain);

            if (this.useBrain) {
                this.controls.forward = outputs[0];
                this.controls.left = outputs[1];
                this.controls.right = outputs[2];
                this.controls.reverse = outputs[3];
            }
        }
    }

    #assessDamage(roadBorders, traffic) {

        for (const border of roadBorders)
        {
            if (polyIntersect(this.polygon, border)) {
                return true;
            }
        }

        for (let i = 0; i < traffic.length; i++) {
            if (polyIntersect(this.polygon, traffic[i].polygon))
            {
                return true;
            }
        }

        return false;
    }

    #createPolygon() {
        const points=[];

        const rad = Math.hypot(this.width, this.height) / 2; // Distance from center to corner
        const alpha = Math.atan2(this.width, this.height); // Angle of diagonal
        
        // Remember that the unit circle is rotated 90 degrees ccw (i.e. angle 0 is up)
        // Top left corner
        points.push({
            x : this.x - Math.sin(this.angle - alpha)*rad,
            y : this.y - Math.cos(this.angle - alpha)*rad
        });

        // Top right corner
        points.push({
            x : this.x - Math.sin(this.angle + alpha)*rad,
            y : this.y - Math.cos(this.angle + alpha)*rad
        });

        // Bottom right corner
        points.push({
            x : this.x - Math.sin(Math.PI + this.angle - alpha)*rad,
            y : this.y - Math.cos(Math.PI + this.angle - alpha)*rad
        });

        // Bottom left corner
        points.push({
            x : this.x - Math.sin(Math.PI + this.angle + alpha)*rad,
            y : this.y - Math.cos(Math.PI + this.angle + alpha)*rad
        });

        return points;
    }

    #move() {
        // Forwards and reverse
        if (this.controls.forward) {
            this.speed += this.acceleration;
        }
        if (this.controls.reverse) {
            this.speed -= this.acceleration;
        }
        
        // Max speed caps
        if (this.speed > this.maxSpeed)
        {
            this.speed = this.maxSpeed;
        }
        if (this.speed < -this.maxSpeed / 2) {
            this.speed = -this.maxSpeed / 2;
        }

        // Friction
        if (this.speed > 0) {
            this.speed -= this.friction;
        }
        if (this.speed < 0) {
            this.speed += this.friction;
        }
        if (Math.abs(this.speed) < this.friction) {
            this.speed = 0;
        }

        // Turning
        if (this.speed != 0) {
            const flip = this.speed > 0 ? 1 : -1;
            if (this.controls.left) {
                this.angle += 0.04 * flip;
            }
            if (this.controls.right) {
                this.angle -= 0.04 * flip;
            }
        }

        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
    }

    draw(ctx, color, drawSensor=false) {
        if (this.damaged) {
            ctx.fillStyle = "gray";
        } else {
            ctx.fillStyle = color;
        }

        ctx.beginPath();
        ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
        for (let i = 1; i < this.polygon.length; i++) {
            ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
        }
        ctx.fill();

        if (this.sensor && drawSensor) {
            this.sensor.draw(ctx);
        }
    }
}