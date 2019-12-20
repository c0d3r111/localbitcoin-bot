  function Bot() {
    const fs     = require('fs-extra');
    this.data    = {
      active:  false,
      ads:     [],
      csell:   0,
      cbuy:    0,
      csads:   [],
      cbads:   [],
      margin:  0,
      sbeat:   0,
      bbeat:   0,
      cmargin: 0,
      switch:  0,
    };
    this.reset   = false;
  
    this.gmp   = Object.freeze(function() {
      return new Promise(function(resolve, reject) {
        Promise.all([
          settings.get("markup"),
          settings.get("margin"),
          settings.get("switch")
        ]).
        then(data => {
          let markup           = parseFloat(data[0]);
          let margin           = data[1] ? parseFloat(data[1]) : 0.01; 
          let buybeat          = data[2] ? 
            parseInt(Math.round(parseFloat(bot.data.cbuy))) : 
            parseFloat(bot.data.cbuy);
          let sellbeat         = data[2] ?
            parseInt(Math.round(parseFloat(bot.data.csell))) : 
            parseFloat(bot.data.csell);
            
          console.log("settings: "  + data);
          console.log("Sell beat: " + sellbeat);
          console.log("Buy beat: "  + buybeat);
          
          bot.data.sellprice   = parseFloat(buybeat + markup);
          bot.data.cmargin     = parseFloat(((sellbeat - buybeat) / buybeat) * 100);
          bot.data.buyprice    = parseFloat(sellbeat - markup);
          
          if (!data[2]) {
            if (bot.data.cmargin < parseInt(100 - (100 * margin))) {
              bot.data.buyprice  = parseFloat(buybeat * (1 - margin));
            }
          }

          bot.data.sbeat = parseFloat(sellbeat);
          bot.data.bbeat = parseFloat(buybeat);
          resolve();
        }).
        catch(err => resolve());
      });
    });
    this.again = Object.freeze(function() {
      return new Promise(function(resolve, reject) {
        Promise.resolve(sleep(2e4)).
        then(() => {
          if (bot.reset) {
            bot.data.active = false;
            bot.reset = false;
          }
          else bot.run();
          resolve();
        });
      });
    });
    this.gap   = Object.freeze(function(t) {
      return new Promise(function(resolve, reject) {
        Promise.all([
          local.adspublic(t, 'my','malaysia','national-bank-transfer'),
          local.adspublic(t, 'my','malaysia','transfers-with-specific-bank')
        ])
        .then(function(data) {
          let pricedata = data[0].concat(data[1]);
          let prices    = pricedata.map(p => parseFloat(p.price)); 
          let target    = t ? Math.max.apply(null, prices) : Math.min.apply(null, prices);
          resolve([target, pricedata, t]);
        })
        .catch(function(err) {
          console.log(err);
          resolve(false);
        });
      });
    });
    this.uads  = Object.freeze(async function() {
      const round = await settings.get('roundad');
      
      for (let a of bot.data.ads) {
        let equation = '';
        if (a.id) {
          if (a.type == "SELL") {
            let price = (bot.data.buyprice);
            
            equation = `(${String(price)} - btc_in_usd*USD_in_MYR*1) + btc_in_usd*USD_in_MYR*1`;
            
            if (round) {
              equation = `floor((${String(price)} - btc_in_usd*USD_in_MYR*1) + btc_in_usd*USD_in_MYR*1)`;
            }
            
          }
          if (a.type == "BUY")  {
            let price = parseFloat(bot.data.sellprice);

            equation = `(${String(price)} - btc_in_usd*USD_in_MYR*1) + btc_in_usd*USD_in_MYR*1`;
            
            if (round) {
              equation = `ceil((${String(price)} - btc_in_usd*USD_in_MYR*1) + btc_in_usd*USD_in_MYR*1)`;
            }
            
          }
          
          await sleep(num(2));
          await local.adsupdate(equation, a.id);
        }
      }
    });
    this.sads  = Object.freeze(function() {
      return new Promise(function(resolve, reject) {
        Promise.resolve(local.adsmine()).
        then(ads => {
          ads = ads.data.ad_list;
          bot.data.ads = [];
          ads.forEach((ad) => {
            let t = {};
            if (ad.data.trade_type) {
              let at = ad.data.trade_type;
              t.type = at.includes('BUY') ? 'BUY' : at.includes('SELL') ? 'SELL' : false;
            } else t.type = false;
            if (ad.data.temp_price) t.price = parseFloat(ad.data.temp_price);
            else t.price = false;
            if (ad.data.ad_id) t.id = ad.data.ad_id;
            else t.id = false;
            bot.data.ads.push(t);
          });
          resolve(true);
        }).
        catch(err => {
          console.log(err);
          resolve(true);
        });
      });
    });
    this.pamg  = Object.freeze(async function() {
      const trades    = await local.gettrades();
      
      try {
        const all       = trades.data.contact_list;
        const tradeinfo = all.map(trade => {
          return {
            type      : trade.data.is_buying ? 'buy' : 'sell',
            id        : trade.data.contact_id,
            created   : new Date(trade.data.created_at).getTime(),
            completed : new Date(trade.data.closed_at).getTime() || false,
            released  : new Date(trade.data.released_at).getTime() || false,
            recipient : trade.data.buyer.real_name,
          };
        });
        
        for (let trade of tradeinfo) {
          console.log(trade);
          const current = await settings.get(trade.id);
          
          if (!current) {
            if (!trade.completed && !trade.released) {
              console.log('new trade detected');
              
              await settings.set(trade.id, trade);
              await bot.nad(trade);
            }
          }
          else {
            if (trade.released) {
              if (!current.closemessage) {
                current.released  = new Date(trade.released);
                current.completed = new Date(trade.completed);
                await bot.cad(current);
              }
            }
          }
        }
      } catch(err) {
        console.log(trades);
      }
        
      await sleep(1e4);
      return bot.pamg();
    }); 
    this.nad   = Object.freeze(async function(data) {
      let message = '';
      
      if (data.type === 'sell') {
        message = await settings.get('sellauto');
      }
      if (data.type === 'buy') {
        message = await settings.get('buyauto');
      }
        
      if (!message) return;
      
      const sent = await local.sendmessage(data.id, message);
      
      console.log(sent);
      
      return;
    });
    this.cad   = Object.freeze(async function(data) {
      const message = await settings.get('finalauto');
      
      if (!message) return;
      
      await local.sendmessage(data.id, message);
      
      data.closemessage = true;
      
      const sent = await settings.set(data.id, data);
      
      console.log(sent);
      
      return;
    });
    
    this.run   = async function() {
      if (!(await settings.get("canrun"))) this.again();
      else if (!(await settings.get('key-one'))) return;
      bot.data.active  = true;
      Promise.all([
        bot.sads(),
        bot.gap(1),
        bot.gap(0)
      ])
      .then(function(data) {
        bot.data.csads  = data[2][1];
        bot.data.cbads  = data[1][1];
        bot.data.csell  = data[2][0];
        bot.data.cbuy   = data[1][0];
        console.log("cads: " + bot.data.cbads.length);
        console.log("cads: " + bot.data.csads.length);
      })
      .then(async function() {
        void   bot.pamg();
        await  bot.gmp();
        await  bot.uads();
        await  bot.sads();
        return bot.again();
      })
      .catch(function(err) {
        console.log(err);
        bot.again();
      });
    };
  }
  
  module.exports = {Bot};
