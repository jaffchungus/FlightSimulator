// Streamlined Fighter Jet Model Creator
const FighterJetModel = {
    // Create a realistic fighter jet
    createFighterJet: function(scene) {
        const jetGroup = new THREE.Group();
        
        // Add all jet components
        this.createFuselage(jetGroup);
        this.createWings(jetGroup);
        this.createTail(jetGroup);
        this.createEngines(jetGroup);
        this.createCockpit(jetGroup);
        this.createWeapons(jetGroup);
        
        // Set initial position
        jetGroup.position.set(0, 20, 0);
        scene.add(jetGroup);
        
        return jetGroup;
    },
    
    // Create fighter jet fuselage (body)
    createFuselage: function(jetGroup) {
        // Main body
        const bodyGeometry = new THREE.CylinderGeometry(3, 3, 40, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.7,
            roughness: 0.2
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = -Math.PI / 2;
        body.castShadow = true;
        jetGroup.add(body);
        
        // Nose cone
        const noseGeometry = new THREE.ConeGeometry(3, 8, 8);
        const nose = new THREE.Mesh(noseGeometry, bodyMaterial);
        nose.position.set(20, 0, 0);
        nose.rotation.x = -Math.PI / 2;
        nose.castShadow = true;
        jetGroup.add(nose);
        
        // Intake ducts
        const intakeGeometry = new THREE.BoxGeometry(4, 2, 2);
        const intakeMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.8,
            roughness: 0.1
        });
        
        const leftIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
        leftIntake.position.set(-10, 0, 2);
        leftIntake.castShadow = true;
        jetGroup.add(leftIntake);
        
        const rightIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
        rightIntake.position.set(-10, 0, -2);
        rightIntake.castShadow = true;
        jetGroup.add(rightIntake);
    },
    
    // Create delta wings
    createWings: function(jetGroup) {
        // Delta wing shape
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(15, -10);
        wingShape.lineTo(20, -8);
        wingShape.lineTo(20, 8);
        wingShape.lineTo(15, 10);
        wingShape.lineTo(0, 0);
        
        const wingExtrudeSettings = {
            steps: 10,
            depth: 2,
            bevelEnabled: false
        };
        
        const wingGeometry = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.7,
            roughness: 0.2
        });
        
        // Left wing
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-15, 0, 0);
        leftWing.rotation.x = -Math.PI / 2;
        leftWing.castShadow = true;
        jetGroup.add(leftWing);
        
        // Right wing
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(-15, 0, 0);
        rightWing.rotation.x = -Math.PI / 2;
        rightWing.rotation.y = Math.PI;
        rightWing.castShadow = true;
        jetGroup.add(rightWing);
    },
    
    // Create tail section
    createTail: function(jetGroup) {
        // Vertical stabilizer
        const tailShape = new THREE.Shape();
        tailShape.moveTo(0, 0);
        tailShape.lineTo(-3, 0);
        tailShape.lineTo(-5, 10);
        tailShape.lineTo(-2, 12);
        tailShape.lineTo(2, 12);
        tailShape.lineTo(5, 10);
        tailShape.lineTo(3, 0);
        tailShape.lineTo(0, 0);
        
        const tailExtrudeSettings = {
            steps: 10,
            depth: 2,
            bevelEnabled: false
        };
        
        const tailGeometry = new THREE.ExtrudeGeometry(tailShape, tailExtrudeSettings);
        const tailMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.7,
            roughness: 0.2
        });
        
        const tailFin = new THREE.Mesh(tailGeometry, tailMaterial);
        tailFin.position.set(-30, 0, 0);
        tailFin.rotation.x = -Math.PI / 2;
        tailFin.castShadow = true;
        jetGroup.add(tailFin);
    },
    
    // Create engines
    createEngines: function(jetGroup) {
        // Engine nacelle
        const engineGeometry = new THREE.CylinderGeometry(2, 2, 8, 16);
        const engineMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.7,
            roughness: 0.1
        });
        
        // Exhaust
        const exhaustGeometry = new THREE.CylinderGeometry(1.5, 2.2, 1, 16);
        const exhaustMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.9,
            roughness: 0.05
        });
        
        // Left engine
        const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        leftEngine.position.set(-25, 0, 2);
        leftEngine.rotation.x = -Math.PI / 2;
        leftEngine.castShadow = true;
        jetGroup.add(leftEngine);
        
        const leftExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        leftExhaust.position.set(-30, 0, 2);
        leftExhaust.rotation.x = -Math.PI / 2;
        leftExhaust.castShadow = true;
        jetGroup.add(leftExhaust);
        
        // Right engine
        const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        rightEngine.position.set(-25, 0, -2);
        rightEngine.rotation.x = -Math.PI / 2;
        rightEngine.castShadow = true;
        jetGroup.add(rightEngine);
        
        const rightExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        rightExhaust.position.set(-30, 0, -2);
        rightExhaust.rotation.x = -Math.PI / 2;
        rightExhaust.castShadow = true;
        jetGroup.add(rightExhaust);
    },
    
    // Create cockpit
    createCockpit: function(jetGroup) {
        // Cockpit canopy
        const canopyGeometry = new THREE.SphereGeometry(3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const canopyMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            metalness: 0.2,
            roughness: 0.1,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
        canopy.position.set(15, 0, 0);
        canopy.rotation.x = -Math.PI / 2;
        canopy.rotation.z = Math.PI / 2;
        canopy.castShadow = true;
        jetGroup.add(canopy);
    },
    
    // Create weapons systems
    createWeapons: function(jetGroup) {
        // Missile
        const missileGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 16);
        const missileMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            metalness: 0.8,
            roughness: 0.1
        });
        
        // Left wing missiles
        const leftMissile1 = new THREE.Mesh(missileGeometry, missileMaterial);
        leftMissile1.position.set(-15, -1, 3);
        leftMissile1.rotation.z = Math.PI / 2;
        leftMissile1.castShadow = true;
        jetGroup.add(leftMissile1);
        
        const leftMissile2 = new THREE.Mesh(missileGeometry, missileMaterial);
        leftMissile2.position.set(-15, -2, 3);
        leftMissile2.rotation.z = Math.PI / 2;
        leftMissile2.castShadow = true;
        jetGroup.add(leftMissile2);
        
        // Right wing missiles
        const rightMissile1 = new THREE.Mesh(missileGeometry, missileMaterial);
        rightMissile1.position.set(-15, -1, -3);
        rightMissile1.rotation.z = Math.PI / 2;
        rightMissile1.castShadow = true;
        jetGroup.add(rightMissile1);
        
        const rightMissile2 = new THREE.Mesh(missileGeometry, missileMaterial);
        rightMissile2.position.set(-15, -2, -3);
        rightMissile2.rotation.z = Math.PI / 2;
        rightMissile2.castShadow = true;
        jetGroup.add(rightMissile2);
    }
};

// Export the FighterJetModel object
if (typeof module !== 'undefined') {
    module.exports = FighterJetModel;
}
