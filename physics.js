// Flight Physics Simulator
const FlightPhysics = {
    // Initialize physics variables
    init: function() {
        return {
            // Velocity vector (in m/s)
            velocity: new THREE.Vector3(),
            
            // Acceleration vector (in m/s²)
            acceleration: new THREE.Vector3(),
            
            // Angular velocity (in radians/s)
            angularVelocity: new THREE.Vector3(),
            
            // Forces
            gravity: new THREE.Vector3(0, -9.81, 0),
            lift: new THREE.Vector3(),
            drag: new THREE.Vector3(),
            thrust: new THREE.Vector3(),
            
            // Control inputs (normalized 0-1)
            elevatorInput: 0,
            aileronInput: 0,
            rudderInput: 0,
            throttle: 0,
            flapsPosition: 0,
            gearDown: true,
            afterburner: false,
            
            // Aircraft constants (modified for fighter jet)
            mass: 10000,        // kg (lighter than commercial aircraft)
            wingspan: 10,       // meters
            wingArea: 30,       // m²
            maxThrust: 150000,  // N (significantly more thrust)
            afterburnerThrust: 250000, // N (additional thrust when afterburner engaged)
            dragCoefficient: 0.024, // (lower for better aerodynamics)
            liftCoefficient: 1.5,  // (better lift characteristics)
            
            // Flight state
            altitude: 0,        // m
            pitch: 0,           // radians
            roll: 0,            // radians
            yaw: 0,             // radians
            heading: 0,         // radians
            stallAngle: 0.3,    // radians
            
            // Status
            crashed: false
        };
    },
    
    // Update physics based on controls and environmental factors
    update: function(physics, aircraft, environment, deltaTime) {
        if (physics.crashed) return physics;
        
        // Update orientation
        this.updateOrientation(physics, deltaTime);
        
        // Update forces
        this.calculateForces(physics, environment);
        
        // Update acceleration
        physics.acceleration.copy(physics.thrust);
        physics.acceleration.add(physics.gravity);
        physics.acceleration.add(physics.lift);
        physics.acceleration.add(physics.drag);
        physics.acceleration.divideScalar(physics.mass);
        
        // Update velocity
        physics.velocity.addScaledVector(physics.acceleration, deltaTime);
        
        // Get the aircraft's forward direction
        const forwardDir = new THREE.Vector3(1, 0, 0).applyQuaternion(aircraft.quaternion);
        
        // Align velocity more with forward direction when at high speeds
        const speed = physics.velocity.length();
        if (speed > 50) {
            // Blend between current velocity direction and forward direction
            const alignmentFactor = Math.min(0.1, deltaTime * 0.5);
            const alignedVelocity = forwardDir.clone().multiplyScalar(speed);
            physics.velocity.lerp(alignedVelocity, alignmentFactor);
        }
        
        // Update position
        aircraft.position.addScaledVector(physics.velocity, deltaTime);
        
        // Ground collision
        if (aircraft.position.y < 0.1 && physics.velocity.y < 0) {
            // Check if landing or crash
            const verticalSpeed = -physics.velocity.y;
            const horizontalSpeed = new THREE.Vector2(physics.velocity.x, physics.velocity.z).length();
            
            // Check if the landing is too hard
            if (verticalSpeed > 10 || 
                (horizontalSpeed > 40 && Math.abs(aircraft.rotation.z) > 0.3) ||
                Math.abs(aircraft.rotation.x) > 0.3) {
                physics.crashed = true;
            } else {
                // Successful landing or ground contact
                aircraft.position.y = 0.1;
                physics.velocity.y = 0;
                
                // Apply ground friction
                if (physics.gearDown) {
                    physics.velocity.x *= 0.98;
                    physics.velocity.z *= 0.98;
                } else {
                    // Friction is lower without landing gear (sliding on belly)
                    physics.velocity.x *= 0.995;
                    physics.velocity.z *= 0.995;
                    
                    // Damage the aircraft if sliding without gear
                    physics.crashed = true;
                }
            }
        }
        
        // Update altitude
        physics.altitude = aircraft.position.y;
        
        // Apply aircraft rotation from physics values
        aircraft.rotation.x = physics.pitch;
        aircraft.rotation.z = -physics.roll;
        aircraft.rotation.y = physics.heading;
        
        // Update afterburner effect if visible
        const afterburner = aircraft.getObjectByName("afterburner");
        if (afterburner) {
            afterburner.visible = physics.afterburner && physics.throttle > 0.5;
            
            // Make it pulse slightly
            if (afterburner.visible) {
                const scale = 1 + 0.2 * Math.sin(Date.now() * 0.01);
                afterburner.scale.set(scale, 1, scale);
            }
        }
        
        return physics;
    },
    
    // Update aircraft orientation based on control inputs
    updateOrientation: function(physics, deltaTime) {
        // Roll rate is proportional to aileron input
        physics.angularVelocity.z = -physics.aileronInput * 2.0; // Faster roll rate for fighter
        
        // Pitch rate is proportional to elevator input, but less effective at high speeds
        const speed = physics.velocity.length();
        const speedFactor = Math.max(0.1, Math.min(1, 100 / Math.max(1, speed)));
        physics.angularVelocity.x = physics.elevatorInput * 1.0 * speedFactor;
        
        // Yaw rate is proportional to rudder input
        physics.angularVelocity.y = physics.rudderInput * 0.5;
        
        // Update roll, pitch, and heading
        physics.roll += physics.angularVelocity.z * deltaTime;
        physics.pitch += physics.angularVelocity.x * deltaTime;
        physics.heading += physics.angularVelocity.y * deltaTime;
        
        // Limit pitch and roll angles
        physics.roll = Math.max(-Math.PI * 0.9, Math.min(Math.PI * 0.9, physics.roll));
        physics.pitch = Math.max(-Math.PI * 0.4, Math.min(Math.PI * 0.4, physics.pitch));
        
        // Normalize heading to [0, 2π]
        physics.heading = physics.heading % (Math.PI * 2);
        if (physics.heading < 0) physics.heading += Math.PI * 2;
        
        // Natural stability - tendency to return to level flight
        physics.roll *= 0.98;
        physics.pitch *= 0.98;
    },
    
    // Calculate aerodynamic and propulsion forces
    calculateForces: function(physics, environment) {
        // Get unit vectors for aircraft orientation
        const forwardDir = new THREE.Vector3(1, 0, 0);
        forwardDir.applyAxisAngle(new THREE.Vector3(0, 0, 1), -physics.roll);
        forwardDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), physics.heading);
        forwardDir.applyAxisAngle(new THREE.Vector3(0, 0, 1), physics.pitch);
        
        const upDir = new THREE.Vector3(0, 1, 0);
        upDir.applyAxisAngle(new THREE.Vector3(0, 0, 1), -physics.roll);
        upDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), physics.heading);
        upDir.applyAxisAngle(new THREE.Vector3(0, 0, 1), physics.pitch);
        
        // Calculate speed and angles
        const airspeed = physics.velocity.length();
        const airspeedSq = airspeed * airspeed;
        
        // Angle of attack (AoA) is angle between velocity and forward direction
        let angleOfAttack = 0;
        if (airspeed > 1) {
            const velocityDir = physics.velocity.clone().normalize();
            angleOfAttack = Math.acos(Math.min(1, Math.max(-1, velocityDir.dot(forwardDir)))) - Math.PI / 2;
        }
        
        // Thrust force
        const baseThrust = physics.throttle * physics.maxThrust;
        const afterburnerBoost = physics.afterburner ? physics.afterburnerThrust * physics.throttle : 0;
        const thrustMagnitude = baseThrust + afterburnerBoost;
        
        physics.thrust.copy(forwardDir);
        physics.thrust.multiplyScalar(thrustMagnitude);
        
        // Effect of landing gear and flaps on drag
        let gearDragFactor = physics.gearDown ? 1.5 : 1.0;
        let flapDragFactor = 1.0 + physics.flapsPosition * 0.5;
        
        // Lift force depends on angle of attack, airspeed, and flap setting
        const effectiveAoA = angleOfAttack + physics.flapsPosition * 0.2;
        let liftCoefficient = physics.liftCoefficient * Math.sin(effectiveAoA * 2);
        
        // Stall effect - lift drops at high angles of attack
        if (Math.abs(effectiveAoA) > physics.stallAngle) {
            const stallFactor = 1.0 - Math.min(1, (Math.abs(effectiveAoA) - physics.stallAngle) / (Math.PI/4 - physics.stallAngle));
            liftCoefficient *= stallFactor;
        }
        
        // Calculate lift magnitude
        const liftMagnitude = 0.5 * liftCoefficient * airspeedSq * physics.wingArea;
        
        // Apply lift in the up direction relative to aircraft
        physics.lift.copy(upDir);
        physics.lift.multiplyScalar(liftMagnitude);
        
        // Drag force depends on angle of attack, airspeed, and configuration
        const inducedDragCoefficient = (liftCoefficient * liftCoefficient) / (Math.PI * physics.wingspan);
        const totalDragCoefficient = physics.dragCoefficient + inducedDragCoefficient;
        
        // Apply configuration effects
        const effectiveDragCoefficient = totalDragCoefficient * gearDragFactor * flapDragFactor;
        
        // Calculate drag magnitude
        const dragMagnitude = 0.5 * effectiveDragCoefficient * airspeedSq * physics.wingArea;
        
        // Apply drag opposite to velocity direction
        if (airspeed > 0.1) {
            physics.drag.copy(physics.velocity);
            physics.drag.normalize();
            physics.drag.multiplyScalar(-dragMagnitude);
        } else {
            physics.drag.set(0, 0, 0);
        }
        
        // Apply environmental effects
        if (environment) {
            // Wind effect
            if (environment.windSpeed > 0) {
                const windDir = new THREE.Vector3(
                    Math.sin(environment.windDirection),
                    0,
                    Math.cos(environment.windDirection)
                );
                const windForce = windDir.multiplyScalar(environment.windSpeed * 10);
                physics.drag.add(windForce);
            }
            
            // Turbulence effect
            if (environment.turbulence > 0) {
                const turbFactor = environment.turbulence * 1000;
                physics.lift.x += (Math.random() - 0.5) * turbFactor;
                physics.lift.y += (Math.random() - 0.5) * turbFactor;
                physics.lift.z += (Math.random() - 0.5) * turbFactor;
            }
        }
        
        return physics;
    },
    
    // Get flight data for display
    getFlightData: function(physics) {
        const speed = physics.velocity.length();
        const groundSpeed = new THREE.Vector2(physics.velocity.x, physics.velocity.z).length();
        const verticalSpeed = physics.velocity.y;
        
        return {
            altitude: physics.altitude,
            speed: speed * 3.6, // Convert to km/h
            verticalSpeed: verticalSpeed * 60, // Convert to m/min
            heading: (physics.heading * 180 / Math.PI) % 360, // Convert to degrees
            pitch: physics.pitch * 180 / Math.PI, // Convert to degrees
            roll: physics.roll * 180 / Math.PI, // Convert to degrees
            throttle: physics.throttle * 100, // Convert to percentage
            afterburner: physics.afterburner,
            groundSpeed: groundSpeed * 3.6, // Convert to km/h
            gearDown: physics.gearDown,
            flaps: physics.flapsPosition * 100 // Convert to percentage
        };
    }
};

// Export the FlightPhysics object
if (typeof module !== 'undefined') {
    module.exports = FlightPhysics;
}
