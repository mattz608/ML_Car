class Traffic {
    constructor(width, length, speed, laneCount, incrementalTrafficGenerationRowCount) {

        this.width = width;
        this.length = length;
        this.speed = speed;
        this.laneCount = laneCount;
        this.incrementalTrafficGenerationRowCount = incrementalTrafficGenerationRowCount;

        // First set of cars are hardcoded so that cars can learn iteratively on a constant set before traffic is randomized
        this.cars = this.#getDefaultTraffic(this.laneCount);

        this.last = this.cars.find(t => t.y == Math.min(...this.cars.map(t2 => t2.y)));

        this.trafficDeleted = 0;
    }

    #getDefaultTraffic(laneCount)
    {
        switch (laneCount) {
            case 4:
                return [
                    new Car(road.getLaneCenter(1), -100, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(3), -300, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(0), -500, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(2), -700, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(0), -900, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(1), -900, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(3), -900, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(0), -1100, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(2), -1100, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(3), -1100, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(0), -1300, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(1), -1300, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(2), -1300, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(3), -1600, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(2), -1600, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(1), -1600, this.width, this.length, "DUMMY", 2)
                ];
                break;
            case 5:
                return [
                    new Car(road.getLaneCenter(1), -100, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(3), -300, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(0), -500, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(2), -700, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(4), -900, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(0), -1200, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(1), -1200, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(2), -1200, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(4), -1500, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(3), -1500, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(2), -1500, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(0), -1800, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(1), -1800, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(3), -1800, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(4), -1800, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(0), -2100, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(2), -2100, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(4), -2100, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(1), -2400, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(2), -2400, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(3), -2400, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(0), -2700, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(1), -2700, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(2), -2700, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(3), -2700, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(0), -3000, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(1), -3000, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(2), -3000, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(3), -3000, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(4), -3300, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(3), -3300, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(2), -3300, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(1), -3300, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(4), -3600, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(3), -3600, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(2), -3600, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(1), -3600, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(0), -3900, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(1), -3900, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(2), -3900, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(4), -3900, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(4), -4100, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(3), -4100, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(2), -4100, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(1), -4100, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(0), -4300, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(1), -4300, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(2), -4300, this.width, this.length, "DUMMY", 2),
                    new Car(road.getLaneCenter(3), -4300, this.width, this.length, "DUMMY", 2)
                ];
                break;

        }

    }

    #generateNewTraffic()
    {
        let currentY = this.last.y;

        for (let i = 0; i < this.incrementalTrafficGenerationRowCount; i++) {
            currentY -= Math.floor(250 + Math.random() * 125)

            let availableLanes = Array.from(Array(this.laneCount).keys());
            let numCars = Math.floor(Math.random() * (this.laneCount - 1) + 1);

            for (let j = 0; j < numCars; j++) {
                this.cars.push(
                    new Car(
                        road.getLaneCenter(
                            availableLanes.splice(Math.floor(Math.random() * availableLanes.length), 1)[0]
                        ),
                        currentY,
                        this.width,
                        this.length,
                        "DUMMY",
                        this.speed
                    )
                )
            };

            if (numCars)
            {
                this.last = this.cars[this.cars.length-1];
            }
        }
    }

    #cleanUpTraffic(bestCar)
    {
        this.trafficDeleted += this.cars.length;
        this.cars = this.cars.filter(t => t.y < bestCar.y || Math.abs(t.y - bestCar.y) < 600);
        this.trafficDeleted -= this.cars.length; // Super ugly way of keeping track of this... but oh well
    }

    update(roadBoarders, bestCar)
    {
        for (let i = 0; i < this.cars.length; i++) {
            traffic.cars[i].update(roadBoarders);
        }

        if (Math.abs(bestCar.y - this.last.y) < 500)
        {
            this.#cleanUpTraffic(bestCar);
            this.#generateNewTraffic();
        }
    }
}