const canvas = document.getElementById("myCanvas");
canvas.width = 200;

const ctx = canvas.getContext("2d");
const road = new Road(canvas.width/2, canvas.width*0.9)
const car = new Car(road.getLaneCenter(1), 100, 30, 50);
road.draw(ctx);
car.draw(ctx);

animate();

function animate() {
    car.update(road.borders);

    canvas.height = window.innerHeight;

    // Focus "camera" above car
    ctx.save();
    ctx.translate(0, -car.y + canvas.height * 0.8);

    road.draw(ctx);
    car.draw(ctx);

    ctx.restore();
    requestAnimationFrame(animate);
}