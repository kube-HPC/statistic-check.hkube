'use strict'
const prequisiteBase = require('prerequisite').prequisiteBase;
const monitor = require('redis-utils').Monitor;
const statisticCheck = require('./statisticCheck');

class statisticCheckPrerquiste extends prequisiteBase {

    constructor(staticsticCheck){
        super();
        this._staticsticCheck =staticsticCheck; 
       
    }
    addAdditional(callback){
         this._staticsticCheck.addAdditionalData(callback);
    }
    Job(){
      return new Promise((resolve,reject)=>{
         this._staticsticCheck.updateData().then((data)=>{
                  //console.log('im here redis is up and running')
                  resolve(data);
              })
              .catch(()=>{
                  reject(`fail to get statistics after ${this._retriesAmount} with ${this._cronTemplate} between them`);
              })
      })

    }

    setDefaultOptions(){
        this.name = "statistic_check";
        this._cronTemplate = '*/20 * * * * *';
        this._retriesAmount = 5;
    }






}

module.exports = statisticCheckPrerquiste;