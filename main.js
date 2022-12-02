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
let carSpeed = 8;
let cars = generateCars(N, carSpeed);

// Algorithm initialization
algClasses = [LinearVariation, GeneticEvolution];
alg = new algClasses[1](cars, traffic, simStats);

// Best car
let bestCar = cars[0];
let worstCar = cars[1];
let lastBestCar = bestCar;
let lastTimeBestCarChanged = Date.now();
const previousBestCar = bestCar;

// Camera view
    // This is actually the amount of pixels the road should be moved from its starting point (hence why we save and restore the context every time)
let currentViewPoint = -bestCar.y + window.innerHeight * 0.5; 
let destinationViewPoint = currentViewPoint;
let translationSpeed = 0;
let maxTranslationSpeed = 16;
let translationAcceleration = 0.4;

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

function generateCars(N, carSpeed) {
    const cars = [];
    for (let i = 0; i < N; i++) {
        cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI", carSpeed));
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
    traffic.update(road.borders, bestCar, worstCar);
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

    // Determine worst car
    worstCar = alg.getWorstCar(cars);

    // Get rid of unnecessary AI cars. Those that are damaged and out of site, or those that haven't passed a car in 5 seconds
    cars = cars.filter(c => 
        c.damaged == false && Date.now() - c.lastTimePassedCar <= 5000 ||
        c.damaged == true && c.y <= nextBestCar.y + carCanvas.height * 0.5
    );

    // Resize canvases to be height of the screen
    carCanvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;

    // Focus "camera" above car
    carCtx.save();

    destinationViewPoint = -nextBestCar.y + carCanvas.height * 0.5;
    updateCurrentViewPoint();
    carCtx.translate(0, currentViewPoint);
    
    // Draw objects
    road.draw(carCtx);
    for (let i = 0; i < traffic.cars.length; i++) {
        // Draw only if the traffic would be seen in the window
        if (traffic.cars[i].y <= bestCar.y + carCanvas.height * 0.5 && traffic.cars[i].y >= bestCar.y - carCanvas.height * 0.5)
        {
            traffic.cars[i].draw(carCtx, "red");
        }
    }

    // Make all other cars transparent
    carCtx.globalAlpha = 0.2;
    for (let i = 0; i < cars.length; i++) {
        // Skip cars that wouldn't be visible in the window anyways
        if (cars[i].y >= bestCar.y + carCanvas.height)
        {
            continue;
        }

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

    // If elite mode, draw the car gold
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

    let allDead = cars.length == 0 || !cars.some(c => c.damaged == false);
    if (!allDead)
    {
        requestAnimationFrame(animate);
    }
    else
    {
        console.log("Reloading: " + Date.now());
        save();
    }
}

function updateCurrentViewPoint()
{
    if (Math.abs(destinationViewPoint - currentViewPoint) <= carSpeed * 1.5)
    {
        currentViewPoint = destinationViewPoint;
        translationSpeed = 0;
    }
    else if (destinationViewPoint < currentViewPoint)
    {
        currentViewPoint -= translationSpeed;
        if (destinationViewPoint < currentViewPoint - translationSpeed)
        {
            translationSpeed = Math.min(translationSpeed + translationAcceleration, maxTranslationSpeed);
        }
        else
        {
            translationSpeed = Math.max(translationSpeed - translationAcceleration, 0);
        }
    }
    else
    {
        currentViewPoint += translationSpeed;
        if (destinationViewPoint > currentViewPoint + translationSpeed * 20)
        {
            translationSpeed = Math.min(translationSpeed + translationAcceleration, maxTranslationSpeed);
        }
        else
        {
            translationSpeed = Math.max(translationSpeed - translationAcceleration, 0);
        }
    }
}