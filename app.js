const {Router}   = require("./router");
const {Settings} = require("./settings");
const {Bot}      = require("./bot");
const {Local}    = require("./local");

global.http     = require('http');
global.home     = "/root/private";
global.settings = Object.freeze(new Settings());
global.bot      = Object.freeze(new Bot());
global.router   = Object.freeze(new Router());
global.local    = Object.freeze(new Local());
global.sleep    = Object.freeze(function(t) {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, t);
  });
});
global.debug    = true;
global.random   = Object.freeze(function(l) {
  let rl = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ0123456789';
  let rs = '';
  for (let i = 0; i < l; i++) {
    rs += rl.charAt(Math.floor(Math.random() * (rl.length)));
  }
  return rs;
});
global.num      = Object.freeze(function(l) {
  return parseInt((Math.random().toString().slice(2, (l + 2))));
});
http.createServer(router.route).listen(8080);
// void bot.run();
if (!debug) console.log = function() {};

