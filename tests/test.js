'use strict'

const statisticCheck = require('../index');
const statisticCheckInternal = require('../statisticCheck');
//process.env.POD_NAME = "test-pod";
//process.env.HOSTNAME = "test-host";

let _statistic = statisticCheck.run({host:'127.0.0.1',port:'6379'},{serviceName:"test-serviceName"});
let _statisticInternal = new statisticCheckInternal({host:'127.0.0.1',port:'6379'},{serviceName:"test-serviceName"});

console.log(_statisticInternal.getEnvData());
_statistic.addAdditional((promise)=>{
    console.log('additional test')    
    promise.resolve({name:'test',val:"test"});
})




console.log('running test');