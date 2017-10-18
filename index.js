'use strict'
const statisticCheck = require('./statisticCheck');
const runPrerequisite = require('./runPrerequisite');
const resourceManger = require('prerequisite').resourceManger;
const RedisKeyValueAdapter = require('./redis-handler/RedisKeyValueAdapter');
const statisticCheckPrefix = '**statisticCheck**';
const timeout = 200000;
const uuidV4 = require('uuid/v4');



module.exports.run = (redisConfig, config) => {
    let _keyValueAdapter = new RedisKeyValueAdapter(redisConfig);
    _keyValueAdapter.on('timeout', function () {
        console.log('timeout')
    });

    let _statisticCheck = new statisticCheck(redisConfig, config);
    let _runPrerequisite = new runPrerequisite(_statisticCheck);
    let _resourceManager = new resourceManger();
    let envData = _statisticCheck.getEnvData();
    let uuid = uuidV4();
    //  let key_extension =null;
    //  if(envData.podName!=null){
    //      key_extension = envData.podName;
    //  }else{
    //      key_extension = envData.hostname   +':'+uuid;
    //  }
    let key_extension = (envData.podName != '') ? envData.podName : envData.hostname + ':' + uuid;
    let key = `${statisticCheckPrefix}::${key_extension}`;
    _keyValueAdapter.getKey(key).then(data => {
        if (data != null) {
            _statisticCheck.setInitData(data);
        }
    }).catch((err) => {
        console.error(err);
    })

    //let _key = statisticCheckPrefix +'::';
    _resourceManager.setResourceForHealtinessCheck('statistic', _runPrerequisite);
    _resourceManager.runHealthyCheck();
    _resourceManager.onEach((data) => {

        //   console.dir(data.jobDetails.description);
        _keyValueAdapter.setKey(key, data.jobDetails.description, timeout);
    })
        .onEachFailure((result) => {
            //console.warning((`check for ${result.jobDetails.name} return with status ${result.jobDetails.status} the current retries amount are ${result.jobDetails.currentRetriesAmount}/${result.jobDetails.retriesAmount}`).yellow, { component: componentName.MAIN });
        })
        .all((allResult) => {
         //   this.emit(CONSTS.SUCCESS, allResult);
        })
        .catch((errorResult) => {
            //console.warning((`check for ${result.jobDetails.name} return with status ${result.jobDetails.status} the current retries amount are ${result.jobDetails.currentRetriesAmount}/${result.jobDetails.retriesAmount}`).yellow, { component: componentName.MAIN });
        });
    return {
        addAdditional: (callback) => {
            _statisticCheck.addAdditionalData(callback);
        }
    }
}





