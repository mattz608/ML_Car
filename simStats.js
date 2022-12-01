
class SimStats {
    constructor() {
        this.generation = 0;
        this.timeStarted = Date.now();
        this.mostCarsPassed = 0;
        this.carsPassedPerGeneration = [];
        this.barChartEnabled = false;
        this.networkVisualizerEnabled = false;

        if (localStorage.getItem("simStats"))
        {
            let savedState = JSON.parse(localStorage.getItem("simStats"));
            for (let prop in savedState) {
                this[prop] = savedState[prop];
            }
        }

        this.trialStartTime = Date.now();
    }

    update(bestCar) {
        this.mostCarsPassed = Math.max(this.mostCarsPassed, bestCar.carsPassed);
        this.carsPassedPerGeneration[this.carsPassedPerGeneration.length-1] = bestCar.carsPassed;
    }
}