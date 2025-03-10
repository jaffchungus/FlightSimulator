// Main Flight Simulator Application
let scene, camera, renderer;
let aircraft, physics, controls, environment;
let clock, lastTime = 0;
let audioContext, engineSound, engineGain;
let crashDebris = [];
let restartTimer = 0;

// Weapon systems
let projectiles = []; // Stores active bullets, missiles, and rockets
let explosions = [];  // Stores active explosions
let targets = [];     // Stores potential targets (will be empty for now)
let weaponSounds = {}; // Store weapon sound generators

// AI enemy aircraft
let enemyAircraft = []; // Stores enemy aircraft
let enemyProjectiles = []; // Stores enemy projectiles
let radarTargets = []; // Stores targets visible on radar
let enemySpawnTimer = 0; // Timer for spawning new enemies
let difficultyLevel = 1; // Increases over time
let enemyCount = 0; // Track number of enemies created
let playerScore = 0; // Track player's score for destroying enemies

// Error handling
window.onerror = function(message, source, lineno, colno, error) {
    const errorDiv = document.getElementById('error');
    errorDiv.style.display = 'block';
    errorDiv.innerHTML = `Error: ${message}<br>Line: ${lineno}`;
    console.error(error);
    return true;
};

// Initialize the simulator
function init() {
    try {
        // Hide any error messages
        document.getElementById('error').style.display = 'none';
        document.getElementById('debug').style.display = 'none';
        
        // Check WebGL support
        if (!checkWebGL()) {
            document.getElementById('loading').innerHTML = 'WebGL not supported by your browser.<br>Please try a modern browser like Chrome, Firefox, or Edge.';
            return;
        }
        
        // Initialize all components
        initScene();
        setupAudio();
        
        // Create environment (terrain, sky, etc.)
        environment = Environment.createEnvironment(scene);
        
        // Create aircraft - start at the beginning of the runway
        aircraft = PlaneModel.createCommercialPlane(scene);
        aircraft.position.set(0, 1.5, -2150); // Position at the very start of the runway (adjusted for longer runway)
        aircraft.rotation.y = Math.PI; // Face down the runway
        
        // Initialize physics
        physics = FlightPhysics.init();
        physics.altitude = aircraft.position.y;
        
        // Initialize controls
        controls = Controls.init();
        Controls.setupListeners(controls);
        
        // Initialize clock for animation
        clock = new THREE.Clock();
        clock.start();
        
        // Set initial camera view to see aircraft on runway
        camera.position.set(-20, 10, -2180);
        camera.lookAt(aircraft.position);
        
        // Setup instruments and HUD
        setupInstruments();
        
        // Start spawning enemy aircraft after a delay
        setTimeout(spawnEnemyAircraft, 30000); // Start spawning enemies 30 seconds after start
        
        // Hide loading message
        document.getElementById('loading').style.display = 'none';
        
        // Start animation loop
        animate();
        
        // Show welcome message with control instructions
        setTimeout(showWelcomeMessage, 500);
        
        // Log success
        console.log("Simulator initialization complete");
    } catch (error) {
        console.error('Initialization error:', error);
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').textContent = 'Error initializing simulator: ' + error.message;
    }
}

// Check WebGL support
function checkWebGL() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
}

// Setup audio context and sounds
function setupAudio() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioContext = new AudioContext();
            
            // Engine sound
            engineSound = audioContext.createOscillator();
            engineSound.type = 'sawtooth';
            engineSound.frequency.setValueAtTime(50, audioContext.currentTime);
            
            engineGain = audioContext.createGain();
            engineGain.gain.setValueAtTime(0, audioContext.currentTime);
            
            // Apply lowpass filter for more realistic engine sound
            const lowpass = audioContext.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 400;
            lowpass.Q.value = 10;
            
            engineSound.connect(lowpass);
            lowpass.connect(engineGain);
            engineGain.connect(audioContext.destination);
            engineSound.start();
            
            // Setup weapon sounds
            setupWeaponSounds();
            
            console.log("Audio setup complete");
        }
    } catch (e) {
        console.warn("Audio not available:", e);
    }
}

// Setup weapon sounds
function setupWeaponSounds() {
    if (!audioContext) return;
    
    try {
        // Gun/cannon sound
        const gunOscillator = audioContext.createOscillator();
        gunOscillator.type = 'square';
        gunOscillator.frequency.value = 80;
        
        const gunGain = audioContext.createGain();
        gunGain.gain.value = 0;
        
        gunOscillator.connect(gunGain);
        gunGain.connect(audioContext.destination);
        gunOscillator.start();
        
        weaponSounds.gun = {
            oscillator: gunOscillator,
            gain: gunGain
        };
        
        // Missile sound - readied
        const missileReadyOscillator = audioContext.createOscillator();
        missileReadyOscillator.type = 'sawtooth';
        missileReadyOscillator.frequency.value = 220;
        
        const missileReadyGain = audioContext.createGain();
        missileReadyGain.gain.value = 0;
        
        missileReadyOscillator.connect(missileReadyGain);
        missileReadyGain.connect(audioContext.destination);
        missileReadyOscillator.start();
        
        weaponSounds.missileReady = {
            oscillator: missileReadyOscillator,
            gain: missileReadyGain
        };
        
        console.log("Weapon sounds initialized");
    } catch (e) {
        console.warn("Error setting up weapon sounds:", e);
    }
}

// Initialize Three.js scene
function initScene() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50000);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    console.log("Scene initialized");
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Setup flight instruments
function setupInstruments() {
    const instruments = document.getElementById('flight-instruments');
    if (!instruments) return;
    
    // Clear existing instruments
    instruments.innerHTML = '';
    
    // Create instruments
    const instrumentData = [
        { id: 'airspeed', label: 'AIRSPEED', unit: 'km/h', max: 2500 },
        { id: 'altitude', label: 'ALTITUDE', unit: 'm', max: 15000 },
        { id: 'vario', label: 'VERT SPEED', unit: 'm/min', max: 3000 },
        { id: 'heading', label: 'HEADING', unit: '°', max: 360 },
        { id: 'bank', label: 'BANK', unit: '°', max: 90 }
    ];
    
    instrumentData.forEach(data => {
        const instrument = document.createElement('div');
        instrument.className = 'instrument';
        instrument.id = data.id + '-gauge';
        
        const needle = document.createElement('div');
        needle.className = 'needle';
        
        const label = document.createElement('div');
        label.className = 'instrument-label';
        label.textContent = data.label;
        
        instrument.appendChild(needle);
        instrument.appendChild(label);
        instruments.appendChild(instrument);
    });
    
    console.log("Instruments setup complete");
}

