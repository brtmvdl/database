const { Database } = require('./database')
const { v4: uuid } = require('@brtmvdl/uuid')

const fs = require('./libs/fs/index.js')
const path = require('path')

class DatabaseObject {
  db = null
  id = null
  timestamp = null

  constructor(database = new Database(), id = uuid(), timestamp = null) {
    this.db = database
    this.id = id
    this.setTimestamp(timestamp)
  }

  setId(id = uuid()) {
    this.id = id
    return this
  }

  getId() {
    return this.id
  }

  setTimestamp(timestamp = null) {
    this.timestamp = timestamp
    return this
  }

  getTimestamp() {
    return this.timestamp != null
      ? this.timestamp.toString()
      : Date.now()
  }

  getID() {
    return this.id
  }

  getPath() {
    return path.resolve(this.db.config, this.id)
  }

  getProps() {
    return fs.readdirSync(this.getPath())
  }

  write(key, value = '') {
    const pathname = this.getPath()
    const filename = key + '.' + this.getTimestamp()
    const filepathname = path.resolve(pathname, filename)

    fs.writeFileSync(filepathname, value)
    return this
  }

  writeMany(obj = {}) {
    return Object.keys(obj)
      .map((key) => this.write(key, obj[key]))
  }

  getPropName(prop, timestamp = this.getTimestamp()) {
    return this.getProps()
      .map((filename) => filename.split('.', 2))
      .filter(([propName,]) => propName === prop)
      .filter(([, propTimestamp]) => +propTimestamp <= +timestamp)
      .sort(([, t1], [, t2]) => +t2 - +t1)
      .find(() => true)
      ?.join('.')
  }

  read(prop, timestamp = this.getTimestamp()) {
    const filepath = this.getPath()
    const propName = this.getPropName(prop, timestamp)
    if (propName === undefined) return null
    const filename = path.resolve(filepath, propName)
    return fs.readFileSync(filename, {})
  }

  readMany(props = []) {
    return props.map((key) => this.read(key))
  }

  readString(prop, timestamp = this.getTimestamp()) {
    const blob = this.read(prop, timestamp)
    if (blob == undefined) return null
    return blob.toString()
  }

  readManyString(props = []) {
    return props.map((key) => this.readString(key))
  }

  toJSON() {
    return this.getProps()
      .reduce((json = {}, prop) => ({ ...json, [prop]: this.readString(prop) }), {})
  }
}

module.exports = {
  DatabaseObject,
}
