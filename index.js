const { InteractiveBrowserCredential } = require("@azure/identity");
const { BlobServiceClient } = require("@azure/storage-blob");
const { PublicClientApplication } = require("@azure/msal-browser");
// import AuthenticationContext from 'adal-angular/lib/adal'
// import { AuthenticationContext } from 'react-adal'
// Now do something interesting with BlobServiceClient

const listContainersButton = document.getElementById("list-containers-button");
const listContainersMsalButton = document.getElementById("list-containers-msal-button");
const listContainersAdalButton = document.getElementById("list-containers-adal-button");
const status = document.getElementById("status");

const reportStatus = message => {
    status.innerHTML += `${message}<br/>`;
    status.scrollTop = status.scrollHeight;
}

// -----------------------------------

const listContainers = async () => {
    // this works with the cedd-test-2021-02-04 app registration
    // It gets its own token under the hood, I think using implicit flow, using either adal or msal v1.x I guess
    const defaultAzureCredential = new InteractiveBrowserCredential(
        {
            clientId:"611fa3fe-d569-4b94-b9ba-31128f9087bd",
            redirectUri:"http://localhost:1234",
            tenantId:"90610670-1a80-434a-88c3-e568bce39bc5",
            loginStyle:"redirect"
        }
    );

    const blobServiceClient = new BlobServiceClient(
    `https://archiebackup.blob.core.windows.net`,
    defaultAzureCredential
    );

    let iter = blobServiceClient.listContainers();
    let containerItem = await iter.next();
    while (!containerItem.done) {
        console.log(`Container: ${containerItem.value.name}`);
        reportStatus(`Container: ${containerItem.value.name}`);
        containerItem = await iter.next();
    }
    reportStatus(`Done internally by blob client library.`);
}

listContainersButton.addEventListener("click", listContainers);

// -----------------------------------

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
    reportStatus(`Done msal.`);
}

listContainersMsalButton.addEventListener("click", listContainersMsal);


// -----------------------------------

export const tenant = '90610670-1a80-434a-88c3-e568bce39bc5'
// export const turbineApiClientId = '4e7e6e03-790b-4d40-ad3b-6b704f6ebbec'
// export const layoutApiClientId = '0edc92fe-5663-4dd7-a94a-9b3f831916dc'
// export const projectApiClientId = '32426fce-8689-48db-81cd-b9535220215c'
// export const yieldApiClientId = '113519de-6613-40f6-8412-c5e53d541d7f'
export const ramClientId = '7189c18a-5c52-4a52-afc4-25bf36fa2175'
export const clientId = '57b1c265-bba9-4096-af18-0471c694b089'



  export const adalConfig = {
    tenant: tenant,
    clientId: clientId, // this should be the client id of the ram
    redirectUri: window.location.origin,
    callback: listContainersAdalFromToken,
    endpoints: {
      // [turbinesEndpoint.API]: turbineApiClientId,
      // [projectsEndpoint.API]: projectApiClientId,
      // [energyYieldsEndpoint.API]: yieldApiClientId,
      // [layoutsEndpoint.API]: layoutApiClientId
    }
  }
  
  let authContext  = new AuthenticationContext(adalConfig)
  
  // Check For & Handle Redirect From AAD After Login
  //var isCallback = authContext.isCallback(window.location.hash);
  //authContext.handleWindowCallback();
  //$errorMessage.html(authContext.getLoginError());
  
  // if (isCallback && !authContext.getLoginError()) {
  //     window.location = authContext._getItem(authContext.CONSTANTS.STORAGE.LOGIN_REQUEST);
  // }
  
  const listContainersAdal = async () => {
    // todo: The App Registration needs to be set up differently for this to work
    // todo: this works with the cedd-test-2021-02-03 app registration
    authContext.acquireTokenRedirect(
        clientId, // this should be the client id of the blob storage api I think, not of the ram any more
        null,
        null
      )

    // authContext.acquireToken(
    //     clientId, // this should be the client id of the blob storage api I think, not of the ram any more
    //     listContainersAdalFromToken
    //   )
}

//listContainersAdalButton.addEventListener("click", listContainersAdal);

