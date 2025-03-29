// Fighter Jet Model Creator
const PlaneModel = {
    // Create a complete fighter jet
    createFighterJet: function(scene) {
        const jetGroup = new THREE.Group();
        
        // Add all jet components
        this.createFuselage(jetGroup);
        this.createWings(jetGroup);
        this.createTail(jetGroup);
        this.createEngines(jetGroup);
        this.createCockpit(jetGroup);
        this.createWeaponHardpoints(jetGroup);
        this.createAirIntakes(jetGroup);
        
        // Set initial position
        jetGroup.position.set(0, 20, 0);
        scene.add(jetGroup);
        
        return jetGroup;
    },
    
    // Create fighter jet fuselage (sleek and angular)
    createFuselage: function(jetGroup) {
        // Main body using tapered cylinder for streamlined shape
        const fuselageGeometry = new THREE.CylinderGeometry(2, 1.5, 30, 32);
        const fuselageMaterial = new THREE.MeshPhongMaterial({
            color: 0x606060,
            specular: 0x909090,
            shininess: 100
        });
        
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        fuselage.rotation.z = Math.PI / 2;
        fuselage.castShadow = true;
        jetGroup.add(fuselage);
        
        // Radar nose cone
        const noseGeometry = new THREE.ConeGeometry(1.5, 8, 32);
        const nose = new THREE.Mesh(noseGeometry, fuselageMaterial);
        nose.rotation.z = Math.PI / 2;
        nose.position.set(16, 0, 0);
        jetGroup.add(nose);
        
        // Afterburner section
        const exhaustGeometry = new THREE.CylinderGeometry(1.2, 1.8, 4, 32);
        const exhaustMaterial = new THREE.MeshPhongMaterial({
            color: 0x303030,
            specular: 0x505050,
            shininess: 150
        });
        const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        exhaust.rotation.z = Math.PI / 2;
        exhaust.position.set(-16, 0, 0);
        jetGroup.add(exhaust);
    },
    
    // Create delta wings with weapons hardpoints
    createWings: function(jetGroup) {
        // Main delta wing
        const wingGeometry = new THREE.TetrahedronGeometry(20, 1);
        const wingMaterial = new THREE.MeshPhongMaterial({
            color: 0x606060,
            specular: 0x909090,
            shininess: 100
        });
        
        const mainWing = new THREE.Mesh(wingGeometry, wingMaterial);
        mainWing.rotation.x = -Math.PI/2;
        mainWing.rotation.z = Math.PI/4;
        mainWing.position.set(-2, -1, 0);
        jetGroup.add(mainWing);
        
        // Wing flaps (movable surfaces)
        const flapGeometry = new THREE.BoxGeometry(8, 0.3, 3);
        const flapMaterial = new THREE.MeshPhongMaterial({
            color: 0x707070,
            specular: 0x909090,
            shininess: 80
        });
        
        // Left flap
        const leftFlap = new THREE.Mesh(flapGeometry, flapMaterial);
        leftFlap.position.set(-8, -1, -6);
        leftFlap.rotation.z = 0.2;
        leftFlap.name = 'flap';
        jetGroup.add(leftFlap);
        
        // Right flap
        const rightFlap = new THREE.Mesh(flapGeometry, flapMaterial);
        rightFlap.position.set(-8, -1, 6);
        rightFlap.rotation.z = 0.2;
        rightFlap.name = 'flap';
        jetGroup.add(rightFlap);
    },
    
    // Create tail section with vertical stabilizer
    createTail: function(jetGroup) {
        // Vertical stabilizer
        const tailFinGeometry = new THREE.BoxGeometry(1.5, 8, 4);
        const tailMaterial = new THREE.MeshPhongMaterial({
            color: 0x606060,
            specular: 0x909090,
            shininess: 100
        });
        
        const tailFin = new THREE.Mesh(tailFinGeometry, tailMaterial);
        tailFin.position.set(-14, 3, 0);
        tailFin.rotation.x = -Math.PI/8;
        jetGroup.add(tailFin);
        
        // Horizontal stabilizers
        const hStabGeometry = new THREE.BoxGeometry(6, 0.5, 3);
        
        // Left horizontal stabilizer
        const leftHStab = new THREE.Mesh(hStabGeometry, tailMaterial);
        leftHStab.position.set(-12, 2, -3);
        leftHStab.rotation.z = Math.PI/8;
        jetGroup.add(leftHStab);
        
        // Right horizontal stabilizer
        const rightHStab = new THREE.Mesh(hStabGeometry, tailMaterial);
        rightHStab.position.set(-12, 2, 3);
        rightHStab.rotation.z = Math.PI/8;
        jetGroup.add(rightHStab);
    },
    
    // Create jet engines with afterburner details
    createEngines: function(jetGroup) {
        // Main engine body
        const engineGeometry = new THREE.CylinderGeometry(1.2, 1.2, 10, 24);
        const engineMaterial = new THREE.MeshPhongMaterial({
            color: 0x404040,
            specular: 0x606060,
            shininess: 150
        });
        
        const engine = new THREE.Mesh(engineGeometry, engineMaterial);
        engine.rotation.z = Math.PI / 2;
        engine.position.set(-10, -1, 0);
        jetGroup.add(engine);
        
        // Afterburner nozzle
        const nozzleGeometry = new THREE.CylinderGeometry(1.4, 1.6, 1, 24);
        const nozzleMaterial = new THREE.MeshPhongMaterial({
            color: 0x202020,
            specular: 0x404040,
            shininess: 200
        });
        
        const nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
        nozzle.rotation.z = Math.PI / 2;
        nozzle.position.set(-15, -1, 0);
        jetGroup.add(nozzle);
    },
    
    // Create bubble cockpit canopy
    createCockpit: function(jetGroup) {
        const canopyGeometry = new THREE.SphereGeometry(2.2, 32, 32, 0, Math.PI * 2, 0, Math.PI / 3);
        const canopyMaterial = new THREE.MeshPhongMaterial({
            color: 0x0055AA,
            specular: 0xFFFFFF,
            shininess: 200,
            transparent: true,
            opacity: 0.6
        });
        
        const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
        canopy.position.set(10, 1.5, 0);
        canopy.rotation.x = Math.PI / 2;
        canopy.rotation.y = Math.PI / 2;
        jetGroup.add(canopy);
        
        // Cockpit frame
        const frameGeometry = new THREE.TorusGeometry(2.3, 0.1, 8, 32, Math.PI/3);
        const frameMaterial = new THREE.MeshPhongMaterial({
            color: 0x303030,
            specular: 0x505050,
            shininess: 100
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(10, 1.5, 0);
        frame.rotation.x = Math.PI / 2;
        frame.rotation.y = Math.PI / 2;
        jetGroup.add(frame);
    },
    
    // Create weapon hardpoints and pylons
    createWeaponHardpoints: function(jetGroup) {
        const pylonGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
        const pylonMaterial = new THREE.MeshPhongMaterial({
            color: 0x505050,
            specular: 0x707070,
            shininess: 80
        });
        
        // Missile geometry
        const missileGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 16);
        const missileMaterial = new THREE.MeshPhongMaterial({
            color: 0x888888,
            specular: 0xAAAAAA,
            shininess: 120
        });
        
        // Create wing pylons
        for(let position of [-5, 5]) {
            const pylon = new THREE.Mesh(pylonGeometry, pylonMaterial);
            pylon.position.set(-6, -2, position);
            jetGroup.add(pylon);
            
            const missile = new THREE.Mesh(missileGeometry, missileMaterial);
            missile.rotation.z = Math.PI/2;
            missile.position.set(-6, -3.5, position);
            jetGroup.add(missile);
        }
        
        // Centerline fuel tank
        const tankGeometry = new THREE.CylinderGeometry(1, 1, 8, 24);
        const tankMaterial = new THREE.MeshPhongMaterial({
            color: 0x707070,
            specular: 0x909090,
            shininess: 80
        });
        const fuelTank = new THREE.Mesh(tankGeometry, tankMaterial);
        fuelTank.rotation.z = Math.PI/2;
        fuelTank.position.set(-8, -2, 0);
        jetGroup.add(fuelTank);
    },
    
    // Create air intakes
    createAirIntakes: function(jetGroup) {
        const intakeGeometry = new THREE.CylinderGeometry(1.2, 1.0, 3, 24);
        const intakeMaterial = new THREE.MeshPhongMaterial({
            color: 0x505050,
            specular: 0x707070,
            shininess: 120
        });
        
        // Left intake
        const leftIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
        leftIntake.position.set(0, -1, -3);
        leftIntake.rotation.z = Math.PI/6;
        jetGroup.add(leftIntake);
        
        // Right intake
        const rightIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
        rightIntake.position.set(0, -1, 3);
        rightIntake.rotation.z = -Math.PI/6;
        jetGroup.add(rightIntake);
    },
    
    // Animation function for control surfaces
    animateControlSurfaces: function(jetGroup, flapAngle, rudderAngle) {
        jetGroup.traverse(function(child) {
            if (child.name === 'flap') {
                child.rotation.z = flapAngle;
            }
            if (child.name === 'rudder') {
                child.rotation.z = rudderAngle;
            }
        });
    }
};

// Export the PlaneModel object
if (typeof module !== 'undefined') {
    module.exports = PlaneModel;
}
