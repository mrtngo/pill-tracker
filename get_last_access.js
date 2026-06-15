import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Parse .env.local
const envPath = "./.env.local";
const envContent = fs.readFileSync(envPath, "utf-8");

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(?:"([^"]*)"|'([^']*)'|([^\\r\\n]*))`, "m"));
  return match ? (match[1] || match[2] || match[3] || "") : null;
};

const supabaseUrl = getEnvVar("SUPABASE_URL");
const supabaseKey = getEnvVar("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
  console.error("Could not read SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY from env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CACHE_FILE = "./.isp_cache.json";

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    }
  } catch (e) {
    // Ignore
  }
  return {};
}

function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (e) {
    // Ignore
  }
}

async function isStarlinkIp(ip, cache) {
  if (!ip || ip.includes(":") || ip === "127.0.0.1") return false;
  
  if (cache[ip] !== undefined) {
    return cache[ip];
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}`);
    if (res.ok) {
      const data = await res.json();
      const isp = data.isp || "";
      const org = data.org || "";
      const isStarlink = isp.toLowerCase().includes("starlink") || 
                         org.toLowerCase().includes("starlink") || 
                         isp.toLowerCase().includes("space exploration") || 
                         org.toLowerCase().includes("space exploration") || 
                         isp.toLowerCase().includes("spacex") || 
                         org.toLowerCase().includes("spacex");
      cache[ip] = isStarlink;
      saveCache(cache);
      return isStarlink;
    }
  } catch (e) {
    // Ignore
  }
  return false;
}

async function run() {
  console.log("Fetching last accesses from request_logs (excluding Starlink)...");
  const { data, error } = await supabase
    .from("request_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Error fetching logs:", error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("No accesses recorded in request_logs.");
    return;
  }

  const cache = loadCache();
  
  let lastNonStarlinkLog = null;
  for (const log of data) {
    const starlink = await isStarlinkIp(log.ip, cache);
    if (!starlink) {
      lastNonStarlinkLog = log;
      break;
    }
  }

  if (!lastNonStarlinkLog) {
    console.log("\nNo non-Starlink accesses found in the last 500 logs.");
    return;
  }

  const log = lastNonStarlinkLog;
  const time = new Date(log.created_at).toLocaleString();
  const location = [log.city, log.country].filter(Boolean).join(", ") || "Unknown";
  const osBrowser = [log.os_name, log.browser_name].filter(Boolean).join("/") || "Unknown";

  console.log("\nLast Access details (filtered out Starlink):");
  console.log("Time:      ", time);
  console.log("IP:        ", log.ip || "Unknown");
  console.log("Location:  ", decodeURIComponent(location));
  console.log("Method:    ", log.method);
  console.log("Endpoint:  ", log.endpoint);
  console.log("OS/Browser:", osBrowser);
  console.log("PWA:       ", log.is_pwa ? "Yes" : "No");
  console.log("Client ID: ", log.client_id || "null");
}

run();