// Display welcome message
function showWelcomeMessage() {
    const hud = document.getElementById('hud');
    if (!hud) return;
    
    const welcome = document.createElement('div');
    welcome.className = 'welcome-message';
    welcome.innerHTML = `
        <h2>Welcome to Fighter Jet Combat Simulator</h2>
        <p>Flight Controls:</p>
        <ul>
            <li>W/S or ↑/↓ - Pitch (nose up/down)</li>
            <li>A/D or ←/→ - Roll (bank left/right)</li>
            <li>Q/E - Yaw (rudder left/right)</li>
            <li>Shift - Increase throttle</li>
            <li>Ctrl - Decrease throttle</li>
            <li>G - Toggle landing gear</li>
            <li>X - Toggle afterburner</li>
            <li>B - Toggle brakes</li>
        </ul>
        <p>Weapon Controls:</p>
        <ul>
            <li>SPACE/Left Mouse - Fire selected weapon</li>
            <li>1 - Select gun/cannon (unlimited ammo)</li>
            <li>2 - Select missiles (6 available)</li>
            <li>3 - Select rockets (12 available)</li>
            <li>Mouse Wheel - Cycle through weapons</li>
        </ul>
        <p>Combat Information:</p>
        <ul>
            <li>Enemy aircraft will appear with red markings</li>
            <li>Use the radar in the bottom-left to track enemies</li>
            <li>Be alert for enemy warning messages</li>
            <li>Destroy enemy aircraft to score points</li>
            <li>Watch out! Enemies will shoot at you</li>
        </ul>
        <p>Start at the runway, take off, and engage in aerial combat!</p>
        <button id="close-welcome">Start Flying</button>
    `;
    
    hud.appendChild(welcome);
    
    document.getElementById('close-welcome').addEventListener('click', function() {
        welcome.style.display = 'none';
    });
}

// Main animation loop
function animate(time) {
    requestAnimationFrame(animate);
    
    // Calculate delta time
    const delta = clock.getDelta();
    
    // Update debug info
    updateDebugInfo();
    
    // Update controls
    controls = Controls.update(controls, delta);
    
    // Apply controls to physics
    physics = Controls.applyToPhysics(controls, physics);
    
    // Check for weapon firing
    handleWeaponFiring(delta);
    
    // Update projectiles and explosions
    updateProjectiles(delta);
    updateExplosions(delta);
    
    // Update enemy aircraft and their projectiles
    updateEnemyAircraft(delta);
    updateEnemyProjectiles(delta);
    
    // Check for enemy spawning
    updateEnemySpawning(delta);
    
    // Update infinite terrain
    if (environment.updateTerrain) {
        environment.updateTerrain(aircraft.position);
    }
    
    // Update physics
    physics = FlightPhysics.update(physics, aircraft, environment, delta);
    
    // Update engine sound
    updateEngineSound();
    
    // Update camera
    updateCamera();
    
    // Update HUD and instruments
    const flightData = FlightPhysics.getFlightData(physics);
    const weaponStatus = Controls.getWeaponStatus(controls);
    updateHUD(flightData, weaponStatus);
    updateInstruments(flightData);
    
    // Update radar
    updateRadar();
    
    // Check for crash
    if (physics.crashed && !restartTimer) {
        triggerCrashEffects();
        
        // Set restart timer
        restartTimer = setTimeout(resetAircraft, 3000);
        
        // Show crash message with countdown
        const crashMessage = document.getElementById('crash-message');
        crashMessage.style.display = 'block';
        
        let countdown = 3;
        crashMessage.textContent = `CRASHED! Restarting in ${countdown}...`;
        
        const countdownInterval = setInterval(function() {
            countdown--;
            if (countdown > 0) {
                crashMessage.textContent = `CRASHED! Restarting in ${countdown}...`;
            } else {
                clearInterval(countdownInterval);
            }
        }, 1000);
    }
    
    // Update debris if there was a crash
    if (crashDebris.length > 0) {
        updateDebris(delta);
    }
    
    // Render the scene
    renderer.render(scene, camera);
}

// Handle weapon firing based on controls
function handleWeaponFiring(delta) {
    // Return if no weapon is being fired
    if (!physics.fireGun && !physics.fireMissile && !physics.fireRocket) {
        // Turn off gun sound
        if (weaponSounds.gun && weaponSounds.gun.gain.gain.value > 0) {
            weaponSounds.gun.gain.gain.value = 0;
        }
        return;
    }
    
    // Check if we're still in cooldown
    if (physics.lastFired > 0) {
        return;
    }
    
    // Get the aircraft's forward direction vector
    const direction = new THREE.Vector3(1, 0, 0);
    direction.applyQuaternion(aircraft.quaternion);
    direction.normalize();
    
    // Get aircraft position (offset slightly forward for weapon origin)
    const weaponOrigin = aircraft.position.clone().add(
        direction.clone().multiplyScalar(5)
    );
    
    // Handle gun firing
    if (physics.fireGun && physics.gunAmmo > 0) {
        // Play gun sound
        if (weaponSounds.gun) {
            weaponSounds.gun.gain.gain.value = 0.3;
        }
        
        // Create bullet
        const bullet = createBullet(weaponOrigin, direction);
        scene.add(bullet);
        projectiles.push({
            mesh: bullet,
            type: 'bullet',
            velocity: direction.clone().multiplyScalar(800), // m/s
            origin: weaponOrigin.clone(),
            distance: 0,
            maxDistance: 2000, // 2km max range
            damage: 10
        });
        
        // Reduce ammo and set cooldown (rapid fire - 10 rounds per second)
        physics.gunAmmo--;
        physics.lastFired = 0.05; // 50ms cooldown
        
        // Update controls ammo count
        controls.gunAmmo = physics.gunAmmo;
    }
    
    // Handle missile firing
    else if (physics.fireMissile && physics.missileCount > 0) {
        // Create missile
        const missile = createMissile(weaponOrigin, direction);
        scene.add(missile);
        projectiles.push({
            mesh: missile,
            type: 'missile',
            velocity: direction.clone().multiplyScalar(300), // m/s
            acceleration: 50, // Acceleration in m/s²
            maxSpeed: 800, // Maximum speed in m/s
            origin: weaponOrigin.clone(),
            distance: 0,
            maxDistance: 8000, // 8km max range
            damage: 200,
            fuel: 10, // 10 seconds of propulsion
            exploded: false
        });
        
        // Play launch sound
        playExplosionSound(0.5);
        
        // Reduce missile count and set cooldown
        physics.missileCount--;
        physics.lastFired = 1.5; // 1.5s cooldown between missiles
        
        // Update controls missile count
        controls.missileCount = physics.missileCount;
    }
    
    // Handle rocket firing
    else if (physics.fireRocket && physics.rocketCount > 0) {
        // Create rocket
        const rocket = createRocket(weaponOrigin, direction);
        scene.add(rocket);
        projectiles.push({
            mesh: rocket,
            type: 'rocket',
            velocity: direction.clone().multiplyScalar(400), // m/s
            origin: weaponOrigin.clone(),
            distance: 0,
            maxDistance: 5000, // 5km max range
            damage: 150,
            exploded: false
        });
        
        // Play launch sound
        playExplosionSound(0.3);
        
        // Reduce rocket count and set cooldown
        physics.rocketCount--;
        physics.lastFired = 0.8; // 0.8s cooldown between rockets
        
        // Update controls rocket count
        controls.rocketCount = physics.rocketCount;
    }
}

// Create a bullet projectile
function createBullet(position, direction) {
    const bulletGeometry = new THREE.SphereGeometry(0.1, 4, 4);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    bullet.position.copy(position);
    
    // Add tracer effect
    const tracerGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 4);
    const tracerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff8800,
        transparent: true,
        opacity: 0.8
    });
    
    const tracer = new THREE.Mesh(tracerGeometry, tracerMaterial);
    tracer.rotation.x = Math.PI / 2;
    tracer.position.set(0, 0, -1); // Position behind the bullet
    
    bullet.add(tracer);
    
    return bullet;
}

