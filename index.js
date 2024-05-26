const LOAD_TIME = 500;
const BOARD_HEIGHT = 0.7;
const BOARD_COLUMNS = 10;
const BOARD_ROWS = 20;

const ARROWHEAD_SIZE = 0.6;
const ARROWHEAD_ANGLE = 60;
const TURN_BUTTON_ARROW_ANGLE_OFFSET = 0.3;
const SLOW_DROP_BUTTON_OFFSET = -0.4;
const FAST_DROP_BUTTON_OFFSET = 0.3;

const BOARD_COLOR = "#111";
const BACKGROUND_COLOR = "#EEE";
const BUTTON_COLOR = "#DDD";

let context = document.getElementById("canvas").getContext("2d");
let stroke =         style  => { context.strokeStyle = style; context.stroke();          };
let fill   =         style  => { context.fillStyle   = style; context.fill();            };
let text = (s, x, y, style) => { context.fillStyle   = style; context.fillText(s, x, y); };

let rect = (x, y, w, h) => ({ x, y, w, h });
let fx = (rect, f) => rect.x + rect.w * f;
let fy = (rect, f) => rect.y + rect.h * f;

let strokeRect = (rect, style) => {
	context.strokeStyle = style;
	context.strokeRect(rect.x, rect.y, rect.w, rect.h);
};
let fillRect   = (rect, style) => {
	context.fillStyle = style;
	context.fillRect(rect.x, rect.y, rect.w, rect.h);
};

document.addEventListener("pointerdown", e => {
	window.alert(`(${e.x}, ${e.y})`);
});

let update = dt => {};

let render = () => {
	let {width: w, height: h} = context.canvas.getBoundingClientRect();
	context.canvas.width = w;
	context.canvas.height = h;
	fillRect(rect(0, 0, w, h), BACKGROUND_COLOR);
	
	context.lineWidth = 10;
	context.lineJoin = "round";
	context.lineCap = "round";

	context.font = "bold 50px sans serif";
	context.textBaseline = "top";

	// Draw board
	let board;
	{
		let bx = context.lineWidth / 2;
		let by = context.lineWidth / 2;
		let bh = h * BOARD_HEIGHT;
		let bw = bh / BOARD_ROWS * BOARD_COLUMNS;
		board = rect(bx, by, bw, bh);
	}

	fillRect(board, BOARD_COLOR);

	for (let i = 0; i < BOARD_COLUMNS; i++) for (let j = 0; j < BOARD_ROWS; j++) {
		let cell = rect(
			fx(board, i / BOARD_COLUMNS),
			fy(board, j / BOARD_ROWS),
			board.w / BOARD_COLUMNS,
			board.h / BOARD_ROWS
		);
		strokeRect(cell, BACKGROUND_COLOR);
	}

	// Draw controls
	let controls = rect(
		context.lineWidth / 2,
		fy(board, 1),
		w - context.lineWidth,
		h - fy(board, 1) - context.lineWidth / 2,
	);

	fillRect(controls, BUTTON_COLOR);

	for (let i = 0; i < 5; i++) {
		let button = rect(
			fx(controls, i / 5),
			controls.y,
			controls.w / 5,
			controls.h
		);
		let r = button.w / 4;

		strokeRect(button, BACKGROUND_COLOR);

		let drawArrow = (x, y, angle, style) => {
			context.beginPath();
			context.moveTo(x, y);
			context.lineTo(
				x + ARROWHEAD_SIZE * r * Math.cos(angle + ARROWHEAD_ANGLE),
				y + ARROWHEAD_SIZE * r * Math.sin(angle + ARROWHEAD_ANGLE)
			);
			context.lineTo(
				x + ARROWHEAD_SIZE * r * Math.cos(angle - ARROWHEAD_ANGLE),
				y + ARROWHEAD_SIZE * r * Math.sin(angle - ARROWHEAD_ANGLE)
			);
			context.closePath();
			stroke(style);
			fill(style);
		};

		if (i == 0) {
			context.moveTo(fx(button, 3/4), fy(button, 1/2));
			context.lineTo(fx(button, 1/4), fy(button, 1/2));
			stroke(BOARD_COLOR);

			drawArrow(fx(button, 1/4), fy(button, 1/2), Math.PI, BOARD_COLOR);
		} else if (i == 1) {
			let a = Math.PI * 3/4;
			let b = Math.PI * 5/4;
			let c = a + TURN_BUTTON_ARROW_ANGLE_OFFSET;

			context.beginPath();
			context.arc(fx(button, 1/2), fy(button, 1/2), r, a, b, true);
			stroke(BOARD_COLOR);

			drawArrow(fx(button, 1/2) + r * Math.cos(a), fy(button, 1/2) - r * Math.sin(a), c, BOARD_COLOR);
		} else if (i == 2) for (let j = 0; j < 2; j++) {
			let mini = rect(button.x, fy(button, j/2), button.w, button.h/2);
			strokeRect(mini, BACKGROUND_COLOR);

			if (j == 0) {
				context.moveTo(fx(mini, 1/3), fy(mini, 1/4));
				context.lineTo(fx(mini, 1/3), fy(mini, 3/4));
				context.moveTo(fx(mini, 2/3), fy(mini, 1/4));
				context.lineTo(fx(mini, 2/3), fy(mini, 3/4));
				stroke(BOARD_COLOR);
			} else if (j == 1) {

				context.moveTo(fx(mini, 1/2), fy(mini, 1/4));
				context.lineTo(fx(mini, 1/2), fy(mini, 3/4));
				stroke(BOARD_COLOR);

				drawArrow(fx(mini, 1/2), fy(mini, 3/4), Math.PI/2, BOARD_COLOR);
			}
		} else if (i == 3) {
			let a = Math.PI * 1/4;
			let b = Math.PI * 7/4;
			let c = a - TURN_BUTTON_ARROW_ANGLE_OFFSET;

			context.beginPath();
			context.arc(fx(button, 1/2), fy(button, 1/2), r, a, b, false);
			stroke(BOARD_COLOR);

			drawArrow(fx(button, 1/2) + r * Math.cos(a), fy(button, 1/2) - r * Math.sin(a), c, BOARD_COLOR);
		} else if (i == 4) {
			context.moveTo(fx(button, 1/4), fy(button, 1/2));
			context.lineTo(fx(button, 3/4), fy(button, 1/2));
			stroke(BOARD_COLOR);

			drawArrow(fx(button, 3/4), fy(button, 1/2), 0, BOARD_COLOR);
		}
	}

	// Draw side panel
	text("Score: " + localStorage.getItem("Score"), fx(board, 1) + 10, fy(board, 0) + 10, BOARD_COLOR);
};

let then = performance.now();
let load = performance.now();

let frame = now => {
	let dt = now - then;
	then = now;
	update(dt);

	render();

	if (now - load < LOAD_TIME) {
		let {width: w, height: h} = context.canvas.getBoundingClientRect();
		fillRect(0, 0, w, h, `rgba(255, 255, 255, ${1 - (now - load) / LOAD_TIME})`);
	}
	
	window.requestAnimationFrame(frame);
};

window.requestAnimationFrame(frame);
