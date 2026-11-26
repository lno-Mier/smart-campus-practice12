// Node-RED settings for the low-code track (Practice #12).
// Start with:  npx node-red -u low-code
module.exports = {
  uiHost: '127.0.0.1',            // listen on this computer only - do not expose the editor
  uiPort: 1880,
  flowFile: 'flows.json',
  credentialSecret: false,        // the flow uses no credentials, connectors or API keys
  diagnostics: { enabled: false },
  telemetry: { enabled: false },
  externalModules: { autoInstall: false, palette: { allowInstall: false } },
  logging: { console: { level: 'info', metrics: false, audit: false } }

  // SECURITY FINDING (report, Section 8): without adminAuth the editor and admin API
  // (e.g. GET /flows) are open to anyone who can reach the port. Before sharing, enable:
  // , adminAuth: {
  //   type: 'credentials',
  //   users: [{ username: 'admin', password: '<bcrypt hash from: npx node-red admin hash-pw>', permissions: '*' }]
  // }
};
