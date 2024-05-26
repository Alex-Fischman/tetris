let context = document.getElementById("canvas").getContext("2d");

let Hex = function(q, r) { this.q = q; this.r = r; };
Hex.prototype.s = function() { return -this.q-this.r; };
Hex.prototype.add = function({q, r}) { return new Hex(this.q + q, this.r + r); };
Hex.prototype.sub = function({q, r}) { return new Hex(this.q - q, this.r - r); };
Hex.prototype.mul = function(s) { return new Hex(this.q * s, this.r * s); };
Hex.prototype.eql = function({q, r}) { return this.q === q && this.r === r; };
Hex.prototype.lerp = function(other, t) { return this.add(other.sub(this).mul(t)); };
Hex.prototype.len = function() {
	return Math.max(Math.abs(this.q), Math.abs(this.r), Math.abs(this.s()));
};
Hex.prototype.normalized = function() { return this.mul(1 / this.len()); };
Hex.prototype.round = function() {
	let q = Math.round(this.q), r = Math.round(this.r), s = Math.round(this.s());
	let q_diff = Math.abs(q - this.q);
	let r_diff = Math.abs(r - this.r);
	let s_diff = Math.abs(s - this.s());
	if (q_diff > r_diff && q_diff > s_diff) q = -r-s;
	else if (r_diff > s_diff)               r = -q-s;
	else                                    s = -q-r;
	return new Hex(q, r);
};
Hex.prototype.render = function(fill) {
	context.beginPath();
	for (let a = PI/2; a <= PI * 5/2; a += PI/3)
		new Vec(Math.cos(a), Math.sin(a)).mul(R + 0.001).add(hexToVec(this)).lineTo();
	context.fillStyle = fill;
	context.fill();
};

let Vec = function(x, y) { this.x = x; this.y = y; };
Vec.prototype.add = function({x, y}) { return new Vec(this.x + x, this.y + y); };
Vec.prototype.sub = function({x, y}) { return new Vec(this.x - x, this.y - y); };
Vec.prototype.mul = function(s) { return new Vec(this.x * s, this.y * s); };
Vec.prototype.eql = function({x, y}) { return this.x === x && this.y === y; };
Vec.prototype.moveTo = function() { context.moveTo(this.x, this.y); };
Vec.prototype.lineTo = function() { context.lineTo(this.x, this.y); };

const R = 0.15, PI = Math.PI;
let hexToVec = ({q, r}) => new Vec((r / 2 + q) * Math.sqrt(3) * R,  r * 3 / 2 * R);
let vecToHex = ({x, y}) => new Hex((-y / 3 + x / Math.sqrt(3)) / R, y / 3 * 2 / R);

let input = {
	x: 0, y: 0,
	pressed: false,
	hex: function() { return vecToHex(context.getTransform().inverse()
		.transformPoint(new DOMPoint(this.x, this.y))); },
};
let handlePointerEvent = e => {
	input.x = e.x;
	input.y = e.y;
	input.pressed = !!e.pressure;
};
document.addEventListener("pointerup", handlePointerEvent);
document.addEventListener("pointerdown", handlePointerEvent);
document.addEventListener("pointermove", handlePointerEvent);

let player = {
	pos: new Hex(0, 0),
	lerp: 0,
	next: undefined,
};

if (!localStorage.getItem("Score")) localStorage.setItem("Score", "0");
else localStorage.setItem("Score", String(Number(localStorage.getItem("Score")) - 1));


let target = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]]
	.map(([q, r]) => new Hex(q, r).mul(Number(localStorage.getItem("Score"))).add(player.pos))
	[Math.floor(Math.random() * 6)];

let Cell = {Floor: {}, Wall: {}, Lava: {}, Ice: {}, Target: {}};
let cells = new Map();
let key = hex => {
	let cantorPairingFunction = (k1, k2) => (k1+k2)*(k1+k2+1)/2+k2;
	let removeSign = n => n >= 0? n * 2: -n * 2 - 1;
	return cantorPairingFunction(removeSign(hex.q), removeSign(hex.r));
};
cells.set(key(new Hex(0, 0)), Cell.Floor);
cells.set(key(target), Cell.Target);
let cell = hex => {
	if (cells.has(key(hex))) return cells.get(key(hex));
	let cs = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]]
		.map(([q, r]) => new Hex(q, r).add(hex))
		.filter(hex => cells.has(key(hex)))
		.map(hex => cells.get(key(hex)));
	let floor = 1;
	let wall = cs.filter(c => c === Cell.Wall).length / 2;
	let lava = cs.filter(c => c === Cell.Lava).length;
	let ice  = cs.filter(c => c === Cell.Ice).length;
	let random = 1;
	let r = Math.random() * (floor + wall + lava + ice + random);
	let s = Math.random();
	let c = r < floor? Cell.Floor:
			r < floor + wall? Cell.Wall:
			r < floor + wall + lava? Cell.Lava:
			r < floor + wall + lava + ice? Cell.Ice:
			s < 1/4? Cell.Floor: s < 2/4? Cell.Wall: s < 3/4? Cell.Lava: Cell.Ice;
	cells.set(key(hex), c);
	return c;
};

