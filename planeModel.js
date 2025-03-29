// Advanced Fighter Jet Model Creator
const AdvancedFighterJetModel = {
    // Create a highly detailed fighter jet
    createFighterJet: function(scene) {
        const jetGroup = new THREE.Group();
        
        // Add all jet components
        this.createFuselage(jetGroup);
        this.createWings(jetGroup);
        this.createTail(jetGroup);
        this.createEngines(jetGroup);
        this.createCockpit(jetGroup);
        this.createLandingGear(jetGroup);
        this.createWeapons(jetGroup);
        this.createStealthFeatures(jetGroup);
        this.createSensors(jetGroup);
        this.createControlSurfaces(jetGroup);
        
        // Set initial position
        jetGroup.position.set(0, 20, 0);
        scene.add(jetGroup);
        
        return jetGroup;
    },
    
    // Create fighter jet fuselage (body)
    createFuselage: function(jetGroup) {
        // Main body - angular and tapered with stealth features
        const bodyShape = new THREE.Shape();
        bodyShape.moveTo(0, 0);
        bodyShape.lineTo(20, -2);
        bodyShape.lineTo(30, -5);
        bodyShape.lineTo(35, -3);
        bodyShape.lineTo(35, 3);
        bodyShape.lineTo(30, 5);
        bodyShape.lineTo(20, 2);
        bodyShape.lineTo(0, 0);
        
        const bodyExtrudeSettings = {
            steps: 20,
            depth: 5,
            bevelEnabled: false
        };
        
        const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, bodyExtrudeSettings);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x2A2A2A,
            metalness: 0.85,
            roughness: 0.15,
            side: THREE.DoubleSide
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = -Math.PI / 2;
        body.castShadow = true;
        jetGroup.add(body);
        
        // Nose cone - pointed with radar dome
        const noseGeometry = new THREE.ConeGeometry(3, 8, 16);
        const nose = new THREE.Mesh(noseGeometry, bodyMaterial);
        nose.position.set(17.5, 0, 0);
        nose.rotation.x = -Math.PI / 2;
        nose.castShadow = true;
        jetGroup.add(nose);
        
        // Radar dome
        const radarDomeGeometry = new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 3);
        const radarDomeMaterial = new THREE.MeshStandardMaterial({
            color: 0xCCCCCC,
            metalness: 0.1,
            roughness: 0.3,
            transparent: true,
            opacity: 0.8
        });
        
        const radarDome = new THREE.Mesh(radarDomeGeometry, radarDomeMaterial);
        radarDome.position.set(19, 0, 0);
        radarDome.rotation.x = -Math.PI / 2;
        radarDome.castShadow = true;
        jetGroup.add(radarDome);
        
        // Intake ducts
        const intakeGeometry = new THREE.BoxGeometry(4, 2, 2);
        const intakeMaterial = new THREE.MeshStandardMaterial({
            color: 0x1A1A1A,
            metalness: 0.9,
            roughness: 0.05
        });
        
        const leftIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
        leftIntake.position.set(-10, 0, 2);
        leftIntake.castShadow = true;
        jetGroup.add(leftIntake);
        
        const rightIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
        rightIntake.position.set(-10, 0, -2);
        rightIntake.castShadow = true;
        jetGroup.add(rightIntake);
        
        // Spine
        const spineGeometry = new THREE.BoxGeometry(1, 1, 40);
        const spineMaterial = new THREE.MeshStandardMaterial({
            color: 0x3A3A3A,
            metalness: 0.8,
            roughness: 0.1
        });
        
        const spine = new THREE.Mesh(spineGeometry, spineMaterial);
        spine.position.set(-10, 1, 0);
        spine.castShadow = true;
        jetGroup.add(spine);
    },
    
    // Create delta wings with canards
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
            steps: 20,
            depth: 2,
            bevelEnabled: false
        };
        
        const wingGeometry = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0x2A2A2A,
            metalness: 0.85,
            roughness: 0.15,
            side: THREE.DoubleSide
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
        
        // Wing flaps
        const flapGeometry = new THREE.BoxGeometry(10, 0.5, 1.5);
        const flapMaterial = new THREE.MeshStandardMaterial({
            color: 0x3A3A3A,
            metalness: 0.8,
            roughness: 0.1
        });
        
        // Left flap
        const leftFlap = new THREE.Mesh(flapGeometry, flapMaterial);
        leftFlap.position.set(-12.5, -1.5, 1.5);
        leftFlap.rotation.x = -Math.PI / 2;
        leftFlap.castShadow = true;
        leftFlap.name = 'flap';
        jetGroup.add(leftFlap);
        
        // Right flap
        const rightFlap = new THREE.Mesh(flapGeometry, flapMaterial);
        rightFlap.position.set(-12.5, -1.5, -1.5);
        rightFlap.rotation.x = -Math.PI / 2;
        rightFlap.rotation.y = Math.PI;
        rightFlap.castShadow = true;
        rightFlap.name = 'flap';
        jetGroup.add(rightFlap);
        
        // Canards (front wings)
        const canardShape = new THREE.Shape();
        canardShape.moveTo(0, 0);
        canardShape.lineTo(5, -3);
        canardShape.lineTo(7, -1);
        canardShape.lineTo(7, 1);
        canardShape.lineTo(5, 3);
        canardShape.lineTo(0, 0);
        
        const canardGeometry = new THREE.ExtrudeGeometry(canardShape, wingExtrudeSettings);
        
        const leftCanard = new THREE.Mesh(canardGeometry, wingMaterial);
        leftCanard.position.set(5, 0, 2);
        leftCanard.rotation.x = -Math.PI / 2;
        leftCanard.castShadow = true;
        jetGroup.add(leftCanard);
        
        const rightCanard = new THREE.Mesh(canardGeometry, wingMaterial);
        rightCanard.position.set(5, 0, -2);
        rightCanard.rotation.x = -Math.PI / 2;
        rightCanard.rotation.y = Math.PI;
        rightCanard.castShadow = true;
        jetGroup.add(rightCanard);
        
        // Wingtip missiles
        const missileGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 16);
        const missileMaterial = new THREE.MeshStandardMaterial({
            color: 0xAAAAAA,
            metalness: 0.8,
            roughness: 0.1
        });
        
        // Left wingtip missile
        const leftMissile = new THREE.Mesh(missileGeometry, missileMaterial);
        leftMissile.position.set(-15, -1, 3);
        leftMissile.rotation.z = Math.PI / 2;
        leftMissile.castShadow = true;
        leftMissile.name = 'weapon';
        jetGroup.add(leftMissile);
        
        // Right wingtip missile
        const rightMissile = new THREE.Mesh(missileGeometry, missileMaterial);
        rightMissile.position.set(-15, -1, -3);
        rightMissile.rotation.z = Math.PI / 2;
        rightMissile.castShadow = true;
        rightMissile.name = 'weapon';
        jetGroup.add(rightMissile);
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
            steps: 20,
            depth: 2,
            bevelEnabled: false
        };
        
        const tailGeometry = new THREE.ExtrudeGeometry(tailShape, tailExtrudeSettings);
        const tailMaterial = new THREE.MeshStandardMaterial({
            color: 0x2A2A2A,
            metalness: 0.85,
            roughness: 0.15
        });
        
        const tailFin = new THREE.Mesh(tailGeometry, tailMaterial);
        tailFin.position.set(-30, 0, 0);
        tailFin.rotation.x = -Math.PI / 2;
        tailFin.castShadow = true;
        jetGroup.add(tailFin);
        
        // Horizontal stabilizers
        const hStabShape = new THREE.Shape();
        hStabShape.moveTo(0, 0);
        hStabShape.lineTo(5, 0);
        hStabShape.lineTo(7, -1);
        hStabShape.lineTo(7, 1);
        hStabShape.lineTo(5, 0);
        hStabShape.lineTo(0, 0);
        
        const hStabGeometry = new THREE.ExtrudeGeometry(hStabShape, tailExtrudeSettings);
        
        const leftHStab = new THREE.Mesh(hStabGeometry, tailMaterial);
        leftHStab.position.set(-30, 0, 2);
        leftHStab.rotation.x = -Math.PI / 2;
        leftHStab.castShadow = true;
        jetGroup.add(leftHStab);
        
        const rightHStab = new THREE.Mesh(hStabGeometry, tailMaterial);
        rightHStab.position.set(-30, 0, -2);
        rightHStab.rotation.x = -Math.PI / 2;
        rightHStab.rotation.y = Math.PI;
        rightHStab.castShadow = true;
        jetGroup.add(rightHStab);
        
        // Tail fins
        const tailFinGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 16);
        const tailFinMaterial = new THREE.MeshStandardMaterial({
            color: 0x3A3A3A,
            metalness: 0.8,
            roughness: 0.1
        });
        
        // Left tail fin
        const leftTailFin = new THREE.Mesh(tailFinGeometry, tailFinMaterial);
        leftTailFin.position.set(-30, 0, 3);
        leftTailFin.rotation.x = -Math.PI / 2;
        leftTailFin.castShadow = true;
        jetGroup.add(leftTailFin);
        
        // Right tail fin
        const rightTailFin = new THREE.Mesh(tailFinGeometry, tailFinMaterial);
        rightTailFin.position.set(-30, 0, -3);
        rightTailFin.rotation.x = -Math.PI / 2;
        rightTailFin.castShadow = true;
        jetGroup.add(rightTailFin);
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
        
        // Afterburner
        const afterburnerGeometry = new THREE.CylinderGeometry(1.8, 2.5, 2, 16);
        const afterburnerMaterial = new THREE.MeshStandardMaterial({
            color: 0xff4400,
            emissive: 0xff4400,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.8
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
        
        const leftAfterburner = new THREE.Mesh(afterburnerGeometry, afterburnerMaterial);
        leftAfterburner.position.set(-31, 0, 2);
        leftAfterburner.rotation.x = -Math.PI / 2;
        jetGroup.add(leftAfterburner);
        
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
        
        const rightAfterburner = new THREE.Mesh(afterburnerGeometry, afterburnerMaterial);
        rightAfterburner.position.set(-31, 0, -2);
        rightAfterburner.rotation.x = -Math.PI / 2;
        jetGroup.add(rightAfterburner);
        
        // Thrust vectoring nozzles
        const nozzleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
        const nozzleMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.1
        });
        
        // Left nozzle
        const leftNozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
        leftNozzle.position.set(-30, 0, 2);
        leftNozzle.rotation.x = -Math.PI / 2;
        leftNozzle.castShadow = true;
        jetGroup.add(leftNozzle);
        
        // Right nozzle
        const rightNozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
        rightNozzle.position.set(-30, 0, -2);
        rightNozzle.rotation.x = -Math.PI / 2;
        rightNozzle.castShadow = true;
        jetGroup.add(rightNozzle);
    },
    
    // Create cockpit
    createCockpit: function(jetGroup) {
        // Cockpit canopy
        const canopyGeometry = new THREE.SphereGeometry(3, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
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
        
        // Pilot seat
        const seatGeometry = new THREE.BoxGeometry(1, 1, 1);
        const seatMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            metalness: 0.5,
            roughness: 0.3
        });
        
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(15, 0.5, 0);
        seat.castShadow = true;
        jetGroup.add(seat);
        
        // Instrument panel
        const panelGeometry = new THREE.BoxGeometry(2, 0.5, 0.5);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.7,
            roughness: 0.2
        });
        
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(15, 0.7, 0.2);
        panel.castShadow = true;
        jetGroup.add(panel);
        
        // HUD
        const hudGeometry = new THREE.PlaneGeometry(1.5, 1.5);
        const hudMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.3
        });
        
        const hud = new THREE.Mesh(hudGeometry, hudMaterial);
        hud.position.set(15, 0.7, 0.5);
        hud.rotation.y = Math.PI / 2;
        hud.castShadow = true;
        jetGroup.add(hud);
    },
    
    // Create landing gear
    createLandingGear: function(jetGroup) {
        // Gear housing
        const housingGeometry = new THREE.CylinderGeometry(1, 1, 2, 16);
        const housingMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            metalness: 0.7,
            roughness: 0.2
        });
        
        const frontHousing = new THREE.Mesh(housingGeometry, housingMaterial);
        frontHousing.position.set(10, -2, 0);
        frontHousing.rotation.x = -Math.PI / 2;
        frontHousing.castShadow = true;
        jetGroup.add(frontHousing);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 32);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.3,
            roughness: 0.5
        });
        
        const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontWheel.position.set(10, -3, 0);
        frontWheel.rotation.x = Math.PI / 2;
        frontWheel.castShadow = true;
        frontWheel.name = 'gear';
        jetGroup.add(frontWheel);
        
        // Main landing gear
        const mainGearGeometry = new THREE.BoxGeometry(0.5, 3, 0.5);
        const mainGearMaterial = new THREE.MeshStandardMaterial({
            color: 0x777777,
            metalness: 0.6,
            roughness: 0.3
        });
        
        // Left main gear
        const leftGear = new THREE.Mesh(mainGearGeometry, mainGearMaterial);
        leftGear.position.set(-5, -2, 2);
        leftGear.castShadow = true;
        leftGear.name = 'gear';
        jetGroup.add(leftGear);
        
        const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        leftWheel.position.set(-5, -4, 2);
        leftWheel.rotation.x = Math.PI / 2;
        leftWheel.castShadow = true;
        leftWheel.name = 'gear';
        jetGroup.add(leftWheel);
        
        // Right main gear
        const rightGear = new THREE.Mesh(mainGearGeometry, mainGearMaterial);
        rightGear.position.set(-5, -2, -2);
        rightGear.castShadow = true;
        rightGear.name = 'gear';
        jetGroup.add(rightGear);
        
        const rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        rightWheel.position.set(-5, -4, -2);
        rightWheel.rotation.x = Math.PI / 2;
        rightWheel.castShadow = true;
        rightWheel.name = 'gear';
        jetGroup.add(rightWheel);
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
        leftMissile1.name = 'weapon';
        jetGroup.add(leftMissile1);
        
        const leftMissile2 = new THREE.Mesh(missileGeometry, missileMaterial);
        leftMissile2.position.set(-15, -2, 3);
        leftMissile2.rotation.z = Math.PI / 2;
        leftMissile2.castShadow = true;
        leftMissile2.name = 'weapon';
        jetGroup.add(leftMissile2);
        
        // Right wing missiles
        const rightMissile1 = new THREE.Mesh(missileGeometry, missileMaterial);
        rightMissile1.position.set(-15, -1, -3);
        rightMissile1.rotation.z = Math.PI / 2;
        rightMissile1.castShadow = true;
        rightMissile1.name = 'weapon';
        jetGroup.add(rightMissile1);
        
        const rightMissile2 = new THREE.Mesh(missileGeometry, missileMaterial);
        rightMissile2.position.set(-15, -2, -3);
        rightMissile2.rotation.z = Math.PI / 2;
        rightMissile2.castShadow = true;
        rightMissile2.name = 'weapon';
        jetGroup.add(rightMissile2);
        
        // Fuselage missiles
        const centerMissile1 = new THREE.Mesh(missileGeometry, missileMaterial);
        centerMissile1.position.set(-20, -1, 0);
        centerMissile1.rotation.z = Math.PI / 2;
        centerMissile1.castShadow = true;
        centerMissile1.name = 'weapon';
        jetGroup.add(centerMissile1);
        
        const centerMissile2 = new THREE.Mesh(missileGeometry, missileMaterial);
        centerMissile2.position.set(-22, -1, 0);
        centerMissile2.rotation.z = Math.PI / 2;
        centerMissile2.castShadow = true;
        centerMissile2.name = 'weapon';
        jetGroup.add(centerMissile2);
        
        // Bombs
        const bombGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
        const bombMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            metalness: 0.7,
            roughness: 0.2
        });
        
        const leftBomb = new THREE.Mesh(bombGeometry, bombMaterial);
        leftBomb.position.set(-15, -1.5, 3);
        leftBomb.castShadow = true;
        leftBomb.name = 'weapon';
        jetGroup.add(leftBomb);
        
        const rightBomb = new THREE.Mesh(bombGeometry, bombMaterial);
        rightBomb.position.set(-15, -1.5, -3);
        rightBomb.castShadow = true;
        rightBomb.name = 'weapon';
        jetGroup.add(rightBomb);
    },
    
    // Create stealth features
    createStealthFeatures: function(jetGroup) {
        // Stealth panels
        const panelGeometry = new THREE.BoxGeometry(5, 1, 1);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x1A1A1A,
            metalness: 0.9,
            roughness: 0.05
        });
        
        // Top panels
        const topPanel1 = new THREE.Mesh(panelGeometry, panelMaterial);
        topPanel1.position.set(-10, 1, 0);
        topPanel1.castShadow = true;
        jetGroup.add(topPanel1);
        
        const topPanel2 = new THREE.Mesh(panelGeometry, panelMaterial);
        topPanel2.position.set(-20, 1, 0);
        topPanel2.castShadow = true;
        jetGroup.add(topPanel2);
        
        // Bottom panels
        const bottomPanel1 = new THREE.Mesh(panelGeometry, panelMaterial);
        bottomPanel1.position.set(-10, -1, 0);
        bottomPanel1.castShadow = true;
        jetGroup.add(bottomPanel1);
        
        const bottomPanel2 = new THREE.Mesh(panelGeometry, panelMaterial);
        bottomPanel2.position.set(-20, -1, 0);
        bottomPanel2.castShadow = true;
        jetGroup.add(bottomPanel2);
        
        // Wing panels
        const wingPanelGeometry = new THREE.BoxGeometry(10, 0.5, 1);
        const wingPanel1 = new THREE.Mesh(wingPanelGeometry, panelMaterial);
        wingPanel1.position.set(-12.5, -0.5, 1.5);
        wingPanel1.castShadow = true;
        jetGroup.add(wingPanel1);
        
        const wingPanel2 = new THREE.Mesh(wingPanelGeometry, panelMaterial);
        wingPanel2.position.set(-12.5, -0.5, -1.5);
        wingPanel2.castShadow = true;
        jetGroup.add(wingPanel2);
    },
    
    // Create sensors and radar
    createSensors: function(jetGroup) {
        // Radar dome
        const radarDomeGeometry = new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 3);
        const radarDomeMaterial = new THREE.MeshStandardMaterial({
            color: 0xCCCCCC,
            metalness: 0.1,
            roughness: 0.3,
            transparent: true,
            opacity: 0.8
        });
        
        const radarDome = new THREE.Mesh(radarDomeGeometry, radarDomeMaterial);
        radarDome.position.set(19, 0, 0);
        radarDome.rotation.x = -Math.PI / 2;
        radarDome.castShadow = true;
        jetGroup.add(radarDome);
        
        // Sensor pods
        const podGeometry = new THREE.BoxGeometry(1, 0.5, 2);
        const podMaterial = new THREE.MeshStandardMaterial({
            color: 0x3A3A3A,
            metalness: 0.8,
            roughness: 0.1
        });
        
        // Left sensor pod
        const leftPod = new THREE.Mesh(podGeometry, podMaterial);
        leftPod.position.set(-5, 0.5, 3);
        leftPod.castShadow = true;
        jetGroup.add(leftPod);
        
        // Right sensor pod
        const rightPod = new THREE.Mesh(podGeometry, podMaterial);
        rightPod.position.set(-5, 0.5, -3);
        rightPod.castShadow = true;
        jetGroup.add(rightPod);
        
        // Tail sensor
        const tailSensorGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const tailSensor = new THREE.Mesh(tailSensorGeometry, podMaterial);
        tailSensor.position.set(-30, 0, 0);
        tailSensor.castShadow = true;
        jetGroup.add(tailSensor);
    },
    
    // Create control surfaces
    createControlSurfaces: function(jetGroup) {
        // Rudder
        const rudderGeometry = new THREE.BoxGeometry(1, 5, 1);
        const rudderMaterial = new THREE.MeshStandardMaterial({
            color: 0x3A3A3A,
            metalness: 0.8,
            roughness: 0.1
        });
        
        const rudder = new THREE.Mesh(rudderGeometry, rudderMaterial);
        rudder.position.set(-30, 0, 0);
        rudder.castShadow = true;
        jetGroup.add(rudder);
        
        // Elevators
        const elevatorGeometry = new THREE.BoxGeometry(1, 1, 3);
        const elevatorMaterial = new THREE.MeshStandardMaterial({
            color: 0x3A3A3A,
            metalness: 0.8,
            roughness: 0.1
        });
        
        // Left elevator
        const leftElevator = new THREE.Mesh(elevatorGeometry, elevatorMaterial);
        leftElevator.position.set(-30, 0, 1.5);
        leftElevator.castShadow = true;
        jetGroup.add(leftElevator);
        
        // Right elevator
        const rightElevator = new THREE.Mesh(elevatorGeometry, elevatorMaterial);
        rightElevator.position.set(-30, 0, -1.5);
        rightElevator.castShadow = true;
        jetGroup.add(rightElevator);
        
        // Ailerons
        const aileronGeometry = new THREE.BoxGeometry(5, 0.5, 1);
        const aileronMaterial = new THREE.MeshStandardMaterial({
            color: 0x3A3A3A,
            metalness: 0.8,
            roughness: 0.1
        });
        
        // Left aileron
        const leftAileron = new THREE.Mesh(aileronGeometry, aileronMaterial);
        leftAileron.position.set(-12.5, 0, 1.5);
        leftAileron.castShadow = true;
        jetGroup.add(leftAileron);
        
        // Right aileron
        const rightAileron = new THREE.Mesh(aileronGeometry, aileronMaterial);
        rightAileron.position.set(-12.5, 0, -1.5);
        rightAileron.castShadow = true;
        jetGroup.add(rightAileron);
    },
    
    // Animation functions
    animateAfterburners: function(jetGroup, intensity) {
        jetGroup.traverse(function(child) {
            if (child.material && child.material.emissiveIntensity !== undefined) {
                child.material.emissiveIntensity = intensity;
            }
        });
    },
    
    animateWeapons: function(jetGroup, visible) {
        jetGroup.traverse(function(child) {
            if (child.name === 'weapon') {
                child.visible = visible;
            }
        });
    },
    
    animateLandingGear: function(jetGroup, retracted) {
        jetGroup.traverse(function(child) {
            if (child.name === 'gear') {
                child.visible = !retracted;
            }
        });
    },
    
    animateControlSurfaces: function(jetGroup, flapAngle, aileronAngle, rudderAngle) {
        jetGroup.traverse(function(child) {
            if (child.name === 'flap') {
                child.rotation.x = flapAngle;
            } else if (child.name === 'aileron') {
                child.rotation.z = aileronAngle;
            } else if (child.name === 'rudder') {
                child.rotation.y = rudderAngle;
            }
        });
    }
};

// Export the AdvancedFighterJetModel object
if (typeof module !== 'undefined') {
    module.exports = AdvancedFighterJetModel;
}
