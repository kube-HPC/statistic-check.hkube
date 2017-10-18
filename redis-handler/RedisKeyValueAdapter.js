// Redis backed key value with expire
// events:
// init 
// close - if the communication has closed, and the specified timeout has passed

"use strict";

var RedisFactory = require('redis-utils').Factory;
var RedisTimeout = require('ioredis-timeout');
var KeyValueAdapter = require('./keyValueAdapter.js');
const DEFAULT_TIMEOUT_MS = 86400000;

/**
 * implementation of KeyValueAdapter that use Redis as the key-value store.
 * It will connect the the client described in the options, or to the SENTINAL service if exposed in the process env.
 * @param {*} [options] Object with the following properties:
 * @param {string} host The host name of the redis host.
 * @param {string} port The port of the redis host.
 * @param {number} reconnectTimeout Timeout in MS before raising the close event.
 * @constructor
 */
class RedisKeyValueAdapter extends KeyValueAdapter {
    constructor(options) {
        super(options);
        options = options || {};

        var self = this;
        this._reconnectTimeout = options.reconnectTimeout || DEFAULT_TIMEOUT_MS;
        this._client = RedisFactory.getClient(options);
        RedisTimeout(this._client, this._reconnectTimeout);

        this._client.on('ready', function () {
            self.isSetTimeout = false;
            if (self._timeout) {
                clearTimeout(self._timeout);
            }
            self.emit('ready');
        });
        this._client.on('close', function () {
            if (!self._isSetTimeout) {
                self._isSetTimeout = true;
                self._timeout = setTimeout(function () {
                    self.emit('timeout');
                }, self._reconnectTimeout);
            }
        });
        this.emit('init');
    }

    /**
     * sets the provided key with the specified value
     * @param {string} key The name of the key
     * @param {*} value The value of the key
     * @param {number} expireMs optional expiry of the key in milliseconds
     * @returns {Promise} a promise that will reject if there was an error
     */
    setKey(key, value, expireMs) {
        var self = this;

        return new Promise((resolve, reject)=> {
            if (!expireMs) {
                self._client.set(key, JSON.stringify(value))
                    .then(result=> {
                        resolve(result);
                    })
                    .catch(error=> {
                        if (error && error.name == RedisTimeout.TimeoutError.NAME) {
                            self.emit('timeout');
                        }
                        return reject(error);
                    });
            }
            else {
                self._client.psetex(key, expireMs, JSON.stringify(value))
                    .then(result=> {
                        //console.log('psetex:',error,result);
                        resolve(result);
                    })
                    .catch(error=> {
                        if (error && error.name == RedisTimeout.TimeoutError.NAME) {
                            self.emit('timeout');
                        }
                        return reject(error);
                    });
            }
        });
    };


    /**
     * gets the value of the key
     * @param {string} key The name of the key
     * @returns {Promise} a promise that will fulfill with the value of the key
     */
    getKey(key) {
        var self = this;
        return new Promise((resolve, reject)=> {
            self._client.get(key).then(result=> {
                resolve(JSON.parse(result));
            }).catch(error=> {
                if (error && error.name == RedisTimeout.TimeoutError.NAME) {
                    self.emit('timeout');
                }
                return reject(error);
            });

        });
    };

    deleteKey(key){
        var self = this;
        return new Promise((resolve, reject)=> {
            self._client.del(key).then(result=> {
                resolve(result);
            }).catch(error=> {
                if (error && error.name == RedisTimeout.TimeoutError.NAME) {
                    self.emit('timeout');
                }
                return reject(error);
            });

        });
    }
    /**
     * gets an array of values for keys that start with the specified prefix
     * @param {string} prefix The prefix of the keys
     * @returns {Promise} a promise that will fulfill with the values of the keys
     */
    getByPattern(prefix) {
        var self = this;
        return new Promise((resolve, reject)=> {

            var match = prefix + '*';
            var stream = self._client.scanStream({match: match});
            var keys = [];
            stream.on('data', function (resultKeys) {
                // `resultKeys` is an array of strings representing key names
                for (var i = 0; i < resultKeys.length; i++) {
                    keys.push(resultKeys[i]);
                }
            });
            stream.on('end', function () {
                if (keys.length == 0) {
                    return resolve(null);
                }
                self._client.mget(keys).then(result=> {

                    if (keys.length != result.length) {
                        return reject('Mismatchd get result from redis.');
                    }
                    var pairs = [];
                    for (var i = 0; i < keys.length; i++) {
                        var value = JSON.parse(result[i]);
                        if (value) {
                            pairs.push([keys[i], value]);
                        }
                    }
                    resolve(pairs);
                }).catch(error=> {
                    if (error && error.name == RedisTimeout.TimeoutError.NAME) {
                        self.emit('timeout');
                    }
                    return reject(error);
                });
            });
            stream.on('error', function (error) {
                if (error && error.name == RedisTimeout.TimeoutError.NAME) {
                    self.emit('timeout');
                }
                return reject(error);
            })
        });
    };
}
module.exports = RedisKeyValueAdapter;