// Create a missile projectile
function createMissile(position, direction) {
    const group = new THREE.Group();
    
    // Missile body
    const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    group.add(body);
    
    // Missile nose
    const noseGeometry = new THREE.ConeGeometry(0.2, 0.5, 8);
    const nose = new THREE.Mesh(noseGeometry, bodyMaterial);
    nose.rotation.z = Math.PI / 2;
    nose.position.set(1.75, 0, 0);
    group.add(nose);
    
    // Missile fins
    const finGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.5);
    const finMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    
    for (let i = 0; i < 4; i++) {
        const fin = new THREE.Mesh(finGeometry, finMaterial);
        fin.position.set(-1, 0, 0);
        fin.rotation.z = i * Math.PI / 2;
        group.add(fin);
    }
    
    // Exhaust
    const exhaustGeometry = new THREE.CylinderGeometry(0.15, 0.3, 1, 8);
    const exhaustMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff4400,
        transparent: true,
        opacity: 0.8 
    });
    
    const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.rotation.z = -Math.PI / 2;
    exhaust.position.set(-1.5, 0, 0);
    group.add(exhaust);
    
    // Set position and direction
    group.position.copy(position);
    
    // Align missile with direction vector
    const lookAt = position.clone().add(direction);
    group.lookAt(lookAt);
    
    return group;
}

// Create a rocket projectile
function createRocket(position, direction) {
    const group = new THREE.Group();
    
    // Rocket body
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x777777 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    group.add(body);
    
    // Rocket nose
    const noseGeometry = new THREE.ConeGeometry(0.3, 0.6, 8);
    const noseMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.rotation.z = Math.PI / 2;
    nose.position.set(1.3, 0, 0);
    group.add(nose);
    
    // Rocket fins
    const finGeometry = new THREE.BoxGeometry(0.5, 0.05, 0.7);
    const finMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 });
    
    for (let i = 0; i < 4; i++) {
        const fin = new THREE.Mesh(finGeometry, finMaterial);
        fin.position.set(-0.7, 0, 0);
        fin.rotation.z = i * Math.PI / 2;
        group.add(fin);
    }
    
    // Exhaust
    const exhaustGeometry = new THREE.CylinderGeometry(0.2, 0.4, 1.5, 8);
    const exhaustMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff2200,
        transparent: true,
        opacity: 0.7 
    });
    
    const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.rotation.z = -Math.PI / 2;
    exhaust.position.set(-1.25, 0, 0);
    group.add(exhaust);
    
    // Set position and direction
    group.position.copy(position);
    
    // Align rocket with direction vector
    const lookAt = position.clone().add(direction);
    group.lookAt(lookAt);
    
    return group;
}

// Update projectiles (bullets, missiles, rockets)
function updateProjectiles(delta) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        
        // Update velocity for missiles (acceleration)
        if (projectile.type === 'missile' && projectile.fuel > 0) {
            projectile.fuel -= delta;
            projectile.velocity.add(
                projectile.velocity.clone().normalize().multiplyScalar(projectile.acceleration * delta)
            );
            
            // Cap at max speed
            const speed = projectile.velocity.length();
            if (speed > projectile.maxSpeed) {
                projectile.velocity.normalize().multiplyScalar(projectile.maxSpeed);
            }
        }
        
        // Update position
        projectile.mesh.position.add(
            projectile.velocity.clone().multiplyScalar(delta)
        );
        
        // Keep missiles and rockets oriented to their velocity
        if (projectile.type === 'missile' || projectile.type === 'rocket') {
            projectile.mesh.lookAt(
                projectile.mesh.position.clone().add(projectile.velocity)
            );
        }
        
        // Update distance traveled
        const distanceDelta = projectile.velocity.length() * delta;
        projectile.distance += distanceDelta;
        
        // Check for terrain collision
        const rayDirection = new THREE.Vector3(0, -1, 0);
        const raycaster = new THREE.Raycaster(
            projectile.mesh.position, 
            rayDirection, 
            0, 
            projectile.mesh.position.y + 10
        );
        
        // Intersection handling - future expansion for checking terrain mesh
        
        // Check for maximum range
        if (projectile.distance > projectile.maxDistance) {
            // Remove from scene
            scene.remove(projectile.mesh);
            projectiles.splice(i, 1);
            continue;
        }
        
        // Check for explosion triggers
        const shouldExplode = 
            (projectile.type === 'missile' && (projectile.distance > 100 && Math.random() < 0.001)) || 
            (projectile.type === 'rocket' && projectile.mesh.position.y <= 1);
        
        if (shouldExplode && !projectile.exploded) {
            projectile.exploded = true;
            
            // Create explosion
            createExplosion(projectile.mesh.position.clone(), projectile.damage / 10);
            
            // Remove projectile after explosion
            scene.remove(projectile.mesh);
            projectiles.splice(i, 1);
            
            // Check if player aircraft is within blast radius
            checkBlastDamage(projectile);
        }
    }
}

// Create explosion at specified position
function createExplosion(position, size = 10) {
    // Make size at least 5
    size = Math.max(5, size);
    
    // Create explosion group
    const explosionGroup = new THREE.Group();
    explosionGroup.position.copy(position);
    
    // Core explosion
    const coreGeometry = new THREE.SphereGeometry(size / 2, 8, 8);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.9
    });
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    explosionGroup.add(core);
    
    // Outer explosion
    const outerGeometry = new THREE.SphereGeometry(size, 8, 8);
    const outerMaterial = new THREE.MeshBasicMaterial({
        color: 0xff9900,
        transparent: true,
        opacity: 0.7
    });
    
    const outer = new THREE.Mesh(outerGeometry, outerMaterial);
    explosionGroup.add(outer);
    
    // Smoke
    const smokeCount = Math.floor(size);
    for (let i = 0; i < smokeCount; i++) {
        const smokeGeometry = new THREE.SphereGeometry(size / 2 * Math.random(), 4, 4);
        const smokeMaterial = new THREE.MeshBasicMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.6 + Math.random() * 0.2
        });
        
        const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smoke.position.set(
            (Math.random() - 0.5) * size,
            (Math.random() - 0.5) * size,
            (Math.random() - 0.5) * size
        );
        
        // Add random velocity
        smoke.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 20,
            5 + Math.random() * 15,
            (Math.random() - 0.5) * 20
        );
        
        // Growth rate
        smoke.growthRate = 1 + Math.random();
        
        explosionGroup.add(smoke);
    }
    
    // Add to scene and track
    scene.add(explosionGroup);
    explosions.push({
        mesh: explosionGroup,
        age: 0,
        maxAge: 2 + size / 5, // Larger explosions last longer
        size: size,
        blastRadius: size * 3, // Blast damage radius
        damage: size * 10 // Damage based on size
    });
    
    // Play explosion sound
    playExplosionSound(0.5 + size / 20);
}

