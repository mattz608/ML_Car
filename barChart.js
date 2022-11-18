class BarChart {
    constructor(options) {
        this.options = options;
        this.canvas = options.canvas;
        this.ctx = this.canvas.getContext("2d");
        this.colors = options.colors;
        this.simStats = options.data;
        this.maxValue = Math.max(...this.simStats.carsPassedPerGeneration);
    }

    update(bestCar)
    {
        this.maxValue = Math.max(...this.simStats.carsPassedPerGeneration);
    }

    drawLine(ctx, startX, startY, endX, endY,color){
        ctx.save();
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(startX,startY);
        ctx.lineTo(endX,endY);
        ctx.stroke();
        ctx.restore();
    }

    drawGridLines() {
        var canvasHeight = this.canvas.height;
        var canvasWidth = this.canvas.width;

        for (let gridValue = 0; gridValue < this.maxValue; gridValue += this.options.gridScale)
        {
            var gridY = canvasHeight * (1 - gridValue / this.maxValue);
            this.drawLine(this.ctx, 0, gridY, canvasWidth, gridY, this.options.gridColor);

            this.ctx.save()
            this.ctx.fillStyle = this.options.gridColor;
            this.ctx.textBaseline = "bottom";
            this.ctx.font = "bold 20px Arial";
            this.ctx.fillText(gridValue, 0, gridY - 2);
            this.ctx.restore();
        }
    }

    drawBar(ctx, upperLeftCornerX, upperLeftCornerY, width, height,color){
        ctx.save();
        ctx.fillStyle=color;
        ctx.fillRect(upperLeftCornerX,upperLeftCornerY,width,height);
        ctx.restore();
    }

    drawBars() {
        var canvasHeight = this.canvas.height;
        var canvasWidth = this.canvas.width;

        var numBars = this.simStats.carsPassedPerGeneration.length;
        var barSize = canvasWidth / numBars;

        for (let i = 0; i < numBars; i++) {
            var barHeight = Math.round(canvasHeight * this.simStats.carsPassedPerGeneration[i] / this.maxValue);

            this.drawBar(
                this.ctx, 
                i * barSize,
                canvasHeight - barHeight,
                barSize,
                barHeight,
                getRGBA((this.simStats.carsPassedPerGeneration[i] - this.maxValue / 2) / ( this.maxValue / 2))
            );
        }
    }

    draw() {
        this.drawGridLines();
        this.drawBars();
    }
}