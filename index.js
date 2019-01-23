const loki = require('lokijs')
      ,db = new loki('./data/data.json',{})
      ,express = require('express')
      ,app = express()
      ,moment = require('./src/moment.min.js')
;
let server = app.listen(9001, function(){
  console.log('server is running on port 3001')
});
io = require('socket.io')(server);

app.use(express.static('dist'));
io.on('connection', function(socket) {
  console.log(socket.id+' connected')
})

db.loadDatabase({},()=> {
  let base = db.getCollection('base')
  io.on('connection', (client) => {
    // get all
    client.on('start',() => {
      io.sockets.emit('start',base.find())
      console.log(base.find())
    })
    // edit one
    client.on('update',(data) => {
      let obj = base.findOne({['$loki']:data.$loki });
      if (obj) {
        obj = data
        base.update(obj);
        db.saveDatabase();
      }
    })
    // delete one
    client.on('delete',(id) => {
      let obj = base.findOne({['$loki']:id });
      if (obj) {
        base.remove(obj);
        db.saveDatabase();
      }
    })    
    // add one
    client.on('add',(data) => {
      base.insert(data)
      db.saveDatabase();      
    })
  })
/*
let data = [
 {prog_list:'01.01.00',targ_list:'155',cat_id:'3,62,82,0',srokmin:6,srokmax:12,sum_min:1000000,summ_max:3000000,kds_rate:2,zp_rate:1,rate:9.99}
,{prog_list:'03.01.00,03.01.01',targ_list:'195,155',cat_id:'1',srokmin:3,srokmax:5,kds_rate:2,zp_rate:1,rate:18} //res
,{prog_list:'03.01.00',targ_list:'195,155',cat_id:'1',srokmin:6,srokmax:7,kds_rate:2,zp_rate:1,rate:17} //res
]
*/
// запрос
let req = {prog:'01.01.00',targ:155,cat_id:0,srok:7,summa:1500000,ask_kds:true,ask_zp:true}

res = base.find().filter((el) =>
  el.cat_id.includes(req.cat_id)
  && req.srok >= el.srokmin && req.srok <= el.srokmax
  && el.prog_list.includes(req.prog)
  && el.targ_list.includes(req.targ)
  && req.summa >= el.sum_min && req.summa <= el.summ_max
);

function get_rate() {
  // беру только первое вхождение
  let obj = res[0]
  // если решение нашлось
  if (obj) {
    if (req.ask_kds) {obj.kds_disc = 0} else {obj.kds_disc = obj.kds_rate}
    if (req.ask_zp) {obj.zp_disc = 0} else {obj.zp_disc = obj.zp_rate}
  }
  return obj.rate - obj.kds_disc - obj.zp_disc  
}

})

/*
let start = moment('08.11.2018', 'DD.MM.YYYY', true)
let end = moment('10.11.2018', 'DD.MM.YYYY', true)
let date = moment('07.11.2018', 'DD.MM.YYYY', true)
console.log(moment(date).isBetween(start, end, 'days', '[]'))
*/