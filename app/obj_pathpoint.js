
//-------------------------------------------------------
// PATH POINT OBJECT
//-------------------------------------------------------

	function PathPoint(oa){
		this.objtype = "pathpoint";

		this.P = oa.P? new Coord(oa.P) : new Coord({"x":100, "y":100});
		this.H1 = oa.H1? new Coord(oa.H1) : new Coord({"x":0, "y":0});
		this.H2 = oa.H2? new Coord(oa.H2) : new Coord({"x":200, "y":200});

		this.type = oa.type || "corner";		// corner, flat, symmetric
		this.selected = oa.selected || false;
		this.useh1 = (isval(oa.useh1)? oa.useh1 : true);
		this.useh2 = (isval(oa.useh2)? oa.useh2 : true);

		//debug("PATHPOINT was passed " + JSON.stringify(oa));
	}




//-------------------------------------------------------
// PATH POINT METHODS
//-------------------------------------------------------

	PathPoint.prototype.getH1x = function() { return this.useh1? this.H1.x : this.P.x; };
	PathPoint.prototype.getH1y = function() { return this.useh1? this.H1.y : this.P.y; };
	PathPoint.prototype.getH2x = function() { return this.useh2? this.H2.x : this.P.x; };
	PathPoint.prototype.getH2y = function() { return this.useh2? this.H2.y : this.P.y; };

	PathPoint.prototype.makeFlat = function(move){
		//debug("MAKEFLAT - move " + move + " starts as " + JSON.stringify(this));

		//figure out length (hypotenuse) of H1
		var adj1 = this.P.x-this.H1.x;
		var opp1 = this.P.y-this.H1.y;
		var hyp1 = Math.sqrt( (adj1*adj1) + (opp1*opp1) );
		var angle1 = Math.acos(adj1 / hyp1);
		//debug("MAKEFLAT adj1 opp1 hyp1 angle1 " + adj1 + " / " + opp1 + " / " + hyp1 + " / " + angle1);

		//figure out length (hypotenuse) of H2
		var adj2 = this.P.x-this.H2.x;
		var opp2 = this.P.y-this.H2.y;
		var hyp2 = Math.sqrt( (adj2*adj2) + (opp2*opp2) );
		var angle2 = Math.acos(adj2 / hyp2);
		//debug("MAKEFLAT adj2 opp2 hyp2 angle2 " + adj2 + " / " + opp2 + " / " + hyp2 + " / " + angle2);

		if(angle1==angle2){
			//debug("MAKEFLAT - Equal Angles, returning");
			return;
		}

		if(isNaN(angle1) || isNaN(angle2)) {
			//debug("MAKEFLAT - NaN found, returning");
			return;
		}

		//new values
		var newHx, newHy, mod, newadj1, newadj2;

		switch(move){
			case "H1" :
				//modifier
				mod = (this.H1.y > this.P.y)? -1 : 1;

				//get new x and y for H2
				newadj2 = Math.cos(angle1) * hyp2;
				newopp2 = Math.tan(angle1) * newadj2;

				//Set values
				newHx =  (this.P.x + (newadj2));
				newHy = (this.P.y + (newopp2*mod));
				//debug("MAKEFLAT move H1 - compute x/y " + newHx + " / " + newHy);
				this.H2.x = newHx;
				this.H2.y = newHy;
				break;

			case "H2" :
				//modifier
				mod = (this.H2.y > this.P.y)? -1 : 1;

				//get new x and y for H2
				newadj1 = Math.cos(angle2) * hyp1;
				newopp1 = Math.tan(angle2) * newadj1;

				//Set values
				newHx =  (this.P.x + (newadj1));
				newHy = (this.P.y + (newopp1*mod));
				//debug("MAKEFLAT move H2 - compute x/y " + newHx + " / " + newHy);
				this.H1.x = newHx;
				this.H1.y = newHy;
				break;
		}

		this.roundAll();
		//debug("MAKEFLAT - returns " + JSON.stringify(this));
	};

	PathPoint.prototype.makeSymmetric = function(move){
		//debug("MAKESYMETRIC - move " + move + " starts as " + JSON.stringify(this));
		switch(move){
			case "H1" :
				this.H2.x = ((this.P.x - this.H1.x) + this.P.x);
				this.H2.y = ((this.P.y - this.H1.y) + this.P.y);
				break;
			case "H2" :
				this.H1.x = ((this.P.x - this.H2.x) + this.P.x);
				this.H1.y = ((this.P.y - this.H2.y) + this.P.y);
				break;
		}

		this.roundAll();
		//debug("MAKESYMETRIC - returns " + JSON.stringify(this));
	};

	PathPoint.prototype.makePointedTo = function(px, py, length){
		//figure out angle
		var adj1 = this.P.x-px;
		var opp1 = this.P.y-py;
		var hyp1 = Math.sqrt( (adj1*adj1) + (opp1*opp1) );
		var angle1 = Math.acos(adj1 / hyp1);

		//debug("MAKEPOINTEDTO - x/y/l " + px + " " + py + " " + length + " - Before H1x/y " + this.H1.x + " " + this.H1.y);
		this.H1.x = this.P.x - Math.cos(angle1)*length;
		this.H1.y = this.P.y - Math.sin(angle1)*length;
		//debug("MAKEPOINTEDTO - after H1x/y " + this.H1.x + " " + this.H1.y);
		this.makeFlat("H1");
		//debug("MAKEPOINTEDTO - after makesymmetric H1x/y " + this.H1.x + " " + this.H1.y);

		this.roundAll();
	};

	PathPoint.prototype.resetHandles = function(){
		this.type = "flat";
		this.H2.x = this.P.x - 100;
		this.H2.y = this.P.y;
		this.H1.x = this.P.x + 100;
		this.H1.y = this.P.y;
	};

	PathPoint.prototype.setPointPosition = function(controlpoint, nx, ny){
		var dx = 0;
		var dy = 0;

		switch(controlpoint){
			case "P":
				if(!this.P.xlock && !isNaN(nx)){
					dx = (this.P.x - nx);
					this.P.x = nx;
					this.H1.x -= dx;
					this.H2.x -= dx;
				}
				if(!this.P.ylock && !isNaN(ny)){
					dy = (this.P.y - ny);
					this.P.y = ny;
					this.H1.y -= dy;
					this.H2.y -= dy;
				}
				break;

			case "H1":
				if(!this.H1.xlock && !isNaN(nx)){
					this.H1.x = nx;
				}
				if(!this.H1.ylock && !isNaN(ny)){
					this.H1.y = ny;
				}
				break;

			case "H2":
				if(!this.H2.xlock && !isNaN(nx)){
					this.H2.x = nx;
					if(this.type == "symmetric"){ this.makeSymmetric("H2"); }
					else if (this.type == "flat") { this.makeFlat("H2"); }
				}
				if(!this.H2.ylock && !isNaN(ny)){
					this.H2.y = ny;
					if(this.type == "symmetric"){ this.makeSymmetric("H1"); }
					else if (this.type == "flat") { this.makeFlat("H1"); }
				}
				break;
		}

		this.roundAll();

	};

	PathPoint.prototype.updatePointPosition = function(controlpoint, dx,dy, force){
		//debug("UPDATEPOINTPOSITION - cp / dx / dy / force: " + controlpoint + " / " + dx + " / " + dy + " / " + force);
		var lockx = (_UI.selectedtool=='pathedit'? this.P.xlock : false);
		var locky = (_UI.selectedtool=='pathedit'? this.P.ylock : false);

		if(isval(force)){
			if(force){
				lockx = false;
				locky = false;
			}
		}

		switch(controlpoint){
			case "P":
				if(!lockx) this.P.x += dx;
				if(!locky) this.P.y += dy;
				if(!lockx) this.H1.x += dx;
				if(!locky) this.H1.y += dy;
				if(!lockx) this.H2.x += dx;
				if(!locky) this.H2.y += dy;
				break;

			case "H1" :
				this.H1.x += dx;
				this.H1.y += dy;
				if(this.type == "symmetric"){ this.makeSymmetric("H1"); }
				else if (this.type == "flat") { this.makeFlat("H1"); }
				break;

			case "H2" :
				this.H2.x += dx;
				this.H2.y += dy;
				if(this.type == "symmetric"){ this.makeSymmetric("H2"); }
				else if (this.type == "flat") { this.makeFlat("H2"); }
				break;
		}

		this.roundAll();
	};

	PathPoint.prototype.roundAll = function(){
		this.P.x = round(this.P.x);
		this.P.y = round(this.P.y);
		this.H1.x = round(this.H1.x);
		this.H1.y = round(this.H1.y);
		this.H2.x = round(this.H2.x);
		this.H2.y = round(this.H2.y);
	};

	PathPoint.prototype.drawPoint = function(c) {
		var ps = _GP.projectsettings.pointsize +1;
		var hp = ps/2;
		_UI.chareditctx.fillStyle = c? c : _UI.colors.accent;

		_UI.chareditctx.fillRect((sx_cx(this.P.x)-hp).makeCrisp(), (sy_cy(this.P.y)-hp).makeCrisp(), ps, ps);
		_UI.chareditctx.strokeRect((sx_cx(this.P.x)-hp).makeCrisp(), (sy_cy(this.P.y)-hp).makeCrisp(), ps, ps);
	};

	PathPoint.prototype.drawDirectionalityPoint = function(c, next){
		_UI.chareditctx.fillStyle = c? c : _UI.colors.accent;
		_UI.chareditctx.strokeStyle = _UI.colors.accent;
		_UI.chareditctx.lineWidth = 1;
		var begin = {"x":this.P.x, "y":this.P.y};
		var end = {"x":this.H2.x, "y":this.H2.y};

		if(!this.useh2) {
			end = {"x":next.P.x, "y":next.P.y};
		}

		var ps = (_GP.projectsettings.pointsize*0.75);
		var arrow = [
			[(ps*3), 0],
			[ps, ps],
			[-ps, ps],
			[-ps, -ps],
			[ps, -ps]
		];
		var rotatedarrow = [];
		var ang = Math.atan2((end.y-begin.y),(end.x-begin.x))*-1;

		for(var a in arrow){
			rotatedarrow.push([
				//round((arrow[a][0] * Math.cos(ang)) - (arrow[a][1] * Math.sin(ang))),
				//round((arrow[a][0] * Math.sin(ang)) + (arrow[a][1] * Math.cos(ang)))
				((arrow[a][0] * Math.cos(ang)) - (arrow[a][1] * Math.sin(ang))),
				((arrow[a][0] * Math.sin(ang)) + (arrow[a][1] * Math.cos(ang)))
			]);
		}

		//debug("DRAWPOINT arrow = " + JSON.stringify(arrow) + "  - rotatedarrow = " + JSON.stringify(rotatedarrow));

		_UI.chareditctx.beginPath();
		_UI.chareditctx.moveTo((rotatedarrow[0][0] + sx_cx(this.P.x)), (rotatedarrow[0][1] + sy_cy(this.P.y)));

		for(var p in rotatedarrow){
			if (p > 0) {
				_UI.chareditctx.lineTo((rotatedarrow[p][0] + sx_cx(this.P.x)), (rotatedarrow[p][1] + sy_cy(this.P.y)));
			}
		}

		_UI.chareditctx.lineTo((rotatedarrow[0][0] + sx_cx(this.P.x)), (rotatedarrow[0][1] + sy_cy(this.P.y)));
		_UI.chareditctx.fill();
		_UI.chareditctx.stroke();

		// Exact Middle Point
		_UI.chareditctx.fillStyle = _UI.colors.accent;
		_UI.chareditctx.fillRect((sx_cx(this.P.x).makeCrisp()), (sy_cy(this.P.y).makeCrisp()), 1, 1);

	};

	PathPoint.prototype.drawHandles = function(drawH1, drawH2) {
		_UI.chareditctx.fillStyle = _UI.colors.accent;
		_UI.chareditctx.lineWidth = 1;
		var hp = _GP.projectsettings.pointsize/2;

		if(drawH1 && this.useh1){
			_UI.chareditctx.beginPath();
			_UI.chareditctx.arc(sx_cx(this.H1.x), sy_cy(this.H1.y), hp, 0, Math.PI*2, true);
			_UI.chareditctx.closePath();
			_UI.chareditctx.fill();

			_UI.chareditctx.beginPath();
			_UI.chareditctx.moveTo(sx_cx(this.P.x), sy_cy(this.P.y));
			_UI.chareditctx.lineTo(sx_cx(this.H1.x), sy_cy(this.H1.y));
			_UI.chareditctx.closePath();
			_UI.chareditctx.stroke();
		}

		if(drawH2 && this.useh2){
			_UI.chareditctx.beginPath();
			_UI.chareditctx.arc(sx_cx(this.H2.x), sy_cy(this.H2.y), hp, 0, Math.PI*2, true);
			_UI.chareditctx.closePath();
			_UI.chareditctx.fill();

			_UI.chareditctx.beginPath();
			_UI.chareditctx.moveTo(sx_cx(this.P.x), sy_cy(this.P.y));
			_UI.chareditctx.lineTo(sx_cx(this.H2.x), sy_cy(this.H2.y));
			_UI.chareditctx.closePath();
			_UI.chareditctx.stroke();
		}
	};