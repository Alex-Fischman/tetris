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
const PIECE_COLORS = ["#1EE", "#11E", "#EA1", "#EE1", "#1E1", "#E1E", "#E11"];

let context = document.getElementById("canvas").getContext("2d");
let stroke =         style  => { context.strokeStyle = style; context.stroke();          };
let fill   =         style  => { context.fillStyle   = style; context.fill();            };
let text = (s, x, y, style) => { context.fillStyle   = style; context.fillText(s, x, y); };

let rect = (x, y, w, h) => ({ x, y, w, h });
let fx = (rect, f) => rect.x + rect.w * f;
let fy = (rect, f) => rect.y + rect.h * f;
let rect_point = (rect, x, y) => x > rect.x && x < fx(rect, 1) && y > rect.y && y < fy(rect, 1);

let strokeRect = (rect, style) => {
	context.strokeStyle = style;
	context.strokeRect(rect.x, rect.y, rect.w, rect.h);
};
let fillRect   = (rect, style) => {
	context.fillStyle = style;
	context.fillRect(rect.x, rect.y, rect.w, rect.h);
};

let mod = (n, m) => ((n % m) + m) % m;

let pieces = [
	[[3, 0], [4, 0], [5, 0], [6, 0]],
	[[3, 0], [3, -1], [4, 0], [5, 0]],
	[[3, 0], [4, 0], [5, 0], [5, -1]],
	[[4, 0], [5, 0], [4, -1], [5, -1]],
	[[3, 0], [4, 0], [4, -1], [5, -1]],
	[[3, 0], [4, 0], [5, 0], [4, -1]],
	[[3, -1], [4, -1], [4, 0], [5, 0]],
];
let centers = [[4.5, 0.5], [4, 0], [4, 0], [4.5, -0.5], [4, 0], [4, 0], [4, 0]];

let active_piece = {
	x: 0,
	y: 4,
	r: 0,
	i: 0,
};

let get_active_cells = () => pieces[active_piece.i].map(([x, y]) => {
	let c = centers[active_piece.i];
	let theta = Math.PI / 2 * active_piece.r;
	let cos = Math.round(Math.cos(theta));
	let sin = Math.round(Math.sin(theta));
	return [
		(cos * (x - c[0]) - sin * (y - c[1])) + c[0] + active_piece.x,
		(sin * (x - c[0]) + cos * (y - c[1])) + c[1] + active_piece.y
	];
});

let is_active_colliding = () => {
	for (let [x, y] of get_active_cells()) {
		if (x < 0 || x >= BOARD_COLUMNS || y >= BOARD_ROWS) return true;
		if (static_board[y][x] != BOARD_COLOR) return true;
	}
	return false;
};

let static_board = [];
for (let i = 0; i < BOARD_ROWS; i++) {
	let row = [];
	for (let j = 0; j < BOARD_COLUMNS; j++) row.push(BOARD_COLOR);
	static_board.push(row);
}

let move_left = () => {
	active_piece.x -= 1;
	if (is_active_colliding()) active_piece.x += 1;
};
let move_right = () => {
	active_piece.x += 1;
	if (is_active_colliding()) active_piece.x -= 1;
};
let fast_drop = () => {
	while (!is_active_colliding()) active_piece.y += 1;
	active_piece.y -= 1;
};
let turn_left = () => {
	active_piece.r = mod(active_piece.r - 1, 4);
	if (is_active_colliding()) active_piece.r = mod(active_piece.r + 1, 4);
};
let turn_right = () => {
	active_piece.r = mod(active_piece.r + 1, 4);
	if (is_active_colliding()) active_piece.r = mod(active_piece.r - 1, 4);
};
let pause_game = () => { console.log("pause_game"); };

let button_rects = [undefined, undefined, undefined,  undefined, undefined,  undefined ];
let button_keys  = ["KeyA",    "KeyJ",    "Escape",   "Space",   "KeyL",     "KeyD"    ];
let button_funcs = [move_left, turn_left, pause_game, fast_drop, turn_right, move_right];

document.addEventListener("pointerdown", e => button_rects.map((r, i) => {
	if (rect_point(r, e.x, e.y)) button_funcs[i]();
}));
document.addEventListener("keydown", e => button_keys.map((k, i) => {
	if (e.code == k) button_funcs[i]();
}));

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

	let drawCell = (i, j, style) => {
		let cell = rect(
			fx(board, i / BOARD_COLUMNS),
			fy(board, j / BOARD_ROWS),
			board.w / BOARD_COLUMNS,
			board.h / BOARD_ROWS
		);
		fillRect(cell, style);
		strokeRect(cell, BACKGROUND_COLOR);
	};

	for (let i = 0; i < BOARD_COLUMNS; i++) for (let j = 0; j < BOARD_ROWS; j++)
		drawCell(i, j, static_board[j][i]);

	for (let [x, y] of get_active_cells()) drawCell(x, y, PIECE_COLORS[active_piece.i]);

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
			button_rects[0] = button;
		} else if (i == 4) {
			context.moveTo(fx(button, 1/4), fy(button, 1/2));
			context.lineTo(fx(button, 3/4), fy(button, 1/2));
			stroke(BOARD_COLOR);

			drawArrow(fx(button, 3/4), fy(button, 1/2), 0, BOARD_COLOR);
			button_rects[5] = button;
		} else if (i == 1) {
			let a = Math.PI * 3/4;
			let b = Math.PI * 5/4;
			let c = a + TURN_BUTTON_ARROW_ANGLE_OFFSET;

			context.beginPath();
			context.arc(fx(button, 1/2), fy(button, 1/2), r, a, b, true);
			stroke(BOARD_COLOR);

			drawArrow(
				fx(button, 1/2) + r * Math.cos(a),
				fy(button, 1/2) - r * Math.sin(a),
				c,
				BOARD_COLOR
			);
			button_rects[1] = button;
		} else if (i == 3) {
			let a = Math.PI * 1/4;
			let b = Math.PI * 7/4;
			let c = a - TURN_BUTTON_ARROW_ANGLE_OFFSET;

			context.beginPath();
			context.arc(fx(button, 1/2), fy(button, 1/2), r, a, b, false);
			stroke(BOARD_COLOR);

			drawArrow(
				fx(button, 1/2) + r * Math.cos(a),
				fy(button, 1/2) - r * Math.sin(a),
				c,
				BOARD_COLOR
			);
			button_rects[4] = button;
		} else if (i == 2) for (let j = 0; j < 2; j++) {
			let mini = rect(button.x, fy(button, j/2), button.w, button.h/2);
			strokeRect(mini, BACKGROUND_COLOR);

			if (j == 0) {
				context.moveTo(fx(mini, 1/3), fy(mini, 1/4));
				context.lineTo(fx(mini, 1/3), fy(mini, 3/4));
				context.moveTo(fx(mini, 2/3), fy(mini, 1/4));
				context.lineTo(fx(mini, 2/3), fy(mini, 3/4));
				stroke(BOARD_COLOR);

				button_rects[2] = mini;
			} else if (j == 1) {
				context.moveTo(fx(mini, 1/2), fy(mini, 1/4));
				context.lineTo(fx(mini, 1/2), fy(mini, 3/4));
				stroke(BOARD_COLOR);

				drawArrow(fx(mini, 1/2), fy(mini, 3/4), Math.PI/2, BOARD_COLOR);
				button_rects[3] = mini;
			}
		}
	}

	// Draw side panel
	text("Score: " + localStorage.getItem("Score"), fx(board, 1) + 10, board.y + 10, BOARD_COLOR);
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
