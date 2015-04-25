let http = require('http')
let request =require('request')
let path = require('path')
let fs = require('fs')


// Get the --host value
let argv = require('yargs')
    .default('host', '127.0.0.1')
    .argv
// let scheme = 'http://'

// Get the --port value
let port = argv.port || argv.host === '127.0.0.1' ? 8000 : 80

let destinationUrl = argv.url || argv.host + ':' + port

// Set logging
let logName = argv.log || "debug.log"
let logPath = logName && path.join(__dirname, logName)
let logStream = logPath ? fs.createWriteStream(logPath) : process.stdout

console.log("destURL: " + destinationUrl)
console.log("logPath: " + logPath)

http.createServer((req, res) => {
    console.log(`Request received at: ${req.url}`)

    for (let header in req.headers) {
      res.setHeader(header, req.headers[header])
    }

    req.pipe(res)

   // Log the req headers and content in our server callback
   // process.stdout.write('\n\n\n' + JSON.stringify(req.headers))
   logStream.write('Request headers: ' + JSON.stringify(req.headers))
   // req.pipe(process.stdout)
   req.pipe(logStream, {end: false})

}).listen(8000)

http.createServer((req, res) => {

  //if header x-desination-url presents, override previous value
  if(req.headers['x-desination-url']) {
    destinationUrl = req.headers['x-desination-url']
  }

  console.log(`Proxying request to: ${destinationUrl + req.url}`)

  // Proxy code here
  let options = {
    headers: req.headers,
    url: `http://${destinationUrl}${req.url}`
  }

  options.method = req.method

  // Log the proxy request headers and content in our server callback
  let downstreamResponse = req.pipe(request(options))
  // process.stdout.write(JSON.stringify(downstreamResponse.headers))
  logStream.write('Request headers: ' + JSON.stringify(req.headers))
  // downstreamResponse.pipe(process.stdout)
  downstreamResponse.pipe(logStream, {end: false})

  downstreamResponse.pipe(res)

}).listen(8001)