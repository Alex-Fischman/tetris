/// Constants
const LOAD_TIME = 500;
const BUTTON_HEIGHT_SPLIT = 2/3;

const BOARD_COLOR = "#111";
const GRID_COLOR = "#EEE";
const BUTTON_COLOR = "#DDD";

/// "Tetris" constants
const BOARD_COLUMNS = 10;
const BOARD_ROWS = 20;

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

let colors = (a, b, c) => [
	`#${a}${c}${c}`, `#${a}${a}${c}`, `#${c}${b}${a}`, `#${c}${c}${a}`,
	`#${a}${c}${a}`, `#${c}${a}${c}`, `#${c}${a}${a}`,
];
const PIECE_COLORS = colors("1", "A", "E");
const GHOST_COLORS = colors("A", "C", "E");

/// Utility
let PI = Math.PI;
// Correct for negative numbers
let mod = (n, m) => ((n % m) + m) % m;

/// Drawing
let context = document.getElementById("canvas").getContext("2d");
let stroke =         style  => { context.strokeStyle = style; context.stroke();          };
let fill   =         style  => { context.fillStyle   = style; context.fill();            };
let text = (s, x, y, style) => { context.fillStyle   = style; context.fillText(s, x, y); };

/// Rect struct
let rect = (x, y, w, h) => ({ x, y, w, h });
let fx = (r, f) => r.x + r.w * f;
let fy = (r, f) => r.y + r.h * f;
let rect_point = (r, x, y) => x > r.x && x < fx(r, 1) && y > r.y && y < fy(r, 1);
let scale = (r, s) => rect(fx(r, (1 - s) / 2), fy(r, (1 - s) / 2), r.w * s, r.h * s);

let strokeRect = (r, style) => {
	context.strokeStyle = style;
	context.strokeRect(r.x, r.y, r.w, r.h);
};
let fillRect   = (r, style) => {
	context.fillStyle = style;
	context.fillRect(r.x, r.y, r.w, r.h);
};

/// Game state
let active_piece = {
	x: 0,
	y: 4,
	r: 0,
	i: 0,
};

let static_board = [];
for (let i = 0; i < BOARD_ROWS; i++) {
	let row = [];
	for (let j = 0; j < BOARD_COLUMNS; j++) row.push(BOARD_COLOR);
	static_board.push(row);
}

let level = 1;
let score = 0;
let last_drop_time = performance.now();

/// Utility functions
let get_active_cells = () => pieces[active_piece.i].map(([x, y]) => {
	let c = centers[active_piece.i];
	let theta = PI / 2 * active_piece.r;
	let cos = Math.round(Math.cos(theta));
	let sin = Math.round(Math.sin(theta));
	return [
		(cos * (x - c[0]) - sin * (y - c[1])) + c[0] + active_piece.x,
		(sin * (x - c[0]) + cos * (y - c[1])) + c[1] + active_piece.y
	];
});

let get_ghost_cells = () => {
	let saved_y = active_piece.y;
	fast_drop();
	let saved_cells = get_active_cells();
	active_piece.y = saved_y;
	return saved_cells;
};

let is_active_colliding = () => {
	for (let [x, y] of get_active_cells()) {
		if (x < 0 || x >= BOARD_COLUMNS || y >= BOARD_ROWS) return true;
		if (y < 0) continue; // some pieces start above the board
		if (static_board[y][x] != BOARD_COLOR) return true;
	}
	return false;
};

let row_time = () => Math.pow((0.8 - ((level - 1) * 0.007)), (level - 1)) * 1000;;

let try_kicks = () => {
	if (!is_active_colliding()) return true;

	active_piece.x += 1;
	if (!is_active_colliding()) return true;
	active_piece.x -= 1;

	active_piece.x -= 1;
	if (!is_active_colliding()) return true;
	active_piece.x += 1;

	active_piece.y += 1;
	if (!is_active_colliding()) return true;
	active_piece.y -= 1;

	active_piece.y -= 1;
	if (!is_active_colliding()) return true;
	active_piece.y += 1;

	return false;
};

let fast_drop = () => {
	while (!is_active_colliding()) active_piece.y += 1;
	active_piece.y -= 1;
};

