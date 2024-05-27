let context = document.getElementById("canvas").getContext("2d");

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
const BOARD_COLOR = "#111";
const LINE_COLOR = "#FFF1";

let active_piece = { x: 0, y: 0, r: 0, i: 0 };
let bag = [];

let next_piece = () => {
	if (bag.length == 0) bag = [...Array(7).keys()]
		.map(value => ({ value, sort: Math.random() }))
		.sort((a, b) => a.sort - b.sort)
		.map(({ value }) => value);

	active_piece = { x: 0, y: 0, r: 0, i: bag.pop() };
};
next_piece();

let empty_row = () => Array(10).fill(BOARD_COLOR);
let stack = Array(20).fill(0).map(empty_row);

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
		if (x < 0 || x >= 10 || y >= 20)          return true;
		if (y >= 0 && stack[y][x] != BOARD_COLOR) return true;
	}
	return false;
};

let lines = 0;
let last_drop_time = performance.now();
let row_time = () => Math.pow((0.8 - ((lines / 10) * 0.007)), (lines / 10)) * 1000;

let piece_has_landed = () => {
	for (let [x, y] of get_active_cells()) {
		if (y < 0) window.location.reload();
		else       stack[y][x] = PIECE_COLORS[active_piece.i];
	}

	next_piece();
	last_drop_time = performance.now();

	for (let i = 0; i < 20; i++) if (stack[i].every(x => x != BOARD_COLOR)) {
		lines++;

		for (let j = i; j > 0; j--) stack[j] = stack[j - 1];
		stack[0] = empty_row();
	}
};

let move_left = () => {
	active_piece.x -= 1;
	if (is_active_colliding()) active_piece.x += 1;
};
let move_right = () => {
	active_piece.x += 1;
	if (is_active_colliding()) active_piece.x -= 1;
};
let hard_drop = () => {
	while (!is_active_colliding()) active_piece.y += 1;
	active_piece.y -= 1;

	piece_has_landed();
};
let turn_right = () => {
	// Correct for negative numbers
	let mod = (n, m) => ((n % m) + m) % m;

	active_piece.r = mod(active_piece.r + 1, 4);
	if (!is_active_colliding()) return;

	active_piece.x += 1;
	if (!is_active_colliding()) return;
	active_piece.x -= 1;

	active_piece.x -= 1;
	if (!is_active_colliding()) return;
	active_piece.x += 1;

	active_piece.y += 1;
	if (!is_active_colliding()) return;
	active_piece.y -= 1;

	active_piece.y -= 1;
	if (!is_active_colliding()) return;
	active_piece.y += 1;

	active_piece.r = mod(active_piece.r - 1, 4);
};

let button_rects = [undefined, undefined, undefined,  undefined ];
let button_keys  = ["Space",   "KeyA",    "KeyW",     "KeyD"    ];
let button_funcs = [hard_drop, move_left, turn_right, move_right];

document.addEventListener("pointerdown", e => button_rects.map((r, i) => {
	if ((r.x < e.x && e.x < r.x + r.w) && (r.y < e.y && e.y < r.y + r.h)) button_funcs[i]();
}));
document.addEventListener("keydown", e => button_keys.map((k, i) => {
	if (e.code == k) button_funcs[i]();
}));

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

let render = () => {
	let {width: w, height: h} = context.canvas.getBoundingClientRect();
	context.canvas.width = w;
	context.canvas.height = h;

	context.fillStyle = BOARD_COLOR;
	context.fillRect(0, 0, w, h);

	let bw = h / 2;
	let bh = h;
	let bx = w / 2 - bw / 2;

	let drawCell = (i, j, style) => {
		context.fillStyle = style;
		context.fillRect(bx + bw * i / 10, bh * j / 20, bw / 10 + 1, bh / 20 + 1);
	};

	for (let i = 0; i < 10; i++) for (let j = 0; j < 20; j++) drawCell(i, j, stack[j][i]);

	let saved_y = active_piece.y;
	while (!is_active_colliding()) active_piece.y += 1;
	active_piece.y -= 1;
	let ghost_cells = get_active_cells();
	active_piece.y = saved_y;

	for (let [x, y] of ghost_cells)        drawCell(x, y, GHOST_COLORS[active_piece.i]);
	for (let [x, y] of get_active_cells()) drawCell(x, y, PIECE_COLORS[active_piece.i]);

	button_rects[0] = { x: 0,       y: 0,     w: w,     h: h / 2 };
	button_rects[1] = { x: w * 0/3, y: h / 2, w: w / 3, h: h / 2 };
	button_rects[2] = { x: w * 1/3, y: h / 2, w: w / 3, h: h / 2 };
	button_rects[3] = { x: w * 2/3, y: h / 2, w: w / 3, h: h / 2 };

	context.moveTo(0, h / 2);
	context.lineTo(w, h / 2);
	context.strokeStyle = LINE_COLOR;
	context.lineWidth = 5;
	context.stroke();
};

let then = performance.now();
let frame = now => {
	let dt = now - then;
	then = now;

	update(dt);
	render();

	window.requestAnimationFrame(frame);
};

window.requestAnimationFrame(frame);
