// Flight Controls Manager
const Controls = {
    // Initialize control state
    init: function() {
        console.log("Initializing controls");
        const controls = {
            // Control inputs (range from -1 to 1 for most controls)
            pitch: 0,       // Up/down (-1 is nose down, 1 is nose up)
            roll: 0,        // Left/right bank (-1 is left, 1 is right)
            yaw: 0,         // Left/right turn (-1 is left, 1 is right)
            throttle: 0,    // 0 to 1 (percentage of max power)
            brakes: 0,      // 0 to 1 (brake application)
            flaps: 0,       // 0 to 1 (flap deployment)
            gearToggle: false,  // True/false (toggle landing gear)
            afterburner: false, // True/false (afterburner engaged)
            
            // Weapon systems
            fireGun: false,       // Cannon firing state
            fireMissile: false,   // Missile firing state
            fireRocket: false,    // Rocket firing state
            weaponSelect: 0,      // 0=Gun, 1=Missile, 2=Rocket
            missileCount: 100,      // Number of missiles available
            rocketCount: 500,      // Number of rockets available
            gunAmmo: 1200,        // Rounds of gun ammo
            lastFired: 0,         // Time since last weapon fired (for cooldown)
            
            // Button states
            keysPressed: {},
            
            // Mouse state for look-around
            mouseLook: {
                active: false,
                x: 0,
                y: 0,
                lastX: 0,
                lastY: 0,
                sensitivity: 0.2
            },
            
            // Control sensitivity
            sensitivity: {
                pitch: 0.02,
                roll: 0.03,
                yaw: 0.01,
                throttle: 0.01
            }
        };

        return controls;
    },
    
    // Set up event listeners
    setupListeners: function(controls) {
        console.log("Setting up control listeners");
        
        // Keyboard controls
        document.addEventListener('keydown', function(e) {
            console.log("Key pressed:", e.key);
            controls.keysPressed[e.key.toLowerCase()] = true;
            
            // Prevent scrolling with arrow keys and space
            if(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].indexOf(e.key.toLowerCase()) > -1) {
                e.preventDefault();
            }
            
            // Handle toggle controls with key press events
            switch(e.key.toLowerCase()) {
                case 'g':
                    controls.gearToggle = !controls.gearToggle;
                    console.log("Gear toggled:", controls.gearToggle);
                    break;
                case 'b':
                    controls.brakes = controls.brakes > 0 ? 0 : 1;
                    console.log("Brakes toggled:", controls.brakes);
                    break;
                case 'f':
                    // Cycle through flap settings (0, 0.5, 1)
                    controls.flaps = (controls.flaps + 0.5) % 1.5;
                    console.log("Flaps set to:", controls.flaps);
                    break;
                case 'x':
                    // Toggle afterburner
                    controls.afterburner = !controls.afterburner;
                    console.log("Afterburner toggled:", controls.afterburner);
                    break;
                case ' ':
                    // Fire primary weapon (depends on selected weapon)
                    controls.fireGun = controls.weaponSelect === 0;
                    controls.fireMissile = controls.weaponSelect === 1;
                    controls.fireRocket = controls.weaponSelect === 2;
                    console.log("Firing weapon: ", 
                        controls.weaponSelect === 0 ? "Gun" : 
                        controls.weaponSelect === 1 ? "Missile" : "Rocket");
                    break;
                case '1':
                    // Select gun
                    controls.weaponSelect = 0;
                    console.log("Selected weapon: Gun");
                    break;
                case '2':
                    // Select missile
                    controls.weaponSelect = 1;
                    console.log("Selected weapon: Missile");
                    break;
                case '3':
                    // Select rocket
                    controls.weaponSelect = 2;
                    console.log("Selected weapon: Rocket");
                    break;
            }
        });
        
        document.addEventListener('keyup', function(e) {
            controls.keysPressed[e.key.toLowerCase()] = false;
            
            // Reset weapon firing states on key release
            if (e.key === ' ') {
                controls.fireGun = false;
                controls.fireMissile = false;
                controls.fireRocket = false;
            }
        });
        
        // Mouse controls for weapons
        document.addEventListener('mousedown', function(e) {
            if (e.button === 0) { // Left mouse button
                // Fire primary weapon (depends on selected weapon)
                controls.fireGun = controls.weaponSelect === 0;
                controls.fireMissile = controls.weaponSelect === 1;
                controls.fireRocket = controls.weaponSelect === 2;
                e.preventDefault();
            } else if (e.button === 2) { // Right mouse button
                controls.mouseLook.active = true;
                controls.mouseLook.lastX = e.clientX;
                controls.mouseLook.lastY = e.clientY;
                e.preventDefault();
            }
        });
        
        document.addEventListener('mouseup', function(e) {
            if (e.button === 0) { // Left mouse button
                controls.fireGun = false;
                controls.fireMissile = false;
                controls.fireRocket = false;
            } else if (e.button === 2) { // Right mouse button
                controls.mouseLook.active = false;
                // Reset view gradually
                controls.mouseLook.x *= 0.9;
                controls.mouseLook.y *= 0.9;
                e.preventDefault();
            }
        });
        
        // Handle mouse wheel for weapon selection
        document.addEventListener('wheel', function(e) {
            if (e.deltaY > 0) {
                // Scroll down - next weapon
                controls.weaponSelect = (controls.weaponSelect + 1) % 3;
            } else if (e.deltaY < 0) {
                // Scroll up - previous weapon
                controls.weaponSelect = (controls.weaponSelect + 2) % 3;
            }
            console.log("Selected weapon: ", 
                controls.weaponSelect === 0 ? "Gun" : 
                controls.weaponSelect === 1 ? "Missile" : "Rocket");
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', function(e) {
            if (controls.mouseLook.active) {
                const dx = e.clientX - controls.mouseLook.lastX;
                const dy = e.clientY - controls.mouseLook.lastY;
                
                controls.mouseLook.x += dx * controls.mouseLook.sensitivity;
                controls.mouseLook.y += dy * controls.mouseLook.sensitivity;
                
                // Limit look angles
                controls.mouseLook.y = Math.max(-80, Math.min(80, controls.mouseLook.y));
                
                controls.mouseLook.lastX = e.clientX;
                controls.mouseLook.lastY = e.clientY;
            }
        });
        
        // Prevent context menu on right click
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
    },
    
    // Update controls based on input
    update: function(controls, deltaTime) {
        // Process keyboard input for flight controls
        if (controls.keysPressed['w'] || controls.keysPressed['arrowup']) {
            controls.pitch += controls.sensitivity.pitch;
        }
        if (controls.keysPressed['s'] || controls.keysPressed['arrowdown']) {
            controls.pitch -= controls.sensitivity.pitch;
        }
        if (controls.keysPressed['a'] || controls.keysPressed['arrowleft']) {
            controls.roll -= controls.sensitivity.roll;
        }
        if (controls.keysPressed['d'] || controls.keysPressed['arrowright']) {
            controls.roll += controls.sensitivity.roll;
        }
        if (controls.keysPressed['q']) {
            controls.yaw -= controls.sensitivity.yaw;
        }
        if (controls.keysPressed['e']) {
            controls.yaw += controls.sensitivity.yaw;
        }
        if (controls.keysPressed['shift']) {
            controls.throttle += controls.sensitivity.throttle;
        }
        if (controls.keysPressed['control']) {
            controls.throttle -= controls.sensitivity.throttle;
        }
        
        // Update weapon firing cooldowns and ammo
        if (controls.lastFired > 0) {
            controls.lastFired -= deltaTime;
            if (controls.lastFired < 0) controls.lastFired = 0;
        }
        
        // Apply control limits and damping
        controls.pitch = Math.max(-1, Math.min(1, controls.pitch));
        controls.roll = Math.max(-1, Math.min(1, controls.roll));
        controls.yaw = Math.max(-1, Math.min(1, controls.yaw));
        controls.throttle = Math.max(0, Math.min(1, controls.throttle));
        
        // Apply damping/self-centering for flight controls
        controls.pitch *= 0.95;
        controls.roll *= 0.95;
        controls.yaw *= 0.85;
        
        return controls;
    },
    
    // Apply controls to the physics model
    applyToPhysics: function(controls, physics) {
        physics.elevatorInput = controls.pitch;
        physics.aileronInput = controls.roll;
        physics.rudderInput = controls.yaw;
        physics.throttle = controls.throttle;
        physics.flapsPosition = controls.flaps;
        physics.gearDown = controls.gearToggle;
        physics.afterburner = controls.afterburner;
        
        // Apply weapon states
        physics.fireGun = controls.fireGun;
        physics.fireMissile = controls.fireMissile;
        physics.fireRocket = controls.fireRocket;
        physics.weaponSelect = controls.weaponSelect;
        physics.missileCount = controls.missileCount;
        physics.rocketCount = controls.rocketCount;
        physics.gunAmmo = controls.gunAmmo;
        physics.lastFired = controls.lastFired;
        
        // Apply brakes (only effective when on ground)
        if (controls.brakes > 0 && physics.altitude < 1) {
            physics.velocity.multiplyScalar(0.95);
        }
        
        return physics;
    },
    
    // Get weapon status for display
    getWeaponStatus: function(controls) {
        return {
            currentWeapon: controls.weaponSelect === 0 ? "GUN" : 
                          controls.weaponSelect === 1 ? "MISSILE" : "ROCKET",
            gunAmmo: controls.gunAmmo,
            missileCount: controls.missileCount,
            rocketCount: controls.rocketCount,
            isFiring: controls.fireGun || controls.fireMissile || controls.fireRocket
        };
    }
};

// Export the Controls object
if (typeof module !== 'undefined') {
    module.exports = Controls;
}
