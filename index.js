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

	// Draw board
	let bh = h * BOARD_HEIGHT;
	let bw = bh / BOARD_ROWS * BOARD_COLUMNS;
	let bx = w / 2 - bw / 2;
	let by = context.lineWidth / 2;
	let bc = bh / BOARD_ROWS;

	context.fillStyle = "#111";
	context.fillRect(bx, by, bw, bh);

	context.strokeStyle = "#EEE";
	for (let i = 0; i <= BOARD_COLUMNS; i++) for (let j = 0; j < BOARD_ROWS; j++)
		context.strokeRect(bx + bw * i / BOARD_COLUMNS, by + bh * j / BOARD_ROWS, bc, bc);

	// Draw controls
	let cx = context.lineWidth / 2;
	let cy = by + bh + context.lineWidth / 2;
	let cw = w - context.lineWidth;
	let ch = h - cy - context.lineWidth;

	context.fillStyle = "#DDD";
	context.fillRect(cx, cy, cw, ch);

	for (let i = 0; i <= 5; i++) {
		context.moveTo(cw * i / 5, cy);
		context.lineTo(cw * i / 5, cy + ch);
		context.stroke();
	}

	context.moveTo(cw * 2 / 5, cy + ch / 2);
	context.lineTo(cw * 3 / 5, cy + ch / 2);
	context.stroke();

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
