Node LocalBitcoins
===========

NodeJS Client Library for the LocalBitcoins API

This is an asynchronous node js client for the localbitcoins.com API.

It exposes all the API methods found here: https://localbitcoins.com/api-docs/ through the 'api' method:

Example Usage:

`npm i localbitcoins-changes-nodejs`

```javascript
const LBCClient = require(localbitcoins-changes-nodejs);
const lbc = new LBCClient(api_key, api_secret);

// Display user's info
lbc.api('myself', null, function(error, data) {
    if(error) {
        console.log(error);
    }
    else {
        console.log(data);
    }
});

```

To-Do: 
- ad-create

Credit:

Forked from https://github.com/pardeep889/
