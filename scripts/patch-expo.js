const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '../node_modules/expo/node_modules/@expo/cli/build/src/start/doctor/typescript/TypeScriptProjectPrerequisite.js'
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  if (
    content.includes("const signal = AbortSignal.timeout(5000);") &&
    !content.includes("typeof _promises().default.glob !== 'function'")
  ) {
    content = content.replace(
      "const signal = AbortSignal.timeout(5000);",
      "if (typeof _promises().default.glob !== 'function') { return null; }\n            const signal = AbortSignal.timeout(5000);"
    );
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('✅ [patch-expo] TypeScriptProjectPrerequisite patched successfully for Node.js compatibility.');
  } else {
    console.log('ℹ️ [patch-expo] TypeScriptProjectPrerequisite is already patched or up to date.');
  }
}
