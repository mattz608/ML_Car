
class SimStats {
    constructor() {
        this.generation = 0;
        this.timeStarted = Date.now();
        this.mostCarsPassed = 0;
        this.carsPassedPerGeneration = [];
        this.barChartEnabled = false;
        this.networkVisualizerEnabled = false;
        this.bestPerformer =
        {
            brain: null,
            carsPassed: 0
        };

        if (localStorage.getItem("simStats"))
        {
            let savedState = JSON.parse(localStorage.getItem("simStats"));
            for (let prop in savedState) {
                this[prop] = savedState[prop];
            }
        }

        this.trialStartTime = Date.now();
    }

    save(bestCar) {
        if (!this.bestPerformer.brain || bestCar.carsPassed > this.bestPerformer.carsPassed)
        {
            this.bestPerformer.brain = bestCar.brain;
            this.bestPerformer.carsPassed = bestCar.carsPassed;
        }

        localStorage.setItem("simStats", JSON.stringify(this));
    }

    update(bestCar) {
        this.mostCarsPassed = Math.max(this.mostCarsPassed, bestCar.carsPassed);
        this.carsPassedPerGeneration[this.carsPassedPerGeneration.length-1] = bestCar.carsPassed;
    }
}