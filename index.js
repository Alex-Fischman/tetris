/// Constants
const LOAD_TIME = 500;
const BOARD_HEIGHT = 0.7;
const BOARD_COLUMNS = 10;
const BOARD_ROWS = 20;

const ARROWHEAD_SIZE = 0.6;
const ARROWHEAD_ANGLE = 60;
const TURN_BUTTON_ARROW_ANGLE_OFFSET = 0.3;
const SLOW_DROP_BUTTON_OFFSET = -0.4;
const FAST_DROP_BUTTON_OFFSET = 0.3;

const GLYPH_WIDTH = 1/7;
const GLYPH_HEIGHT = 2;
const GLYPH_KERNING = 1.3;
const GLYPH_PADDING = 0.8;

const BOARD_COLOR = "#111";
const BACKGROUND_COLOR = "#EEE";
const BUTTON_COLOR = "#DDD";
const PIECE_COLORS = ["#1EE", "#11E", "#EA1", "#EE1", "#1E1", "#E1E", "#E11"];

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

/// Piece shapes
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

let load = performance.now();

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

let is_active_colliding = () => {
	for (let [x, y] of get_active_cells()) {
		if (x < 0 || x >= BOARD_COLUMNS || y >= BOARD_ROWS) return true;
		if (static_board[y][x] != BOARD_COLOR) return true;
	}
	return false;
};

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

/// Controls
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
	if (!try_kicks()) active_piece.r = mod(active_piece.r + 1, 4);
};
let turn_right = () => {
	active_piece.r = mod(active_piece.r + 1, 4);
	if (!try_kicks()) active_piece.r = mod(active_piece.r - 1, 4);
};
let pause_game = () => { console.log("pause_game"); };

/// Input handlers
let button_rects = [undefined, undefined, undefined,  undefined, undefined,  undefined ];
let button_keys  = ["KeyA",    "KeyJ",    "Escape",   "Space",   "KeyL",     "KeyD"    ];
let button_funcs = [move_left, turn_left, pause_game, fast_drop, turn_right, move_right];

document.addEventListener("pointerdown", e => button_rects.map((r, i) => {
	if (rect_point(r, e.x, e.y)) button_funcs[i]();
}));
document.addEventListener("keydown", e => button_keys.map((k, i) => {
	if (e.code == k) button_funcs[i]();
}));

/// Update
let update = dt => {};

