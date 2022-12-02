class GeneticEvolution {
    constructor(cars, traffic, simStats) {
        this.cars = cars;
        this.bestCar = cars[0];
        this.simStats = simStats;

        this.crossoverRate = 1; // Needs to be 1 unless k-point crossover is implemented
        this.mutationRate = 0.1;
        this.mutationAlpha = 0.15;

        this.elitismFactor = 5; // Number of top performing parents to be carried forward unaltered

        this.eliteMode = true; // Keeps the best performing car across all generations
        if (localStorage.getItem("nextGenerationCandidates"))
        {
            this.parentBrains = JSON.parse(localStorage.getItem("nextGenerationCandidates"));
            if (this.eliteMode && simStats?.bestPerformer?.brain != null)
            {
                this.parentBrains.push(simStats.bestPerformer.brain);
            }
            this.mutate();
        }

        this.traffic = traffic;
        this.candidateRate = 0.025;
        
    }

    mutate()
    {
        // Implementing elitism - Carry forward some of the best performer parent genes unaltered
        for (let i = 0; i < this.elitismFactor; i++)
        {
            this.cars[i].brain = this.parentBrains[i];
        }

        // Load best car of all generations
        let loadEliteCar = this.eliteMode && this.simStats.bestPerformer.brain != null;
        if (loadEliteCar)
        {
            this.cars[this.elitismFactor].brain = this.simStats.bestPerformer.brain;
        }

        // Do random crossover and mutation for the remaining cars
        for (let i = this.elitismFactor + loadEliteCar; i < this.cars.length; i++)
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

    getBestCar(cars=this.cars)
    {
        let currBestCar = this.bestCar.damaged ? cars.find(c => !c.damaged) ?? this.cars[0] : this.bestCar;

        for (let i = 0; i < cars.length; i++)
        {
            if (!cars[i].damaged && cars[i].carsPassed >= currBestCar.carsPassed && cars[i].y < currBestCar.y)
            {
                currBestCar = cars[i];
            }
        }

        this.bestCar = currBestCar;
        return currBestCar;
    }

    getWorstCar(cars=this.cars)
    {
        let worstCar = cars[0];
        for (var i = 0; i < cars.length; i++)
        {
            if (cars[i].y > worstCar.y)
            {
                worstCar = cars[i];
            }
        }

        return worstCar;
    }

    getNextGenerationCandidates()
    {
        // Remove elite car from candidates
        if (this.eliteMode && this.simStats?.bestPerformer?.brain != null)
        {
            let eliteCar = this.cars.findIndex(c => c.brain == this.simStats.bestPerformer.brain);
            if (eliteCar >= 0) {
                this.cars.splice(eliteCar, 1);
            }
        }

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