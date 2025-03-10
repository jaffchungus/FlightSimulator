// Environment Creator for Flight Simulator
const Environment = {
    // Terrain tile management
    terrainTiles: [],
    tileDimension: 50000, // Size of a single terrain tile
    
    // Create the complete environment
    createEnvironment: function(scene) {
        this.scene = scene; // Store scene reference for adding new tiles
        this.createSky(scene);
        
        // Create initial terrain tile at origin
        const centerTile = this.createTerrainTile(0, 0);
        scene.add(centerTile);
        this.terrainTiles.push({ x: 0, z: 0, mesh: centerTile });
        
        this.createClouds(scene);
        this.createAirport(scene);
        this.createCity(scene, 5000, 2000, 4000);
        
        // Add lighting
        this.setupLighting(scene);
        
        return {
            clouds: this.clouds,
            terrain: centerTile, // Return the center tile as the main terrain
            windSpeed: 0,
            windDirection: 0,
            visibility: 10000,
            turbulence: 0,
            updateTerrain: this.updateTerrainTiles.bind(this) // Function to update terrain as player moves
        };
    },
    
    // Update terrain tiles based on player position
    updateTerrainTiles: function(playerPosition) {
        // Calculate which tile the player is on
        const tileX = Math.floor(playerPosition.x / this.tileDimension);
        const tileZ = Math.floor(playerPosition.z / this.tileDimension);
        
        // Check if we need to create new tiles
        for (let x = tileX - 1; x <= tileX + 1; x++) {
            for (let z = tileZ - 1; z <= tileZ + 1; z++) {
                // Skip if this tile already exists
                if (!this.tileExists(x, z)) {
                    // Create new tile
                    const newTile = this.createTerrainTile(x, z);
                    this.scene.add(newTile);
                    this.terrainTiles.push({ x: x, z: z, mesh: newTile });
                    
                    console.log(`Created new terrain tile at (${x}, ${z})`);
                }
            }
        }
        
        // Remove tiles that are too far away (more than 2 tiles away)
        for (let i = this.terrainTiles.length - 1; i >= 0; i--) {
            const tile = this.terrainTiles[i];
            if (Math.abs(tile.x - tileX) > 2 || Math.abs(tile.z - tileZ) > 2) {
                this.scene.remove(tile.mesh);
                this.terrainTiles.splice(i, 1);
                console.log(`Removed distant terrain tile at (${tile.x}, ${tile.z})`);
            }
        }
    },
    
    // Check if a tile at x,z coordinates already exists
    tileExists: function(x, z) {
        return this.terrainTiles.some(tile => tile.x === x && tile.z === z);
    },
    
    // Create a terrain tile at the specified grid position
    createTerrainTile: function(tileX, tileZ) {
        // Calculate world position
        const worldX = tileX * this.tileDimension;
        const worldZ = tileZ * this.tileDimension;
        
        // Create terrain geometry
        const terrainSize = this.tileDimension;
        const terrainResolution = 128; // Lower resolution for performance
        const terrainGeometry = new THREE.PlaneGeometry(
            terrainSize, terrainSize, terrainResolution, terrainResolution
        );
        
        // Access the terrain vertices for height manipulation
        const vertices = terrainGeometry.attributes.position.array;
        
        // Generate terrain height using multiple noise frequencies
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i] + worldX;
            const z = vertices[i+2] + worldZ;
            
            // Create varied terrain with mountains, hills, and valleys
            let height = 0;
            
            // Use consistent noise pattern so tiles match at edges
            height += Math.sin(x/5000) * Math.cos(z/5000) * 800;
            height += Math.sin(x/1200) * Math.cos(z/1500) * 300;
            height += Math.sin(x/400) * Math.cos(z/400) * 50;
            
            // Add deterministic variation based on position
            height += Math.sin(x * 0.01) * Math.cos(z * 0.01) * 50;
            
            // Make a flat area for airport (only on center tile)
            if (tileX === 0 && tileZ === 0) {
                const distFromCenter = Math.sqrt(x*x + z*z);
                if (distFromCenter < 5000) {
                    const smoothFactor = Math.max(0, (distFromCenter - 2000) / 3000);
                    height *= smoothFactor;
                }
            }
            
            // Set height
            vertices[i+1] = height;
        }
        
        terrainGeometry.attributes.position.needsUpdate = true;
        terrainGeometry.computeVertexNormals();
        
        // Create terrain material with texture
        const terrainMaterial = new THREE.MeshPhongMaterial({
            color: 0x3d663d,
            specular: 0x222222,
            shininess: 10,
            flatShading: false
        });
        
        // Create terrain mesh
        const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
        terrain.rotation.x = -Math.PI / 2; // Rotate to horizontal
        terrain.position.set(worldX + terrainSize/2, 0, worldZ + terrainSize/2);
        terrain.receiveShadow = true;
        
        // Add water for this tile
        if (tileX === 0 && tileZ === 0) {
            const waterGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize);
            const waterMaterial = new THREE.MeshPhongMaterial({
                color: 0x0055aa,
                specular: 0xffffff,
                shininess: 100,
                transparent: true,
                opacity: 0.8
            });
            
            const water = new THREE.Mesh(waterGeometry, waterMaterial);
            water.rotation.x = -Math.PI / 2;
            water.position.set(worldX + terrainSize/2, -50, worldZ + terrainSize/2);
            this.scene.add(water);
        }
        
        return terrain;
    },
    
    // Create sky dome and atmosphere effects
    createSky: function(scene) {
        // Sky dome geometry - make it very large
        const skyGeometry = new THREE.SphereGeometry(200000, 32, 32);
        // We'll invert the sphere so we see the inside
        skyGeometry.scale(-1, 1, 1);
        
        // Create sky shader material for realistic sky color based on altitude and viewing angle
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 500 },
                exponent: { value: 0.8 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        // Create sky dome
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        scene.add(sky);
        
        // Add sun
        const sunGeometry = new THREE.SphereGeometry(300, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffcc,
            transparent: true,
            fog: false
        });
        
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(5000, 8000, -10000);
        scene.add(sun);
        
        // Add sun lens flare
        const textureLoader = new THREE.TextureLoader();
        // Note: in a real implementation, you would need to load actual textures
        
        // Create directional light for sun
        const sunLight = new THREE.DirectionalLight(0xffffee, 1.5);
        sunLight.position.copy(sun.position);
        sunLight.castShadow = true;
        
        // Configure shadow for bigger area
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 500;
        sunLight.shadow.camera.far = 30000;
        sunLight.shadow.camera.left = -15000;
        sunLight.shadow.camera.right = 15000;
        sunLight.shadow.camera.top = 15000;
        sunLight.shadow.camera.bottom = -15000;
        sunLight.shadow.bias = -0.0001;
        
        scene.add(sunLight);
        
        return sky;
    },
    
    // Create volumetric clouds
    createClouds: function(scene) {
        const clouds = [];
        const cloudCount = 500; // More clouds for larger world
        
        // Create cloud groups at different heights
        for (let i = 0; i < cloudCount; i++) {
            const cloudGroup = new THREE.Group();
            
            // Random cloud size
            const cloudSize = 200 + Math.random() * 800;
            
            // Number of cloud puffs in this cloud
            const puffCount = Math.floor(Math.random() * 8) + 3;
            
            // Create individual puffs that make up the cloud
            for (let j = 0; j < puffCount; j++) {
                const puffGeometry = new THREE.SphereGeometry(cloudSize / 2, 8, 8);
                const puffMaterial = new THREE.MeshPhongMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.8 + Math.random() * 0.2,
                    flatShading: true
                });
                
                const puff = new THREE.Mesh(puffGeometry, puffMaterial);
                puff.position.set(
                    (Math.random() - 0.5) * cloudSize,
                    (Math.random() - 0.5) * cloudSize / 3,
                    (Math.random() - 0.5) * cloudSize
                );
                
                cloudGroup.add(puff);
            }
            
            // Position the cloud in the sky - much wider distribution
            cloudGroup.position.set(
                (Math.random() - 0.5) * 150000,
                2000 + Math.random() * 6000,
                (Math.random() - 0.5) * 150000
            );
            
            scene.add(cloudGroup);
            clouds.push(cloudGroup);
            
            // Store cloud movement for animation
            cloudGroup.userData = {
                speed: 0.2 + Math.random() * 0.8,
                direction: Math.random() * Math.PI * 2
            };
        }
        
        this.clouds = clouds;
        return clouds;
    },
    
    // Create an airport with runway, taxiways, and buildings
    createAirport: function(scene) {
        const airportGroup = new THREE.Group();
        
        // Create runway - longer runway
        const runwayLength = 4500; // Longer runway
        const runwayWidth = 80; // Wider runway
        const runwayGeometry = new THREE.PlaneGeometry(runwayWidth, runwayLength);
        const runwayMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            specular: 0x111111,
            shininess: 30
        });
        
        const runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
        runway.rotation.x = -Math.PI / 2;
        runway.position.y = 1; // Slightly above ground to prevent z-fighting
        runway.receiveShadow = true;
        airportGroup.add(runway);
        
        // Create runway markings
        // Centerline
        for (let i = 0; i < 45; i++) { // More markings for longer runway
            const markingGeometry = new THREE.PlaneGeometry(1, 30);
            const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const marking = new THREE.Mesh(markingGeometry, markingMaterial);
            marking.rotation.x = -Math.PI / 2;
            marking.position.set(0, 1.1, (i * 100) - runwayLength/2 + 100);
            airportGroup.add(marking);
        }
        
        // Threshold markings
        for (let i = 0; i < 8; i++) {
            // Runway start
            const startMarkGeometry = new THREE.PlaneGeometry(4, 30);
            const startMarkMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const startMarking = new THREE.Mesh(startMarkGeometry, startMarkMaterial);
            startMarking.rotation.x = -Math.PI / 2;
            startMarking.position.set(-20 + i * 6, 1.1, -runwayLength/2 + 15);
            airportGroup.add(startMarking);
            
            // Runway end
            const endMarking = startMarking.clone();
            endMarking.position.set(-20 + i * 6, 1.1, runwayLength/2 - 15);
            airportGroup.add(endMarking);
        }
        
        // Create taxiway
        const taxiwayGeometry = new THREE.PlaneGeometry(40, 1500); // Wider and longer taxiway
        const taxiwayMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            specular: 0x111111,
            shininess: 20
        });
        
        const taxiway = new THREE.Mesh(taxiwayGeometry, taxiwayMaterial);
        taxiway.rotation.x = -Math.PI / 2;
        taxiway.position.set(70, 1, 0);
        taxiway.receiveShadow = true;
        airportGroup.add(taxiway);
        
        // Add a starting position marker (bright yellow square at the start of the runway)
        const startMarkerGeometry = new THREE.PlaneGeometry(30, 30);
        const startMarkerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.7
        });
        const startMarker = new THREE.Mesh(startMarkerGeometry, startMarkerMaterial);
        startMarker.rotation.x = -Math.PI / 2;
        startMarker.position.set(0, 1.2, -runwayLength/2 + 100); // Position at the start of the runway
        airportGroup.add(startMarker);
        
        // Create a terminal building
        const terminalGeometry = new THREE.BoxGeometry(200, 30, 80);
        const terminalMaterial = new THREE.MeshPhongMaterial({
            color: 0x999999,
            specular: 0x111111,
            shininess: 40
        });
        
        const terminal = new THREE.Mesh(terminalGeometry, terminalMaterial);
        terminal.position.set(200, 15, 0);
        terminal.castShadow = true;
        terminal.receiveShadow = true;
        airportGroup.add(terminal);
        
        // Create control tower
        const towerBaseGeometry = new THREE.BoxGeometry(20, 40, 20);
        const towerBaseMaterial = new THREE.MeshPhongMaterial({
            color: 0xcccccc,
            specular: 0x333333,
            shininess: 50
        });
        
        const towerBase = new THREE.Mesh(towerBaseGeometry, towerBaseMaterial);
        towerBase.position.set(250, 20, 100);
        towerBase.castShadow = true;
        towerBase.receiveShadow = true;
        airportGroup.add(towerBase);
        
        const towerTopGeometry = new THREE.CylinderGeometry(15, 15, 10, 16);
        const towerTopMaterial = new THREE.MeshPhongMaterial({
            color: 0x88ccff,
            specular: 0xffffff,
            shininess: 100,
            transparent: true,
            opacity: 0.7
        });
        
        const towerTop = new THREE.Mesh(towerTopGeometry, towerTopMaterial);
        towerTop.position.set(250, 45, 100);
        towerTop.castShadow = true;
        airportGroup.add(towerTop);
        
        // Add hangars
        for (let i = 0; i < 5; i++) { // More hangars
            const hangarGeometry = new THREE.BoxGeometry(60, 20, 40);
            const hangarMaterial = new THREE.MeshPhongMaterial({
                color: 0x777777,
                specular: 0x222222,
                shininess: 30
            });
            
            const hangar = new THREE.Mesh(hangarGeometry, hangarMaterial);
            hangar.position.set(150, 10, -150 - i * 60);
            hangar.castShadow = true;
            hangar.receiveShadow = true;
            airportGroup.add(hangar);
        }
        
        scene.add(airportGroup);
        return airportGroup;
    },
    
    // Create a city with buildings
    createCity: function(scene, x, z, size) {
        const cityGroup = new THREE.Group();
        const buildingCount = 150;
        
        // Create skyscrapers and buildings
        for (let i = 0; i < buildingCount; i++) {
            // Generate building position within city area
            const bx = x + (Math.random() - 0.5) * size;
            const bz = z + (Math.random() - 0.5) * size;
            
            // Distance from center affects building height (taller in center)
            const distFromCenter = Math.sqrt((bx - x) * (bx - x) + (bz - z) * (bz - z));
            const centerFactor = 1 - Math.min(1, distFromCenter / (size / 2));
            
            // Determine building size
            const height = 20 + Math.random() * 100 + centerFactor * 300;
            const width = 20 + Math.random() * 40;
            const depth = 20 + Math.random() * 40;
            
            // Create building geometry
            const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
            
            // Different materials for variety
            const colorValue = 0x333333 + Math.floor(Math.random() * 0x999999);
            const buildingMaterial = new THREE.MeshPhongMaterial({
                color: colorValue,
                specular: 0x111111,
                shininess: 30 + Math.random() * 30
            });
            
            const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
            building.position.set(bx, height / 2, bz);
            building.castShadow = true;
            building.receiveShadow = true;
            
            cityGroup.add(building);
            
            // Add windows at night (emissive material)
            if (height > 40) {
                const windowRows = Math.floor(height / 10);
                const windowCols = Math.floor(width / 5);
                
                for (let row = 0; row < windowRows; row++) {
                    for (let col = 0; col < windowCols; col++) {
                        // Random chance of window light being on
                        if (Math.random() > 0.3) {
                            const windowGeometry = new THREE.PlaneGeometry(3, 3);
                            const windowMaterial = new THREE.MeshPhongMaterial({
                                color: 0x88ccff,
                                emissive: 0x88ccff,
                                emissiveIntensity: 0.5,
                                side: THREE.DoubleSide
                            });
                            
                            // Create window meshes for each side of the building
                            for (let side = 0; side < 4; side++) {
                                const windowPane = new THREE.Mesh(windowGeometry, windowMaterial);
                                
                                // Position based on side
                                switch (side) {
                                    case 0: // Front
                                        windowPane.position.set(
                                            bx - width / 2 + 4 + col * 5,
                                            5 + row * 10,
                                            bz + depth / 2 + 0.1
                                        );
                                        break;
                                    case 1: // Back
                                        windowPane.position.set(
                                            bx - width / 2 + 4 + col * 5,
                                            5 + row * 10,
                                            bz - depth / 2 - 0.1
                                        );
                                        windowPane.rotation.y = Math.PI;
                                        break;
                                    case 2: // Left
                                        windowPane.position.set(
                                            bx - width / 2 - 0.1,
                                            5 + row * 10,
                                            bz - depth / 2 + 4 + col * 5
                                        );
                                        windowPane.rotation.y = -Math.PI / 2;
                                        break;
                                    case 3: // Right
                                        windowPane.position.set(
                                            bx + width / 2 + 0.1,
                                            5 + row * 10,
                                            bz - depth / 2 + 4 + col * 5
                                        );
                                        windowPane.rotation.y = Math.PI / 2;
                                        break;
                                }
                                
                                if (Math.random() > 0.7) { // Only add some windows for performance
                                    cityGroup.add(windowPane);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Add city to scene
        scene.add(cityGroup);
        return cityGroup;
    },
    
    // Setup lighting for the scene
    setupLighting: function(scene) {
        // Ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0x444444);
        scene.add(ambientLight);
        
        // Hemisphere light for sky/ground color variation
        const hemisphereLight = new THREE.HemisphereLight(0x8888ff, 0x444422, 0.5);
        scene.add(hemisphereLight);
    },
    
    // Update environment based on time and conditions
    update: function(environment, deltaTime) {
        // Move clouds based on wind
        environment.clouds.forEach(cloud => {
            const speed = cloud.userData.speed * environment.windSpeed * deltaTime;
            const direction = cloud.userData.direction + environment.windDirection;
            
            cloud.position.x += Math.sin(direction) * speed;
            cloud.position.z += Math.cos(direction) * speed;
            
            // If cloud moves too far away, loop it back to the opposite side
            if (cloud.position.x > 25000) cloud.position.x = -25000;
            if (cloud.position.x < -25000) cloud.position.x = 25000;
            if (cloud.position.z > 25000) cloud.position.z = -25000;
            if (cloud.position.z < -25000) cloud.position.z = 25000;
        });
        
        return environment;
    },
    
    // Set weather conditions
    setWeather: function(environment, conditions) {
        environment.windSpeed = conditions.windSpeed || 0;
        environment.windDirection = conditions.windDirection || 0;
        environment.visibility = conditions.visibility || 10000;
        environment.turbulence = conditions.turbulence || 0;
        
        // Adjust fog based on visibility
        if (environment.scene && environment.scene.fog) {
            environment.scene.fog.far = environment.visibility;
        }
        
        // Adjust cloud opacity based on conditions
        const cloudOpacity = Math.min(1, (10000 - environment.visibility) / 8000 + 0.2);
        environment.clouds.forEach(cloud => {
            cloud.traverse(child => {
                if (child.isMesh) {
                    child.material.opacity = cloudOpacity;
                }
            });
        });
        
        return environment;
    }
};

// Export the Environment object
if (typeof module !== 'undefined') {
    module.exports = Environment;
} 