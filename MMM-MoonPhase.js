/* MagicMirror²
 * Module: MMM-MoonPhase
 *
 * By Nolan Kingdon
 * MIT Licensed.
 */

Module.register("MMM-MoonPhase", {
	requiresVersion: "2.1.0", // Required version of MagicMirror
	defaults: { 
		updateInterval: 43200000, // Every Twelve hours
		hemisphere: "N", // N or S
		resolution: "detailed", // Detailed Or basic
		basicColor: "#FFF", // If basic moon (shape only) is used, this is it's color
		title: true, // Whether or not the Moon Phase Title is displayed
		phase: true, // Label for what moon phase it is
		age: false, // Display the age of the moon in days
		x: 200, // x dimension
		y: 200, // y dimension - I really recommend this staays the same as x, but whatever, go nuts
		alpha: 0.8 // Visibility of the moon behind the shadow - 1 is fully blacked out
	},
	start: function() {
		const self = this;
		this.moonData = {
			points: [],
			jDate: []
		}
		this.sendSocketNotification('CALCULATE_MOONDATA', this.config);

		// Schedule update timer.
		setInterval(function() {
			this.sendSocketNotification('CALCULATE_MOONDATA');
			// self.updateDom();
		}, this.config.updateInterval);
	},
	getStyles: function () {
		return [
			"MMM-MoonPhase.css",
		];
	},
	getTranslations: function() {
		/* If adding translations for the module,
		 * add the reference to the json file you
		 * created here!
		 */
		return {
			en: "translations/en.json",
			de: "translations/de.json",
			fr: "translations/fr.json",
			sv: "translations/sv.json",
			es: "translations/es.json",
			gr: "translations/gr.json",
			pl: "translations/pl.json",
			it: "translations/it.json",
			pt: "translations/pt-br.json",
			ru: "translations/ru.json",
			cs: "translations/cs.json"
		};
	},
	socketNotificationReceived: function (notification, payload) {
		if (notification === 'CURRENT_MOONDATA') {
			this.moonData = payload;
			this.updateDom();
		}
	},
	getDom: function() {
		const wrapper = document.createElement("div");
		const title = document.createElement("p");
		const jDate = this.moonData.jDate;
		wrapper.id = "moonphase-wrapper";
		title.id = "moonphase-title";

		if (this.config.title) {
			title.innerHTML = this.translate("TITLE");
		} else {
			title.style.display = "none";
		}

		const moonCanvas = document.createElement("canvas");
		moonCanvas.id = "moonphase-canvas";
		moonCanvas.height = this.config.y;
		moonCanvas.width = this.config.x;

		if (this.config.resolution === "detailed"){
			moonCanvas.style.background = "url('./MMM-MoonPhase/Phases/full.png?raw=true')";
			moonCanvas.style.backgroundSize = "cover";
		}

		const phase = document.createElement("p");
		phase.id = "moonphase-phase";

		if (jDate[1] < 1 || jDate[1] > 29){
			phase.innerHTML = this.translate("NEW");
		} else if (jDate[1] > 1 && jDate[1] < 7){
			phase.innerHTML = this.translate("WAX_CRESC");
		} else if (jDate[1] >= 7 && jDate[1] <= 8) {
			phase.innerHTML = this.translate("FIRST");
		} else if (jDate[1] > 8 && jDate[1] < 14){
			phase.innerHTML = this.translate("WAX_GIB");
		} else if (jDate[1] > 14 && jDate[1] < 16){
			phase.innerHTML = this.translate("FULL");
		} else if (jDate[1] > 16 && jDate[1] < 21){
			phase.innerHTML = this.translate("WAN_GIB");
		} else if (jDate[1] >= 22 && jDate[1] <= 23) {
			phase.innerHTML = this.translate("THIRD");
		} else if (jDate[1] > 23 && jDate[1] < 29){
			phase.innerHTML = this.translate("WAN_CRESC");
		}

		if (!this.config.phase){ 
			phase.style.display = "none";
		}

		const age = document.createElement("p");
		age.id  = "moonphase-age";

		if (!this.config.age){ 
			age.style.display = "none";
		}

		this.drawCanvas(age, moonCanvas);

		// Appending our elements to the DOM object
		wrapper.appendChild(title);
		wrapper.appendChild(moonCanvas);
		wrapper.appendChild(phase);
		wrapper.appendChild(age);
		return wrapper;
	},
	drawCanvas: function(age, canvas){
		const jDate = this.moonData.jDate;
		const ctx = canvas.getContext("2d");
		this.drawAxisCircles(jDate, ctx);

		// Transforming the moon image to align with the southern hemisphere
		if (this.config.hemisphere.toUpperCase() === "S"){
			canvas.style.transform = "rotate(180deg)";
		}

		age.innerHTML = Math.round(jDate[1]) + " " + this.translate("DAYS");
	},
	drawAxisCircles: function(jDate, ctx) {
		ctx.clearRect(0, 0, this.config.x, this.config.y);

		if (this.config.resolution === "basic"){
			ctx.beginPath();
			ctx.fillStyle = this.config.basicColor;
			ctx.arc(this.config.x/2, this.config.y/2, this.config.x/2, 1.5*Math.PI, 3.5 * Math.PI);
			ctx.fill();
			// Have to move back the cursor to not have interfering lines
			ctx.moveTo(this.config.x/2, this.config.y);
			ctx.closePath();
		}

		ctx.beginPath();

		// Draw curve
		for (i=0; i<this.moonData.points.length; i++) {
			ctx.fillStyle = "rgba(0,0,0, " + this.config.alpha + ")";
			this.drawPoint(
				this.moonData.points[i],
				ctx
			);
		}

		// Fill shadow
		if (jDate[1] < 15){ // We are in waxing phases
			// ClockWise
			ctx.arc(
				this.config.x/2,
				this.config.y/2,
				this.config.x/2,
				0.5*Math.PI,
				1.5*Math.PI
			);
			ctx.fill();
		} else if (jDate[1] >= 15){
			// Arc counter clckwise
			ctx.arc(
				this.config.x/2,
				this.config.y/2,
				this.config.x/2,
				0.5*Math.PI,
				1.5*Math.PI,
				true
			);
			ctx.fill();
		}
	},
	drawPoint: function(coor, ctx){
		// If the points z coordinate is less than
		// zero, it is out of view thus, grey.
		let color = "transparent";
		if (coor[2] >= 0) {
			color = "rgba(0,0,0, " + this.config.alpha + ")";
		}
		ctx.fillStyle = color;
		ctx.lineTo(this.config.x/2 + coor[0], this.config.y/2 - coor[1]);
		ctx.stroke();
	},
});