let piece_has_landed = () => {
	for (let [x, y] of get_active_cells()) static_board[y][x] = PIECE_COLORS[active_piece.i];

	active_piece.i = mod(active_piece.i + 1, 7);
	active_piece.x = 0;
	active_piece.y = 0;
	active_piece.r = 0;

	last_drop_time = performance.now();

	// TODO: check for line clears
	// TODO: score -> level
};

/// Controls
let move_left = () => {
	active_piece.x -= 1;
	if (is_active_colliding()) active_piece.x += 1;
};
let move_right = () => {
	active_piece.x += 1;
	if (is_active_colliding()) active_piece.x -= 1;
};
let hard_drop = () => {
	fast_drop();
	piece_has_landed();
};
let turn_left = () => {
	active_piece.r = mod(active_piece.r - 1, 4);
	if (!try_kicks()) active_piece.r = mod(active_piece.r + 1, 4);
};
let turn_right = () => {
	active_piece.r = mod(active_piece.r + 1, 4);
	if (!try_kicks()) active_piece.r = mod(active_piece.r - 1, 4);
};
let pause_game = () => { console.log("pause_game"); };

/// Input handlers
let button_rects = [undefined, undefined,  undefined , undefined, undefined, undefined ];
let button_keys  = ["KeyA",    "Escape",   "KeyD"    , "KeyJ",    "Space",   "KeyL"    ];
let button_funcs = [move_left, pause_game, move_right, turn_left, hard_drop, turn_right];

document.addEventListener("pointerdown", e => button_rects.map((r, i) => {
	if (rect_point(r, e.x, e.y)) button_funcs[i]();
}));
document.addEventListener("keydown", e => button_keys.map((k, i) => {
	if (e.code == k) button_funcs[i]();
}));

/// Update
let update = dt => {
	let now = performance.now();

	if (now - last_drop_time > row_time()) {
		active_piece.y += 1;

		if (is_active_colliding()) {
			active_piece.y -= 1;
			piece_has_landed();
		}

		last_drop_time = now;
	}
};

/// Render
let render = () => {
	let {width: w, height: h} = context.canvas.getBoundingClientRect();
	context.canvas.width = w;
	context.canvas.height = h;
	fillRect(rect(0, 0, w, h), BOARD_COLOR);
	
	context.lineWidth = 10;
	context.lineJoin = "round";
	context.lineCap = "round";

	context.font = "bold 50px sans serif";
	context.textBaseline = "top";

	// Board
	let bh = h - context.lineWidth;
	let bw = bh / BOARD_ROWS * BOARD_COLUMNS;
	let board = rect(w / 2 - bw / 2, context.lineWidth / 2, bw, bh);

	let drawCell = (i, j, style) => {
		let cell = rect(
			fx(board, i / BOARD_COLUMNS),
			fy(board, j / BOARD_ROWS),
			board.w / BOARD_COLUMNS,
			board.h / BOARD_ROWS
		);
		fillRect(cell, style);
		strokeRect(cell, GRID_COLOR);
	};

	for (let i = 0; i < BOARD_COLUMNS; i++) for (let j = 0; j < BOARD_ROWS; j++)
		drawCell(i, j, static_board[j][i]);

	for (let [x, y] of get_ghost_cells())  drawCell(x, y, GHOST_COLORS[active_piece.i]);
	for (let [x, y] of get_active_cells()) drawCell(x, y, PIECE_COLORS[active_piece.i]);

	// Buttons
	for (let i = 0; i < 6; i++) {
		let x = i % 3;
		let y = Math.floor(i / 3);
		let button = rect(
			w * x / 3,
			h * (y == 0 ? 0 : BUTTON_HEIGHT_SPLIT),
			w / 3,
			h * (y == 0 ? BUTTON_HEIGHT_SPLIT : 1 - BUTTON_HEIGHT_SPLIT),
		);
		let r = button.w / 4;
		button_rects[i] = button;
	}
};

/// Timing
let then = performance.now();
let frame = now => {
	let dt = now - then;
	then = now;

	update(dt);
	render();

	window.requestAnimationFrame(frame);
};

window.requestAnimationFrame(frame);
