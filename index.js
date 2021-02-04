// index.js
const { InteractiveBrowserCredential } = require("@azure/identity");
const { BlobServiceClient } = require("@azure/storage-blob");
const { PublicClientApplication } = require("@azure/msal-browser");
// Now do something interesting with BlobServiceClient

const listContainersButton = document.getElementById("list-containers-button");
const listContainersMsalButton = document.getElementById("list-containers-msal-button");
const status = document.getElementById("status");

const reportStatus = message => {
    status.innerHTML += `${message}<br/>`;
    status.scrollTop = status.scrollHeight;
}

const listContainers = async () => {
    // this works with the cedd-test-2021-02-04 app registration
    // It gets its own token under the hood, I think using implicit flow, using either adal or msal v1.x I guess
    const account = "archiebackup";
    const defaultAzureCredential = new InteractiveBrowserCredential(
        {
            clientId:"611fa3fe-d569-4b94-b9ba-31128f9087bd",
            redirectUri:"http://localhost:1234",
            tenantId:"90610670-1a80-434a-88c3-e568bce39bc5",
            loginStyle:"redirect"
        }
    );

    const blobServiceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    defaultAzureCredential
    );

    let iter = blobServiceClient.listContainers();
    let containerItem = await iter.next();
    while (!containerItem.done) {
        console.log(`Container: ${containerItem.value.name}`);
        reportStatus(`Container: ${containerItem.value.name}`);
        containerItem = await iter.next();
    }
    reportStatus(`Done.`);
}

listContainersButton.addEventListener("click", listContainers);

const listContainersMsal = async () => {
    // MSAL.js 2.x improves on MSAL.js 1.x by supporting the authorization code flow in the browser instead of the implicit grant flow.
    // https://docs.microsoft.com/en-us/azure/active-directory/develop/migrate-spa-implicit-to-auth-code
    // The App Registration needs to be set up differently for this to work
    // this works with the cedd-test-2021-02-03 app registration
    let request = {
        scopes: ['https://storage.azure.com/user_impersonation'],
      };

    let msalInstance = new PublicClientApplication( 
        {
            auth: {
                clientId: '6964f2a5-49ab-4ee2-a4e9-95d19cc1d557',
                authority: 'https://login.microsoftonline.com/90610670-1a80-434a-88c3-e568bce39bc5',
            },
            cache: {
                cacheLocation: 'localStorage',
            }
        }
    )

    var tokenResponse
    try {
        tokenResponse = await msalInstance.acquireTokenSilent(request);
    } catch (error) {
        console.error( 'Silent token acquisition failed. Using interactive mode' );
        tokenResponse = await msalInstance.acquireTokenPopup(request);
        console.log(`Access token acquired via interactive auth ${tokenResponse.accessToken}`)
    }
    
    let tokenCredential = new CustomTokenCredential(tokenResponse.accessToken);
    
    const blobServiceClient = new BlobServiceClient(
        `https://archiebackup.blob.core.windows.net`,
        tokenCredential
    );

    let iter = blobServiceClient.listContainers();
    let containerItem = await iter.next();
    while (!containerItem.done) {
        console.log(`Container: ${containerItem.value.name}`);
        reportStatus(`Container: ${containerItem.value.name}`);
        containerItem = await iter.next();
    }
    reportStatus(`Done.`);
}

listContainersMsalButton.addEventListener("click", listContainersMsal);

class CustomTokenCredential {
    token;
    expiresOn;
  
    constructor(token, expiresOn) {
      this.token = token;
      if (expiresOn == undefined) {
        this.expiresOn = Date.now() + 60 * 60 * 1000;
      } else {
        this.expiresOn = expiresOn.getTime();
      }
    }
  
    async getToken(_scopes, _options) {
      console.log(_scopes, _options);
      return {
        token: this.token,
        expiresOnTimestamp: this.expiresOn,
      };
    }
  }

