'use strict'
const RedisFactory = require('redis-utils').Factory;
const metricsTest = require('./metricsTests');
const os =require('os');
/*status:{
    serviceName:string,from config
    machine:{
        podName:string, from env
        hostIp:string , from env
        }
    metrics:{
        cpu:string,
        memory:string,
        uptime:date,
    }
    additional:{custom by api}
    
}   */

class statisticCheck {

    constructor(redisconfig, configFile) {
        this._redisconfig = redisconfig;
        this._config = configFile;
        this.currentStatus = {
            serviceName: null,
            hostIp: null,
            podName: null,
            metrics: {},
            additional: {}

        };
        this._client = null;
        this.additionalDataCallBack = new Set();
        this.promiseTimeOut = 10000;
        this.metricsTest = new metricsTest();
        this._init();
    }

    _init() {
        this._client = RedisFactory.getClient(this._redisconfig);
        this._client
        this._getDataFromConfig();
        this._getDataFromEnv();
    }

    _getDataFromConfig() {
        this.currentStatus.serviceName = this._config.serviceName;

    }
    _getMetrics(promise) {
     //   this.currentStatus.metrics = { test: 'test' }
        this.metricsTest.run().then(data => {
        //    console.log('im in get_metrics after reoslve')
            this.currentStatus.metrics = data;
            promise.resolve();
        }).catch(error => {
            promise.reject(error)
        })


    }
    _getDataFromEnv() {
        this.currentStatus.hostIp = process.env.NODE_NAME || '';
        this.currentStatus.podName = process.env.POD_NAME||'';
        this.currentStatus.hostName = os.hostname();
    }
    getEnvData(){
        return {
            serviceName:this.currentStatus.serviceName,
            podName:this.currentStatus.podName,
            hostIp:this.currentStatus.hostIp,
            hostname:this.currentStatus.hostName
        }
    }
    setInitData(data){
        this.currentStatus = data;
    }
    updateData() {
        let self = this;
        let getMatrixPromise = this._getPromiseWithTimeOut(self._getMetrics.bind(self));
        let getAdditionalDataPromise = this._getPromiseWithTimeOut(self._getAdditionalData.bind(self));
        let returnedPromise = null;
        Promise.all([getMatrixPromise, getAdditionalDataPromise]).then(data => {
            returnedPromise.resolve(self.currentStatus);
        }).catch((err) => {
            returnedPromise.reject(err);
        })

        return new Promise((resolve, reject) => {
            returnedPromise = { resolve, reject };
        }).catch((err) => {
            resolve(err);
        })

    }
    addAdditionalData(callback) {
        this.additionalDataCallBack.add(callback);

    }
    _getPromiseWithTimeOut(func) {
        let _resolve = null;
        return new Promise((resolve, reject) => {
            _resolve = resolve;
            func({ resolve, reject });

            setTimeout(() => {
                reject('timeout pass')
            }, this.promiseTimeOut)

        }).catch((err) => {
            reject(err);
        })
    }
    _getAdditionalData(promiseFromCallingMethod) {
        this.promiseArr = [];
        let _resolve = null;
        this.additionalDataCallBack.forEach((callback) => {
            let promise = new Promise((resolve, reject) => {
                callback({ resolve: resolve, reject: reject });
                setTimeout(() => {
                    reject('timeout pass')
                }, this.promiseTimeOut)
            }).then((data) => {
                this.currentStatus.additional[data.name] = data.val;
            }).catch((err) => {
                reject(err);
            })
            this.promiseArr.push(promise);
        })
        Promise.all(this.promiseArr).then(() => {
            promiseFromCallingMethod.resolve();
        }).catch(err => {
            promiseFromCallingMethod.reject(err);
        })

    }


}

module.exports = statisticCheck;
