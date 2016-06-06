var bunyan = require('bunyan');
var http = require('http');
var fs = require('fs');

var stub_data_array = [];
var request_id='';
var EQUAL='equalTo';
var MATCH_TEXT='matches';
var NOT_MATCH_TEXT='doesNotMatch';

var config = {
    PORT: getEnv('PORT'),
    LOGDIR: getEnv('LOGDIR'),
    STUBFILE: getEnv('STUBFILE')
};

log = bunyan.createLogger({name:'node_mocker',
    streams:[
        {
            level: 'info',
            stream: process.stdout
        },
        {
            level: 'info',
            type: 'rotating-file',
            period: "1d",
            count: 30,
            path: config.LOGDIR+'/node_mocker.log'
        }
    ]
});

function isUndefined(value) {
    return typeof(value) == "undefined";
}

function getEnv(variable){
    if (process.env[variable] === undefined){
        throw new Error('You must create an environment variable for ' + variable);
    }
    return process.env[variable];
};

function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
};

function generate_guid(){
    return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
};

function send_response_from_stub(response,stub_response_data){
    if(isUndefined(stub_response_data['bodyFile'])){
        if(!isUndefined(stub_response_data['body'])){
            send_response(response,stub_response_data['status'],stub_response_data['headers'],stub_response_data['body']);
        }
        else {
            send_response(response,stub_response_data['status'],stub_response_data['headers'],'');
        }
    }
    else {
        send_response(response,stub_response_data['status'],stub_response_data['headers'],fs.readFileSync(stub_response_data['bodyFile'], "UTF-8"))
    }
};

function send_response(response,statusCode,headers,body){
    response.writeHead(statusCode,headers);
    response.end(body);
    log.info({'request_id':request_id,'time':new Date().toISOString(),'status_code':statusCode,'response_header':headers,'response_body':body});
};

function raise_bad_request(response,body) {
    send_response(response,400,{'Content-Type': 'application/json'},JSON.stringify({'statusCode':'400','Description':body}));
};

function raise_internal_server_error(response) {
    send_response(response,500,{'Content-Type': 'application/json'},JSON.stringify({'statusCode':'500','Description':'Internal Server Error'}));
};

function validateRegEx(pattern,text) {
    var re = new RegExp(pattern);
    return re.test(text);
};

function log_request(request,request_body) {
    log.info({'request_id':request_id,'time':new Date().toISOString(),'method':request.method,'url':request.url,'request_body':request_body});
};

function stub_data_check(stub_pattern,data) {
    if (isUndefined(stub_pattern[MATCH_TEXT]) && isUndefined(stub_pattern[NOT_MATCH_TEXT]) && isUndefined(stub_pattern[EQUAL])) {
        return false;
    }
    if (!isUndefined(stub_pattern[MATCH_TEXT]) && !validateRegEx(stub_pattern[MATCH_TEXT], data)) {
        return false;
    }
    else if (!isUndefined(stub_pattern[NOT_MATCH_TEXT]) && validateRegEx(stub_pattern[NOT_MATCH_TEXT], data)) {
        return false;
    }
    else if (!isUndefined(stub_pattern[EQUAL]) && stub_pattern[EQUAL]!=data) {
        return false;
    }
    return true;
};

//We need a function which handles requests and send response
function handleRequest(request, response){
    var request_method=request.method;
    var request_body = [];
    var request_header = [];

    request.on('data', function(chunk) {
        request_body.push(chunk);
    });
    request.on('end', function() {
        request_body = Buffer.concat(request_body).toString();
        request_header = request.headers;
        request_id=generate_guid()
        log_request(request,request_body);
        try {

            if (request.url.toLowerCase() == '/') {
                return response.end('Your mocker is up and running!!');
            }
            if (request.url.toLowerCase() == '/heartbeat/') {
                return response.end('OK!');
            }
            if (request.url.toLowerCase() == '/stubdata/') {
                return response.end(JSON.stringify(stub_data_array));
            }
            if (request.url.toLowerCase() == '/addstubdata/') {
                stub_data_array[stub_data_array.length]=JSON.parse(request_body)
                return response.end(JSON.stringify(stub_data_array));
            }
            for (i = 0; i < stub_data_array.length; i++) {
                var stub_data = stub_data_array[i];
                var stub_method = stub_data['request']['method'];
                var stub_url = stub_data['request']['url'];
                var stub_headers = stub_data['request']['headers'];
                var stub_body_patterns = stub_data['request']['bodyPatterns'];
                if (validateRegEx(stub_method, request_method) && validateRegEx(stub_url, request.url)) {

                    var header_match = true;
                    if (typeof(stub_headers)!="undefined"){
                        for(var key in stub_headers){
                            header_match=header_match && stub_data_check(stub_headers[key],request_header[key]);
                        }
                    }

                    if (request_body == '') {
                        if (request_method=='GET') {
                            return send_response_from_stub(response, stub_data['response']);
                        }
                        else {
                            return raise_bad_request(response,"Post request should have a request body!")
                        }
                    }

                    var body_match = true;
                    for (j = 0; j < stub_body_patterns.length; j++) {
                        // All the conditions in a body mock should match for the response to be triggered
                        var stub_body_pattern = stub_body_patterns[j];
                        body_match = body_match && stub_data_check(stub_body_pattern,request_body);
                    }

                    if (body_match && header_match) {
                        return send_response_from_stub(response, stub_data['response']);
                    }
                }
            }
            raise_bad_request(response,"No Matching Stub")
        }
        catch(err){
            raise_internal_server_error(response);
        }
    });
}

exports.run = function () {
    //Create a server
    var server = http.createServer(handleRequest);

    //Lets start our server
    server.listen(config.PORT, function(){
        //Callback triggered when server is successfully listening. Hurray!
        console.log("Server listening on: http://localhost:%s", config.PORT);
        //Loading the stub file in memory
        stub_data_array = JSON.parse(fs.readFileSync(config.STUBFILE, "UTF-8"));
    });
}
