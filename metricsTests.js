'use strict'
const systeminfo = require('./systeminformation/lib/index');
const async = require('async');

class metricsTest {

    constructor() {

    }
    run() {
        return new Promise((resolve, reject) => {


            async.parallel({
                cpu: (callback) => {
                    systeminfo.cpu().then(data => {
                        //console.log(`cpu- ${JSON.stringify(data)}`);
                        callback(null, data);
                    })
                },
                memory: (callback) => {
                    systeminfo.mem().then(data => {
                        //console.log(`memory- ${JSON.stringify(data)}`)
                        let memory = {
                            total: `${(data.total / 1000000000).toFixed(4)} giga`,
                            free: `${(data.free / 1000000000).toFixed(4)} giga`,
                            persentage_used: `${((data.active / data.total) * 100).toFixed(4)}% `,
                            swap: {
                                total: `${(data.swaptotal / 1000000000).toFixed(4)} giga`,
                                free: `${(data.swapfree / 1000000000).toFixed(4)} giga`,
                                persentage: `${((data.swapused / data.swaptotal) * 100).toFixed(4)}% `
                            }
                        }
                        //   console.log(`memory persentage- ${JSON.stringify(memory)}`)
                        callback(null, memory)
                    })
                },
                processes: (callback) => {
                    systeminfo.processes().then(data => {
                        //        console.log(`cadsdadpu- ${JSON.stringify(data)}`);
                        let processesData = {
                            all: data.all,
                            running: data.running, blocked: data.blocked,
                            sleeping: data.sleeping
                        }
                        callback(null, processesData);
                    })
                },
                netStats: (callback) => {
                    systeminfo.networkStats('eth0', function (data) {
                        // console.log('Network Interface Stats (eth0):');
                        // console.log('- is up: ' + data.operstate);
                        // console.log('- RX bytes overall: ' + data.rx);
                        // console.log('- TX bytes overall: ' + data.tx);
                        // console.log('- RX bytes/sec: ' + data.rx_sec);
                        // console.log('- TX bytes/sec: ' + data.tx_sec);
                        let networkData = {
                            operstate: data.operstate,
                            rx: data.rx,
                            tx: data.tx,
                            rx_sec: data.rx_sec,
                            tx_sec: data.tx_sec
                        };
                        callback(null, networkData);
                    })
                }
            }, (err, result) => {

                // console.log(`result: ${result}`)
                // console.dir(result);

                if (err == null) {
                    resolve(result);
                }
                else {
                    reject(err);
                }



            })


            //  systeminfo.networkConnections().then(data => console.log(`cpu- ${JSON.stringify(data)}`))


        })
    }
}


module.exports = metricsTest;

// systeminfo.dockerAll((data)=>{
// console.log(`dockerAll persentage- ${JSON.stringify(data)}`)  
// })