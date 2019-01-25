const loki = require('lokijs')
      ,db = new loki('./data/data.json',{})
      ,express = require('express')
      ,app = express()
      ,moment = require('./src/moment.min.js')
;
let server = app.listen(9001, function(){
  console.log('server is running on port 9001')
});
io = require('socket.io')(server);

app.use(express.static('dist'));
io.on('connection', function(socket) {
  // console.log(socket.id+' connected')
})

db.loadDatabase({},()=> {
  let base = db.getCollection('base')
  io.on('connection', (client) => {
    // get all
    client.on('start',() => {
      io.sockets.emit('start',base.find())
      // console.log(base.find())
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
    // test request
    client.on('request',(req)=>{
      // console.log(data)
      let res = get_rate(req)
      io.sockets.emit('result',res)
    })
  })

  // make decision
function get_rate(req) {
  res = base.find().filter((el) =>
    moment(req.date, 'DD.MM.YYYY', true).isBetween(moment(el.dstart, 'DD.MM.YYYY', true), moment(el.dend, 'DD.MM.YYYY', true), 'days', '[]')
    && el.prog_list.includes(req.prog)
    && el.targ_list.includes(req.targ)
    && el.cat_id.includes(req.cat_id)
    && req.term >= el.srokmin && req.term <= el.srokmax
    && req.amount >= el.sum_min && req.amount <= el.sum_max
  );
  console.log(req)
  console.log(base.find())
  // беру только первое вхождение
  let obj = res[0]
  // если решение не нашлось = 0
  if (!obj) {
    return 0
  }
  if (req.ask_kds) {obj.kds_disc = 0} else {obj.kds_disc = obj.kds_rate}
  if (req.ask_zp) {obj.zp_disc = 0} else {obj.zp_disc = obj.zp_rate}
  return obj.rate + obj.kds_disc + obj.zp_disc
}

})