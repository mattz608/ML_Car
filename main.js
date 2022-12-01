// Car canvas
const carCanvas = document.getElementById("carCanvas");
const carCtx = carCanvas.getContext("2d");

// Network canvas
const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 0;
const networkCtx = networkCanvas.getContext("2d");

// Road
let laneCount = 5;
carCanvas.width = laneCount * 66;
const road = new Road(carCanvas.width/2, carCanvas.width*0.9, laneCount);

// Traffic
let traffic = new Traffic(30, 50, 2, laneCount, 4);

// Sim stats
let simStats = new SimStats();
simStats.carsPassedPerGeneration.push(0);
simStats.generation = simStats.carsPassedPerGeneration.length;
document.getElementById("genCounter").innerText = "Gen: " + simStats.generation;

// Bar chart
let barChartCanvas = document.getElementById("barChartCanvas");
let barChartContext = barChartCanvas.getContext("2d");
barChartContext.canvas.width = 0;
let barChart = new BarChart({
    canvas: barChartCanvas,
    colors: ["#ffffff"],
    data: simStats,
    gridScale: 100,
    gridColor: "#ffffff"
});

// Generate cars
const N = 2000;
let cars = generateCars(N);

// Algorithm initialization
algClasses = [LinearVariation, GeneticEvolution];
alg = new algClasses[1](cars, traffic, simStats);

// Best car
let bestCar = cars[0];
let lastBestCar = bestCar;
let lastTimeBestCarChanged = Date.now();

// Brain initializations
const previousBestCar = bestCar;

animate();


function save() {
    console.log("Saving");

    simStats.save(bestCar);
    alg.save();

    window.location.reload();
    /*
    // For stopping the animation for a specific condition. Refresh to continue
    if (simStats.generation != 30)
    {
        window.location.reload();
    }*/
}

function discard() {
    alg.discard();

    localStorage.removeItem("simStats");
    window.location.reload();
}

function drawBarChart() {
    simStats.barChartEnabled = simStats.barChartEnabled == false;
}

function drawNetworkVisualizer()
{
    simStats.networkVisualizerEnabled = simStats.networkVisualizerEnabled == false;
}

function generateCars(N) {
    const cars = [];
    for (let i = 0; i < N; i++) {
        cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI", 8));
    }

    return cars;
}

function updateDisplayedStats()
{
    // Update displayed stats
    document.getElementById("bestCarTimer").innerText = 
    "Time since last pass: " + ((Date.now() - bestCar.lastTimePassedCar) / 1000).toFixed(2) + "s";
    document.getElementById("simulationTimer").innerText = 
        "Simulation duration: " + convertMillisecondsToDaysHoursMinutesSeconds(Date.now() - simStats.timeStarted);
    document.getElementById("trialTimer").innerText = 
        "Trial duration: " + convertMillisecondsToDaysHoursMinutesSeconds(Date.now() - simStats.trialStartTime);
    document.getElementById("mostCarsPassed").innerText = 
        "Most cars passed: " + simStats.mostCarsPassed;
    document.getElementById("lastCarsPassed").innerText = 
        "Cars passed last trial: " + (simStats.carsPassedPerGeneration.length >= 2 
                                        ? simStats.carsPassedPerGeneration[simStats.carsPassedPerGeneration.length-2] 
                                        : "N/A") ;
    document.getElementById("carsAlive").innerText = 
        "Cars alive: " + cars.reduce((alive, c) => alive += (!c.damaged), 0);
    document.getElementById("currentMostCarsPassed").innerText = 
        "Current passed: " + bestCar.carsPassed;
}

function animate(time) {
    // Update objects
    traffic.update(road.borders, bestCar);
    for (let i = 0; i < cars.length; i++) {
        cars[i].update(road.borders, traffic);
    }
    simStats.update(bestCar);
    barChart.update();
    
    updateDisplayedStats();

    // Determine best car. Wait to switch perspectives so we can avoid determining new best cars every frame when crowds crash
    let nextBestCar = alg.getBestCar(cars);
    if (nextBestCar != lastBestCar && Date.now() - lastTimeBestCarChanged > 500)
    {
        bestCar = nextBestCar;
        lastBestCar = bestCar;
        lastTimeBestCarChanged = Date.now();
    }

    // Get rid of unnecessary AI cars
    cars = cars.filter(c => 
        c.damaged == false && c.y <= bestCar.y + 600 ||
        c.damaged == true && c.y <= -nextBestCar.y + carCanvas.height
    );

    // Resize canvases to be height of the screen
    carCanvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;

    // Focus "camera" above car
    carCtx.save();
    carCtx.translate(0, -nextBestCar.y + carCanvas.height * 0.5);
    

    // Draw objects
    road.draw(carCtx);
    for (let i = 0; i < traffic.cars.length; i++) {
        traffic.cars[i].draw(carCtx, "red");
    }

    // Make all other cars transparent
    carCtx.globalAlpha = 0.2;
    for (let i = 0; i < cars.length; i++) {
        if (cars[i] != previousBestCar && cars[i] != bestCar && (!alg?.eliteMode || cars[i].brain != simStats.bestPerformer?.brain))
        {
            cars[i].draw(carCtx, "blue");
        }
    }

    // Make best car not transparent and has sensors
    // Draw previous best performer green
    carCtx.globalAlpha = 1;
    if (previousBestCar == bestCar)
    {
        bestCar.draw(carCtx, "green", true);
    }
    else
    {
        bestCar.draw(carCtx, "black", true);

        if (cars.includes(previousBestCar))
        {
            previousBestCar.draw(carCtx, "green");
        }
    }

    if (alg?.eliteMode && simStats?.bestPerformer?.brain) {
        let eliteCar = cars.find(c => c.brain == simStats.bestPerformer.brain);
        if (eliteCar) {
            eliteCar.draw(carCtx, "gold");
        }
    }

    barChartContext.canvas.width = simStats.barChartEnabled ? 600 : 0;
    barChartContext.canvas.height = simStats.barChartEnabled ? 600 : 0;
    if (simStats.barChartEnabled) {
        barChart.draw();
    }
    
    carCtx.restore();

    networkCanvas.width = simStats.networkVisualizerEnabled ? 400 : 0;
    if (simStats.networkVisualizerEnabled)
    {
        networkCtx.lineDashOffset=time/50;
        Visualizer.drawNetwork(networkCtx, bestCar.brain);
    }

    let stuckInTraffic = Date.now() - bestCar.lastTimePassedCar > 5000; // best car is stuck in traffic for more than 5 seconds
    let allDead = !cars.some(c => c.damaged == false);
    if (!stuckInTraffic && !allDead)
    {
        requestAnimationFrame(animate);
    }
    else
    {
        console.log("Reloading: " + Date.now());
        save();
    }
}