// config/dns.js

import dns from "node:dns";

// Force Node.js to use Google DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);

//console.log("✅ DNS servers configured:", dns.getServers());