/// Render
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

	// Board
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

	// Buttons
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

			drawArrow(fx(button, 1/4), fy(button, 1/2), PI, BOARD_COLOR);
			button_rects[0] = button;
		} else if (i == 4) {
			context.moveTo(fx(button, 1/4), fy(button, 1/2));
			context.lineTo(fx(button, 3/4), fy(button, 1/2));
			stroke(BOARD_COLOR);

			drawArrow(fx(button, 3/4), fy(button, 1/2), 0, BOARD_COLOR);
			button_rects[5] = button;
		} else if (i == 1) {
			let a = PI * 3/4;
			let b = PI * 5/4;
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
			let a = PI * 1/4;
			let b = PI * 7/4;
			let c = a - TURN_BUTTON_ARROW_ANGLE_OFFSET;

			context.beginPath();
			context.arc(fx(button, 1/2), fy(button, 1/2), r, a, b);
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

				drawArrow(fx(mini, 1/2), fy(mini, 3/4), PI/2, BOARD_COLOR);
				button_rects[3] = mini;
			}
		}
	}

	// Side panel
	let panel = rect(fx(board, 1) + context.lineWidth / 2, board.y, w - fx(board, 1), fy(board, 1));
	let glyphWidth = panel.w * GLYPH_WIDTH;
	let glyphHeight = glyphWidth * GLYPH_HEIGHT;
	
	let drawLetterS = (x, y, style) => {
		let glyph = scale(rect(x, y, glyphWidth, glyphHeight), GLYPH_PADDING);
		context.beginPath();
		context.arc(   fx(glyph, 1/2), fy(glyph, 1/4), glyph.w / 2, 0, PI * 1/2, true);
		context.arc(   fx(glyph, 1/2), fy(glyph, 3/4), glyph.w / 2, PI * 3/2, PI);
		stroke(style);
	};
	let drawLetterC = (x, y, style) => {
		let glyph = scale(rect(x, y, glyphWidth, glyphHeight), GLYPH_PADDING);
		context.beginPath();
		context.arc(   fx(glyph, 1/2), fy(glyph, 1/4), glyph.w / 2, 0, PI, true);
		context.lineTo(glyph.x,        fy(glyph, 3/4));
		context.arc(   fx(glyph, 1/2), fy(glyph, 3/4), glyph.w / 2, PI, 0, true);
		stroke(style);
	};
	let drawLetterO = (x, y, style) => {
		let glyph = scale(rect(x, y, glyphWidth, glyphHeight), GLYPH_PADDING);
		context.beginPath();
		context.arc(   fx(glyph, 1/2), fy(glyph, 1/4), glyph.w / 2, 0, PI, true);
		context.lineTo(glyph.x,        fy(glyph, 3/4));
		context.arc(   fx(glyph, 1/2), fy(glyph, 3/4), glyph.w / 2, PI, 0, true);
		context.lineTo(fx(glyph, 1),   fy(glyph, 1/4));
		stroke(style);
	};
	let drawLetterR = (x, y, style) => {
		let glyph = scale(rect(x, y, glyphWidth, glyphHeight), GLYPH_PADDING);
		context.beginPath();
		context.moveTo(fx(glyph, 0),   fy(glyph, 1));
		context.lineTo(fx(glyph, 0),   fy(glyph, 0));
		context.lineTo(fx(glyph, 1/2), fy(glyph, 0));
		context.arc(   fx(glyph, 2/3), fy(glyph, 1/4), glyph.w / 2, PI * 3/2, PI / 2);
		context.lineTo(fx(glyph, 0),   fy(glyph, 1/2));
		context.lineTo(fx(glyph, 1/2), fy(glyph, 1/2));
		context.lineTo(fx(glyph, 1),   fy(glyph, 1));
		stroke(style);
	};
	let drawLetterE = (x, y, style) => {
		let glyph = scale(rect(x, y, glyphWidth, glyphHeight), GLYPH_PADDING);
		context.beginPath();
		context.moveTo(fx(glyph, 1),   fy(glyph, 0));
		context.lineTo(fx(glyph, 0),   fy(glyph, 0));
		context.lineTo(fx(glyph, 0),   fy(glyph, 1/2));
		context.lineTo(fx(glyph, 1/2), fy(glyph, 1/2));
		context.lineTo(fx(glyph, 0),   fy(glyph, 1/2));
		context.lineTo(fx(glyph, 0),   fy(glyph, 1));
		context.lineTo(fx(glyph, 1),   fy(glyph, 1));
		stroke(style);
	};
	let drawLetterL = (x, y, style) => {
		let glyph = scale(rect(x, y, glyphWidth, glyphHeight), GLYPH_PADDING);
		context.beginPath();
		context.moveTo(fx(glyph, 0),   fy(glyph, 0));
		context.lineTo(fx(glyph, 0),   fy(glyph, 1));
		context.lineTo(fx(glyph, 1),   fy(glyph, 1));
		stroke(style);
	};
	let drawLetterV = (x, y, style) => {
		let glyph = scale(rect(x, y, glyphWidth, glyphHeight), GLYPH_PADDING);
		context.beginPath();
		context.moveTo(fx(glyph, 0),   fy(glyph, 0));
		context.lineTo(fx(glyph, 1/2), fy(glyph, 1));
		context.lineTo(fx(glyph, 1),   fy(glyph, 0));
		stroke(style);
	};
	let drawNumber0 = (x, y, style) => {
		drawLetterO(x, y, style);
		let glyph = scale(rect(x, y, glyphWidth, glyphHeight), GLYPH_PADDING);
		context.beginPath();
		context.moveTo(fx(glyph, 0),   fy(glyph, 1));
		context.lineTo(fx(glyph, 1),   fy(glyph, 0));
		stroke(style);
	};
	let drawNumber1 = (x, y, style) => {
		let glyph = scale(rect(x, y, glyphWidth, glyphHeight), GLYPH_PADDING);
		context.beginPath();
		context.moveTo(fx(glyph, 0),   fy(glyph, 1/4));
		context.lineTo(fx(glyph, 1/2), fy(glyph, 0));
		context.lineTo(fx(glyph, 1/2), fy(glyph, 1));
		context.lineTo(fx(glyph, 0),   fy(glyph, 1));
		context.lineTo(fx(glyph, 1),   fy(glyph, 1));
		stroke(style);
	};
	let drawNumber2 = (x, y, style) => {
		let glyph = scale(rect(x, y, glyphWidth, glyphHeight), GLYPH_PADDING);
		context.beginPath();
		context.arc(   fx(glyph, 1/2), fy(glyph, 1/4), glyph.w / 2, PI, PI * 1/4);
		context.lineTo(fx(glyph, 0),   fy(glyph, 1));
		context.lineTo(fx(glyph, 1),   fy(glyph, 1));
		stroke(style);
	};
	let drawNumber3 = (x, y, style) => {
		let glyph = scale(rect(x, y, glyphWidth, glyphHeight), GLYPH_PADDING);
		context.beginPath();
		context.arc(   fx(glyph, 1/2), fy(glyph, 1/4), glyph.w / 2, PI, PI * 1/2);
		context.arc(   fx(glyph, 1/2), fy(glyph, 3/4), glyph.w / 2, PI * 3/2, PI);
		stroke(style);
	};
	let drawNumber4 = (x, y, style) => {
		let glyph = scale(rect(x, y, glyphWidth, glyphHeight), GLYPH_PADDING);
		context.beginPath();
		context.moveTo(fx(glyph, 1/4), fy(glyph, 0));
		context.lineTo(fx(glyph, 0),   fy(glyph, 1/2));
		context.lineTo(fx(glyph, 1),   fy(glyph, 1/2));
		context.lineTo(fx(glyph, 1),   fy(glyph, 0));
		context.lineTo(fx(glyph, 1),   fy(glyph, 1));
		stroke(style);
	};
	let drawNumber5 = (x, y, style) => {
		let glyph = scale(rect(x, y, glyphWidth, glyphHeight), GLYPH_PADDING);
		context.beginPath();
		context.moveTo(fx(glyph, 0.9), fy(glyph, 0));
		context.lineTo(fx(glyph, 0),   fy(glyph, 0));
		context.lineTo(fx(glyph, 0),   fy(glyph, 1/2));
		context.arc(   fx(glyph, 1/2), fy(glyph, 3/4), glyph.w / 2, PI * 3/2, PI / 2);
		context.lineTo(fx(glyph, 0),   fy(glyph, 1));
		stroke(style);
	};
	let drawNumber6 = (x, y, style) => {
		let glyph = scale(rect(x, y, glyphWidth, glyphHeight), GLYPH_PADDING);
		context.beginPath();
		context.arc(   fx(glyph, 1/2), fy(glyph, 3/4), glyph.w / 2, PI, PI * 3);
		context.arc(   fx(glyph, 1),   fy(glyph, 4/9), glyph.w,     PI, PI * 4/3);
		stroke(style);
	};
	let drawNumber7 = (x, y, style) => {
		let glyph = scale(rect(x, y, glyphWidth, glyphHeight), GLYPH_PADDING);
		context.beginPath();
		context.moveTo(fx(glyph, 0),   fy(glyph, 0));
		context.lineTo(fx(glyph, 1),   fy(glyph, 0));
		context.lineTo(fx(glyph, 1/2), fy(glyph, 1));
		stroke(style);
	};
	let drawNumber8 = (x, y, style) => {
		let glyph = scale(rect(x, y, glyphWidth, glyphHeight), GLYPH_PADDING);
		context.beginPath();
		context.arc(   fx(glyph, 1/2), fy(glyph, 1/4), glyph.w / 2, PI * 1/2, PI * 5/2);
		context.arc(   fx(glyph, 1/2), fy(glyph, 3/4), glyph.w / 2, PI * 3/2, PI * 7/2);
		stroke(style);
	};
	let drawNumber9 = (x, y, style) => {
		let glyph = scale(rect(x, y, glyphWidth, glyphHeight), GLYPH_PADDING);
		context.beginPath();
		context.arc(   fx(glyph, 1/2), fy(glyph, 1/4), glyph.w / 2, 0, PI * 2);
		context.arc(   fx(glyph, 0),   fy(glyph, 5/9), glyph.w,     0, PI * 1/3);
		stroke(style);
	};
	let drawNumber = [
		drawNumber0, drawNumber1, drawNumber2, drawNumber3, drawNumber4,
		drawNumber5, drawNumber6, drawNumber7, drawNumber8, drawNumber9,
	];
	let drawInteger = (x, y, n) => {
		let divisor = 1;
		for (let i = 0; i < 5; i++) {
			let digit = mod(Math.floor(n / divisor), 10);
			divisor *= 10;
			drawNumber[digit](x + glyphWidth * GLYPH_KERNING * (4 - i), y);
		}
	};
	
	let y = panel.y;
	drawLetterS(panel.x + glyphWidth * GLYPH_KERNING * 0, y);
	drawLetterC(panel.x + glyphWidth * GLYPH_KERNING * 1, y);
	drawLetterO(panel.x + glyphWidth * GLYPH_KERNING * 2, y);
	drawLetterR(panel.x + glyphWidth * GLYPH_KERNING * 3, y);
	drawLetterE(panel.x + glyphWidth * GLYPH_KERNING * 4, y);

	y += glyphHeight;
	drawInteger(panel.x, y, 1234);

	y += glyphHeight;
	drawLetterL(panel.x + glyphWidth * GLYPH_KERNING * 0, y);
	drawLetterE(panel.x + glyphWidth * GLYPH_KERNING * 1, y);
	drawLetterV(panel.x + glyphWidth * GLYPH_KERNING * 2, y);
	drawLetterE(panel.x + glyphWidth * GLYPH_KERNING * 3, y);
	drawLetterL(panel.x + glyphWidth * GLYPH_KERNING * 4, y);

	y += glyphHeight;
	drawInteger(panel.x, y, 56789);

	/// Load screen
	let now = performance.now();
	if (now - load < LOAD_TIME) {
		let {width: w, height: h} = context.canvas.getBoundingClientRect();
		fillRect(0, 0, w, h, `rgba(255, 255, 255, ${1 - (now - load) / LOAD_TIME})`);
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
