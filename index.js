const LOAD_TIME = 500;
const BOARD_HEIGHT = 0.7;
const BOARD_COLUMNS = 10;
const BOARD_ROWS = 20;

let context = document.getElementById("canvas").getContext("2d");

document.addEventListener("pointerdown", e => {
	window.alert(`(${e.x}, ${e.y})`);
});

let update = dt => {
	context.fillColor = `#FFFF${then.toLocaleString("en-US", {minimumIntegerDigits: 2, maximumIntegerDigits: 2})}`;
	context.fillRect(0, 0, 1, 1);
};

let render = () => {
	let {width: w, height: h} = context.canvas.getBoundingClientRect();
	context.canvas.width = w;
	context.canvas.height = h;
	context.fillStyle = "#EEE";
	context.fillRect(0, 0, w, h);

	context.lineWidth = 5;
	context.lineJoin = "round";
	context.lineCap = "round";

	let bh = h * BOARD_HEIGHT;
	let bw = bh / BOARD_ROWS * BOARD_COLUMNS;
	let bx = w / 2 - bw / 2;
	let by = context.lineWidth / 2;

	context.fillStyle = "#111";
	context.fillRect(bx, by, bw, bh);

	context.strokeStyle = "#EEE";
	for (let i = 0; i <= BOARD_COLUMNS; i++) {
		context.moveTo(bx + bw * i / BOARD_COLUMNS, by);
		context.lineTo(bx + bw * i / BOARD_COLUMNS, by + bh);
		context.stroke();
	}
	for (let i = 0; i <= BOARD_ROWS; i++) {
		context.moveTo(bx,      by + bh * i / BOARD_ROWS);
		context.lineTo(bx + bw, by + bh * i / BOARD_ROWS);
		context.stroke();
	}

	context.font = "bold 50px sans serif";
	context.textBaseline = "top";

	context.fillStyle = "#111";
	context.fillText("Score: " + localStorage.getItem("Score"), 10, h - 50 - 10);
};

let then = performance.now();
let load = performance.now();

let frame = now => {
	let dt = now - then;
	then = now;
	update(dt);

	render();

	if (now - load < LOAD_TIME) {
		context.fillStyle = `rgba(255, 255, 255, ${1 - (now - load) / LOAD_TIME})`;
		let {width: w, height: h} = context.canvas.getBoundingClientRect();
		context.fillRect(0, 0, w, h);
	}
	
	window.requestAnimationFrame(frame);
};

window.requestAnimationFrame(frame);
