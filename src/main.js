// MAIN

// common global variables
var container, scene, camera, renderer, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
var start = Date.now();

var controls;

// used for mouse picking
var projector, mouse = { x: 0, y:0 };
var targetList = [];
var mouseLeftButtonDown;

// loading textures (possibly other things)
// You access textureAtlas by doing textureAtlas[name]. e.g. textureAtlas['gravel']
var textureAtlas = {};
var textureLoader = new THREE.ImageLoader();
// loadCount holds how many images have been loaded. maxLoadCount how many have to be loaded for everything to proceed
var loadCount = 0;
var maxLoadCount = 4;
var hasInitHappened = false;

// think about putting these elsewhere. Preliminary objects.
var ground;
var player;
var playerSpotLight;
var playerSpotLightPosition = new THREE.Vector3(-100, 200, 50);

// parameters
var cameraYDistance = 400;
var anisotropy = 2;

load(); // This starts everything. Game doesn't start until maxLoadCount amount of assets have been loaded.

// Enter images you wish to be loaded here using loadTexture(url, name);
function load() {
    loadTexture("assets/Gravel512.jpg", "gravel");
    loadTexture("assets/Gravel512_SSBump.jpg", "gravel_bump");
    loadTexture("assets/Water512.jpg", "water");
    loadTexture("assets/Water512-gray_Normal.png", "water_normal");
	loadTexture("assets/brick.png", "brick");
}

// Eventually place these into a separate loading file
function loadTexture(url, name) {
    document.getElementById("Loading").innerHTML += "<br>Loading: " + url;
    var image = new Image();
    var texture = new THREE.Texture(image);
    image.onload = function() {
        texture.needsUpdate = true;
        loadCount++;
        if (!hasInitHappened) {
            begin(); // Possibly bad design
        }
    }
    image.src = url;
    textureAtlas[name] = texture;
}

function begin(event) {
    if (loadCount == maxLoadCount) { // Can possibly cause an issue if loading happens in an odd manner
        hasInitHappened = true;
        init();
        animate();
    }
}

// MAIN INITIALIZATION
function init() {
    console.log("Starting init...");
    // Remove the loading div. (Might be necessary, might not be.)
    var node = document.getElementById("Loading");
    if (node.parentNode) {
        node.parentNode.removeChild(node);
    }
    
    // SCENE
    scene = new THREE.Scene();
    
    // CAMERA
    var SCREEN_WIDTH = window.innerWidth - 5; // -5 to try to get rid of scrollbars
    var SCREEN_HEIGHT = window.innerHeight - 5;
    var VIEW_ANGLE = 45;
    var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;
    var NEAR = 0.1;
    var FAR = 20000;
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    camera.position.set(0, cameraYDistance, 0); // later make it so initial look at is on player
    camera.lookAt(scene.position);
    
    // RENDERER
    if (Detector.webgl) {
        renderer = new THREE.WebGLRenderer( { antialias: true } );
    } else {
        renderer = new THREE.CanvasRenderer(); // At some point might want to try whether this actually works.
    }
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.shadowMapEnabled = true;
    
    container = document.getElementById("ThreeJS");
    container.appendChild(renderer.domElement);
    
    // EVENTS of resize and fullscreen
    THREEx.WindowResize(renderer, camera);
    THREEx.FullScreen.bindKey( { charCode: "m".charCodeAt(0) });
    
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    
    // STATS
    stats = new Stats();
    stats.domElement.style.position = "absolute";
    stats.domElement.style.top = "2px";
    stats.domElement.style.zIndex = 95;
    container.appendChild(stats.domElement);
    
    // LIGHTS
    var light = new THREE.PointLight(0x333333);
    light.position.set(0, 250, 10);
    //scene.add(light);
    
    var ambientLight = new THREE.AmbientLight(0x111111);
    scene.add(ambientLight);
    
    playerSpotLight = new THREE.SpotLight(0xaaaaaa);
    playerSpotLight.position.set(0, 200, 0);
    playerSpotLight.shadowDarkness = 0.8;
    playerSpotLight.castShadow = true;
    //spotLight.shadowCameraFov = 120;
    //playerSpotLight.shadowMapWidth = 1024;
    //playerSpotLight.shadowMapHeight = 1024;
    scene.add(playerSpotLight);
    
    // GROUND
    var repeat = 50;
    
    var groundTexture = textureAtlas["gravel"];
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(repeat, repeat);
    groundTexture.anisotropy = anisotropy;
    
    var groundTextureBump = textureAtlas["gravel_bump"];
    groundTextureBump.wrapS = groundTextureBump.wrapT = THREE.RepeatWrapping;
    groundTextureBump.repeat.set(repeat, repeat);
    groundTextureBump.anisotropy = anisotropy;
    var brickMaterialArray = [];
	brickMaterialArray.push(new THREE.MeshBasicMaterial( { map: textureAtlas["brick"] }));
	brickMaterialArray.push(new THREE.MeshBasicMaterial( { map: textureAtlas["brick"] }));
	brickMaterialArray.push(new THREE.MeshBasicMaterial( { map: textureAtlas["brick"] }));
	brickMaterialArray.push(new THREE.MeshBasicMaterial( { map: textureAtlas["brick"] }));
	brickMaterialArray.push(new THREE.MeshBasicMaterial( { map: textureAtlas["brick"] }));
	brickMaterialArray.push(new THREE.MeshBasicMaterial( { map: textureAtlas["brick"] }));
	var StaticCubeMat = new THREE.MeshFaceMaterial(brickMaterialArray);
	var StaticCubeGeom = new THREE.CubeGeometry( 50, 50, 50, 1, 1, 1, brickMaterialArray );
	var group = new THREE.Object3D();
	var m = maze(10,10);
	var posArray = getPositionArray(m);
	for(var i = 0 ; i<posArray.x.length ; i++){
		StaticCube = new THREE.Mesh( StaticCubeGeom, StaticCubeMat );
		StaticCube.position.set(posArray.x[i], 25.1, posArray.y[i]);
		group.add(StaticCube);
	}
	scene.add( group );
    var groundMaterial = new THREE.MeshPhongMaterial( { map: groundTexture,
                                                       bumpMap: groundTextureBump,
                                                       side: THREE.SingleSide });
    var groundGeometry = new THREE.PlaneGeometry(10000, 10000, 1, 1);
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    
    ground.position.y = -0.5;
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    targetList.push(ground); // used for picking
    ground.receiveShadow = true;
    
    // PLAYER
    var sphereTexture = textureAtlas["water"];
    sphereTexture.anisotropy = 16;
    var sphereTextureNormal = textureAtlas["water_normal"];
    sphereTextureNormal.anisotropy = 16;
    
    var sphereGeometry = new THREE.SphereGeometry(25, 64, 64);
    var sphereMaterial = new THREE.MeshPhongMaterial( { map: sphereTexture,
                                                       normalMap: sphereTextureNormal,
                                                       side: THREE.DoubleSide });
    player = new THREE.Mesh(sphereGeometry, sphereMaterial);
    
    player.position.set(100, 50, -50);
    scene.add(player);
    
    player.castShadow = true;
    playerSpotLight.target = player;
    
    // MOUSE PICKING projector
    projector = new THREE.Projector();
    
    // EVENT LISTENERS
    document.addEventListener("mousedown", onMouseDown, false);
    document.addEventListener("mouseup", onMouseUp, false);
    document.addEventListener("mousemove", onMouseMove, false);
    window.addEventListener("wheel", onMouseWheel, false);
    window.addEventListener("mousewheel", mouseWheel, false);
}

