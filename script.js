
const SERVICE_UUID =
    "12345678-1234-1234-1234-1234567890ab";

const CHARACTERISTIC_UUID =
    "abcd1234-1234-1234-1234-abcdef123456";

let bleDevice = null;
let bleServer = null;
let bleCharacteristic = null;
let latestData = null;

const page = document.body.dataset.page;

const content = document.getElementById("pageContent");
const statusElement = document.getElementById("bleStatus");
const connectButton = document.getElementById("bleConnectBtn");

const pageTitles = {
    dashboard: "Dashboard",
    sensors: "Sensors",
    alerts: "Alerts",
    gps: "GPS Location",
    system: "System"
};

document.getElementById("pageTitle").textContent =
    pageTitles[page] || "RailGuard";

document.querySelectorAll("[data-nav]").forEach(link => {
    if (link.dataset.nav === page) {
        link.classList.add("active");
    }
});

function renderPage() {
    if (page === "dashboard") {
        content.innerHTML = `
            <div class="page-heading">
                <h2>Railway Monitoring Overview</h2>
                <p>Live information from your ESP32 trolley.</p>
            </div>

            <div class="grid">
                <div class="card">
                    <div class="card-label">Left IR Sensor</div>
                    <div class="card-value" id="leftIR">Unavailable</div>
                    <div class="card-note">Track surface detection</div>
                </div>

                <div class="card">
                    <div class="card-label">Right IR Sensor</div>
                    <div class="card-value" id="rightIR">Unavailable</div>
                    <div class="card-note">Track surface detection</div>
                </div>

                <div class="card">
                    <div class="card-label">Crack Detection</div>
                    <div class="card-value" id="crack">Unavailable</div>
                    <div class="card-note">IR sensor analysis</div>
                </div>

                <div class="card">
                    <div class="card-label">Motor Status</div>
                    <div class="card-value" id="motor">Unavailable</div>
                    <div class="card-note">Four motor monitoring</div>
                </div>
            </div>

            <div class="panel">
                <h3>System Information</h3>
                <div class="data-row">
                    GPS Status <span class="data-value" id="gpsStatus">Unavailable</span>
                </div>
                <div class="data-row">
                    GSM Status <span class="data-value" id="gsm">Unavailable</span>
                </div>
                <div class="data-row">
                    SMS Status <span class="data-value" id="sms">Unavailable</span>
                </div>
                <div class="data-row">
                    Last Update <span class="data-value" id="lastUpdate">Waiting</span>
                </div>
            </div>
        `;
    }

    if (page === "sensors") {
        content.innerHTML = `
            <div class="page-heading">
                <h2>Sensor Monitoring</h2>
                <p>Live IR sensor values received from ESP32.</p>
            </div>

            <div class="grid">
                <div class="card">
                    <div class="card-label">Left IR Sensor</div>
                    <div class="card-value" id="leftIR">Unavailable</div>
                    <div class="card-note">GPIO 23</div>
                </div>

                <div class="card">
                    <div class="card-label">Right IR Sensor</div>
                    <div class="card-value" id="rightIR">Unavailable</div>
                    <div class="card-note">GPIO 22</div>
                </div>

                <div class="card">
                    <div class="card-label">Crack Detection</div>
                    <div class="card-value" id="crack">Unavailable</div>
                    <div class="card-note">LOW = normal, HIGH = crack</div>
                </div>

                <div class="card">
                    <div class="card-label">Ultrasonic Sensor</div>
                    <div class="card-value">Not connected</div>
                    <div class="card-note">HC-SR04 integration pending</div>
                </div>
            </div>
        `;
    }

    if (page === "alerts") {
        content.innerHTML = `
            <div class="page-heading">
                <h2>Railway Track Alerts</h2>
                <p>Crack detection and system notifications.</p>
            </div>

            <div class="panel">
                <h3>Current Track Condition</h3>
                <div id="alertDisplay" class="empty-state">
                    Waiting for ESP32 sensor data...
                </div>
            </div>

            <div class="panel">
                <h3>Latest Alert Information</h3>
                <div class="data-row">
                    Left IR <span id="alertLeft" class="data-value">Unavailable</span>
                </div>
                <div class="data-row">
                    Right IR <span id="alertRight" class="data-value">Unavailable</span>
                </div>
                <div class="data-row">
                    GSM SMS <span id="alertSMS" class="data-value">Unavailable</span>
                </div>
                <div class="data-row">
                    Last Update <span id="alertTime" class="data-value">Waiting</span>
                </div>
            </div>
        `;
    }

    if (page === "gps") {
        content.innerHTML = `
            <div class="page-heading">
                <h2>GPS Tracking</h2>
                <p>Location information from the NEO-6M module.</p>
            </div>

            <div class="grid">
                <div class="card">
                    <div class="card-label">GPS Status</div>
                    <div class="card-value" id="gpsStatus">Unavailable</div>
                </div>

                <div class="card">
                    <div class="card-label">Latitude</div>
                    <div class="card-value" id="latitude">Unavailable</div>
                </div>

                <div class="card">
                    <div class="card-label">Longitude</div>
                    <div class="card-value" id="longitude">Unavailable</div>
                </div>

                <div class="card">
                    <div class="card-label">GPS Fix</div>
                    <div class="card-value" id="gpsFix">Unavailable</div>
                </div>
            </div>

            <div class="panel">
                <h3>Map Location</h3>
                <p id="mapMessage" class="empty-state">
                    Waiting for valid GPS coordinates...
                </p>
                <a id="mapLink" class="map-link" target="_blank"
                   rel="noopener" hidden>Open location in Google Maps ↗</a>
            </div>
        `;
    }

    if (page === "system") {
        content.innerHTML = `
            <div class="page-heading">
                <h2>Hardware System Status</h2>
                <p>Communication and hardware monitoring.</p>
            </div>

            <div class="grid">
                <div class="card">
                    <div class="card-label">Bluetooth</div>
                    <div class="card-value" id="systemBle">Disconnected</div>
                </div>

                <div class="card">
                    <div class="card-label">Motors</div>
                    <div class="card-value" id="motor">Unavailable</div>
                </div>

                <div class="card">
                    <div class="card-label">GPS Module</div>
                    <div class="card-value" id="gpsStatus">Unavailable</div>
                </div>

                <div class="card">
                    <div class="card-label">GSM Module</div>
                    <div class="card-value" id="gsm">Unavailable</div>
                </div>
            </div>

            <div class="panel">
                <h3>Hardware Details</h3>
                <div class="data-row">Controller <span class="data-value">ESP32 DevKit V1</span></div>
                <div class="data-row">Motor Driver <span class="data-value">L298N</span></div>
                <div class="data-row">IR Sensors <span class="data-value">2 digital sensors</span></div>
                <div class="data-row">GPS <span class="data-value">NEO-6M</span></div>
                <div class="data-row">GSM <span class="data-value">SIM800L</span></div>
                <div class="data-row">Ultrasonic <span class="data-value">Not integrated</span></div>
            </div>
        `;
    }

    if (latestData) {
        updateDashboard(latestData);
    }
}

