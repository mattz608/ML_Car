const carCanvas = document.getElementById("carCanvas");
const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

let laneCount = 4;
carCanvas.width = laneCount * 66;

const road = new Road(carCanvas.width/2, carCanvas.width*0.9, laneCount);

const N = 1000;
let cars = generateCars(N);

let bestCar = cars[0];
if (localStorage.getItem("bestBrain")) {
    for (let i = 0; i < cars.length; i++) {
        cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));;
        if (i != 0) {
            NeuralNetwork.mutateLinear(cars[i].brain, 0.2);
        }
    }
}

const incrementalTrafficGenerationRowCount = 4;
let traffic = generateTraffic(incrementalTrafficGenerationRowCount);
let lastTraffic = traffic.find(t => t.y == Math.min(...traffic.map(t2 => t2.y)));
let trafficDeleted = 0;

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

function generateCars(N) {
    const cars = [];
    for (let i = 0; i < N; i++) {
        cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI", 4));
    }

    return cars;
}

function generateTraffic(N, start=-100)
{
    const traffic = [];
    let currentY = start;
    
    for (let i = 0; i < N; i++) {
        let availableLanes = Array.from(Array(laneCount).keys());
        let numCars = Math.floor(Math.random() * (laneCount - 1) + 1);
        for (let j = 0; j < numCars; j++) {
            traffic.push(
                new Car(
                    road.getLaneCenter(
                        availableLanes.splice(Math.floor(Math.random() * availableLanes.length), 1)[0]
                    ),
                    currentY,
                    30,
                    50,
                    "DUMMY",
                    2
                )
            )
        }

        currentY -= Math.floor(200 + Math.random() * 100);
        
    }

    return traffic;
}

function animate(time) {
    // Update objects
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].update(road.borders,[]);
    }
    
    for (let i = 0; i < cars.length; i++) {
        cars[i].update(road.borders, traffic, trafficDeleted);
    }
    
    simStats.update(bestCar);

    barChart.update();

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
    if (Date.now() - bestCar.lastTimePassedCar > 6000)
    {
        debugger;
    }
    
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
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].draw(carCtx, "red");
    }

    // Make all other cars transparent
    carCtx.globalAlpha = 0.2;
    for (let i = 0; i < cars.length; i++) {
        cars[i].draw(carCtx, "blue");
    }

    // Make best car not transparent and has sensors
    carCtx.globalAlpha = 1;
    bestCar.draw(carCtx, "blue", true);

    if (drawBarChartEnabled) {
        barChart.draw();
    }
    
    carCtx.restore();

    // Manage traffic generation and clean-up
    if (Math.abs(bestCar.y - lastTraffic.y) < 500) {
        trafficDeleted += traffic.length;
        traffic = traffic.filter(t => t.y < bestCar.y || Math.abs(t.y - bestCar.y) < 500);
        trafficDeleted -= traffic.length; // Super ugly way of keeping track of this... but oh well

        traffic.push(...generateTraffic(incrementalTrafficGenerationRowCount, lastTraffic.y - 200));
        lastTraffic = traffic.find(t => t.y == Math.min(...traffic.map(t2 => t2.y)));
    }

    networkCtx.lineDashOffset=time/50;
    Visualizer.drawNetwork(networkCtx, bestCar.brain);

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