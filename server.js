"use strict"

let WebSocketServer = require('ws').Server;
let Writer = require('./writer');

let wss = new WebSocketServer({port: 8080});

wss.on('connection', (ws) => {

    let parser = new Parser();

    ws.on('message', (rawMessage) => {
        let msg = JSON.parse(rawMessage);
        let action = parser.parse(msg);
        action.perform().then(function(data){
            ws.send(JSON.stringify({
                data : data,
                cb : msg.cb
            }));
            if(data.notify){
                let type = data.notify;
                delete data.notify;
                wss.clients.forEach(function each(client) {
                    client.send(JSON.stringify({
                        data : data,
                        entity: msg.entity,
                        type: type
                    }));
                });
            }
        })
    });
});

class Parser {
    parse (message) {
        let id = typeof message.id == 'undefined' ? false : parseInt(message.id);
        return new Actioner(message.method, message.entity, message.data || {}, id);
    }
}

class Actioner {
    constructor(type, entity, data, id)
    {
        switch(type) {
            case 'get':
                return new Getter(entity);
                break;
            case 'put':
                return new Putter(entity, data);
                break;
            case 'post':
                return new Poster(entity, data, id);
                break;
        }
    }
}

class Getter {
    constructor(type)
    {
        this.writer = new Writer(type);
    }
    perform(id)
    {
        return new Promise(function(resolve, reject){
            this.writer.open().then(function(writer){
                resolve(writer.content.data);
            });
        }.bind(this));
    }
}

class Putter {
    constructor(type, data)
    {
        this.data = data;
        this.writer = new Writer(type);
    }
    perform()
    {
        return new Promise(function(resolve, reject){
            this.writer.open().then(function(writer){
                writer.addItem(this.data)
                .then(() => {
                    writer.save();
                    this.data.notify = 'add';
                    resolve(this.data);
                });
            }.bind(this));
        }.bind(this));
    }
}

class Poster {
    constructor(type, data, id)
    {
        this.data = data;
        this.id = id;
        this.writer = new Writer(type);
    }
    perform()
    {
        return new Promise(function(resolve, reject){
            this.writer.open().then(function(writer){
                writer.editItem(this.id, this.data)
                .then(() => {
                    writer.save();
                    this.data.id = this.id;
                    this.data.notify = 'merge';
                    resolve(this.data);
                })
            }.bind(this));
        }.bind(this));
    }
}