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
