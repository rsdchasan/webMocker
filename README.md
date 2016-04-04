# webMocker
1) Clone the repo
2) Add index.js file in the same repo with the below two lines in it,
	var mock_server = require('./mock_server')
	mock_server.run()
3) create a folder name 'logs' in the current dir
4) start the server using the below command
	STUBFILE=sample_stub/stub.json PORT=8050 LOGDIR=logs node index.js
5) your server is up and running now.

Sample commands to test the mock server
1)curl http://localhost:8050/heartbeat/
2)curl http://localhost:8050/stubdata/
3)curl -X POST -H "Content-Type: application/json" -d 'sales' http://localhost:8050/df/ 