// MAIN APPLICATION LOOP
function animate() {
    requestAnimationFrame(animate);
    render();
    update();
}

// MAIN UPDATE LOOP
function update() {
    var delta = clock.getDelta(); // seconds
    var moveDistance = 200 * delta;
    
    if (keyboard.pressed("A")) {
        console.log("a");
    }
    
    if (mouseLeftButtonDown) {
        var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
        projector.unprojectVector(vector, camera);
        var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
        
        var intersects = ray.intersectObjects(targetList);
        
        // MOVEMENT
        if (intersects.length > 0) {
            var dmouseX = intersects[0].point.x - player.position.x;
            var dmouseZ = intersects[0].point.z - player.position.z;
            var rotAngle = Math.atan2(dmouseZ, dmouseX);
            
            // this is some massive clusterf-
            player.rotation.y = Math.atan2(dmouseX, dmouseZ) + Math.PI;
            
            player.position.x += moveDistance * Math.cos(rotAngle);
            player.position.z += moveDistance * Math.sin(rotAngle);
            
            
        }
    }
    
    // SPOTLIGHT FOLLOW
    playerSpotLight.position.set(
                player.position.x + playerSpotLightPosition.x, 
                player.position.y + playerSpotLightPosition.y,
                player.position.z + playerSpotLightPosition.z);
    
    // CAMERA FOLLOW
    var relativeCameraOffset = new THREE.Vector3(0, cameraYDistance, 0);
    var cameraOffset = relativeCameraOffset.applyMatrix4(player.matrixWorld);
    
    camera.position.set(cameraOffset.x, cameraYDistance, cameraOffset.z);
    
    if (keyboard.pressed("space")) {
        controls.update();
    }
    stats.update();
}

// MAIN RENDER LOOP
function render() {
    renderer.render(scene, camera);
}

// ADDITIONAL FUNCTIONS. EVENTUALLY MOVE TO OTHER FILE
function sign(x) {
    if (x > 0) {
        return 1;
    } else if (x < 0) {
        return -1;
    }
    return 0;
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onMouseDown(event) {
    if (event.button == 0) {
        mouseLeftButtonDown = true;
    }
}

function onMouseUp(event) {
    if (event.button == 0) {
        mouseLeftButtonDown = false;
    }
}

// for chrome
function mouseWheel(event) {
    cameraYDistance -= event.wheelDeltaY / 5;
    event.preventDefault();
}

// for firefox
function onMouseWheel(event) {
    cameraYDistance -= 8 * event.deltaY;
    event.preventDefault();
}