// Play explosion sound with variable volume
function playExplosionSound(volume = 0.5) {
    if (!audioContext) return;
    
    try {
        // Create explosion sound
        const explosion = audioContext.createOscillator();
        explosion.type = 'triangle';
        explosion.frequency.setValueAtTime(100, audioContext.currentTime);
        explosion.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 1.5);
        
        const explosionGain = audioContext.createGain();
        explosionGain.gain.setValueAtTime(volume, audioContext.currentTime);
        explosionGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
        
        explosion.connect(explosionGain);
        explosionGain.connect(audioContext.destination);
        
        explosion.start();
        explosion.stop(audioContext.currentTime + 1.5);
    } catch (e) {
        console.warn("Error playing explosion sound:", e);
    }
}

// Check if aircraft is within blast radius and apply damage
function checkBlastDamage(projectile) {
    if (physics.crashed) return; // Already crashed
    
    // Calculate distance from blast to aircraft
    const distance = projectile.mesh.position.distanceTo(aircraft.position);
    const blastRadius = projectile.type === 'missile' ? 50 : 30;
    
    // If within blast radius, trigger damage
    if (distance < blastRadius) {
        const damageAmount = (1 - distance / blastRadius) * projectile.damage;
        console.log(`Aircraft took ${damageAmount.toFixed(1)} damage from blast!`);
        
        // If damage is significant, crash the aircraft
        if (damageAmount > 50) {
            physics.crashed = true;
            console.log("Aircraft destroyed by explosion!");
        }
    }
}

// Update active explosions
function updateExplosions(delta) {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        
        // Update age
        explosion.age += delta;
        
        // Update explosion visuals
        const core = explosion.mesh.children[0];
        const outer = explosion.mesh.children[1];
        
        // Fade out core and outer explosion
        const coreOpacity = Math.max(0, 0.9 * (1 - explosion.age / explosion.maxAge));
        const outerOpacity = Math.max(0, 0.7 * (1 - explosion.age / explosion.maxAge));
        
        core.material.opacity = coreOpacity;
        outer.material.opacity = outerOpacity;
        
        // Expand outer explosion
        const expansionFactor = 1 + explosion.age;
        outer.scale.set(expansionFactor, expansionFactor, expansionFactor);
        
        // Update smoke particles
        for (let j = 2; j < explosion.mesh.children.length; j++) {
            const smoke = explosion.mesh.children[j];
            
            // Update position
            smoke.position.add(smoke.velocity.clone().multiplyScalar(delta));
            
            // Apply "gravity" effect to velocity
            smoke.velocity.y -= 5 * delta;
            
            // Expand smoke
            const smokeExpansion = 1 + smoke.growthRate * delta;
            smoke.scale.multiplyScalar(smokeExpansion);
            
            // Fade smoke
            smoke.material.opacity -= 0.2 * delta;
        }
        
        // Check for end of explosion
        if (explosion.age >= explosion.maxAge) {
            scene.remove(explosion.mesh);
            explosions.splice(i, 1);
        }
    }
}

// Update debug info
function updateDebugInfo() {
    const debug = document.getElementById('debug');
    if (debug && debug.style.display !== 'none') {
        const keysStatus = Object.entries(controls.keysPressed)
            .filter(([key, value]) => value)
            .map(([key]) => key)
            .join(', ');
            
        let weaponInfo = '';
        if (physics.weaponSelect === 0) {
            weaponInfo = `Gun: ${physics.gunAmmo} rounds`;
        } else if (physics.weaponSelect === 1) {
            weaponInfo = `Missiles: ${physics.missileCount}`;
        } else {
            weaponInfo = `Rockets: ${physics.rocketCount}`;
        }
            
        debug.innerHTML = `
            <div>Controls Status:</div>
            <div>Pitch: ${controls.pitch.toFixed(2)}</div>
            <div>Roll: ${controls.roll.toFixed(2)}</div>
            <div>Yaw: ${controls.yaw.toFixed(2)}</div>
            <div>Throttle: ${(controls.throttle * 100).toFixed(0)}%</div>
            <div>Afterburner: ${controls.afterburner ? 'ON' : 'OFF'}</div>
            <div>Keys Pressed: ${keysStatus || 'None'}</div>
            <div>Weapon: ${physics.weaponSelect === 0 ? 'GUN' : physics.weaponSelect === 1 ? 'MISSILE' : 'ROCKET'}</div>
            <div>${weaponInfo}</div>
            <div>Active Projectiles: ${projectiles.length}</div>
            <div>Active Explosions: ${explosions.length}</div>
            <div>Physics:</div>
            <div>Velocity: ${physics.velocity.length().toFixed(1)} m/s</div>
            <div>Altitude: ${physics.altitude.toFixed(1)} m</div>
        `;
    }
}

// Update HUD display with weapon info
function updateHUD(flightData, weaponStatus) {
    const hud = document.getElementById('hud');
    if (!hud) return;
    
    // Clear existing HUD
    if (!hud.querySelector('.hud-container')) {
        hud.innerHTML = '<div class="hud-container"></div>';
    }
    
    const hudContainer = hud.querySelector('.hud-container');
    
    // Update or create HUD elements
    hudContainer.innerHTML = `
        <div class="hud-element hud-altitude">ALT: ${Math.round(flightData.altitude)} m</div>
        <div class="hud-element hud-speed">SPD: ${Math.round(flightData.speed)} km/h</div>
        <div class="hud-element hud-heading">HDG: ${Math.round(flightData.heading)}°</div>
        <div class="hud-element hud-throttle">THR: ${Math.round(flightData.throttle)}%${flightData.afterburner ? ' A/B' : ''}</div>
        <div class="hud-element hud-vspeed">V/S: ${Math.round(flightData.verticalSpeed)} m/min</div>
        <div class="hud-element hud-gear">GEAR: ${flightData.gearDown ? 'DOWN' : 'UP'}</div>
        <div class="hud-element hud-weapon">WPN: ${weaponStatus.currentWeapon}</div>
        <div class="hud-element hud-ammo">AMO: ${
            weaponStatus.currentWeapon === "GUN" ? weaponStatus.gunAmmo + " RDS" :
            weaponStatus.currentWeapon === "MISSILE" ? weaponStatus.missileCount + " MSL" :
            weaponStatus.rocketCount + " RKT"
        }</div>
        <div class="hud-element hud-enemies">BOGEYS: ${enemyAircraft.length}</div>
        <div class="hud-element hud-score">SCORE: ${playerScore}</div>
    `;
    
    // Add weapon aiming reticle
    if (!document.getElementById('reticle')) {
        const reticle = document.createElement('div');
        reticle.id = 'reticle';
        reticle.innerHTML = `
            <div class="reticle-circle"></div>
            <div class="reticle-crosshair-h"></div>
            <div class="reticle-crosshair-v"></div>
        `;
        hudContainer.appendChild(reticle);
    }
    
    // Highlight reticle when firing
    const reticle = document.getElementById('reticle');
    if (reticle) {
        if (weaponStatus.isFiring) {
            reticle.classList.add('firing');
        } else {
            reticle.classList.remove('firing');
        }
    }
    
    // Update flight info
    const flightInfo = document.getElementById('flight-info');
    if (flightInfo) {
        flightInfo.innerHTML = `
            <div>FIGHTER JET SIMULATOR</div>
            <div>PITCH: ${Math.round(flightData.pitch)}°</div>
            <div>ROLL: ${Math.round(flightData.roll)}°</div>
            <div>ENEMIES: ${enemyAircraft.length}</div>
            <div>DIFFICULTY: ${difficultyLevel}</div>
        `;
    }
}

