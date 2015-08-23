var web3 = require('web3');
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({host: '0.0.0.0', port:8085});

wss.broadcast = function broadcast(data) {
      wss.clients.forEach(function each(client) {
          try {
              client.send(JSON.stringify(data), function (err) {
                  if (err) {
                      console.log(err.message);
                  }
              });
          } catch (e) {
              console.log(e.message);
          }
      });
};
wss.on('connection', function (ws) {
    console.log('Connected: ' + (ws.upgradeReq.headers['x-forwarded-for'] || ws.upgradeReq.connection.remoteAddress));
});
wss.on('error', function (err) {
    console.log(err);
});
var blockFilter = web3.eth.filter('latest');
blockFilter.watch(function (error, result) {
    if (error) {
        console.log(error);
        return;
    }
    var block = web3.eth.getBlock(result);
//    console.log(block);
    wss.broadcast({
        subscription: 'blocks',
        data: {
            height: block.number,
            transactions_count: block.transactions.length,
            total_gas: block.gasUsed,
            size: block.size
        }
    });

});
var txFilter = web3.eth.filter('pending');
txFilter.watch(function (error, result) {
    if (error) {
        console.log(error);
        return;
    }
    var tx = web3.eth.getTransaction(result);
    var isContract = tx.to !== null && web3.eth.getCode(tx.to.toString()) !== '0x';
    wss.broadcast({
        subscription: 'transactions',
        data: {
            value: tx.value.toString(),
            to: tx.to === null ? null : tx.to.toString(),
            hash: tx.hash,
            isContract: isContract
        }
    });
});


