class GeneticEvolution {
    constructor(cars, traffic) {
        this.cars = cars;
        this.bestCar = cars[0];

        this.crossoverRate = 1; // Needs to be 1 unless k-point crossover is implemented
        this.mutationRate = 0.1;
        this.mutationAlpha = 0.2;

        this.elitismFactor = 5; // Number of top performing parents to be carried forward unaltered

        if (localStorage.getItem("nextGenerationCandidates"))
        {
            this.parentBrains = JSON.parse(localStorage.getItem("nextGenerationCandidates"));
            this.mutate();
        }

        this.traffic = traffic;
        this.candidateRate = 0.0125;
    }

    mutate()
    {
        // Implementing elitism - Carry forward some of the best performer parent genes unaltered
        for (let i = 0; i < this.elitismFactor; i++)
        {
            this.cars[i].brain = this.parentBrains[i];
        }

        // Do random crossover and mutation for the remaining cars
        for (let i = this.elitismFactor; i < this.cars.length; i++)
        {
            let p1 = this.parentBrains[Math.floor(Math.random() * this.parentBrains.length)]
            let p2;
            do {
                p2 = this.parentBrains[Math.floor(Math.random() * this.parentBrains.length)]
            } while (p1 == p2);

            let currCar = this.cars[i];

            // Move through each level of networks between p1, p2, and the current cars[i]
            for (let l = 0; l < currCar.brain.levels.length; l++)
            {
                let currLevel = currCar.brain.levels[l];

                // Biases
                for (let b = 0; b < currLevel.biases.length; b++)
                {
                    // Crossover
                    if (Math.random() < this.crossoverRate)
                    {
                        currLevel.biases[b] = Math.random() >= 0.5 ? p1.levels[l].biases[b] : p2.levels[l].biases[b];
                    }

                    // Mutation
                    if (Math.random() < this.mutationRate)
                    {
                        currLevel.biases[b] = lerp(
                            currLevel.biases[b],
                            Math.random() * 2 - 1,
                            this.mutationAlpha
                        );
                    }
                }

                // Weights
                for (let w1 = 0; w1 < currLevel.weights.length; w1++)
                {
                    for (let w2 = 0; w2 < currLevel.weights[w1].length; w2++)
                    {
                        // Crossover
                        if (Math.random() < this.crossoverRate)
                        {
                            currLevel.weights[w1][w2] = Math.random() >= 0.5 ? p1.levels[l].weights[w1][w2] : p2.levels[l].weights[w1][w2];
                        }

                        // Mutation
                        if (Math.random() < this.mutationRate)
                        {
                            currLevel.weights[w1][w2] = lerp(
                                currLevel.weights[w1][w2],
                                Math.random() * 2 - 1,
                                this.mutationAlpha
                            );
                        }
                    }
                }
            }
        }
    }

    getBestCar()
    {
        let currBestCar = this.bestCar ?? this.cars[0];
        for (const car of this.cars)
        {
            if (car.carsPassed >= currBestCar.carsPassed && car.y < currBestCar.y)
            {
                currBestCar = car;
            }
        }

        this.bestCar = currBestCar;
        return currBestCar;
    }

    getNextGenerationCandidates()
    {
        this.cars.sort((a,b) => {
            if (a.carsPassed > b.carsPassed)
            {
                return -1;
            }
            else if (a.carsPassed < b.carsPassed)
            {
                return 1;
            }
            else
            {
                if (a.y <= b.y)
                {
                    return -1;
                }

                return 1;
            }
        });

        return this.cars.slice(0, Math.floor(this.cars.length * this.candidateRate));
    }

    save()
    {
        localStorage.setItem("nextGenerationCandidates", JSON.stringify(this.getNextGenerationCandidates().map(c => c.brain)));
    }

    discard()
    {
        localStorage.removeItem("nextGenerationCandidates");
    }
}