// Reset aircraft after crash
function resetAircraft() {
    // Remove debris
    for (const debris of crashDebris) {
        scene.remove(debris);
    }
    crashDebris.length = 0;
    
    // Clear all projectiles and explosions
    for (const projectile of projectiles) {
        scene.remove(projectile.mesh);
    }
    projectiles.length = 0;
    
    for (const explosion of explosions) {
        scene.remove(explosion.mesh);
    }
    explosions.length = 0;
    
    // Reset aircraft position and physics
    aircraft.position.set(0, 1.5, -2150); // Reset to runway start position (adjusted for longer runway)
    aircraft.rotation.set(0, Math.PI, 0);
    aircraft.visible = true;
    
    // Reset physics
    physics = FlightPhysics.init();
    physics.altitude = aircraft.position.y;
    
    // Hide crash message
    document.getElementById('crash-message').style.display = 'none';
    
    // Reset controls
    controls = Controls.init();
    Controls.setupListeners(controls);
    
    // Reset timer
    restartTimer = 0;
}

// Update camera position and rotation
function updateCamera() {
    // Different camera modes
    if (controls.keysPressed['1']) {
        // Cockpit view
        const cockpitPos = new THREE.Vector3(4, 1.2, 0);
        cockpitPos.applyQuaternion(aircraft.quaternion);
        cockpitPos.add(aircraft.position);
        
        camera.position.copy(cockpitPos);
        camera.quaternion.copy(aircraft.quaternion);
        
        // Apply mouse look
        if (controls.mouseLook) {
            const lookQuat = new THREE.Quaternion()
                .setFromEuler(new THREE.Euler(
                    THREE.MathUtils.degToRad(controls.mouseLook.y),
                    THREE.MathUtils.degToRad(controls.mouseLook.x),
                    0,
                    'YXZ'
                ));
            camera.quaternion.multiply(lookQuat);
        }
    } else if (controls.keysPressed['2']) {
        // External follow camera
        const offset = new THREE.Vector3(-15, 5, 0);
        offset.applyQuaternion(aircraft.quaternion);
        
        camera.position.copy(aircraft.position).add(offset);
        camera.lookAt(aircraft.position);
    } else {
        // Default chase camera
        const cameraOffset = new THREE.Vector3(-10, 3, 0);
        cameraOffset.applyQuaternion(aircraft.quaternion);
        
        const targetPos = aircraft.position.clone().add(cameraOffset);
        camera.position.lerp(targetPos, 0.1);
        
        const lookAtPos = aircraft.position.clone();
        const forwardOffset = new THREE.Vector3(5, 0, 0);
        forwardOffset.applyQuaternion(aircraft.quaternion);
        lookAtPos.add(forwardOffset);
        
        camera.lookAt(lookAtPos);
    }
}

// Update engine sound based on throttle
function updateEngineSound() {
    if (!audioContext || !engineSound || !engineGain) return;
    
    try {
        // Base frequency depends on throttle
        const baseFreq = 50 + physics.throttle * 100;
        
        // Add afterburner effect
        const afterburnerFreq = physics.afterburner ? 150 : 0;
        
        // Set frequency with slight randomness for realism
        const frequency = baseFreq + afterburnerFreq + Math.random() * 10;
        engineSound.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        // Set volume based on throttle and afterburner
        const volume = Math.min(1, physics.throttle * 0.8 + (physics.afterburner ? 0.2 : 0));
        engineGain.gain.setValueAtTime(volume, audioContext.currentTime);
    } catch (e) {
        console.warn("Error updating engine sound:", e);
    }
}

// Trigger visual effects when aircraft crashes
function triggerCrashEffects() {
    // Hide the aircraft
    //aircraft.visible = false;
    
    // Create debris particles
    const debrisCount = 20;
    const debrisGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const debrisMaterials = [
        new THREE.MeshPhongMaterial({ color: 0x333333 }),
        new THREE.MeshPhongMaterial({ color: 0x555555 }),
        new THREE.MeshPhongMaterial({ color: 0x777777 })
    ];
    
    for (let i = 0; i < debrisCount; i++) {
        const material = debrisMaterials[Math.floor(Math.random() * debrisMaterials.length)];
        const debris = new THREE.Mesh(debrisGeometry, material);
        
        // Position at aircraft
        debris.position.copy(aircraft.position);
        
        // Add random velocity
        debris.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            Math.random() * 15,
            (Math.random() - 0.5) * 10
        );
        
        // Add random rotation
        debris.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
        
        debris.rotationSpeed = new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
        );
        
        scene.add(debris);
        crashDebris.push(debris);
    }
    
    // Create smoke particles
    const smokeCount = 30;
    const smokeGeometry = new THREE.SphereGeometry(1, 8, 8);
    const smokeMaterial = new THREE.MeshBasicMaterial({
        color: 0x222222,
        transparent: true,
        opacity: 0.7
    });
    
    for (let i = 0; i < smokeCount; i++) {
        const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
        
        // Position at aircraft
        smoke.position.copy(aircraft.position);
        
        // Random size
        const size = 1 + Math.random() * 3;
        smoke.scale.set(size, size, size);
        
        // Add random velocity (slower than debris)
        smoke.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            Math.random() * 5 + 2,
            (Math.random() - 0.5) * 5
        );
        
        // Smoke expands and fades
        smoke.growRate = 0.5 + Math.random() * 1;
        smoke.fadeRate = 0.01 + Math.random() * 0.05;
        
        scene.add(smoke);
        crashDebris.push(smoke);
    }
    
    // Create fire particles
    const fireCount = 15;
    const fireGeometry = new THREE.SphereGeometry(1, 8, 8);
    const fireMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4500,
        transparent: true,
        opacity: 0.9
    });
    
    for (let i = 0; i < fireCount; i++) {
        const fire = new THREE.Mesh(fireGeometry, fireMaterial);
        
        // Position at aircraft
        fire.position.copy(aircraft.position);
        
        // Random size
        const size = 0.5 + Math.random() * 1.5;
        fire.scale.set(size, size, size);
        
        // Add random velocity
        fire.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            Math.random() * 8 + 5,
            (Math.random() - 0.5) * 3
        );
        
        // Fire fades faster than smoke
        fire.fadeRate = 0.02 + Math.random() * 0.08;
        
        scene.add(fire);
        crashDebris.push(fire);
    }
    
    // Play explosion sound if audio is available
    try {
        if (audioContext) {
            const explosion = audioContext.createOscillator();
            explosion.type = 'triangle';
            explosion.frequency.setValueAtTime(100, audioContext.currentTime);
            explosion.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 1.5);
            
            const explosionGain = audioContext.createGain();
            explosionGain.gain.setValueAtTime(1, audioContext.currentTime);
            explosionGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
            
            explosion.connect(explosionGain);
            explosionGain.connect(audioContext.destination);
            
            explosion.start();
            explosion.stop(audioContext.currentTime + 1.5);
        }
    } catch (e) {
        console.warn("Error playing explosion sound:", e);
    }
}

