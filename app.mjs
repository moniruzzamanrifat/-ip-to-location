import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import geoip from "geoip-lite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => res.render("index"));

// Socket.IO: receive client IP, lookup location
io.on("connection", (socket) => {
  socket.on("report-ip", (clientPublicIp) => {
    const geo = geoip.lookup(clientPublicIp);

    if (!geo) {
      socket.emit("client-location", { error: "Location not found" });
      return;
    }

    socket.emit("client-location", {
      ip: clientPublicIp,
      country: geo.country || null,
      region: geo.region || null,
      city: geo.city || null,
      latitude: geo.ll ? geo.ll[0] : null,
      longitude: geo.ll ? geo.ll[1] : null,
    });
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
