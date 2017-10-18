"use strict";

var EventEmitter = require('events').EventEmitter;
var util = require('util');

util.inherits(KeyValueAdapter, EventEmitter);

function KeyValueAdapter(options){
    
    EventEmitter.call(this);
    options=options||{};
}
/**
 * sets the provided key with the specified value
 * @param {string} key The name of the key
 * @param {*} value The value of the key
 * @param {number} expireMs optional expiry of the key in milliseconds
 * @returns {Promise} a promise that will reject if there was an error
 */
KeyValueAdapter.prototype.setKey=function(key,value,expireMs){
    return Promise.reject('Abstract class');
};

/**
 * gets the value of the key
 * @param {string} key The name of the key
 * @returns {Promise} a promise that will fulfill with the value of the key
 */
KeyValueAdapter.prototype.getKey=function(key){
    return Promise.reject('Abstract class');
};

module.exports=KeyValueAdapter;