// Update debris particles
function updateDebris(delta) {
    const gravity = new THREE.Vector3(0, -9.8, 0);
    
    for (let i = crashDebris.length - 1; i >= 0; i--) {
        const debris = crashDebris[i];
        
        // Apply gravity to velocity
        debris.velocity.addScaledVector(gravity, delta);
        
        // Update position
        debris.position.addScaledVector(debris.velocity, delta);
        
        // Handle ground collision
        if (debris.position.y < 0) {
            debris.position.y = 0;
            debris.velocity.y = -debris.velocity.y * 0.3; // Bounce with energy loss
            debris.velocity.x *= 0.8; // Friction
            debris.velocity.z *= 0.8; // Friction
            
            // Stop very slow debris
            if (debris.velocity.length() < 0.5) {
                debris.velocity.set(0, 0, 0);
            }
        }
        
        // Update rotation if this debris has rotation speed
        if (debris.rotationSpeed) {
            debris.rotation.x += debris.rotationSpeed.x * delta;
            debris.rotation.y += debris.rotationSpeed.y * delta;
            debris.rotation.z += debris.rotationSpeed.z * delta;
        }
        
        // Handle smoke/fire effects
        if (debris.growRate) {
            // Grow the smoke
            const growAmount = debris.growRate * delta;
            debris.scale.x += growAmount;
            debris.scale.y += growAmount;
            debris.scale.z += growAmount;
        }
        
        if (debris.fadeRate) {
            // Fade the smoke/fire
            debris.material.opacity -= debris.fadeRate;
            
            // Remove if fully faded
            if (debris.material.opacity <= 0) {
                scene.remove(debris);
                crashDebris.splice(i, 1);
            }
        }
    }
}

// Update instruments
function updateInstruments(flightData) {
    // Update airspeed indicator
    const airspeedGauge = document.getElementById('airspeed-gauge');
    if (airspeedGauge) {
        const needle = airspeedGauge.querySelector('.needle');
        const speedRatio = Math.min(1, flightData.speed / 2500);
        const speedDegrees = speedRatio * 270 - 135;
        needle.style.transform = `rotate(${speedDegrees}deg)`;
    }
    
    // Update altitude indicator
    const altitudeGauge = document.getElementById('altitude-gauge');
    if (altitudeGauge) {
        const needle = altitudeGauge.querySelector('.needle');
        const altRatio = Math.min(1, flightData.altitude / 15000);
        const altDegrees = altRatio * 270 - 135;
        needle.style.transform = `rotate(${altDegrees}deg)`;
    }
    
    // Update vertical speed indicator
    const varioGauge = document.getElementById('vario-gauge');
    if (varioGauge) {
        const needle = varioGauge.querySelector('.needle');
        const vsRatio = (flightData.verticalSpeed + 3000) / 6000; // Range from -3000 to +3000
        const vsDegrees = vsRatio * 270 - 135;
        needle.style.transform = `rotate(${vsDegrees}deg)`;
    }
    
    // Update heading indicator
    const headingGauge = document.getElementById('heading-gauge');
    if (headingGauge) {
        const needle = headingGauge.querySelector('.needle');
        const hdgDegrees = flightData.heading - 135;
        needle.style.transform = `rotate(${hdgDegrees}deg)`;
    }
    
    // Update bank indicator
    const bankGauge = document.getElementById('bank-gauge');
    if (bankGauge) {
        const needle = bankGauge.querySelector('.needle');
        const bankDegrees = flightData.roll;
        needle.style.transform = `rotate(${bankDegrees}deg)`;
    }
}

// Create an enemy aircraft
function createEnemyAircraft() {
    // Enemy fighter jet group
    const enemyGroup = new THREE.Group();
    
    // Enemy body - smaller than player aircraft
    const bodyGeometry = new THREE.CylinderGeometry(1, 0.8, 12, 16);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,  // Dark gray
        specular: 0x111111,
        shininess: 30
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    enemyGroup.add(body);
    
    // Wings
    const wingGeometry = new THREE.BoxGeometry(4, 0.2, 8);
    const wingMaterial = new THREE.MeshPhongMaterial({
        color: 0x444444,
        specular: 0x222222,
        shininess: 30
    });
    
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.castShadow = true;
    enemyGroup.add(wings);
    
    // Tail
    const tailGeometry = new THREE.BoxGeometry(3, 2, 0.2);
    const tail = new THREE.Mesh(tailGeometry, wingMaterial);
    tail.position.set(-5, 1, 0);
    tail.castShadow = true;
    enemyGroup.add(tail);
    
    // Nose cone
    const noseGeometry = new THREE.ConeGeometry(1, 3, 16);
    const nose = new THREE.Mesh(noseGeometry, bodyMaterial);
    nose.rotation.z = Math.PI / 2;
    nose.position.set(7.5, 0, 0);
    nose.castShadow = true;
    enemyGroup.add(nose);
    
    // Add markings to make enemy aircraft visually distinct
    const markingGeometry = new THREE.CylinderGeometry(1.01, 0.81, 4, 16);
    const markingMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,  // Red markings
        specular: 0x222222,
        shininess: 30
    });
    
    const marking = new THREE.Mesh(markingGeometry, markingMaterial);
    marking.rotation.z = Math.PI / 2;
    marking.position.set(2, 0, 0);
    enemyGroup.add(marking);
    
    // Random initial position (relatively far from player but within view distance)
    const distance = 2000 + Math.random() * 3000; // 2-5km away
    const angle = Math.random() * Math.PI * 2; // Random direction
    
    // Position relative to player, but at least 500m altitude
    const x = aircraft.position.x + Math.sin(angle) * distance;
    const z = aircraft.position.z + Math.cos(angle) * distance;
    const y = Math.max(aircraft.position.y + 500, 1000);  // Either 500m above player or at least 1000m altitude
    
    enemyGroup.position.set(x, y, z);
    
    // Initial facing toward player
    enemyGroup.lookAt(aircraft.position);
    
    // Add to scene
    scene.add(enemyGroup);
    
    // Add to enemy aircraft array with AI behavior data
    enemyCount++;
    enemyAircraft.push({
        mesh: enemyGroup,
        id: 'enemy-' + enemyCount,
        health: 100,
        speed: 200 + Math.random() * 100, // 200-300 units/sec
        turnRate: 0.5 + Math.random() * 0.5, // turning ability
        state: 'pursuing', // pursuing, attacking, evading
        lastFired: 0,
        fireRate: 2 + Math.random() * 3, // shots per second
        accuracy: 0.7 + (difficultyLevel * 0.05), // 0-1 accuracy factor
        evasionTimer: 0,
        targetingTimer: 0,
        targetPosition: new THREE.Vector3(),
        distanceToPlayer: distance
    });
    
    // Add red blip to radar
    radarTargets.push({
        id: 'enemy-' + enemyCount,
        position: enemyGroup.position,
        type: 'enemy',
        mesh: enemyGroup
    });
    
    // Play a warning sound
    playWarningSound();
    
    return enemyGroup;
}

