// Commercial Airplane Model Creator
const PlaneModel = {
    // Create a complete commercial airplane
    createCommercialPlane: function(scene) {
        const planeGroup = new THREE.Group();
        
        // Add all airplane components
        this.createFuselage(planeGroup);
        this.createWings(planeGroup);
        this.createTail(planeGroup);
        this.createEngines(planeGroup);
        this.createWindows(planeGroup);
        this.createLandingGear(planeGroup);
        
        // Set initial position
        planeGroup.position.set(0, 20, 0);
        scene.add(planeGroup);
        
        return planeGroup;
    },
    
    // Create airplane fuselage (body)
    createFuselage: function(planeGroup) {
        // Main body cylinder
        const fuselageGeometry = new THREE.CylinderGeometry(3, 3, 40, 32);
        const fuselageMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            specular: 0x555555,
            shininess: 30
        });
        
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        fuselage.rotation.z = Math.PI / 2;
        fuselage.castShadow = true;
        planeGroup.add(fuselage);
        
        // Nose cone
        const noseGeometry = new THREE.ConeGeometry(3, 6, 32);
        const nose = new THREE.Mesh(noseGeometry, fuselageMaterial);
        nose.rotation.z = Math.PI / 2;
        nose.position.set(23, 0, 0);
        nose.castShadow = true;
        planeGroup.add(nose);
        
        // Tail cone
        const tailConeGeometry = new THREE.ConeGeometry(3, 8, 32);
        const tailCone = new THREE.Mesh(tailConeGeometry, fuselageMaterial);
        tailCone.rotation.z = -Math.PI / 2;
        tailCone.position.set(-23, 0, 0);
        tailCone.castShadow = true;
        planeGroup.add(tailCone);
    },
    
    // Create wings
    createWings: function(planeGroup) {
        // Create wing shape
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(15, -1);
        wingShape.lineTo(18, -2);
        wingShape.lineTo(18, -3);
        wingShape.lineTo(0, -3);
        wingShape.lineTo(0, 0);
        
        const wingExtrudeSettings = {
            steps: 1,
            depth: 1.5,
            bevelEnabled: true,
            bevelThickness: 0.3,
            bevelSize: 0.2,
            bevelOffset: 0,
            bevelSegments: 3
        };
        
        const wingGeometry = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
        const wingMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            specular: 0x555555,
            shininess: 30
        });
        
        // Left wing
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-5, 0, 0);
        leftWing.castShadow = true;
        planeGroup.add(leftWing);
        
        // Right wing (mirror of left wing)
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(-5, 0, 0);
        rightWing.rotation.y = Math.PI;
        rightWing.castShadow = true;
        planeGroup.add(rightWing);
    },
    
    // Create tail section
    createTail: function(planeGroup) {
        // Vertical stabilizer (tail fin)
        const tailFinShape = new THREE.Shape();
        tailFinShape.moveTo(0, 0);
        tailFinShape.lineTo(-4, 0);
        tailFinShape.lineTo(-6, 7);
        tailFinShape.lineTo(-3, 7);
        tailFinShape.lineTo(0, 0);
        
        const tailExtrudeSettings = {
            steps: 1,
            depth: 0.5,
            bevelEnabled: true,
            bevelThickness: 0.2,
            bevelSize: 0.1,
            bevelOffset: 0,
            bevelSegments: 2
        };
        
        const tailFinGeometry = new THREE.ExtrudeGeometry(tailFinShape, tailExtrudeSettings);
        const tailMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            specular: 0x555555,
            shininess: 30
        });
        
        const tailFin = new THREE.Mesh(tailFinGeometry, tailMaterial);
        tailFin.position.set(-20, 3, 0);
        tailFin.castShadow = true;
        planeGroup.add(tailFin);
        
        // Horizontal stabilizers
        const hStabShape = new THREE.Shape();
        hStabShape.moveTo(0, 0);
        hStabShape.lineTo(5, 0);
        hStabShape.lineTo(7, -0.5);
        hStabShape.lineTo(7, -1);
        hStabShape.lineTo(0, -1);
        hStabShape.lineTo(0, 0);
        
        const hStabGeometry = new THREE.ExtrudeGeometry(hStabShape, tailExtrudeSettings);
        
        // Left horizontal stabilizer
        const leftHStab = new THREE.Mesh(hStabGeometry, tailMaterial);
        leftHStab.position.set(-20, 2, 0.5);
        leftHStab.castShadow = true;
        planeGroup.add(leftHStab);
        
        // Right horizontal stabilizer
        const rightHStab = new THREE.Mesh(hStabGeometry, tailMaterial);
        rightHStab.position.set(-20, 2, -0.5);
        rightHStab.rotation.y = Math.PI;
        rightHStab.castShadow = true;
        planeGroup.add(rightHStab);
    },
    
    // Create engines
    createEngines: function(planeGroup) {
        const engineGeometry = new THREE.CylinderGeometry(1.5, 1.5, 5, 24);
        const engineMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            specular: 0x888888,
            shininess: 60
        });
        
        // Intake geometry
        const intakeGeometry = new THREE.CylinderGeometry(1.6, 1.4, 0.5, 24);
        const intakeMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            specular: 0x888888,
            shininess: 80
        });
        
        // Exhaust geometry
        const exhaustGeometry = new THREE.CylinderGeometry(1.4, 1.6, 0.5, 24);
        const exhaustMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            specular: 0x888888,
            shininess: 80
        });
        
        // Engine mounts
        const mountGeometry = new THREE.BoxGeometry(3, 0.5, 1);
        const mountMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            specular: 0x888888,
            shininess: 50
        });
        
        // Left engine
        const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        leftEngine.rotation.z = Math.PI / 2;
        leftEngine.position.set(-3, -3, -8);
        leftEngine.castShadow = true;
        planeGroup.add(leftEngine);
        
        const leftIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
        leftIntake.rotation.z = Math.PI / 2;
        leftIntake.position.set(-0.5, -3, -8);
        leftIntake.castShadow = true;
        planeGroup.add(leftIntake);
        
        const leftExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        leftExhaust.rotation.z = Math.PI / 2;
        leftExhaust.position.set(-5.5, -3, -8);
        leftExhaust.castShadow = true;
        planeGroup.add(leftExhaust);
        
        const leftMount = new THREE.Mesh(mountGeometry, mountMaterial);
        leftMount.position.set(-3, -1.5, -8);
        leftMount.castShadow = true;
        planeGroup.add(leftMount);
        
        // Right engine
        const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        rightEngine.rotation.z = Math.PI / 2;
        rightEngine.position.set(-3, -3, 8);
        rightEngine.castShadow = true;
        planeGroup.add(rightEngine);
        
        const rightIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
        rightIntake.rotation.z = Math.PI / 2;
        rightIntake.position.set(-0.5, -3, 8);
        rightIntake.castShadow = true;
        planeGroup.add(rightIntake);
        
        const rightExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        rightExhaust.rotation.z = Math.PI / 2;
        rightExhaust.position.set(-5.5, -3, 8);
        rightExhaust.castShadow = true;
        planeGroup.add(rightExhaust);
        
        const rightMount = new THREE.Mesh(mountGeometry, mountMaterial);
        rightMount.position.set(-3, -1.5, 8);
        rightMount.castShadow = true;
        planeGroup.add(rightMount);
    },
    
    // Create windows
    createWindows: function(planeGroup) {
        const windowGeometry = new THREE.PlaneGeometry(0.7, 0.7);
        const windowMaterial = new THREE.MeshPhongMaterial({
            color: 0x88CCFF,
            specular: 0xFFFFFF,
            shininess: 100,
            transparent: true,
            opacity: 0.7
        });
        
        // Create passenger windows along fuselage
        for (let i = -15; i < 15; i += 2) {
            // Windows on the left side
            const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
            leftWindow.position.set(i, 1, 3.01);  // Slightly outside radius
            leftWindow.rotation.y = Math.PI / 2;
            planeGroup.add(leftWindow);
            
            // Windows on the right side
            const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
            rightWindow.position.set(i, 1, -3.01);  // Slightly outside radius
            rightWindow.rotation.y = -Math.PI / 2;
            planeGroup.add(rightWindow);
        }
        
        // Cockpit windows
        const cockpitGeometry = new THREE.SphereGeometry(2.8, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpitMaterial = new THREE.MeshPhongMaterial({
            color: 0x88CCFF,
            specular: 0xFFFFFF,
            shininess: 200,
            transparent: true,
            opacity: 0.7
        });
        
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(21, 1, 0);
        cockpit.rotation.x = Math.PI / 2;
        cockpit.rotation.y = Math.PI / 2;
        planeGroup.add(cockpit);
    },
    
    // Create landing gear
    createLandingGear: function(planeGroup) {
        // Main strut geometry
        const strutGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
        const strutMaterial = new THREE.MeshPhongMaterial({
            color: 0x777777,
            specular: 0x999999,
            shininess: 60
        });
        
        // Wheel geometry
        const wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16);
        const wheelMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            specular: 0x444444,
            shininess: 30
        });
        
        // Housing geometry
        const housingGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
        const housingMaterial = new THREE.MeshPhongMaterial({
            color: 0x555555,
            specular: 0x777777,
            shininess: 40
        });
        
        // Front landing gear
        const frontStrut = new THREE.Mesh(strutGeometry, strutMaterial);
        frontStrut.position.set(15, -3, 0);
        planeGroup.add(frontStrut);
        
        const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontWheel.position.set(15, -4.5, 0);
        frontWheel.rotation.x = Math.PI / 2;
        planeGroup.add(frontWheel);
        
        const frontHousing = new THREE.Mesh(housingGeometry, housingMaterial);
        frontHousing.position.set(15, -1.5, 0);
        planeGroup.add(frontHousing);
        
        // Left main landing gear
        const leftStrut = new THREE.Mesh(strutGeometry, strutMaterial);
        leftStrut.position.set(-5, -3, -3);
        planeGroup.add(leftStrut);
        
        const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        leftWheel.position.set(-5, -4.5, -3);
        leftWheel.rotation.x = Math.PI / 2;
        planeGroup.add(leftWheel);
        
        const leftHousing = new THREE.Mesh(housingGeometry, housingMaterial);
        leftHousing.position.set(-5, -1.5, -3);
        planeGroup.add(leftHousing);
        
        // Right main landing gear
        const rightStrut = new THREE.Mesh(strutGeometry, strutMaterial);
        rightStrut.position.set(-5, -3, 3);
        planeGroup.add(rightStrut);
        
        const rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        rightWheel.position.set(-5, -4.5, 3);
        rightWheel.rotation.x = Math.PI / 2;
        planeGroup.add(rightWheel);
        
        const rightHousing = new THREE.Mesh(housingGeometry, housingMaterial);
        rightHousing.position.set(-5, -1.5, 3);
        planeGroup.add(rightHousing);
    },
    
    // Animation function for gear retraction
    retractGear: function(planeGroup, isRetracted) {
        // Find all landing gear components
        planeGroup.traverse(function(child) {
            if (child.name && child.name.includes('gear')) {
                child.visible = !isRetracted;
            }
        });
    },
    
    // Create wing flaps that can be animated
    animateFlaps: function(planeGroup, flapAngle) {
        // Find flap components and rotate them
        planeGroup.traverse(function(child) {
            if (child.name && child.name.includes('flap')) {
                child.rotation.x = flapAngle;
            }
        });
    }
};

// Export the PlaneModel object
if (typeof module !== 'undefined') {
    module.exports = PlaneModel;
} 
