## statistic check for each microservice


#### inorder to run use :

- for running just call ``run(redisConfig,configWithServiceName)``

```js
let _statistic = statisticCheck.run({host:'127.0.0.1',port:'6379'},{serviceName:"test-serviceName"});
```
- for adding additional information use ``addAdditional()`` method

```js
_statistic.addAdditional((promise)=>{
    promise.resolve({name:'test',val:"test"});
})
```