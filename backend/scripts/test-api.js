/**
 * Full API test - login, create blood request, get my-requests
 * Run this while the server is running: node scripts/test-api.js
 */
const http = require("http");

const BASE = "http://localhost:5000/api";

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "localhost",
      port: 5000,
      path: `/api${path}`,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(data && { "Content-Length": Buffer.byteLength(data) }),
      },
    };
    const req = http.request(options, (res) => {
      let chunks = "";
      res.on("data", (c) => (chunks += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(chunks) });
        } catch {
          resolve({ status: res.statusCode, body: chunks });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log("=== LifeLink API Test ===\n");

  // 1. Login
  console.log("1. Logging in as testuser@lifelink.com...");
  const login = await request("POST", "/auth/login", {
    email: "testuser@lifelink.com",
    password: "Test@1234",
  });
  console.log("   Status:", login.status);
  if (login.status !== 200) {
    console.error("   ❌ Login failed:", login.body);
    return;
  }
  const token = login.body.token;
  console.log("   ✅ Login OK. Token:", token ? token.slice(0, 30) + "..." : "MISSING");

  // 2. Get my-requests (should be empty or have old ones)
  console.log("\n2. GET /blood/my-requests...");
  const getReqs1 = await request("GET", "/blood/my-requests", null, token);
  console.log("   Status:", getReqs1.status);
  if (getReqs1.status !== 200) {
    console.error("   ❌ Get my-requests failed:", getReqs1.body);
  } else {
    console.log("   ✅ Got", getReqs1.body.length, "existing requests");
  }

  // 3. Create a blood request
  console.log("\n3. POST /blood/request (creating O+ request)...");
  const createReq = await request("POST", "/blood/request", {
    patientName: "API Test Patient",
    bloodGroup: "O+",
    units: 1,
    requestAddress: "Test Hospital, Test City",
    phone: "9999999999",
    urgency: "Normal",
    requiredDate: "2026-03-25",
  }, token);
  console.log("   Status:", createReq.status);
  if (createReq.status !== 201) {
    console.error("   ❌ Create request failed:", JSON.stringify(createReq.body, null, 2));
    return;
  }
  console.log("   ✅ Request created. ID:", createReq.body.bloodRequest?._id);
  console.log("   Matched donors:", createReq.body.matchedDonors);

  // 4. Get my-requests again – should now have 1 more
  console.log("\n4. GET /blood/my-requests (after creating)...");
  const getReqs2 = await request("GET", "/blood/my-requests", null, token);
  console.log("   Status:", getReqs2.status);
  if (getReqs2.status !== 200) {
    console.error("   ❌ Get my-requests failed:", JSON.stringify(getReqs2.body, null, 2));
  } else {
    console.log("   ✅ Got", getReqs2.body.length, "requests");
    if (getReqs2.body.length > 0) {
      const first = getReqs2.body[0];
      console.log("   Latest request:", {
        id: first._id,
        patientName: first.patientName,
        bloodGroup: first.bloodGroup,
        status: first.status,
        acceptedDonors: first.acceptedDonors?.length,
      });
    } else {
      console.error("   ❌ NO REQUESTS RETURNED! This is the bug.");
    }
  }

  console.log("\n=== Done ===");
}

run().catch(console.error);
