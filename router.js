function Router() {
  const setsession  = {};
  const coinedgekey = "69f68c0c1706ddf6bf292691727b94d907a42129";
  const getcookie   = Object.freeze(function(req) {
    let cookie = req.headers.cookie;
    if (!cookie) return false;
    else {
      const c = cookie.split(' ').filter(k => k.split('=')[0] == 'lbcbotsession');
      if (!c.length) return false;
      else return c[0].split('=')[1];
    }
  });
  const getdata    = Object.freeze(function(req) {
    let header = req.headers['bot-data'];
    if (!header) return false;
    else {
      try { return JSON.parse(header) }
      catch(e) { return false }
    }
  });
  const getsession = Object.freeze(function(key) {
    if (!key) return false;
    else return setsession[key];
  });
  const setheaders = Object.freeze(function(res) {
    let response = res;
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', '*');
    response.setHeader('Access-Control-Allow-Headers', '*');
    response.setHeader('Access-Control-Allow-Credentials', true);
    return response;
  });
  const settimer   = Object.freeze(function(key) {
    let k = key;
    setTimeout(function() { delete setsession[k] }, 1000 * 60 * 30);
    return;
  });
  const paths      = Object.freeze({
    login:  function(data, res) {
      if (data.password === settings.access()) {
        let key = random(128);
        setsession[key] = key;
        settimer(key);
        if (!bot.data.active) {
          bot.reset = false;
          void bot.run();
        }
        res.setHeader('Set-Cookie', `lbcbotsession=${key};max-age=1800;path=/;secure;httponly;samesite=strict`);
        res.end('1');
      }
      else res.end('9');
    },
    load:   function(data, res) {
      return new Promise(function(resolve, reject) {
        Promise.resolve(settings.all()).
        then(results => resolve(res.end(JSON.stringify(results))));
      });
    },
    auth:   function(data, res) {
      Promise.all([
        settings.get('key-one'),
        settings.get('secret-one')
      ])
      .then(function(data) {
        let check = data.filter(d => d);
        if (check.length) {
          if (!bot.data.active) {
            bot.reset = false;
            void bot.run();
          }
          res.end('1');
        }
        else res.end('8');
      });
    },
    save:   function(data, res) {
      if (data.margin)    void settings.set("margin",    parseFloat(data.margin) || 0);
      if (data.markup)    void settings.set("markup",    parseFloat(data.markup) || 0);
      if (data.trades)    void settings.set("trades",    parseInt(data.trades) || 100);
      if (data.limit)     void settings.set("limit",     parseInt(data.limit) || 10001);
      if (data.interval)  void settings.set("interval",  parseInt(data.interval) || 2);
      if (data.canrun)    void settings.set("canrun",    parseInt(data.canrun) || 1);
      if (data.maxlimit)  void settings.set("maxlimit",  parseInt(data.maxlimit) || 20001);
      if (data.gaplimit)  void settings.set("gaplimit",  parseInt(data.gaplimit) || 10);
      if (data.roundad)   void settings.set("roundad",   parseInt(data.roundad) || 0);
      if (data.roundcad)  void settings.set("roundcad",  parseInt(data.roundcad) || 0);
      if (data.switch)    void settings.set("switch",    parseInt(data.switch) || 0);
      if (data.blacklist) void settings.set("blacklist", data.blacklist);
      if (data.sellauto)  void settings.set('sellauto',  data.sellauto);
      if (data.buyauto)   void settings.set('buyauto',   data.buyauto);
      if (data.finalauto) void settings.set('finalauto', data.finalauto);
      if (data.reset == 1) {
        Promise.all([
          settings.del("key-one"),
          settings.del("secret-one"),
          settings.del("key-two"),
          settings.del("secret-two"),
          settings.del("key-three"),
          settings.del("secret-three"),
          settings.del("key-four"),
          settings.del("secret-four"),
          settings.del("key-five"),
          settings.del("secret-five"),
          settings.del("password")
        ]).
        then(function() {
          bot.reset = true;
          settings.config();
          return void res.end('8');
        });
      }
      return void res.end('1');
    },
    new:    function(data, res) {
      if (data.setupkey === settings.access()) {
        Promise.all([
          settings.set("key-one", data.rw),
          settings.set("secret-one", data.rws),
          settings.set("key-two", data.ro),
          settings.set("secret-two", data.ros),
          settings.set("key-three", data.rot),
          settings.set("secret-three", data.rots),
          settings.set("key-four", data.rk4),
          settings.set("secret-four", data.rs4),
          settings.set("key-five", data.rk5),
          settings.set("secret-five", data.rs5),
          settings.set("password", data.password)
        ]).
        then(function() {
          void settings.config(data.password);
          void res.end('1');
          void setTimeout(process.exit, 2e3);
        });
      }
      else res.end('9');
    },
    coinedge: function(data, res) {
      if (data.key == coinedgekey) {
        return void res.end(JSON.stringify({buyprice:bot.data.buyprice,sellprice:bot.data.sellprice}));
      }
      return void res.end();
    }
  });

  this.route       = Object.freeze(function(req, res) {
    let response = setheaders(res);
    let request  = req.url.replace(/\W+/g,'').replace('api','');
    let data     = getdata(req);
    let cookie   = getsession(getcookie(req));
    try {
      if (!data) throw "no data";
      switch (request) {
        case "login": {
          if (!cookie) paths.login(data, response);
          else if (getsession(cookie)) ressponse.end('1');
          else response.end('9');
          break;
        }
        case "check": {
          if (getsession(cookie)) response.end('1');
          else response.end('2');
          break;
        }
        case "auth": {
          if (getsession(cookie)) paths.auth(data, response);
          else response.end('2');
          break;
        }
        case "save": {
          if (getsession(cookie)) paths.save(data,response);
          else response.end('2');
          break;
        }
        case "load": {
          if (getsession(cookie)) paths.load(data,response);
          else response.end('2');
          break;
        }
        case "new": {
          if (getsession(cookie)) paths.new(data,response);
          else response.end('2');
          break;
        }
        case "switch": {
          if (getsession(cookie)) paths.switch(data,response);
          else response.end('2');
          break;
        }
        case "coinedge": {
          paths.coinedge(data, response);
        }
        default: {
          response.end();
          break;
        }
      }
      return true;
    }
    catch(e) {
      console.log(e)
      response.end();
      return false;
    }
  });
}

module.exports = {Router};
