const carCanvas = document.getElementById("carCanvas");
const carCtx = carCanvas.getContext("2d");

const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 0;
const networkCtx = networkCanvas.getContext("2d");
let networkVisualizerEnabled = false;

let laneCount = 4;
carCanvas.width = laneCount * 66;
const road = new Road(carCanvas.width/2, carCanvas.width*0.9, laneCount);

const N = 1000;
let cars = generateCars(N);

// Best car and brain initialization
let bestCar = cars[0];
const previousBestCar = bestCar;
if (localStorage.getItem("bestBrain")) {
    for (let i = 0; i < cars.length; i++) {
        cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));;
        if (i != 0) {
            NeuralNetwork.mutateLinear(cars[i].brain, 0.1);
        }
    }
}

// Traffic
let traffic = new Traffic(30, 50, 2, laneCount, 4);

let simStats = new SimStats();
simStats.carsPassedPerGeneration.push(0);

document.getElementById("genCounter").innerText = "Gen: " + simStats.generation;

// Bar chart
let barChartCanvas = document.getElementById("barChartCanvas");
let barChartContext = barChartCanvas.getContext("2d");
let drawBarChartEnabled = false;
barChartContext.canvas.width = 0;
let barChart = new BarChart({
    canvas: barChartCanvas,
    colors: ["#ffffff"],
    data: simStats,
    gridScale: 10,
    gridColor: "#ffffff"
});

animate();

function save() {
    localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));

    simStats.generation += 1;
    localStorage.setItem("simStats", JSON.stringify(simStats));
    window.location.reload();
}

function discard() {
    localStorage.removeItem("bestBrain");
    localStorage.removeItem("simStats");
    window.location.reload();
}

function drawBarChart() {
    drawBarChartEnabled = drawBarChartEnabled == false;
    barChartContext.canvas.width = drawBarChartEnabled ? 600 : 0;
    barChartContext.canvas.height = drawBarChartEnabled ? 600 : 0;
}

function drawNetworkVisualizer()
{
    networkVisualizerEnabled = networkVisualizerEnabled == false;
    networkCanvas.width = networkVisualizerEnabled ? 400 : 0;
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
    let mostCarsPassed = Math.max(...cars.map(c => c.carsPassed));
    let candidateCars = cars.filter(c => c.carsPassed == mostCarsPassed);
    newBestCar = candidateCars.find(c => c.y == Math.min(...candidateCars.map(c2 => c2.y)));
    bestCar = newBestCar;

    // Get rid of unnecessary cars
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

    if (drawBarChartEnabled) {
        barChart.draw();
    }
    
    carCtx.restore();

    if (networkVisualizerEnabled)
    {
        networkCtx.lineDashOffset=time/50;
        Visualizer.drawNetwork(networkCtx, bestCar.brain);
    }

    // Check if we should go on to next generation
    reloadIfDone();

    if (bestCar.carsPassed < traffic.length || bestCar.y > lastTraffic.y - 10 * bestCar.height)
    {
        requestAnimationFrame(animate);
    }
}

function reloadIfDone() {
    let stuckInTraffic = Date.now() - bestCar.lastTimePassedCar > 5000 && bestCar.y > lastTraffic.y; // best car is stuck in traffic for more than 5 seconds
    //let pastTraffic = bestCar.y + (10 * bestCar.height) < lastTraffic.y; // best car has passed all traffic and survived for 10 more car lengths
    if (stuckInTraffic) {
        save();
    }
}