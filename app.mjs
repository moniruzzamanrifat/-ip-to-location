import express from "express";
import geoip from "geoip-lite";
import { publicIpv4 } from "public-ip";
import os from "os";

const app = express();
const PORT = 5000;

app.set("view engine", "ejs");
app.use(express.static("public"));

// Get local IP from the device
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

// Lookup location info
function lookupIP(ip) {
  const geo = geoip.lookup(ip);
  if (!geo) return null;

  return {
    ip,
    country: geo.country || null,
    region: geo.region || null,
    city: geo.city || null,
    latitude: geo.ll ? geo.ll[0] : null,
    longitude: geo.ll ? geo.ll[1] : null,
  };
}

// Main route
app.get("/", async (req, res) => {
  try {
    const localIP = getLocalIP();
    const publicIP = await publicIpv4({ timeout: 3000 });

    console.log("Local IP:", localIP);
    console.log("Public IP:", publicIP);

    let data = lookupIP(publicIP);
    if (!data) {
      console.warn(`No GeoIP data for ${publicIP}, using fallback 8.8.8.8`);
      data = lookupIP("8.8.8.8");
    }

    res.render("index", { localIP, publicIP, data });
  } catch (err) {
    console.error("Error:", err);
    const fallback = lookupIP("8.8.8.8");
    res.render("index", { localIP: "Unknown", publicIP: "Unknown", data: fallback });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
