let ClipperAPI = require('./src/API.js')
let path = require('path')



let port = 12000
let static_files = path.join(__dirname, "build")

new ClipperAPI(static_files, port);