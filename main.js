// Main Flight Simulator Application
let scene, camera, renderer;
let aircraft, physics, controls, environment;
let clock, lastTime = 0;
let audioContext, engineSound, engineGain;
let crashDebris = [];
let restartTimer = 0;

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
            
            console.log("Audio setup complete");
        }
    } catch (e) {
        console.warn("Audio not available:", e);
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
        <h2>Welcome to Fighter Jet Simulator</h2>
        <p>Controls:</p>
        <ul>
            <li>W/S or ↑/↓ - Pitch (nose up/down)</li>
            <li>A/D or ←/→ - Roll (bank left/right)</li>
            <li>Q/E - Yaw (rudder left/right)</li>
            <li>Shift - Increase throttle</li>
            <li>Ctrl - Decrease throttle</li>
            <li>G - Toggle landing gear</li>
            <li>X - Toggle afterburner</li>
            <li>B - Toggle brakes</li>
            <li>D - Toggle debug info</li>
        </ul>
        <p>Start at the runway, take off, and enjoy your flight!</p>
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
    
    // Update physics
    physics = FlightPhysics.update(physics, aircraft, environment, delta);
    
    // Update engine sound
    updateEngineSound();
    
    // Update camera
    updateCamera();
    
    // Update HUD and instruments
    const flightData = FlightPhysics.getFlightData(physics);
    updateHUD(flightData);
    updateInstruments(flightData);
    
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

// Update debug info
function updateDebugInfo() {
    const debug = document.getElementById('debug');
    if (debug && debug.style.display !== 'none') {
        const keysStatus = Object.entries(controls.keysPressed)
            .filter(([key, value]) => value)
            .map(([key]) => key)
            .join(', ');
            
        debug.innerHTML = `
            <div>Controls Status:</div>
            <div>Pitch: ${controls.pitch.toFixed(2)}</div>
            <div>Roll: ${controls.roll.toFixed(2)}</div>
            <div>Yaw: ${controls.yaw.toFixed(2)}</div>
            <div>Throttle: ${(controls.throttle * 100).toFixed(0)}%</div>
            <div>Afterburner: ${controls.afterburner ? 'ON' : 'OFF'}</div>
            <div>Keys Pressed: ${keysStatus || 'None'}</div>
            <div>Physics:</div>
            <div>Velocity: ${physics.velocity.length().toFixed(1)} m/s</div>
            <div>Altitude: ${physics.altitude.toFixed(1)} m</div>
        `;
    }
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

// Reset aircraft after crash
function resetAircraft() {
    // Remove debris
    for (const debris of crashDebris) {
        scene.remove(debris);
    }
    crashDebris.length = 0;
    
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

// Update HUD display
function updateHUD(flightData) {
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
    `;
    
    // Update flight info
    const flightInfo = document.getElementById('flight-info');
    if (flightInfo) {
        flightInfo.innerHTML = `
            <div>FIGHTER JET SIMULATOR</div>
            <div>PITCH: ${Math.round(flightData.pitch)}°</div>
            <div>ROLL: ${Math.round(flightData.roll)}°</div>
        `;
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