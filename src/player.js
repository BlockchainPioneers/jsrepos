/*
 * This file houses the Player class.
 */

Player = function(x, y, z, health, moveSpeed) {
    var sphereTexture = textureAtlas["water"];
    sphereTexture.anisotropy = 16;
    var sphereTextureNormal = textureAtlas["water_normal"];
    sphereTextureNormal.anisotropy = 16;
    
    var sphereGeometry = new THREE.SphereGeometry(25, 64, 64);
    var sphereMaterial = new THREE.MeshPhongMaterial( { map: sphereTexture,
                                                       normalMap: sphereTextureNormal,
                                                       side: THREE.DoubleSide });
    this.model = new THREE.Mesh(sphereGeometry, sphereMaterial);
    
    this.model.castShadow = true;
    this.model.position.set(x || 0, y || 0, z || 0);
    scene.add(this.model);
    
    this.moveSpeed = moveSpeed || 200;
    this.health = health || 100;
    
}

Player.prototype = {
    
    update: function(delta) {
        
        if (keyboard.pressed("T")) {
            console.log(this.model.position);
        }
        
        if (mouseLeftButtonDown) {
            var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
            projector.unprojectVector(vector, camera);
            var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
            
            var intersects = ray.intersectObjects(targetList);
            
            // MOVEMENT
            if (intersects.length > 0) {
                var dmouseX = intersects[0].point.x - player.model.position.x;
                var dmouseZ = intersects[0].point.z - player.model.position.z;
                var rotAngle = Math.atan2(dmouseZ, dmouseX);
                
                // this is some massive clusterf-
                this.model.rotation.y = Math.atan2(dmouseX, dmouseZ) + Math.PI;
                
                this.moveTo(this.moveSpeed * delta * Math.cos(rotAngle), 
                      this.moveSpeed * delta * Math.sin(rotAngle));
            }
        }
        
    },
    
    moveTo: function(x, z) {
        
        // COLLISION
        //console.log(this.model.position);
        /*var ray = new THREE.Raycaster(new THREE.Vector3(this.model.position.x,
                                                        this.model.position.y,
                                                        this.model.position.z), 
                                      new THREE.Vector3(x, 0, z), 0, 200);
        collisions = ray.intersectObjects(collidables, true);
        //console.log(ray.ray.origin, this.model.position);
        //console.log(ray.ray.direction);
        
        if (collisions.length > 0) {
            console.log("collision! " + collisions.length);
            console.log(ray.ray.origin, this.model.position);
            console.log(ray.ray.direction, x, z);
        }*/
        var originPoint = this.model.position.clone();
        
        for (var vertexIndex = 0; vertexIndex < this.model.geometry.vertices.length; vertexIndex++) {
            var localVertex = this.model.geometry.vertices[vertexIndex].clone();
            var globalVertex = localVertex.applyMatrix4(this.model.matrix);
            var directionVector = globalVertex.sub(this.model.position);
            
            var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
            var collisionResults = ray.intersectObjects(collidables);
            if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
                // TODO: calculate MINIMUM TRANSLATION DISTANCE
                x = -sign(directionVector.x) * 2;
                z = -sign(directionVector.z) * 2;
                console.log("collision!");
            }
        }
        var futureX = this.model.position.x + x;
        var futureZ = this.model.position.z + z;
        
        this.model.position.x = futureX;
        this.model.position.z = futureZ;
    }
    
}