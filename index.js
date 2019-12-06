var request = require("request");
var crypto = require("crypto");
var querystring = require("querystring");

function getNonce() {
  return new Date().getTime();
}

function LBCClient(key, secret, otp) {
  var self = this;

  var config = {
    url: "https://localbitcoins.com/api",
    key: key,
    secret: secret,
    otp: otp,
    timeoutMS: 5000
  };

  /**
   * This method makes a public or private API request.
   * @param  {String}   method   The API method (public or private)
   * @param  {Object}   params   Arguments to pass to the api call
   * @param  {String}   type     For Get or Post request
   * @param  {Function} callback A callback function to be executed when the request is complete
   * @return {Object}            The request object
   */
  function api(method, params, type, callback) {
    let delete_route = "/";
    let user_get_route = "/";
    let post_chat_message = "/";
    let get_chat_sms = "/";
    let get_single_ad = "/";
    let update_price_equation = "/";
    let cancelTrade = "/";
    let releaseTrade = "/";
    let releaseTradeWithPin = "/";

    if (params) {
      if (params.hasOwnProperty("msg")) {
        let id = params.contact_id;
        post_chat_message = `contact_message_post/${id}`;
        delete params.contact_id;
      }

      if (params.hasOwnProperty("ad_id")) {
        let id = params.ad_id;
        delete_route = `ad-delete/${id}`;
        get_single_ad = `ad-get/${id}`;
        update_price_equation = `ad-equation/${params.ad_id}`;
      }
      if (params.hasOwnProperty("contact_id")) {
        let id = params.contact_id;
        params = null;
        user_get_route = `contact_info/${id}`;
        get_chat_sms = `contact_messages/${id}`;
        cancelTrade = `contact_cancel/${id}`;
        releaseTrade = `contact_release/${id}`;
      }
      if(params.hasOwnProperty("pincode")){
        let id = params.contact_id;
        releaseTradeWithPin = `contact_release_pin/${id}`;
        delete params.contact_id;
      }
    }

    var methods = {
      public: [],
      private: [
        "ads",
        "ad-get",
        "ad-create",
        `${get_single_ad}`,
        `${update_price_equation}`,
        `${delete_route}`,
        "myself",
        "dashboard",
        "dashboard/released",
        "dashboard/canceled",
        "dashboard/closed",
        "dashboard/released/buyer",
        "dashboard/canceled/buyer",
        "dashboard/closed/buyer",
        "dashboard/released/seller",
        "dashboard/canceled/seller",
        "dashboard/closed/seller",
        "wallet-send",
        "notifications",
        "recent_messages",
        `${user_get_route}`,
        `${post_chat_message}`,
        `${get_chat_sms}`,
        "dashboard/canceled",
        `${cancelTrade}`,
        `${releaseTrade}`,
        `${releaseTradeWithPin}`
      ]
    };

    if (methods.public.indexOf(method) !== -1) {
      return publicMethod(method, params, type, callback);
    } else if (methods.private.indexOf(method) !== -1) {
      return privateMethod(method, params, type, callback);
    } else {
      throw new Error(method + " is not a valid API method.");
    }
  }

  /**
   * This method makes a public API request.
   * @param  {String}   method   The API method (public or private)
   * @param  {Object}   params   Arguments to pass to the api call
   * @param  {String}   type     For Get or Post request
   * @param  {Function} callback A callback function to be executed when the request is complete
   * @return {Object}            The request object
   */
  function publicMethod(method, params, type, callback) {
    params = params || {};

    var path = "/" + method;
    var url = config.url + path;

    return rawRequest(url, {}, params, type, callback);
  }

  /**
   * This method makes a private API request.
   * @param  {String}   method   The API method (public or private)
   * @param  {Object}   params   Arguments to pass to the api call
   * @param  {String}   type     For Get or Post request
   * @param  {Function} callback A callback function to be executed when the request is complete
   * @return {Object}            The request object
   */
  function privateMethod(method, params, type, callback) {
    params = params || {};

    var path = "/" + method;
    var url = config.url + path;

    const nonce = getNonce();

    var signature = getMessageSignature(path, params, nonce);
    // console.log(params);

    var headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "Apiauth-Key": config.key,
      "Apiauth-Nonce": nonce,
      "Apiauth-Signature": signature
    };

    return rawRequest(url, headers, params, type, callback);
  }

  /**
   * This method returns a signature for a request as a Base64-encoded string
   * @param  {String}  path    The relative URL path for the request
   * @param  {Object}  request The POST body
   * @param  {Integer} nonce   A unique, incrementing integer
   * @return {String}          The request signature
   */
  function getMessageSignature(path, params, nonce) {
    var postParameters = querystring.stringify(params);
    var path = "/api" + path + "/";
    var message = nonce + config.key + path + postParameters;
    var auth_hash = crypto
      .createHmac("sha256", config.secret)
      .update(message)
      .digest("hex")
      .toUpperCase();
    return auth_hash;
  }

  /**
   * This method sends the actual HTTP request
   * @param  {String}   url      The URL to make the request
   * @param  {Object}   headers  Request headers
   * @param  {Object}   params   POST body
   * @param  {String}   type     For Get or Post request
   * @param  {Function} callback A callback function to call when the request is complete
   * @return {Object}            The request object
   */
  function rawRequest(url, headers, params, type, callback) {
    var options = {
      url: url + "/",
      headers: headers,
      form: params
    };
    if (type === "GET") {
      var req = request.get(options, function(error, response, body) {
        if (typeof callback === "function") {
          var data;

          if (error) {
            callback.call(
              self,
              new Error("Error in server response: " + JSON.stringify(error)),
              null
            );
            return;
          }

          try {
            data = JSON.parse(body);
          } catch (e) {
            callback.call(
              self,
              new Error("Could not understand response from server: " + body),
              null
            );
            return;
          }

          if (data.error && data.error.length) {
            callback.call(self, data.error, null);
          } else {
            callback.call(self, null, data);
          }
        }
      });

      return req;
    }

    var req = request.post(options, function(error, response, body) {
      if (typeof callback === "function") {
        var data;

        if (error) {
          callback.call(
            self,
            new Error("Error in server response: " + JSON.stringify(error)),
            null
          );
          return;
        }

        try {
          data = JSON.parse(body);
        } catch (e) {
          callback.call(
            self,
            new Error("Could not understand response from server: " + body),
            null
          );
          return;
        }

        if (data.error && data.error.length) {
          callback.call(self, data.error, null);
        } else {
          callback.call(self, null, data);
        }
      }
    });

    return req;
  }

  self.api = api;
  self.publicMethod = publicMethod;
  self.privateMethod = privateMethod;
}

module.exports = LBCClient;