let update = dt => {
	if (player.next) {
		player.lerp += 1.0 / R * dt / 1000;
		if (player.next && player.lerp >= 1) {
			player.lerp = 0;
			let c = cell(player.next);
			if (c === Cell.Floor) {
				player.pos = player.next;
				player.next = undefined;
			}
			else if (c === Cell.Lava) {
				player.pos = player.next;
				player.next = undefined;
				location.reload();
			}
			else if (c === Cell.Ice) {
				let next = player.next.add(player.next.sub(player.pos));
				player.pos = player.next;
				player.next = cell(next) === Cell.Wall? undefined: next;
			}
			else if (c === Cell.Target) {
				let next = player.next.add(player.next.sub(player.pos));
				player.pos = player.next;
				player.next = undefined;
				
				let score = Number(localStorage.getItem("Score")) + 1;
				localStorage.setItem("Score", String(score));
				
				target = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]]
					.map(([q, r]) => new Hex(q, r).mul(score).add(player.pos))
					[Math.floor(Math.random() * 6)];
				cells.set(key(player.pos), Cell.Floor);
				cells.set(key(target), Cell.Target);
			}
			else throw "Cell type not implemented: " + c;
		}
	} else if (input.pressed && input.hex().sub(player.pos).len() >= 0.5) {
		let next = input.hex().sub(player.pos).normalized().round().add(player.pos);
		if (cell(next) !== Cell.Wall) player.next = next;
	}
};

let render = () => {
	let {width: w, height: h} = context.canvas.getBoundingClientRect();
	context.canvas.width = w;
	context.canvas.height = h;
	context.fillStyle = "#EEE";
	context.fillRect(0, 0, w, h);
	context.setTransform(new DOMMatrix(w > h? 
		[h / 2, 0, 0, -h / 2, h / 2 + (w - h) / 2, h / 2]: 
		[w / 2, 0, 0, -w / 2, w / 2, w / 2 + (h - w) / 2]
	));
	context.lineJoin = "round";
	context.lineCap = "round";

	let lerped = player.next? player.pos.lerp(player.next, player.lerp): player.pos;
	context.translate(-hexToVec(lerped).x, -hexToVec(lerped).y);
	{
		let hexes = [];
		let {width: w, height: h} = context.canvas.getBoundingClientRect();
		let m = context.getTransform().inverse();
		let a = vecToHex(m.transformPoint(new DOMPoint(0, 0)));
		let b = vecToHex(m.transformPoint(new DOMPoint(w, h)));
		for (let i = Math.round(a.q) - 1; i <= Math.round(b.q) + 1; i += 1)
			for (let j = Math.round(b.r) - 1; j <= Math.round(a.r) + 1; j += 1)
				hexes.push(new Hex(i, j));
		for (let hex of hexes) if (cell(hex) === Cell.Wall) hex.render("#111");
		for (let hex of hexes) if (cell(hex) === Cell.Lava) hex.render("#E88");
		for (let hex of hexes) if (cell(hex) === Cell.Ice) hex.render("#88E");
		for (let hex of hexes) if (cell(hex) === Cell.Target) hex.render("#8E8");

		let t = hexToVec(target);
		t.x = Math.min(Math.max(t.x, hexToVec(a).x), hexToVec(b).x);
		t.y = Math.min(Math.max(t.y, hexToVec(b).y), hexToVec(a).y);
		if (!t.eql(hexToVec(target))) {
			context.fillStyle = "#8E8";
			context.beginPath();
			context.arc(t.x, t.y, 0.05, 0, PI * 2);
			context.fill();
		}
	}

	let p = hexToVec(lerped);
	context.fillStyle = "#111";
	context.beginPath();
	context.arc(p.x, p.y, 0.05, 0, PI * 2);
	context.fill();

	context.save();
	context.resetTransform();
	context.font = "bold 50px sans serif";
	context.textBaseline = "top";
	context.lineWidth = 1;
	context.fillStyle = "#111";
	context.fillText("Score: " + localStorage.getItem("Score"), 10, 10);
	context.strokeStyle = "#EEE";
	context.strokeText("Score: " + localStorage.getItem("Score"), 10, 10);
	context.restore();
};

let then = performance.now(), load = performance.now();
let frame = now => {
	let dt = now - then;
	then = now;
	update(dt);
	render();
	if (now - load < 500) {
		context.fillStyle = `rgba(255, 255, 255, ${1 - (now - load) / 500})`;
		let {width: w, height: h} = context.canvas.getBoundingClientRect();
		let a = context.getTransform().inverse().transformPoint(new DOMPoint(0, 0));
		let b = context.getTransform().inverse().transformPoint(new DOMPoint(w, h));
		context.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
	}
	window.requestAnimationFrame(frame);
};
window.requestAnimationFrame(frame);
