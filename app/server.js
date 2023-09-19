// NodeJS imports
import { fileURLToPath } from "url";
import path from "path";
// import fs from "fs";

import * as pingOneClient from "../sdk/pingOneClient.js"

// import crypto from "crypto"

// External libraries
import Fastify from "fastify";
// import fetch from "node-fetch";

// Initialize variables that are no longer available by default in Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Require the fastify framework and instantiate it
const fastify = Fastify({
  // Set this to true for detailed logging
  logger: false,
  ignoreTrailingSlash: true,
  trustProxy: true
});

// Setup our static files
fastify.register(import("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/" // optional: default '/'
});

// fastify-formbody lets us parse incoming forms
fastify.register(import("@fastify/formbody"));

// fastify-cookie lets us handle cookies
fastify.register(import("@fastify/cookie"));

/******************************************
* PingOne Protect
******************************************/

/******************************************
* Get Evaluation decision
******************************************/
fastify.post("/getProtectDecision", (req, res) => { 
    
    const userAgent = req.headers['user-agent']
  
    const username = req.body.username
    const ipAddress = req.body.ipAddress || req.headers['x-forwarded-for'].split(",")[0]
    const sdkpayload = req.body.sdkPayload
    
    // console.log("Protect Request: ", username)
  
    getProtectDecision(ipAddress, sdkpayload, username, userAgent, riskDetails => {
      res.send(riskDetails)
    })
  })

  fastify.post("/getProtectDecision", (req, res) => { 
    
    const userAgent = req.headers['user-agent']
  
    const username = req.body.username
    const ipAddress = req.body.ipAddress || req.headers['x-forwarded-for'].split(",")[0]
    const sdkpayload = req.body.sdkPayload
    
    // console.log("Protect Request: ", username)
  
    getProtectDecision(ipAddress, sdkpayload, username, userAgent, riskDetails => {
      res.send(riskDetails)
    })
  })

// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);