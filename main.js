// Car canvas
const carCanvas = document.getElementById("carCanvas");
const carCtx = carCanvas.getContext("2d");

// Network canvas
const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 0;
const networkCtx = networkCanvas.getContext("2d");

// Road
let laneCount = 4;
carCanvas.width = laneCount * 66;
const road = new Road(carCanvas.width/2, carCanvas.width*0.9, laneCount);

// Traffic
let traffic = new Traffic(30, 50, 2, laneCount, 4);

// Sim stats
let simStats = new SimStats();
simStats.carsPassedPerGeneration.push(0);
document.getElementById("genCounter").innerText = "Gen: " + simStats.generation;

// Bar chart
let barChartCanvas = document.getElementById("barChartCanvas");
let barChartContext = barChartCanvas.getContext("2d");
barChartContext.canvas.width = 0;
let barChart = new BarChart({
    canvas: barChartCanvas,
    colors: ["#ffffff"],
    data: simStats,
    gridScale: 10,
    gridColor: "#ffffff"
});

// Generate cars
const N = 200;
let cars = generateCars(N);

// Algorithm initialization
algClasses = [LinearVariation];
alg = new algClasses[0](cars, traffic);

// Best car
let bestCar = cars[0];

// Brain initializations
const previousBestCar = bestCar;

animate();

function save() {
    alg.save();

    simStats.generation += 1;
    localStorage.setItem("simStats", JSON.stringify(simStats));
    window.location.reload();
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
        cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI", 4));
    }

    return cars;
}

function updateDisplayedStats()
{
    // Update displayed stats
    document.getElementById("bestCarTimer").innerText = 
    "Time since last pass: " + ((Date.now() - bestCar.lastTimePassedCar) / 1000).toFixed(2);
    document.getElementById("simulationTimer").innerText = 
        "Simulation duration: " + ((Date.now() - simStats.timeStarted) / 1000).toFixed(2);
    document.getElementById("mostCarsPassed").innerText = 
        "Most cars passed: " + simStats.mostCarsPassed;
    document.getElementById("carsAlive").innerText = 
        "Cars alive: " + cars.filter(c => !c.damaged).length;
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

    // Determine best car
    bestCar = alg.getBestCar();

    // Get rid of unnecessary AI cars
    cars = cars.filter(c => c.y <= bestCar.y || Math.abs(c.y - bestCar.y) < 250 || c.carsPassed == mostCarsPassed);

    // Resize canvases to be height of the screen
    carCanvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;

    // Focus "camera" above car
    carCtx.save();
    carCtx.translate(0, -bestCar.y + carCanvas.height * 0.8);

    // Draw objects
    road.draw(carCtx);
    for (let i = 0; i < traffic.cars.length; i++) {
        traffic.cars[i].draw(carCtx, "red");
    }

    // Make all other cars transparent
    carCtx.globalAlpha = 0.2;
    for (let i = 0; i < cars.length; i++) {
        if (cars[i] != previousBestCar && cars[i] != bestCar)
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
        bestCar.draw(carCtx, "blue", true);

        if (cars.includes(previousBestCar))
        {
            previousBestCar.draw(carCtx, "green");
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

    // Check if we should go on to next generation
    reloadIfDone();

    if (bestCar.carsPassed < traffic.length || bestCar.y > traffic.last.y - 10 * bestCar.height)
    {
        requestAnimationFrame(animate);
    }
}

function reloadIfDone() {
    let stuckInTraffic = Date.now() - bestCar.lastTimePassedCar > 5000 && bestCar.y > traffic.last.y; // best car is stuck in traffic for more than 5 seconds
    //let pastTraffic = bestCar.y + (10 * bestCar.height) < traffic.last.y; // best car has passed all traffic and survived for 10 more car lengths
    if (stuckInTraffic) {
        save();
    }
}