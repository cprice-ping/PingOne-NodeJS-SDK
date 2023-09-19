import fetch from "node-fetch";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const p1ApiRoot = `${process.env.APIROOT}/v1/environments/${process.env.ENVID}`
const p1AuthRoot = `${process.env.AUTHROOT}/${process.env.ENVID}`
const p1OrchestrateRoot = `${process.env.ORCHESTRATEAPIROOT}/v1/company/${process.env.ENVID}`

/********************************************
 * PingOne Sessions
 *******************************************/

// Retrieves the session identified by the provided token.
export async function getSession(sessionToken) {

  const accessToken = await getWorkerToken();
  const apiEndpoint = "sessions"

  const url = `${p1ApiRoot}/${apiEndpoint}/me`

  const response = await fetch(url, {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Cookie': `ST=${sessionToken}`
    }
  })
  .then(res => res.json())
  .then(data => { return data })
  .catch(err => console.log(`${apiEndpoint} Error: ${err.code}`))
  
  return response;
}

// Updates the session identified by the provided token.
export async function updateSession(sessionToken, session) {
  const accessToken = await getWorkerToken();
  const apiEndpoint = "sessions"

  const url = `${p1ApiRoot}/${apiEndpoint}/me`

  const response = await fetch(url, {
    method: 'put',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Cookie': `ST=${sessionToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(deviceBody)
  })
  .then(res => res.json())
  .then(data => { return data })
  .catch(err => console.log(`${apiEndpoint} Error: ${err.code}`))
  
  return response;
}
/* PingOne Sessions */

/********************************************
 * PingOne MFA
 *******************************************/
export async function createMfaDevice(userId, deviceBody){
  
  const accessToken = await getWorkerToken();

  const apiEndpoint = `users/${userId}/devices`
  const url = `${p1ApiRoot}/${apiEndpoint}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    },
    body: JSON.stringify(deviceBody)
  })
  .then(res => res.json())
  .then(data => { return data })
  .catch(err => console.log(`${apiEndpoint} Error: ${err.code}`))
  
  return response
}

export async function activateMfaDevice(userId, deviceId, activateDeviceBody){
  
  const accessToken = await getWorkerToken();

  const apiEndpoint = `users/${userId}/devices/${deviceId}`
  const url = `${p1ApiRoot}/${apiEndpoint}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      "Content-Type": "application/vnd.pingidentity.device.activate+json",
      "Authorization": `Bearer ${accessToken}`
    },
    body: JSON.stringify(activateDeviceBody)
  })
  .then(response => response.text())
  .then(data => { return data })
  .catch(err => console.log(`${apiEndpoint} Error: ${err.code}`))
  
  return response
}

export async function createMfaDeviceAuthentication(userId){
  
  const accessToken = await getWorkerToken();

  const apiEndpoint = `deviceAuthentications`
  const url = `${p1ApiRoot}/${apiEndpoint}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      user: {
        id: userId
      }
    })
  })
  .then(res => res.json())
  .then(data => { return data })
  .catch(err => console.log(`${apiEndpoint} Error: ${err.code}`))
  
  return response
}

export async function validateMfaDeviceAuthentication(deviceAuthId, validateBody){
  
  const accessToken = await getWorkerToken();

  const apiEndpoint = `deviceAuthentications/${deviceAuthId}`
  const url = `${p1ApiRoot}/${apiEndpoint}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      "Content-Type": "application/vnd.pingidentity.assertion.check+json",
      "Authorization": `Bearer ${accessToken}`
    },
    body: JSON.stringify(validateBody)
  })
  .then(res => res.json())
  .then(data => { return data })
  .catch(err => console.log(`${apiEndpoint} Error: ${err.code}`))
  
  return response
}
/* PingOne MFA */

/*********************************************
 * PingOne Images API
*********************************************/

// Uploads an base64 JPEG image to P1 Images API.
export async function uploadImage(filename, referenceImage) {
  
  const accessToken = await getWorkerToken();

  const apiEndpoint = `images`
  const url = `${p1ApiRoot}/${apiEndpoint}`
  
  const response = await fetch(url, {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'image/jpeg',
      'content-disposition': `attachment; filename=${filename}`
    },
    body: referenceImage
    })
    .then(res => res.json())
    .catch(err => console.log(`${apiEndpoint} Error: ${err.code}`))
  
  return response;
}
/* PingOne Images API */

// Obtains an access token for the PingOne worker application used to retrieve/update sessions.
// This is a naive implementation that gets a token every time.
// It could be improved to cache the token and only get a new one when it is expiring.
const getWorkerToken = async () => {
  
  var urlencoded = new URLSearchParams();
  urlencoded.append("grant_type", "client_credentials");

  const apiEndpoint = "as/token"
  const url = `${p1AuthRoot}/${apiEndpoint}`
  
  const response = await fetch(url,
    {
      method: 'post',
      body: urlencoded,
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': "Basic " + btoa(process.env.WORKERID+":"+process.env.WORKERSECRET)
    }
  })
  .then(res => res.json())
  .then(data => { return data })
  .catch(err => console.log(`${apiEndpoint} Error: ${err.code}`))
  
  return response.access_token;
}

// Obtains an "SDK token" that is passed into the DV widget to execute the flow policy.
// The session token is passed in via 'global.sessionToken' to make it available to the flow.
// exports.getSdkToken = async (sessionToken) => {
  export async function getSdkToken(sessionToken, policyId) {
    const requestBody = {
      policyId: policyId
    };
    
    if (sessionToken) {
      requestBody.global = { sessionToken };
    }
  
    const apiEndpoint = "sdktoken"
    const url = `${p1OrchestrateRoot}/${apiEndpoint}`
    
    const response = await fetch(url, {
      method: 'post',
      headers: {
        "X-SK-API-KEY": process.env.dvApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    })
    .then(res => res.json())
    .then(data => { return data })
    .catch(err => console.log(`${apiEndpoint} Error: ${err.code}`))
  
    //console.log(response)
    return response.access_token
  } 