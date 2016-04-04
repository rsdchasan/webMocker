# webMocker
<ol>
<li>Clone the repo</li>
<li>Add index.js file in the same repo with the below two lines in it,
<ul>
<li>var mock_server = require('./mock_server')</li>
<li>mock_server.run()</li></ul>
</li>
<li>create a folder name 'logs' in the current dir</li>
<li>start the server using the below command
<ul>
<li>STUBFILE=sample_stub/stub.json PORT=8050 LOGDIR=logs node index.js</li>
</ul>
</li>
<li>your server is up and running now.</li>
</ol>

Sample commands to test the mock server<br>
1)curl http://localhost:8050/heartbeat/<br>
2)curl http://localhost:8050/stubdata/<br>
3)curl -X POST -H "Content-Type: application/json" -d 'sales' http://localhost:8050/df/ <br>
