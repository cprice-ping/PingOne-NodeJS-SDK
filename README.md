# PingOne NodeJS SDK

 Module to support making calls to P1 Services from NodeJS

 This is an attempt to make PingOne API calls easier to make. Due to the need for a P1 Worker token, these calls need to be be handled from a server-side component - add this line to initialilize the SDK:

 `import * as pingOneClient from "./sdk/pingOneSDK.js"`

## Currently Implemented Methods

### Helper Functions

* `getWorkerToken`: Used to get the Worker Token used for the API call
* `makeApicall`: Used to perform the API call with the Worker
* `pollApiCall`: Some P1 API calls need you to poll for `status`
* `getSdkToken`: Used by the DaVinci Widget

### PingOne Service Calls

| PingOne API | Methods | API Reference |
| --- | --- | --- |
| **Sessions** | | |
| | `getSession` | |
| | `updateSession` | |
| **Authorize** | | |
| | `getAuthorizeDecision` (PDP) | |
| **Credentials** | | |
| | `pairDigitalWallet` | |
| | `getCredentialTransaction` (Polling) | |
| **Protect** | | | 
| | `getProtectDecision` | |
| | `updateProtectDecision` | |
| **MFA** | | |
| | `createMfaDevice` | |
| | `activateMfaDevice` | |
| | `createMfaDeviceAuthentication` | |
| | `validateMfaDeviceAuthentication` | |
| **Images** | | |
| | `uploadImage` | |

### Using the SDK

The SDK handles the actual P1 API call - it will get a Worker token and add it to the API call.
Given the variability of the P1 APIs - it's up to the calling function to construct the proper contents of the request.

#### PingOne Protect

| PingOne API | Methods |
| --- | --- |
| `getProtectDecision` |[Create Risk Evaluation](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-create-risk-evaluation) |
| `updateProtectDecision` |[Update Risk Evaluation](https://apidocs.pingidentity.com/pingone/platform/v1/api/#put-update-risk-evaluation) |

`getProtectDecision`:

Construct the API Body like this:

```js
// Construct Risk Eval body
    const body = {
      event: {
        "targetResource": { 
            "id": "Signals SDK demo",
            "name": "Signals SDK demo"
        },
        "ip": req.headers['x-forwarded-for'].split(",")[0].trim(), 
        "flow": { 
            "type": "AUTHENTICATION",
            "sub-type": "ACTIVE_SESSION"
        },
        "session": {
            "id": req.body.sessionId
        },
        "browser": {
            "userAgent": req.headers['user-agent']
        },
        "sdk": {
          "signals": {
              "data": req.body.sdkpayload // Signals SDK payload from Client
          }
        },
        "user": {
          "id": username, // if P1, send in the UserId and set `type` to PING_ONE
          "name": username, // This is displayed in Dashboard and Audit
          "type": "EXTERNAL"
        },
        "sharingType": "PRIVATE", 
        "origin": "FACILE_DEMO"
      }
    } 
  ```

Then pass the body into the SDK method:

```js
const riskEval = await pingOneClient.getProtectDecision(body)
```

Note: The SDK takes care of the Headers \ Method for this specific call

`updateProtectDecision`:`

```js
const updateEval = await pingOneClient.updateProtectDecision(riskEval.id, "SUCCESS")
```
