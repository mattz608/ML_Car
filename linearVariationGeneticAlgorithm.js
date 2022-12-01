class LinearVariation {
    constructor(cars, traffic, simStats)
    {
        this.cars = cars;
        if (localStorage.getItem("bestBrain")) {
            for (let i = 0; i < cars.length; i++) {
                cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));;
                if (i != 0) {
                    this.mutate(cars[i].brain, 0.1);
                }
            }
        }

        this.traffic = traffic;
        this.simStats = simStats;

        this.eliteMode = false; // Not implemented yet
    }

    mutate(network, amount=1)
    {
        network.levels.forEach(level => {
            for (let i = 0; i < level.biases.length; i++) {
                level.biases[i] = lerp(
                    level.biases[i],
                    Math.random() * 2 - 1, // Random value between [-1, 1]
                    amount                 // Scale of random value
                );
            }

            for (let i = 0; i < level.weights.length; i++) {
                for (let j = 0; j < level.weights[i].length; j++) {
                    level.weights[i][j] = lerp(
                        level.weights[i][j],
                        Math.random() * 2 - 1,
                        amount
                    );
                }
            }
        });
    }

    getBestCar()
    {
        let mostCarsPassed = Math.max(...this.cars.map(c => c.carsPassed));
        let candidateCars = this.cars.filter(c => c.carsPassed == mostCarsPassed);
        return candidateCars.find(c => c.y == Math.min(...candidateCars.map(c2 => c2.y)));
    }

    save()
    {
        localStorage.setItem("bestBrain", JSON.stringify(this.getBestCar().brain));
    }

    discard()
    {
        localStorage.removeItem("bestBrain");
    }
}