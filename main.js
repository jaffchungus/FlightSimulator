<!DOCTYPE html>
<html>
<head>
    <title>Fighter Jet Flight Simulator</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        /* Additional styling for map notification */
        #map-info {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.7);
            color: #00ff00;
            padding: 10px;
            border-radius: 5px;
            font-family: 'Arial', sans-serif;
            font-size: 14px;
            z-index: 1000;
            max-width: 250px;
            transition: opacity 1s;
        }
        
        /* Weapons info styling */
        #weapons-info {
            position: fixed;
            bottom: 70px;
            right: 20px;
            background: rgba(0,0,0,0.7);
            color: #ff9900;
            padding: 10px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div id="loading">Loading Fighter Jet Simulator...</div>
    <div id="hud"></div>
    <div id="flight-info"></div>
    <div id="cockpit-view"></div>
    <div id="flight-instruments"></div>
    <div id="weather-alert"></div>
    <div id="controls">Controls: W/S or ↑/↓ - Pitch | A/D or ←/→ - Roll | Q/E - Yaw | Shift - Throttle Up | Ctrl - Throttle Down | G - Gear | X - Afterburner</div>
    <div id="weapons-info">Weapon Controls: SPACE/Mouse - Fire | 1,2,3 - Select Weapon | Mouse Wheel - Cycle Weapons</div>
    <div id="crash-message">CRASHED! Restarting in 3...</div>
    <div id="error"></div>
    <div id="debug" style="position: fixed; bottom: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 10px; font-family: monospace; z-index: 1000;"></div>
    <div id="map-info">MAP UPGRADED:<br>• Larger world with extended terrain<br>• Longer runway (4500m)<br>• More detailed airport<br>• Starting position marked with yellow square</div>
    
    <!-- Load Three.js first -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    
    <!-- Load simulator modules -->
    <script src="planeModel.js"></script>
    <script src="physics.js"></script>
    <script src="environment.js"></script>
    <script src="controls.js"></script>
    <script src="main.js"></script>
    
    <script>
        // Initialize simulator when everything is loaded
        window.addEventListener('load', function() {
            console.log("Page loaded, initializing simulator");
            if (typeof init === 'function') {
                try {
                    init();
                    console.log("Simulator initialized successfully");
                    
                    // Hide map info after 10 seconds
                    setTimeout(function() {
                        const mapInfo = document.getElementById('map-info');
                        if (mapInfo) {
                            mapInfo.style.opacity = '0';
                            setTimeout(function() {
                                mapInfo.style.display = 'none';
                            }, 1000);
                        }
                    }, 10000);
                    
                } catch (error) {
                    console.error("Error initializing simulator:", error);
                    document.getElementById('error').style.display = 'block';
                    document.getElementById('error').textContent = 'Error initializing simulator: ' + error.message;
                }a
            } else {
                console.error("init function not found");
                document.getElementById('error').style.display = 'block';
                document.getElementById('error').textContent = 'Error: Simulator initialization failed - init function not found';
            }
            
            // Setup debug info
            window.addEventListener('keydown', function(e) {
                if (e.key === 'd') {
                    const debug = document.getElementById('debug');
                    debug.style.display = debug.style.display === 'none' ? 'block' : 'none';
                }
            });
        });
    </script>
</body>
</html>
