function Local() {
  let filters;
  let keys                = [];
  let adcache             = {};
  let pricecache          = {};
  const f                 = parseFloat;
  const i                 = parseInt;
  const fetch             = require("node-fetch");
  const crypto            = require("crypto");
  const {URLSearchParams} = require('url');
  const signature   = Object.freeze(function(path, params, nonce, authkey, authsecret) {
  	let parameters	= params || "";
  	let message = nonce + authkey + path + parameters;
  	let auth_hash = crypto.createHmac("sha256", authsecret).update(message).digest('hex').toUpperCase();
  	return auth_hash;
  });
  const microtime   = Object.freeze(function() {
    let hrTime = process.hrtime();
    return (hrTime[0] * 1000000 + parseInt(hrTime[1] / 1000) + Date.now());
  });
  const filter      = Object.freeze(function(a_) {
    let a = a_;
    let adlimit = false;
    if (a.data.max_amount_available) adlimit = parseInt(a.data.max_amount_available);
		else if (a.data.max_amount) adlimit = parseInt(a.data.max_amount);
		let f1 = parseInt(a.data.profile.trade_count) >= filters.trades;
    let f2 = parseInt(a.data.min_amount) <= parseInt(filters.limit);
    let f3 = parseInt(filters.maxlimit) <= parseInt(adlimit);
    let f4 = (parseInt(adlimit) - parseInt(a.data.min_amount)) >= parseInt(filters.gaplimit);
    if (filters.blacklist.includes(a.data.profile.username.toLowerCase())) return false;
    if (filters.blacklist.includes(a.data.ad_id.toString())) return false;
    else if (f1 && f2 && f3 && f4) {
      console.log(a.data.profile.username);
    	return {
    		user: a.data.profile.username,
    		price: filters.roundcad ? Math.round(f(a.data.temp_price)) : f(a.data.temp_price)
    	};
    }
  });
  const init        = Object.freeze(function() {
    Promise.all([
      settings.get("key-one"),
      settings.get("secret-one"),
      settings.get("key-two"),
      settings.get("secret-two"),
      settings.get("key-three"),
      settings.get("secret-three"),
      settings.get("key-four"),
      settings.get("secret-four"),
      settings.get("key-five"),
      settings.get("secret-five")
    ]).
    then(data => {
      keys = data;
      console.log(data);
    }).
    catch(err => {
      setTimeout(init, 1000 * 60 * 5);
      console.log(err);
    });
  });
  
  this.adsprivate   = Object.freeze(function(type, id) {
    return new Promise(function(resolve, reject) {
      let nonce    = microtime();
      let url      = 'https://localbitcoins.com';
      let path     = '/api/ad-get/' + id + '/';
      let adkey    = keys[4];
      let adsecret = keys[5];
      let options  = {
        method: type,
        headers: {
    			'Content-Type': 'application/x-www-form-urlencoded',
    			'Apiauth-Key': adkey,
    			'Apiauth-Nonce': nonce,
    			'Apiauth-Signature': signature(path, null, nonce, adkey, adsecret)
    		}
      };
      fetch(url + path, options).
      then(response => response.json()).
      then(result => resolve(result)).
      catch(err => resolve(false));
    });
  });
  this.adsmine      = Object.freeze(function() {
    return new Promise(function(resolve, reject) {
      let nonce    = microtime();
      let url      = 'https://localbitcoins.com';
      let path     = '/api/ads/';
      let adkey    = keys[2];
      let adsecret = keys[3];
      let options  = {
        method: 'get',
        headers: {
    			'Content-Type': 'application/x-www-form-urlencoded',
    			'Apiauth-Key': adkey,
    			'Apiauth-Nonce': nonce,
    			'Apiauth-Signature': signature(path, null, nonce, adkey, adsecret)
    		}
      };
      fetch(url + path, options).
      then(response => response.json()).
      then(result => resolve(result)).
      catch(err => resolve(false));
    });
  });
  this.adsupdate    = Object.freeze(function(equation, id) {
    return new Promise(function(resolve, reject) {
      let nonce    = microtime();
      let url      = 'https://localbitcoins.com';
      let path     = '/api/ad-equation/' + id + '/';
      let adkey    = keys[0];
      let adsecret = keys[1];
      let params   = new URLSearchParams();
      params.append('price_equation', equation);
      let options  = {
        method: 'post',
        headers: {
    			'Content-Type': 'application/x-www-form-urlencoded',
    			'Apiauth-Key': adkey,
    			'Apiauth-Nonce': nonce,
    			'Apiauth-Signature': signature(path, params, nonce, adkey, adsecret)
    		},
    		body: params
      };
      fetch(url + path, options).
      then(response => response.json()).
      then(result => {
        console.log(result);
        resolve(result);
      }).
      catch(err => {
        console.log(err);
        resolve(false);
      });
    });
  });
  this.adspublic    = Object.freeze(function(m, cc, cn, pm) {
    return new Promise(function(resolve, reject) {
      let url = `https://localbitcoins.com/${m ? 'sell' : 'buy'}-bitcoins-online/${cc}/${cn}/${pm}/.json`;
      fetch(url).
      then(response => response.json()).
      then(result => {
        let prices = [];
        let adlist = result.data.ad_list;
        if (!adcache[m] || !adcache[m].length) {
          adcache[m] = adlist.filter(ad => ad.data.ad_id);
          local.adsscrub(m, adcache[m]);
        }
    	  for (var i = 0; i < adlist.length; i++) {
    	    prices.push(filter(adlist[i]));
    	  }
    	  prices = prices.filter(p => p);
    	  if (m == 'sell') prices = prices.splice(0, 3);
    	  resolve(prices);
      }).
      catch(err => {
        console.log(err);
        resolve([]);
      });
    });
  });
  this.adsscrub     = Object.freeze(function(t, ads) {
    let cid = ads.pop();
    if (typeof cid == 'object') cid = cid.data.ad_id;
    console.log(cid);
    if (!cid) {
      Promise.resolve(() => {
        let pr = pricecache[t];
        let h = pricecache[t][0] ? pricecache[t][0].price : null;
        let t1 = [];
        if (h) t1.push(parseFloat(h));
        let t2 = t ? Math.min(...t1) : Math.max(...t1);
        let data = [t2, pr, t];
        t ? bot.data.cbuy = data[0] : bot.data.csell = data[0];
      }).
      then(() => Promise.resolve(bot.gmp())).
      then(() => Promise.resolve(bot.uads())).
      then(() => Promise.resolve(bot.sads())).
      then(() => pricecache = {}).
      catch(err => console.log(err));
    }
    else {
      if (!pricecache[t]) pricecache[t] = [];
      Promise.resolve(local.adsprivate('get', cid.toString())).
      then(result => {
        if (typeof result != 'object') throw "error 503";
        if (!result.data || !result.data.ad_list[0]) {
          console.log(cid + " failed.");
          console.log(JSON.stringify(result));
        }
        else pricecache[t].push(filter(result.data.ad_list[0]));
      }).
      then(() => {
        Promise.resolve(sleep(5000)).then(() => local.adsscrub(t, ads));
      }).
      catch(err => {
        console.log(err);
        Promise.resolve(sleep(5000)).then(() => local.adsscrub(t, ads));
      });
    }
  });
  
  this.gettrades    = Object.freeze(function() {
    return new Promise(function(resolve) {
      let nonce    = microtime();
      let url      = 'https://localbitcoins.com';
      let path     = '/api/dashboard/';
      let adkey    = keys[6];
      let adsecret = keys[7];
      let options  = {
        method: 'get',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Apiauth-Key': adkey,
          'Apiauth-Nonce': nonce,
          'Apiauth-Signature': signature(path, null, nonce, adkey, adsecret)
        }
      };
      fetch(url + path, options).
      then(response => response.json()).
      then(result => resolve(result)).
      catch(err => resolve(false));
    });
  });
  this.gettradeinfo = Object.freeze(function(id) {
    return new Promise(function(resolve) {
      let nonce    = microtime();
      let url      = 'https://localbitcoins.com';
      let path     = '/api/contact_info/' + String(id) + '/';
      let adkey    = keys[6];
      let adsecret = keys[7];
      let options  = {
        method: 'get',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Apiauth-Key': adkey,
          'Apiauth-Nonce': nonce,
          'Apiauth-Signature': signature(path, null, nonce, adkey, adsecret)
        }
      };
      fetch(url + path, options).
      then(response => response.json()).
      then(result => resolve(result)).
      catch(err => resolve(false));
    });
  });
  this.getmessages  = Object.freeze(function(id) {
    return new Promise(function(resolve) {
      let nonce    = microtime();
      let url      = 'https://localbitcoins.com';
      let path     = '/api/contact_messages/' + String(id) + '/';
      let adkey    = keys[6];
      let adsecret = keys[7];
      let options  = {
        method: 'get',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Apiauth-Key': adkey,
          'Apiauth-Nonce': nonce,
          'Apiauth-Signature': signature(path, null, nonce, adkey, adsecret)
        }
      };
      fetch(url + path, options).
      then(response => response.json()).
      then(result => resolve(result)).
      catch(err => resolve(false));
    });
  });
  
  this.sendmessage  = Object.freeze(function(id, message) {
    return new Promise(function(resolve) {
      let nonce    = microtime();
      let url      = 'https://localbitcoins.com';
      let path     = '/api/contact_message_post/' + String(id) + '/';
      let adkey    = keys[8];
      let adsecret = keys[9];
      let params   = new URLSearchParams();
          params.append('msg', message);
      let options  = {
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Apiauth-Key': adkey,
          'Apiauth-Nonce': nonce,
          'Apiauth-Signature': signature(path, params, nonce, adkey, adsecret)
        },
        body: params,
      };
      fetch(url + path, options).
      then(response => response.json()).
      then(result => resolve(result)).
      catch(err => resolve(false));
    });
  });


  init();
  setInterval(function() {
    Promise.resolve(settings.all()).
    then(function(data) {
      filters = data;
      filters.blacklist = filters.blacklist.map(b => b.toLowerCase());
    });
  }, 1000);
}

module.exports = {Local};