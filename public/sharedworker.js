let browserInstances = [];

self.onconnect = function(e) {
  var port = e.ports[0];
  browserInstances.push(port);
  port.onmessage = function(e) {
    browserInstances.map(port => port.postMessage(e.data));
  };
};
