// Fighter Jet Model Creator
const PlaneModel = {
    // Create a complete fighter jet
    createFighterJet: function(scene) {
        const planeGroup = new THREE.Group();
        
        // Add all fighter jet components
        this.createFuselage(planeGroup);
        this.createWings(planeGroup);
        this.createTail(planeGroup);
        this.createEngines(planeGroup);
        this.createCockpit(planeGroup);
        this.createLandingGear(planeGroup);
        
        // Set initial position
        planeGroup.position.set(0, 20, 0);
        scene.add(planeGroup);
        
        return planeGroup;
    },
    
    // Create fighter jet fuselage (body)
    createFuselage: function(planeGroup) {
        // Main body cylinder - narrower and longer for sleekness
        const fuselageGeometry = new THREE.CylinderGeometry(1.5, 1.5, 60, 32);
        const fuselageMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,  // White base color, typical for fighter jet prototypes
            specular: 0x555555,
            shininess: 30
        });
        
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        fuselage.rotation.z = Math.PI / 2;  // Align along x-axis
        fuselage.castShadow = true;
        planeGroup.add(fuselage);
        
        // Nose cone - pointed and elongated
        const noseGeometry = new THREE.ConeGeometry(1.5, 10, 32);
        const nose = new THREE.Mesh(noseGeometry, fuselageMaterial);
        nose.rotation.z = Math.PI / 2;
        nose.position.set(30, 0, 0);  // Base at fuselage end, tip extends forward
        nose.castShadow = true;
        planeGroup.add(nose);
        
        // Tail cone - shorter, integrates with exhaust
        const tailConeGeometry = new THREE.ConeGeometry(1.5, 10, 32);
        const tailCone = new THREE.Mesh(tailConeGeometry, fuselageMaterial);
        tailCone.rotation.z = -Math.PI / 2;  // Points backward
        tailCone.position.set(-30, 0, 0);   // Base at fuselage rear
        tailCone.castShadow = true;
        planeGroup.add(tailCone);
    },
    
    // Create wings - swept-back for aerodynamics
    createWings: function(planeGroup) {
        // Define a swept-back wing shape
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);       // Root leading edge
        wingShape.lineTo(8, -15);     // Tip leading edge (swept back)
        wingShape.lineTo(10, -15);    // Tip trailing edge
        wingShape.lineTo(2, 0);       // Root trailing edge
        wingShape.lineTo(0, 0);
        
        const wingExtrudeSettings = {
            steps: 1,
            depth: 0.5,               // Thinner than commercial wings
            bevelEnabled: true,
            bevelThickness: 0.2,
            bevelSize: 0.1,
            bevelOffset: 0,
            bevelSegments: 2
        };
        
        const wingGeometry = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
        const wingMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            specular: 0x555555,
            shininess: 30
        });
        
        // Left wing - positioned lower on fuselage
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-5, -1, 0);
        leftWing.castShadow = true;
        planeGroup.add(leftWing);
        
        // Right wing - mirrored
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(-5, -1, 0);
        rightWing.rotation.y = Math.PI;  // Mirror across y-axis
        rightWing.castShadow = true;
        planeGroup.add(rightWing);
    },
    
    // Create tail section - twin vertical stabilizers
    createTail: function(planeGroup) {
        // Vertical stabilizers (twin fins)
        const tailFinShape = new THREE.Shape();
        tailFinShape.moveTo(0, 0);
        tailFinShape.lineTo(-2, 0);
        tailFinShape.lineTo(-3, 4);  // Smaller, more angular
        tailFinShape.lineTo(-1, 4);
        tailFinShape.lineTo(0, 0);
        
        const tailExtrudeSettings = {
            steps: 1,
            depth: 0.3,              // Thin profile
            bevelEnabled: true,
            bevelThickness: 0.1,
            bevelSize: 0.05,
            bevelOffset: 0,
            bevelSegments: 2
        };
        
        const tailFinGeometry = new THREE.ExtrudeGeometry(tailFinShape, tailExtrudeSettings);
        const tailMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            specular: 0x555555,
            shininess: 30
        });
        
        // Left tail fin
        const leftTailFin = new THREE.Mesh(tailFinGeometry, tailMaterial);
        leftTailFin.position.set(-25, 1.5, 1.5);
        leftTailFin.rotation.x = Math.PI / 2;  // Vertical orientation
        leftTailFin.castShadow = true;
        planeGroup.add(leftTailFin);
        
        // Right tail fin
        const rightTailFin = new THREE.Mesh(tailFinGeometry, tailMaterial);
        rightTailFin.position.set(-25, 1.5, -1.5);
        rightTailFin.rotation.x = Math.PI / 2;
        rightTailFin.castShadow = true;
        planeGroup.add(rightTailFin);
        
        // Horizontal stabilizers
        const hStabShape = new THREE.Shape();
        hStabShape.moveTo(0, 0);
        hStabShape.lineTo(3, 0);
        hStabShape.lineTo(4, -0.5);
        hStabShape.lineTo(4, -1);
        hStabShape.lineTo(0, -1);
        hStabShape.lineTo(0, 0);
        
        const hStabGeometry = new THREE.ExtrudeGeometry(hStabShape, tailExtrudeSettings);
        
        // Left horizontal stabilizer
        const leftHStab = new THREE.Mesh(hStabGeometry, tailMaterial);
        leftHStab.position.set(-25, 1, 0.5);
        leftHStab.castShadow = true;
        planeGroup.add(leftHStab);
        
        // Right horizontal stabilizer
        const rightHStab = new THREE.Mesh(hStabGeometry, tailMaterial);
        rightHStab.position.set(-25, 1, -0.5);
        rightHStab.rotation.y = Math.PI;
        rightHStab.castShadow = true;
        planeGroup.add(rightHStab);
    },
    
    // Create engines - integrated with fuselage
    createEngines: function(planeGroup) {
        // Intake geometry - side-mounted
        const intakeGeometry = new THREE.BoxGeometry(2, 1, 1);
        const intakeMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,  // Dark gray for realism
            specular: 0x888888,
            shininess: 80
        });
        
        // Left intake
        const leftIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
        leftIntake.position.set(-10, -1, 2);
        leftIntake.castShadow = true;
        planeGroup.add(leftIntake);
        
        // Right intake
        const rightIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
        rightIntake.position.set(-10, -1, -2);
        rightIntake.castShadow = true;
        planeGroup.add(rightIntake);
        
        // Exhaust geometry - rear-mounted with slight flare
        const exhaustGeometry = new THREE.CylinderGeometry(1, 1.2, 3, 24);
        const exhaustMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            specular: 0x888888,
            shininess: 80
        });
        
        // Exhaust
        const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        exhaust.rotation.z = Math.PI / 2;
        exhaust.position.set(-30, 0, 0);  // Aligned with tail cone
        exhaust.castShadow = true;
        planeGroup.add(exhaust);
    },
    
    // Create cockpit canopy - sleek and forward
    createCockpit: function(planeGroup) {
        const canopyGeometry = new THREE.SphereGeometry(1.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const canopyMaterial = new THREE.MeshPhongMaterial({
            color: 0x88CCFF,    // Light blue tint
            specular: 0xFFFFFF,
            shininess: 200,     // High shininess for glass effect
            transparent: true,
            opacity: 0.7
        });
        
        const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
        canopy.position.set(20, 1.5, 0);  // Positioned forward on fuselage
        canopy.rotation.x = Math.PI / 2;
        planeGroup.add(canopy);
    },
    
    // Create landing gear - compact and retractable
    createLandingGear: function(planeGroup) {
        // Main strut geometry - slimmer
        const strutGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
        const strutMaterial = new THREE.MeshPhongMaterial({
            color: 0x777777,
            specular: 0x999999,
            shininess: 60
        });
        
        // Wheel geometry - smaller
        const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
        const wheelMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            specular: 0x444444,
            shininess: 30
        });
        
        // Housing geometry - compact
        const housingGeometry = new THREE.BoxGeometry(1, 0.5, 1);
        const housingMaterial = new THREE.MeshPhongMaterial({
            color: 0x555555,
            specular: 0x777777,
            shininess: 40
        });
        
        // Front landing gear
        const frontStrut = new THREE.Mesh(strutGeometry, strutMaterial);
        frontStrut.position.set(10, -1.5, 0);
        planeGroup.add(frontStrut);
        
        const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontWheel.position.set(10, -3, 0);
        frontWheel.rotation.x = Math.PI / 2;
        planeGroup.add(frontWheel);
        
        const frontHousing = new THREE.Mesh(housingGeometry, housingMaterial);
        frontHousing.position.set(10, -0.5, 0);
        planeGroup.add(frontHousing);
        
        // Left main landing gear
        const leftStrut = new THREE.Mesh(strutGeometry, strutMaterial);
        leftStrut.position.set(-10, -1.5, -2);
        planeGroup.add(leftStrut);
        
        const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        leftWheel.position.set(-10, -3, -2);
        leftWheel.rotation.x = Math.PI / 2;
        planeGroup.add(leftWheel);
        
        const leftHousing = new THREE.Mesh(housingGeometry, housingMaterial);
        leftHousing.position.set(-10, -0.5, -2);
        planeGroup.add(leftHousing);
        
        // Right main landing gear
        const rightStrut = new THREE.Mesh(strutGeometry, strutMaterial);
        rightStrut.position.set(-10, -1.5, 2);
        planeGroup.add(rightStrut);
        
        const rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        rightWheel.position.set(-10, -3, 2);
        rightWheel.rotation.x = Math.PI / 2;
        planeGroup.add(rightWheel);
        
        const rightHousing = new THREE.Mesh(housingGeometry, housingMaterial);
        rightHousing.position.set(-10, -0.5, 2);
        planeGroup.add(rightHousing);
    },
    
    // Animation function for gear retraction
    retractGear: function(planeGroup, isRetracted) {
        planeGroup.traverse(function(child) {
            if (child.name && child.name.includes('gear')) {
                child.visible = !isRetracted;
            }
        });
    },
    
    // Animate wing flaps
    animateFlaps: function(planeGroup, flapAngle) {
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