// Update enemy aircraft behavior
function updateEnemyAircraft(delta) {
    if (physics.crashed) return; // Don't update if player crashed
    
    for (let i = enemyAircraft.length - 1; i >= 0; i--) {
        const enemy = enemyAircraft[i];
        
        // Skip destroyed enemies
        if (!enemy.mesh) continue;
        
        // Calculate distance to player
        const distanceVector = aircraft.position.clone().sub(enemy.mesh.position);
        enemy.distanceToPlayer = distanceVector.length();
        
        // Update enemy targeting - slight randomness in aim for realism
        enemy.targetPosition = aircraft.position.clone().add(
            new THREE.Vector3(
                (Math.random() - 0.5) * (1 - enemy.accuracy) * 100,
                (Math.random() - 0.5) * (1 - enemy.accuracy) * 100,
                (Math.random() - 0.5) * (1 - enemy.accuracy) * 100
            )
        );
        
        // Different behavior based on state
        switch (enemy.state) {
            case 'pursuing':
                // Move toward player at full speed
                const pursuitDirection = enemy.targetPosition.clone().sub(enemy.mesh.position).normalize();
                enemy.mesh.position.add(pursuitDirection.multiplyScalar(enemy.speed * delta));
                
                // Gradually turn to face player
                const pursuitTarget = enemy.targetPosition.clone();
                enemy.mesh.lookAt(pursuitTarget);
                
                // Transition to attacking when close enough
                if (enemy.distanceToPlayer < 1000) {
                    enemy.state = 'attacking';
                }
                break;
                
            case 'attacking':
                // Move toward player but keep some distance
                const attackDirection = enemy.targetPosition.clone().sub(enemy.mesh.position).normalize();
                
                // If too close, back off slightly
                if (enemy.distanceToPlayer < 500) {
                    enemy.mesh.position.add(attackDirection.multiplyScalar(enemy.speed * 0.5 * delta));
                } else {
                    enemy.mesh.position.add(attackDirection.multiplyScalar(enemy.speed * delta));
                }
                
                // Look at player for attack
                enemy.mesh.lookAt(enemy.targetPosition);
                
                // Fire weapons if cooldown expired
                enemy.lastFired -= delta;
                if (enemy.lastFired <= 0 && enemy.distanceToPlayer < 1500) {
                    // Fire at player
                    fireEnemyWeapon(enemy);
                    enemy.lastFired = 1 / enemy.fireRate; // Reset cooldown
                }
                
                // Randomly transition to evasion
                enemy.targetingTimer += delta;
                if (enemy.targetingTimer > 5 + Math.random() * 5) {
                    enemy.state = 'evading';
                    enemy.evasionTimer = 2 + Math.random() * 3; // 2-5 seconds of evasion
                    enemy.targetingTimer = 0;
                }
                break;
                
            case 'evading':
                // Perform evasive maneuvers - fly in a less predictable pattern
                const evasionDirection = new THREE.Vector3(
                    Math.sin(Date.now() * 0.001) * 0.5,
                    Math.cos(Date.now() * 0.002) * 0.3,
                    Math.sin(Date.now() * 0.0015) * 0.5
                ).normalize();
                
                // Still move generally toward player but with randomness
                const playerDirection = aircraft.position.clone().sub(enemy.mesh.position).normalize();
                evasionDirection.add(playerDirection).normalize();
                
                // Move in the calculated direction
                enemy.mesh.position.add(evasionDirection.multiplyScalar(enemy.speed * 1.2 * delta)); // Faster during evasion
                
                // Look in the direction of movement
                const lookTarget = enemy.mesh.position.clone().add(evasionDirection);
                enemy.mesh.lookAt(lookTarget);
                
                // Reduce evasion timer
                enemy.evasionTimer -= delta;
                if (enemy.evasionTimer <= 0) {
                    // Return to attacking or pursuing based on distance
                    enemy.state = enemy.distanceToPlayer < 1000 ? 'attacking' : 'pursuing';
                }
                break;
        }
        
        // Check if enemy is too far (over 10km from player) and should be removed
        if (enemy.distanceToPlayer > 10000) {
            scene.remove(enemy.mesh);
            enemyAircraft.splice(i, 1);
            
            // Remove from radar
            for (let j = radarTargets.length - 1; j >= 0; j--) {
                if (radarTargets[j].id === enemy.id) {
                    radarTargets.splice(j, 1);
                    break;
                }
            }
        }
        
        // Check if enemy is hit by player projectiles
        checkEnemyHit(enemy, i);
    }
}

// Check if enemy is hit by player projectiles
function checkEnemyHit(enemy, enemyIndex) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        
        // Distance from projectile to enemy
        const distance = projectile.mesh.position.distanceTo(enemy.mesh.position);
        
        // Hit detection radius depends on projectile type
        const hitRadius = 
            projectile.type === 'bullet' ? 5 : 
            projectile.type === 'missile' ? 15 : 10;
        
        if (distance < hitRadius) {
            // Enemy is hit!
            
            // Apply damage based on projectile type
            const damage = projectile.damage;
            enemy.health -= damage;
            
            // Create explosion effect at hit point
            createExplosion(projectile.mesh.position.clone(), damage / 5);
            
            // Remove projectile
            scene.remove(projectile.mesh);
            projectiles.splice(i, 1);
            
            // If enemy is destroyed
            if (enemy.health <= 0) {
                // Create bigger explosion
                createExplosion(enemy.mesh.position.clone(), 15);
                
                // Remove enemy aircraft
                scene.remove(enemy.mesh);
                enemyAircraft.splice(enemyIndex, 1);
                
                // Remove from radar
                for (let j = radarTargets.length - 1; j >= 0; j--) {
                    if (radarTargets[j].id === enemy.id) {
                        radarTargets.splice(j, 1);
                        break;
                    }
                }
                
                // Increase player score
                playerScore += 100;
                
                // Show score update
                const scoreMsg = document.createElement('div');
                scoreMsg.className = 'score-message';
                scoreMsg.textContent = '+100';
                document.body.appendChild(scoreMsg);
                
                // Fade out and remove after animation
                setTimeout(() => {
                    scoreMsg.classList.add('fadeout');
                    setTimeout(() => {
                        document.body.removeChild(scoreMsg);
                    }, 1000);
                }, 500);
                
                break;
            }
        }
    }
}

// Fire enemy weapon at player
function fireEnemyWeapon(enemy) {
    // Calculate firing direction with some inaccuracy
    const direction = aircraft.position.clone().sub(enemy.mesh.position).normalize();
    
    // Add inaccuracy based on enemy accuracy
    const inaccuracy = (1 - enemy.accuracy) * 0.2; // 0-0.2 radians of deviation
    direction.x += (Math.random() - 0.5) * inaccuracy;
    direction.y += (Math.random() - 0.5) * inaccuracy;
    direction.z += (Math.random() - 0.5) * inaccuracy;
    direction.normalize();
    
    // Create enemy bullet at aircraft position
    const bulletGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red tracer
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    // Position bullet at front of enemy aircraft
    const bulletPos = enemy.mesh.position.clone().add(direction.clone().multiplyScalar(10));
    bullet.position.copy(bulletPos);
    
    // Add tracer effect
    const tracerGeometry = new THREE.CylinderGeometry(0.2, 0.2, 4, 4);
    const tracerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.8
    });
    
    const tracer = new THREE.Mesh(tracerGeometry, tracerMaterial);
    tracer.rotation.x = Math.PI / 2;
    tracer.position.set(0, 0, -2); // Position behind the bullet
    
    bullet.add(tracer);
    scene.add(bullet);
    
    // Add to enemy projectiles
    enemyProjectiles.push({
        mesh: bullet,
        velocity: direction.multiplyScalar(600), // 600 units/sec
        damage: 10,
        distance: 0,
        maxDistance: 2000 // 2km range
    });
    
    // Play enemy fire sound
    playEnemyFireSound();
}

