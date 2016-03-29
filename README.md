# streemiolib
Streemio Kademlia, JWT, JWE and crypto Node.js libraries

Develop the project
-------------------

To develop, improve and experiment with this library follow the steps below.

1. Add the discoverysrvc.js, streemio.js and wssrvc.js files from the https://github.com/streemio-org/streemio-seed project. Modify the require("streemiolib/") clauses to require("./") in these source files.
2. Run "npm install leveldown", "npm install levelup", "npm install config" and "npm install socket.io" to get libraries which are required to run the streemio.js file. (Do not use the "--save" flag in the npm install command as it will rewrite the package.json file!)
3. Create a directory "config" and copy the default.json file from the https://github.com/streemio-org/streemio-seed project config directory.
4. Modify the address and account fields of the config/default.json file. Address is e.g. localhost or 192.168.xxx.xxx.
5. Run the streemio.js file from the terminal "node streemio.js"