function setBleStatus(message, connected) {
    statusElement.innerHTML =
        `<span class="status-dot"></span>${message}`;

    statusElement.classList.toggle("connected", connected);

    connectButton.textContent =
        connected ? "Disconnect ESP32" : "Connect ESP32";

    if (page === "system") {
        const systemBle = document.getElementById("systemBle");
        if (systemBle) {
            systemBle.textContent =
                connected ? "Connected" : "Disconnected";
        }
    }
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function formatIR(value) {
    if (value === 0) return "Normal (LOW)";
    if (value === 1) return "Crack (HIGH)";
    return "Unavailable";
}

function updateDashboard(data) {
    latestData = data;

    setText("leftIR", formatIR(data.leftIR));
    setText("rightIR", formatIR(data.rightIR));

    setText(
        "crack",
        data.crackDetected === true ? "CRACK DETECTED" :
        data.crackDetected === false ? "Normal" : "Unavailable"
    );

    setText("motor", data.motor ?? "Unavailable");
    setText("gsm", data.gsmStatus ?? "Unavailable");
    setText("sms", data.smsStatus ?? "Unavailable");

    const gpsValid = data.gpsValid === true &&
        Number.isFinite(Number(data.latitude)) &&
        Number.isFinite(Number(data.longitude));

    setText("gpsStatus", gpsValid ? "GPS FIXED" : "No GPS FIX");
    setText("gpsFix", gpsValid ? "Valid" : "Unavailable");

    if (gpsValid) {
        setText("latitude", Number(data.latitude).toFixed(6));
        setText("longitude", Number(data.longitude).toFixed(6));

        const link = document.getElementById("mapLink");
        if (link) {
            link.href = "https://www.google.com/maps?q=" +
                encodeURIComponent(data.latitude + "," + data.longitude);
            link.hidden = false;
        }

        setText("mapMessage", "GPS coordinates received.");
    } else {
        setText("latitude", "Unavailable");
        setText("longitude", "Unavailable");
        setText("mapMessage", "Waiting for valid GPS coordinates.");

        const link = document.getElementById("mapLink");
        if (link) link.hidden = true;
    }

    setText("lastUpdate", new Date().toLocaleTimeString());

    setText("alertLeft", formatIR(data.leftIR));
    setText("alertRight", formatIR(data.rightIR));
    setText("alertSMS", data.smsStatus ?? "Unavailable");
    setText("alertTime", new Date().toLocaleTimeString());

    const alertDisplay = document.getElementById("alertDisplay");

    if (alertDisplay) {
        alertDisplay.innerHTML = data.crackDetected === true
            ? `<div class="alert-item">
                <h4 class="red">TRACK CRACK DETECTED</h4>
                <p>The ESP32 has reported a crack indication. Motor state: ${
                    escapeHTML(data.motor ?? "Unknown")
                }</p>
               </div>`
            : `<div class="alert-item normal">
                <h4 class="green">No crack indication reported</h4>
                <p>Latest IR sensor readings received from ESP32.</p>
               </div>`;
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function handleBleNotification(event) {
    const message = new TextDecoder().decode(event.target.value);

    console.log("ESP32 BLE DATA:", message);

    try {
        const data = JSON.parse(message);
        updateDashboard(data);
    } catch (error) {
        console.log("Received non-JSON BLE message:", message);
    }
}

async function connectESP32() {
    try {
        if (!navigator.bluetooth) {
            throw new Error(
                "Web Bluetooth unavailable. Use Chrome or Edge on localhost."
            );
        }

        setBleStatus("Searching for RailGuard...", false);

        // This request must happen directly inside the button click.
        bleDevice = await navigator.bluetooth.requestDevice({
            filters: [{ name: "RailGuard" }],
            optionalServices: [SERVICE_UUID]
        });

        bleDevice.addEventListener(
            "gattserverdisconnected",
            handleDisconnect
        );

        setBleStatus("Connecting...", false);

        bleServer = await bleDevice.gatt.connect();

        const service =
            await bleServer.getPrimaryService(SERVICE_UUID);

        bleCharacteristic =
            await service.getCharacteristic(CHARACTERISTIC_UUID);

        const initialValue =
            await bleCharacteristic.readValue();

        const initialMessage =
            new TextDecoder().decode(initialValue);

        console.log("Initial ESP32 data:", initialMessage);

        try {
            updateDashboard(JSON.parse(initialMessage));
        } catch (error) {
            console.log("Initial message:", initialMessage);
        }

        if (bleCharacteristic.properties.notify) {
            await bleCharacteristic.startNotifications();

            bleCharacteristic.addEventListener(
                "characteristicvaluechanged",
                handleBleNotification
            );
        }

        setBleStatus("ESP32 Connected", true);

    } catch (error) {
        console.error("BLE connection error:", error);
        setBleStatus(error.name + ": " + error.message, false);
    }
}

function handleDisconnect() {
    bleServer = null;
    bleCharacteristic = null;
    setBleStatus("Disconnected", false);
}

function disconnectESP32() {
    if (bleDevice && bleDevice.gatt && bleDevice.gatt.connected) {
        bleDevice.gatt.disconnect();
    }
}

connectButton.addEventListener("click", () => {
    if (bleServer && bleServer.connected) {
        disconnectESP32();
    } else {
        connectESP32();
    }
});

renderPage();

if (!window.isSecureContext || !navigator.bluetooth) {
    connectButton.disabled = true;
    setBleStatus("Web Bluetooth unavailable", false);
}
