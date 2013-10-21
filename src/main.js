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

// Particles
var particleGroup;
var particleAttributes;

// collision list - eventually some spatial data structure.
var collidables = [];

// loading textures (possibly other things)
// You access textureAtlas by doing textureAtlas[name]. e.g. textureAtlas['gravel']
var textureAtlas = {};
var textureLoader = new THREE.ImageLoader();
// loadCount holds how many images have been loaded.
// maxLoadCount how many have to be loaded for everything to proceed
var loadCount = 0;
var maxLoadCount = 6;
var hasInitHappened = false;

// think about putting these elsewhere. Preliminary objects.
var ground;
var player;
var playerSpotLight;
var playerSpotLightPosition = new THREE.Vector3(0, 220, 50);
var light;

// parameters
var cameraYDistance = 400;
var anisotropy = 2;

// This starts everything. Game doesn't start until 
// maxLoadCount amount of assets have been loaded.
load(); 

// Enter images you wish to be loaded here using loadTexture(url, name);
function load() {
    loadTexture("assets/Gravel512.jpg", "gravel");
    loadTexture("assets/Gravel512_SSBump.jpg", "gravel_bump");
    loadTexture("assets/Water512.jpg", "water");
    loadTexture("assets/Water512-gray_Normal.png", "water_normal");
	loadTexture("assets/brick.png", "brick");
    loadTexture("assets/spark.png", "particle");
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
    // Can possibly cause an issue if loading happens in an odd manner
    if (loadCount == maxLoadCount) { 
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
    // -5 to try to get rid of scrollbars initially
    var SCREEN_WIDTH = window.innerWidth - 5; 
    var SCREEN_HEIGHT = window.innerHeight - 5;
    var VIEW_ANGLE = 45;
    var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;
    var NEAR = 0.1;
    var FAR = 2000;
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    // later make it so initial look at is on player
    camera.position.set(0, cameraYDistance, 0); 
    camera.lookAt(scene.position);
    
    // RENDERER
    if (Detector.webgl) {
        renderer = new THREE.WebGLRenderer( { antialias: true } );
    } else {
        // At some point might want to try whether this actually works.
        renderer = new THREE.CanvasRenderer();
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
    light = new THREE.PointLight(0x333333);
    light.position.set(0, 410, 0);
    scene.add(light);
    
    var ambientLight = new THREE.AmbientLight(0x090909);
    scene.add(ambientLight);
    
    playerSpotLight = new THREE.SpotLight(0xaaaaaa);
    playerSpotLight.position.set(0, 115, 0);
    playerSpotLight.shadowDarkness = 0.8;
    playerSpotLight.castShadow = true;
    playerSpotLight.shadowCameraFov = 120;
    //playerSpotLight.shadowMapWidth = 1024;
    //playerSpotLight.shadowMapHeight = 1024;
    //playerSpotLight.onlyShadow = true;
    //playerSpotLight.shadowCameraVisible = true;
    scene.add(playerSpotLight);
    
    
    
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 100, 0);
    directionalLight.onlyShadow = true;
    scene.add(directionalLight);
    
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
   
    var groundMaterial = new THREE.MeshPhongMaterial( { map: groundTexture,
                                                       bumpMap: groundTextureBump,
                                                       side: THREE.DoubleSide });
    var groundGeometry = new THREE.PlaneGeometry(10000, 10000, 1, 1);
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    
    ground.position.y = -0.5;
    ground.rotation.x = Math.PI / 2;
    scene.add(ground);
    targetList.push(ground); // used for picking
    ground.receiveShadow = true;
    
    // WALL - merge geometry!
    var staticCubeMat = new THREE.MeshBasicMaterial( { map:textureAtlas["brick"] });
    var m = maze(5, 5);
    var posArray = getPositionArray(m);
    var group = new THREE.CubeGeometry(0, 250, 0, 1, 1, 1);
    /*for (var o = 0; o < group.vertices.length; o++) {
        group.vertices[o].x -= posArray.x[i];
        group.vertices[o].z -= posArray.y[i];
    }*/
    
    for (var i = 0; i < posArray.x.length; i++) {
        var staticCubeGeom = new THREE.CubeGeometry(100, 250, 100, 1, 1, 1);
        var mesh2 = new THREE.Mesh(staticCubeGeom, staticCubeMat);
        mesh2.position.set(posArray.x[i], 50, posArray.y[i]);
        /*for (var j = 0; j < staticCubeGeom.vertices.length; j++) {
            staticCubeGeom.vertices[j].x -= posArray.x[i];
            staticCubeGeom.vertices[j].z -= posArray.y[i];
        }*/
        //THREE.GeometryUtils.merge(group, staticCubeGeom);
        
        THREE.GeometryUtils.merge(group, mesh2);
        
    }   
    
    //THREE.GeometryUtils.triangulateQuads(group);
    //group.computeBoundingSphere();
    
    var mesh = new THREE.Mesh(group, staticCubeMat);
    mesh.castShadow = true;
    mesh.recieveShadow = true;
    
    mesh.position.y = 50;
    scene.add(mesh);
    targetList.push(mesh);
    collidables.push(mesh);
    
    // PLAYER
    console.log(97, 50, -43);
    player = new Player(97, 50, -43, 100, 200);
    playerSpotLight.target = player.model;
    
    // MOUSE PICKING projector
    projector = new THREE.Projector();
    
    // PARTICLES
    particleGroup = new THREE.Object3D();
    particleAttributes = { startSize: [], startPosition: [], randomness: [] };
    
    var totalParticles = 200;
    var radiusRange = 50;
    for (var k = 0; k < totalParticles; k++) {
        var spriteMaterial = new THREE.SpriteMaterial( { map: textureAtlas["particle"], 
                                                       useScreenCoordinates: false,
                                                       color: 0xffffff});
        var sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(32, 32, 1.0);
        sprite.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        sprite.position.setLength(radiusRange * (Math.random() * 0.1 + 0.9));
        sprite.material.color.setHSL(Math.random(), 0.9, 0.7);
        
        sprite.material.blending = THREE.AdditiveBlending;
        
        particleGroup.add(sprite);
        particleAttributes.startPosition.push(sprite.position.clone());
        particleAttributes.randomness.push(Math.random());                                              
    }
    particleGroup.position.set(258, 50, 252);
    scene.add(particleGroup);
    particleGroup.castShadow = true;
    
    scene.add(new THREE.FogExp2(0x333333, 0.01));
    
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
    
    // PLAYER UPDATE
    player.update(delta);
    
    // SPOTLIGHT FOLLOW
    var relativeLightOffset = new THREE.Vector3(playerSpotLightPosition.x,
                                                playerSpotLightPosition.y,
                                                playerSpotLightPosition.z);
    var lightOffset = relativeLightOffset.applyMatrix4(player.model.matrixWorld);
    playerSpotLight.position.set(relativeLightOffset.x,
                                 relativeLightOffset.y,
                                 relativeLightOffset.z);
    light.position.x = player.model.position.x;
    light.position.z = player.model.position.z;
    
    // CAMERA FOLLOW
    var relativeCameraOffset = new THREE.Vector3(0, cameraYDistance, 0);
    var cameraOffset = relativeCameraOffset.applyMatrix4(player.model.matrixWorld);
    
    camera.position.set(cameraOffset.x,cameraYDistance, cameraOffset.z);
    
    // PARTICLE UPDATE
    var time = 4 * clock.getElapsedTime();
    for (var c = 0; c < particleGroup.children.length; c++) {
        var sprite = particleGroup.children[c];
        var a = particleAttributes.randomness[c] + 1;
		var pulseFactor = Math.sin(a * time) * 0.1 + 0.9;
		sprite.position.x = particleAttributes.startPosition[c].x * pulseFactor;
		sprite.position.y = particleAttributes.startPosition[c].y * pulseFactor;
		sprite.position.z = particleAttributes.startPosition[c].z * pulseFactor;	
    }
    particleGroup.rotation.y = time * 0.75;
    particleGroup.position.x = player.model.position.x;
    particleGroup.position.z = player.model.position.z;
    
    // DISABLE CAMERA FOLLOW TO REALLY USE THIS
    if (keyboard.pressed("space")) {
        controls.update();
    }
    stats.update();
}

// MAIN RENDER LOOP
function render() {
    renderer.render(scene, camera);
}

// ADDITIONAL FUNCTIONS. EVENTUALLY MOVE TO OTHER FILES
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