// Update enemy projectiles
function updateEnemyProjectiles(delta) {
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const projectile = enemyProjectiles[i];
        
        // Update position
        projectile.mesh.position.add(projectile.velocity.clone().multiplyScalar(delta));
        
        // Update distance traveled
        const distanceDelta = projectile.velocity.length() * delta;
        projectile.distance += distanceDelta;
        
        // Check for maximum range
        if (projectile.distance > projectile.maxDistance) {
            scene.remove(projectile.mesh);
            enemyProjectiles.splice(i, 1);
            continue;
        }
        
        // Check for hit on player
        const distanceToPlayer = projectile.mesh.position.distanceTo(aircraft.position);
        if (distanceToPlayer < 5 && !physics.crashed) { // 5-unit hit radius
            // Create explosion at hit point
            createExplosion(projectile.mesh.position.clone(), 5);
            
            // Apply damage to player (trigger crash)
            physics.crashed = true; // Set the crashed state
            
            // Trigger crash effects
            triggerCrashEffects(); // Call the function to handle crash effects
            
            // Remove projectile
            scene.remove(projectile.mesh);
            enemyProjectiles.splice(i, 1);
        }
    }
}

// Update enemy spawning logic
function updateEnemySpawning(delta) {
    // Increment timer
    enemySpawnTimer += delta;
    
    // Increase difficulty over time (every 5 minutes)
    const gameDuration = clock.getElapsedTime() / 60; // in minutes
    difficultyLevel = 1 + Math.floor(gameDuration / 5);
    
    // Spawn interval decreases with difficulty (faster spawns at higher levels)
    const spawnInterval = Math.max(30, 120 - (difficultyLevel * 15)); // 120 to 30 seconds
    
    // If enough time has passed and we're under the max enemy count, spawn a new enemy
    const maxEnemies = 2 + difficultyLevel; // 3 to 7 enemies based on level
    
    if (enemySpawnTimer > spawnInterval && enemyAircraft.length < maxEnemies) {
        spawnEnemyAircraft();
        enemySpawnTimer = 0;
    }
}

// Spawn a new enemy aircraft
function spawnEnemyAircraft() {
    if (physics.crashed) return; // Don't spawn if player crashed
    
    createEnemyAircraft();
    
    // Notify player
    showEnemyAlert();
}

// Show enemy alert message
function showEnemyAlert() {
    const alert = document.createElement('div');
    alert.className = 'enemy-alert';
    alert.textContent = 'WARNING: ENEMY AIRCRAFT DETECTED';
    document.body.appendChild(alert);
    
    // Remove after animation
    setTimeout(() => {
        alert.classList.add('fadeout');
        setTimeout(() => {
            document.body.removeChild(alert);
        }, 1000);
    }, 3000);
}

// Update radar display
function updateRadar() {
    // Find or create radar container
    let radar = document.getElementById('radar-container');
    if (!radar) {
        radar = document.createElement('div');
        radar.id = 'radar-container';
        document.body.appendChild(radar);
        
        // Create radar background
        const radarBg = document.createElement('div');
        radarBg.className = 'radar-background';
        radar.appendChild(radarBg);
        
        // Create player blip
        const playerBlip = document.createElement('div');
        playerBlip.className = 'radar-blip player-blip';
        playerBlip.id = 'player-blip';
        radar.appendChild(playerBlip);
        
        // Add sweep effect
        const radarSweep = document.createElement('div');
        radarSweep.className = 'radar-sweep';
        radar.appendChild(radarSweep);
    }
    
    // Update player blip in center
    const playerBlip = document.getElementById('player-blip');
    if (playerBlip) {
        playerBlip.style.left = '50%';
        playerBlip.style.top = '50%';
    }
    
    // Update or create blips for enemies
    for (let i = 0; i < radarTargets.length; i++) {
        const target = radarTargets[i];
        
        // Get or create blip for this enemy
        let blip = document.getElementById(`blip-${target.id}`);
        if (!blip) {
            blip = document.createElement('div');
            blip.id = `blip-${target.id}`;
            blip.className = 'radar-blip enemy-blip';
            radar.appendChild(blip);
        }
        
        // Calculate relative position (radar is 200px wide, 200px tall)
        // Convert world position to radar position
        const relX = aircraft.position.x - target.position.x;
        const relZ = aircraft.position.z - target.position.z;
        
        // Scale and clamp to radar size (5000 units = 100px)
        const radarScale = 100 / 5000;
        const blipX = 50 - relX * radarScale; // 50% is center
        const blipZ = 50 - relZ * radarScale;
        
        // Clamp positions to radar bounds
        const clampedX = Math.max(5, Math.min(95, blipX));
        const clampedZ = Math.max(5, Math.min(95, blipZ));
        
        // Update blip position
        blip.style.left = `${clampedX}%`;
        blip.style.top = `${clampedZ}%`;
        
        // Make blips fade with distance
        const distance = target.position.distanceTo(aircraft.position);
        const opacity = Math.max(0.3, Math.min(1, 2000 / distance));
        blip.style.opacity = opacity;
    }
    
    // Clean up old blips
    const blips = document.getElementsByClassName('enemy-blip');
    for (let i = blips.length - 1; i >= 0; i--) {
        const blip = blips[i];
        let found = false;
        for (let j = 0; j < radarTargets.length; j++) {
            if (blip.id === `blip-${radarTargets[j].id}`) {
                found = true;
                break;
            }
        }
        if (!found) {
            blip.parentNode.removeChild(blip);
        }
    }
}

// Play enemy detection warning sound
function playWarningSound() {
    if (!audioContext) return;
    
    try {
        const warning = audioContext.createOscillator();
        warning.type = 'sine';
        
        // Create a gain node for volume control
        const warningGain = audioContext.createGain();
        warningGain.gain.value = 0.2;
        
        // Connect the oscillator to the gain node, and the gain node to the destination
        warning.connect(warningGain);
        warningGain.connect(audioContext.destination);
        
        // Warning sound pattern
        warning.frequency.setValueAtTime(880, audioContext.currentTime); // A5
        warning.frequency.setValueAtTime(440, audioContext.currentTime + 0.2); // A4
        warning.frequency.setValueAtTime(880, audioContext.currentTime + 0.4); // A5
        warning.frequency.setValueAtTime(440, audioContext.currentTime + 0.6); // A4
        
        // Start and stop the oscillator
        warning.start();
        warning.stop(audioContext.currentTime + 0.8);
    } catch (e) {
        console.warn("Error playing warning sound:", e);
    }
}

// Play enemy weapon firing sound
function playEnemyFireSound() {
    if (!audioContext) return;
    
    try {
        const fire = audioContext.createOscillator();
        fire.type = 'square';
        fire.frequency.value = 60;
        
        const fireGain = audioContext.createGain();
        fireGain.gain.setValueAtTime(0.1, audioContext.currentTime);
        fireGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        fire.connect(fireGain);
        fireGain.connect(audioContext.destination);
        
        fire.start();
        fire.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.warn("Error playing enemy fire sound:", e);
    }
}
