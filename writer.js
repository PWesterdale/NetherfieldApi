"use strict"

let fs = require('fs');
let dir = '/db/';

class Writer {
    constructor(type){
        this.content = {data : [], counter : 0};
        this.filename = __dirname + dir + type + '.json';
    }
    open() {
        return new Promise(function(resolve, reject){
            fs.readFile(this.filename, 'utf8', (err, data) => {
                this.content = Object.assign({}, this.content, data ? JSON.parse(data) : {});
                resolve(this);
            });
        }.bind(this))
    }
    addItem(item) {
        return new Promise(function(resolve, reject){
            let next = this.content ? this.content.counter : 0;
            item.id = next;
            this.content.data.push(item);
            this.content.counter++;
            resolve(this);
        }.bind(this));
    }
    editItem(id, data) {
        return new Promise(function(resolve, reject){
            this.content.data = this.content.data.map((item) => {
                if(item.id == id){
                    let newItem = Object.assign({}, item, data);
                    return newItem;
                } else {
                    return item;
                }
            });
            resolve(this);
        }.bind(this));
    }
    save() {
        return new Promise(function(resolve, reject){
            fs.writeFile(this.filename, JSON.stringify(this.content), (err) => {
                if(err) reject(err);
                resolve(this);
            });
        }.bind(this));
    }
}

module.exports = Writer;