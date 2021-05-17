const { query, request } = require('express');
const express = require('express')
var cors = require('cors');
const app = express()
app.use(cors());
const port = 3000

class SimpleSQLController {
    constructor() {
        this.config = {
            user : 'app',
            password: 'HAA4h5X$v^CHW5UeNucQf7',
            server: '102.141.191.13',
            port : 25565,
            database: 'pss',
            encrypt: false
        };
    }

    returnRespose(sqlQuery, req, res) {
        var sql = require("mssql");

        // The this reference dissapears in below asynchronis functions below and idk why
        // Creating local references of needed vars.
        var config = this.config;

        sql.connect(config, function (err) {
            if (err) console.log(err);

            var request = new sql.Request();
            request.query(
                sqlQuery, 
                function (err, recordset) {
                    if (err) console.log(err);
                    
                    res.send(recordset);
                }
            );
        });
    }

    async insertCallLog(timeStarted, timeEnded, AgendID, req, res) {
        var callLogInsert = `INSERT INTO CallLog(timeStarted, timeEnded, AgentID, incoming) OUTPUT Inserted.CallID VALUES ('${timeStarted}', '${timeEnded}', ${AgendID}, 'false')`;
        console.log(`callLogInsert: ${callLogInsert}`);

        
        var sql = require("mssql");
        var config = this.config;
        var req = req;
        var res = res;


        await sql.connect(config, function (err) {
            if (err) console.log(err);

            var callLogInsertRequest = new sql.Request();
            callLogInsertRequest.query(
                callLogInsert, 
                function (err, recordset) {
                    if (err) console.log(err);
                    var callID = recordset['recordset'][0]['CallID'];
                    res.send({
                        'status': 'Calllog inserted',
                        'callID' : callID
                    });

                }
            );
        });
    }

    async checkCredentials(username, password, req, res) {
        var sql = require("mssql");
        var config = this.config;
        var username = username;
        var password = password;
        var req = req;
        var res = res;

        var queryCheck = `SELECT password, AgentID FROM Agent WHERE username = '${username}'`;
        console.log(queryCheck);

        await sql.connect(config, function (err) {
            if (err) console.log(err);

            var requestUpdateRequest = new sql.Request();
            requestUpdateRequest.query(
                queryCheck, 
                function (err, recordset) {
                    if (err) console.log(err);

                    console.log(recordset)
                    if (recordset.recordset.length > 0){
                        if (recordset.recordset[0].password === password) {
                            res.send({
                                "auth" : recordset.recordset[0].password === password,
                                "AgentID" : recordset.recordset[0].AgentID
                            }); 
                        } else {
                            res.send({
                                "auth" : recordset.recordset[0].password === password,
                            }); 
                        }
                         
                    } else {
                        res.send({
                            "auth" : 'false'
                        });  
                    }
                        
                }
            );
        });

    }

    async updateComplaintToClosed(timeEnded, AgendID, ComplaintRequestID, req, res) {
        var requestUpdate = `UPDATE Request SET status = 'Closed' WHERE RequestID = ${ComplaintRequestID}`;
        console.log(`requestUpdate: ${requestUpdate}`);

        
        var sql = require("mssql");
        var config = this.config;
        var req = req;
        var res = res;


        await sql.connect(config, function (err) {
            if (err) console.log(err);

            var requestUpdateRequest = new sql.Request();
            requestUpdateRequest.query(
                requestUpdate, 
                function (err, recordset) {
                    if (err) console.log(err);
                    console.log(`Request SET status = 'Closed'`);
                    res.send({"status" : "Complaint status set to closed"});
                }
            );

        });

        

    }
}


app.get('/IndividualClients', (req, res) => {
    const sqlQuery = 'SELECT * FROM IndividualClient AS I ' +
        'LEFT JOIN Client AS C ON I.IndividualClientID = C.ClientID';

    var simpleSQL = new SimpleSQLController();

    simpleSQL.returnRespose(sqlQuery, req, res);
});

app.get('/BusinessClients', (req, res) => {
    const sqlQuery = 'SELECT * FROM BusinessClient AS B ' +
        'LEFT JOIN Client AS C ON B.BusinessClientID = C.ClientID';

    var simpleSQL = new SimpleSQLController();

    simpleSQL.returnRespose(sqlQuery, req, res);
});

app.get('/Client', (req, res) => {
    const clientID = req.query.clientID;
    const sqlQuery = 'SELECT C.ClientID, C.contactNum, B.name AS bName, I.name AS iName, I.surname AS iSurname FROM Client AS C ' +
                        'LEFT JOIN BusinessClient AS B ON B.BusinessClientID = C.ClientID ' +
                        'LEFT JOIN IndividualClient AS I ON I.IndividualClientID = C.ClientID ' +
                     `WHERE C.ClientID = ${clientID}`;

    var simpleSQL = new SimpleSQLController();

    simpleSQL.returnRespose(sqlQuery, req, res);
});

app.get('/ComplaintRequests', (req, res) => {
    const sqlQuery = 'SELECT C.ComplaintRequestID, C.description, R.ClientID, R.contactNum, R.dateCreated, R.dateResolved, R.status, CL.CallID, CL.timeStarted, CL.timeEnded, CL.AgentID, CL.incoming, A.aName, A.contactNum AS agentContactNum, A.employeeType, A.employmentStatus ' +
    'FROM dbo.ComplaintRequest AS C ' +
      'LEFT JOIN dbo.Request AS R ON R.RequestID = C.ComplaintRequestID ' +
      'LEFT JOIN dbo.CallLog AS CL ON CL.CallID = R.CallID ' +
      'LEFT JOIN dbo.Agent AS A ON A.AgentID = CL.AgentID';

    var simpleSQL = new SimpleSQLController();

    simpleSQL.returnRespose(sqlQuery, req, res);
});

app.get('/CallCentreAgents', (req, res) => {
    const sqlQuery = 'SELECT AgentID, aName, contactNum, employmentStatus, employeeType FROM Agent WHERE employeeType = \'ClientSatisfaction\'';

    var simpleSQL = new SimpleSQLController();

    simpleSQL.returnRespose(sqlQuery, req, res);
});

app.post('/ResolveComplaintRequest', (req, res) => {
    const ComplaintRequestID = req.query.ComplaintRequestID;
    const AgentID = req.query.AgentID;
    const DateTimeResolved = req.query.DateTimeResolved;

    var simpleSQL = new SimpleSQLController();

    simpleSQL.updateComplaintToClosed(
        DateTimeResolved,
        AgentID,
        ComplaintRequestID,
        req,
        res
    );
});

app.get('/CheckCredentials', (req, res) => {
    const username = req.headers.username;
    const password = req.headers.password;

    var simpleSQL = new SimpleSQLController();

    simpleSQL.checkCredentials(username, password, req, res);
});

app.post('/InsertCallLog', (req, res) => {
    const AgentID = req.query.AgentID;
    const DateTimeCallStarted = req.query.DateTimeCallStarted;
    const DateTimeCallEnded = req.query.DateTimeCallEnded;

    var simpleSQL = new SimpleSQLController();

    simpleSQL.insertCallLog(
        DateTimeCallStarted,
        DateTimeCallEnded,
        AgentID,
        req,
        res
    );
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});