/*
	Three.js "tutorials by example"
	Author: Lee Stemkoski
	Date: July 2 13 (three.js v59dev)
*/

// MAIN

// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// custom global variables
var cube;
var isMouseDown = false;
    
var targetList = [];
var projector, mouse = { x: 0, y: 0 };

init();
animate();

// FUNCTIONS 		
function init() {
	// SCENE
	scene = new THREE.Scene();
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(0,0,0);
	camera.lookAt(scene.position);	
	// RENDERER
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer(); 
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	container = document.getElementById( 'ThreeJS' );
	container.appendChild( renderer.domElement );
	// EVENTS
	THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });

	// CONTROLS
	// MUST REMOVE THIS LINE!!!
	// controls = ...

	// STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );
	// LIGHT
	var light = new THREE.PointLight(0xffffff);
	light.position.set(0,250,0);
	scene.add(light);
	// FLOOR
	var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
	floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
	floorTexture.repeat.set( 10, 10 );
	var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
	var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    targetList.push(floor);
    
	floor.position.y = -0.5;
	floor.rotation.x = Math.PI / 2;
	scene.add(floor);
	// SKYBOX/FOG
	var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
	var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
	var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
	// scene.add(skyBox);
	scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );
	
	////////////
	// CUSTOM //
	////////////
	
	// create an array with six textures for a cool cube
	var materialArray = [];
	materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'images/xpos.png' ) }));
	materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'images/xneg.png' ) }));
	materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'images/ypos.png' ) }));
	materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'images/yneg.png' ) }));
	materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'images/zpos.png' ) }));
	materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'images/zneg.png' ) }));
	var MovingCubeMat = new THREE.MeshFaceMaterial(materialArray);
	var MovingCubeGeom = new THREE.CubeGeometry( 50, 50, 50, 1, 1, 1, materialArray );
	MovingCube = new THREE.Mesh( MovingCubeGeom, MovingCubeMat );
	MovingCube.position.set(0, 25.1, 0);
	scene.add( MovingCube );	
    MovingCube.speed = 0;
	
    projector = new THREE.Projector();
    
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('mouseup', onMouseUp, false);
    document.addEventListener('mousemove', onMouseMove, false);
    
    relativeCameraOffset = new THREE.Vector3(0,600,0);
	var cameraOffset = relativeCameraOffset.applyMatrix4( MovingCube.matrixWorld );
	camera.position.x = cameraOffset.x;
	camera.position.y = 600;
	camera.position.z = cameraOffset.z;
	camera.lookAt( MovingCube.position );
    
}

var MovingCube;
var rightMouseDown = false;
function onDocumentMouseDown(event) {
    if (event.button == 2 && !rightMouseDown) {
        rightMouseDown = true;
    }
    isMouseDown = true;
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
    
function onMouseUp(event) {
    isMouseDown = false;
    if (event.button == 2) {
        rightMouseDown = false;
    }
}

document.oncontextmenu = function contextMenu(e) { 
    return false; 
}
    
function sign(x) {
    if (x > 0)
        return 1;
    else if (x < 0)
        return -1;
    return 0;
}

function animate() {
    requestAnimationFrame( animate );
	render();		
	update();
}

function toString(v) { 
    return "[ " + v.x + ", " + v.y + ", " + v.z + " ]"; 
}

var dmouseX, dmouseZ;
function update() {
	var delta = clock.getDelta(); // seconds.
	var moveDistance = 200 * delta; // 200 pixels per second
	var rotateAngle = Math.PI / 2 * delta;   // pi/2 radians (90 degrees) per second
	
	// local transformations

	// move forwards/backwards/left/right
	if ( keyboard.pressed("W") )
		MovingCube.translateZ( -moveDistance );
	if ( keyboard.pressed("S") )
		MovingCube.translateZ(  moveDistance );
	if ( keyboard.pressed("Q") )
		MovingCube.translateX( -moveDistance );
	if ( keyboard.pressed("E") )
		MovingCube.translateX(  moveDistance );	

	// rotate left/right/up/down
	var rotation_matrix = new THREE.Matrix4().identity();
	if ( keyboard.pressed("A") ) {
        MovingCube.rotation.y += rotateAngle;
		//MovingCube.rotateOnAxis( new THREE.Vector3(0,1,0), rotateAngle);
    }
	if ( keyboard.pressed("D") ) {
		//MovingCube.rotateOnAxis( new THREE.Vector3(0,1,0), -rotateAngle);
        MovingCube.rotation.y -= rotateAngle;
    }
	if ( keyboard.pressed("R") )
		MovingCube.rotateOnAxis( new THREE.Vector3(1,0,0), rotateAngle);
	if ( keyboard.pressed("F") )
		MovingCube.rotateOnAxis( new THREE.Vector3(1,0,0), -rotateAngle);
	
	if ( keyboard.pressed("Z") )
	{
		MovingCube.position.set(0,25.1,0);
		MovingCube.rotation.set(0,0,0);
	}
   
    if (isMouseDown) {
        var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
        projector.unprojectVector(vector, camera);
        var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

        var intersects = ray.intersectObjects(targetList);

        if (intersects.length > 0) {
            var dmouseX = intersects[0].point.x - MovingCube.position.x;
            var dmouseZ = intersects[0].point.z - MovingCube.position.z;
            var rotAngle = Math.atan2(dmouseZ, dmouseX);
            
            // local ??? Kas see on ikka local? I have no idea. Muutsin selle tõttu ära ka
            // keyboard turnimise - muidu hakkas imelikke asju tegema.
            MovingCube.rotation.y = Math.atan2(dmouseX, dmouseZ) + Math.PI;

            // global -- keyboard input does screw with this whole thing though.
            MovingCube.position.x += moveDistance * Math.cos(rotAngle);
            MovingCube.position.z += moveDistance * Math.sin(rotAngle);
        }     
    }

    var relativeCameraOffset = new THREE.Vector3(0,600,0);
	var cameraOffset = relativeCameraOffset.applyMatrix4( MovingCube.matrixWorld );

	camera.position.x = cameraOffset.x;
	camera.position.y = 600;
	camera.position.z = cameraOffset.z;
	
	//camera.updateMatrix();
	//camera.updateProjectionMatrix();
			
	stats.update();
}

function render() {
	renderer.render( scene, camera );
}
