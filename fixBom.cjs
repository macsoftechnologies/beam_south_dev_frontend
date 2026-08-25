const fs = require('fs');
const path = require('path');

function removeBom(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            removeBom(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath);
            if (content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
                console.log("Removing BOM from", fullPath);
                content = content.slice(3);
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

removeBom('d:/Projects/React/Beam/Development/Beam2.o_South_Incidents/src/modules/safety-observations');
removeBom('d:/Projects/React/Beam/Development/Beam2.o_South_Incidents/src/modules/incident-management');
