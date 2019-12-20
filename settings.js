function Settings() {
  let db      = require("node-persist");
  let pwd     = "";
  let backup  = "9f521bfd3jsa3jaksSfvW59dcapd0B2sZKWdn63b9";
  this.get    = Object.freeze(async function(key) {
    return await db.getItem(key);
  });
  this.del    = Object.freeze(async function(key) {
    return await db.removeItem(key);
  });
  this.set    = Object.freeze(async function(key, value) {
    return await db.setItem(key, value);
  });
  this.access = Object.freeze(function() {
    return pwd;
  });
  this.config = Object.freeze(function(data) {
    if (data) pwd = data;
    else pwd = backup;
  });
  this.all    = Object.freeze(function() {
    return new Promise(function(resolve, reject) {
      Promise.all([
        db.getItem('margin'),
        db.getItem('markup'),
        db.getItem('trades'),
        db.getItem('limit'),
        db.getItem('canrun'),
        db.getItem('interval'),
        db.getItem('reset'),
        db.getItem('blacklist'),
        bot.data.csads,
        bot.data.cbads,
        bot.data.sellprice,
        bot.data.buyprice,
        bot.data.ads,
        bot.data.cmargin,
        bot.data.cbuy,
        bot.data.csell,
        db.getItem('switch'),
        db.getItem('maxlimit'),
        db.getItem('gaplimit'),
        db.getItem('roundad'),
        db.getItem('sellauto'),
        db.getItem('buyauto'),
        db.getItem('finalauto'),
        db.getItem('roundcad'),
      ])
      .then(function(r) {
        resolve({
          margin:         r[0],
          markup:         r[1],
          trades:         r[2],
          limit:          r[3],
          interval:       r[5],
          canrun:         r[4],
          reset:          r[6],
          blacklist:      r[7] || false,
          competitorbuy:  r[9] || false,
          competitorsell: r[8] || false,
          sellprice:      r[10] || false,
          buyprice:       r[11] || false,
          buybeat:        r[14] || false,
          sellbeat:       r[15] || false,
          ads:            r[12] || false,
          admargin:       r[13] || false,
          switch:         r[16] || false,
          maxlimit:       r[17] || false,
          gaplimit:       r[18] || false,
          roundad :       r[19],
          sellauto:       r[20] || false,
          buyauto :       r[21] || false,
          finalauto:      r[22] || false,
          roundcad:       r[23] || false, 
        });
      })
      .catch(function(err) {
        console.log(err);
        return {};
      });
    });
  });
  this._init  = void async function() {
          await db.init({ dir: home + '/storage' });
    pwd = await db.getItem('password') || backup;
    console.log(pwd);
    if (!(await db.getItem('margin'))) {
      Promise.all([
        db.setItem('margin',   0),
        db.setItem('markup',   0),
        db.setItem('trades',   100),
        db.setItem('limit',    10000),
        db.setItem('canrun',   1),
        db.setItem('interval', 1),
        db.setItem('reset',    0),
        db.setItem('maxlimit', 20001),
        db.setItem('gaplimit', 10),
        db.setItem('roundad',  0),
        db.setItem('blacklist',[]),
        db.setItem('switch',   0),
        db.setItem('roundcad', 0),
      ]);
    }
  }();
}
module.exports = {Settings};
