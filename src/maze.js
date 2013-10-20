/**

 */
 
function maze(x,y) {
	var n=x*y-1;
	if (n<0) {alert("illegal maze dimensions");return;}
	var horiz =[]; for (var j= 0; j<x+1; j++) horiz[j]= [],
	    verti =[]; for (var j= 0; j<y+1; j++) verti[j]= [],
	    here = [Math.floor(Math.random()*x), Math.floor(Math.random()*y)],
	    path = [here],
	    unvisited = [];
	for (var j = 0; j<x+2; j++) {
		unvisited[j] = [];
		for (var k= 0; k<y+1; k++)
			unvisited[j].push(j>0 && j<x+1 && k>0 && (j != here[0]+1 || k != here[1]+1));
	}
	while (0<n) {
		var potential = [[here[0]+1, here[1]], [here[0],here[1]+1],
		    [here[0]-1, here[1]], [here[0],here[1]-1]];
		var neighbors = [];
		for (var j = 0; j < 4; j++)
			if (unvisited[potential[j][0]+1][potential[j][1]+1])
				neighbors.push(potential[j]);
		if (neighbors.length) {
			n = n-1;
			next= neighbors[Math.floor(Math.random()*neighbors.length)];
			unvisited[next[0]+1][next[1]+1]= false;
			if (next[0] == here[0])
				horiz[next[0]][(next[1]+here[1]-1)/2]= true;
			else 
				verti[(next[0]+here[0]-1)/2][next[1]]= true;
			path.push(here = next);
		} else 
			here = path.pop();
	}
	return {x: x, y: y, horiz: horiz, verti: verti};
}

function getPositionArray(m){
	var x = [];
	var y = [];
	for (var j= 0; j<m.x*2+1; j++) {
		var line= [];
		if (0 == j%2){
			for (var k=0; k<m.y*4+1; k++){
				if (0 == k%4) {
					//old code, just for reference
					//var StaticCube = new THREE.Mesh( MovingCubeGeom, StaticCubeMat );
					//StaticCube.position.set(-475+Math.floor(j/2)*100, 25.1, 475 - Math.floor(k/4)*100);
					//group.add(StaticCube);
					x.push(-475 + Math.floor(j/2)*100);
					y.push(475 - Math.floor(k/4)*100);
					}
				else{
					if (j>0 && m.verti[j/2-1][Math.floor(k/4)]){
					}
					else{
						if(2 == k%4){
						//var StaticCube = new THREE.Mesh( MovingCubeGeom, StaticCubeMat );
						//StaticCube.position.set(-475+Math.floor(j/2)*100, 25.1, 475 - Math.floor(k/2)*50);
						//group.add(StaticCube);
						x.push(-475+Math.floor(j/2)*100);
						y.push(475 - Math.floor(k/2)*50);
						}
					}
				}
			}
		}
		else{
			for (var k=0; k<m.y*4+1; k++){
				if (0 == k%4){
					if (k>0 && m.horiz[(j-1)/2][k/4-1]){
					}
					else{
						//var StaticCube = new THREE.Mesh( MovingCubeGeom, StaticCubeMat );
						//StaticCube.position.set(-475+j*50, 25.1, 475 - Math.floor(k/4)*100);
						//group.add(StaticCube);
						x.push(-475+j*50);
						y.push(475 - Math.floor(k/4)*100);
					}
				}
			}
		}
	}
	return {x: x, y: y};
}