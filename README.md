# webMocker
1) Clone the repo<br>
2) Add index.js file in the same repo with the below two lines in it,<br>
	<t>var mock_server = require('./mock_server')<br>
	mock_server.run()<br>
3) create a folder name 'logs' in the current dir<br>
4) start the server using the below command<br>
	STUBFILE=sample_stub/stub.json PORT=8050 LOGDIR=logs node index.js<br>
5) your server is up and running now.<br>

Sample commands to test the mock server<br>
1)curl http://localhost:8050/heartbeat/<br>
2)curl http://localhost:8050/stubdata/<br>
3)curl -X POST -H "Content-Type: application/json" -d 'sales' http://localhost:8050/df/ <br>
