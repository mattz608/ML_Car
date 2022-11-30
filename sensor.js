class Sensor {
    constructor(car) {
        this.car = car;
        this.rayCount = 12;
        this.rayLength = 200;
        this.raySpread = 3 * Math.PI/4; // Field of view

        // Each ray has 2 elements [startPoint, endPoint] (endPoint carries the angle property of the ray before car rotation)
        this.rays = Array.from(Array(this.rayCount).keys()).map(r => 
            [
                {
                    x: null, 
                    y: null,
                }, 
                {
                    x: null,
                    y: null,
                    angle: lerp(
                        this.raySpread/2,
                        -this.raySpread/2,
                        this.rayCount == 1 ? 0.5 : r/(this.rayCount-1) // rayCount - 1 is the amount of spaces between the rays
                    )
                }
            ]
        );
        this.readings = [];
    }

    update(roadBorders, traffic) {
        this.#castRays();

        this.readings = [];
        for (let i = 0; i < this.rays.length; i++) {
            this.readings.push(
                this.#getReading(this.rays[i], 
                    roadBorders, 
                    traffic)
            );
        }
    }

    #getReading(ray, roadBorders, traffic) {
        let touches = [];

        let minTouch = { x: ray[1].x, y: ray[1].y, offset: 1 };

        for (let border of roadBorders)
        {
            const touch = getIntersection(
                ray[0],
                ray[1],
                border[0],
                border[1]
            );
            if (touch && touch.offset < minTouch.offset) {
                minTouch = touch;
                break;
            }
        }

        for (let i = 0; i < traffic.length; i++) {
            const poly = traffic[i].polygon;
            for (let j = 0; j < poly.length; j++) {
                const touch = getIntersection(
                    ray[0],
                    ray[1],
                    poly[j],
                    poly[(j+1) % poly.length]
                );
                if (touch && touch.offset < minTouch.offset) {
                    minTouch = touch;
                }
            }
        }

        return minTouch.offset == 1 ? null : minTouch;
    }

    #castRays() {
        for (let i = 0; i < this.rays.length; i++)
        {
            this.rays[i][0].x = this.car.x;
            this.rays[i][0].y = this.car.y;
            this.rays[i][1].x = this.car.x - Math.sin(this.rays[i][1].angle + this.car.angle) * this.rayLength;
            this.rays[i][1].y = this.car.y - Math.cos(this.rays[i][1].angle + this.car.angle) * this.rayLength;
        }
    }

    draw(ctx) { 
        for (let i = 0; i < this.rays.length; i++) {
            let end = this.rays[i][1];
            if (this.readings[i]) {
                end = this.readings[i];
            }

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "yellow";
            ctx.moveTo(
                this.rays[i][0].x,
                this.rays[i][0].y
            );
            ctx.lineTo(
                end.x,
                end.y
            );
            ctx.stroke();

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "black";
            ctx.moveTo(
                this.rays[i][1].x,
                this.rays[i][1].y
            );
            ctx.lineTo(
                end.x,
                end.y
            );
            ctx.stroke();
        }
    }
}