module.exports = function () {
    'use strict';
    var fs = require('fs'),
        http = require('http'),
        chokidar = require('chokidar'),
        diff = require('deep-diff').diff,
        init = function () { 
        
        },
        watch = function (path) {
            var watcher = chokidar.watch(),
                getFile = function (path, callback) {
                    if (typeof callback !== "function") {
                        callback = false;
                    }
                    fs.readFile(path, 'utf8', function (error, data) {
                        if (error) throw error;
                        var file = JSON.parse(data);
                        if (file) {
                            if (callback) {
                                callback(file);
                            }
                        }
                    });
                },
                previousPlayers = (JSON.parse(fs.readFileSync(path + '/banned-players.json', 'utf8'))).sort(sortByProperty('name')),
                previousIps = (JSON.parse(fs.readFileSync(path + '/banned-ips.json', 'utf8'))).sort(sortByProperty('ip')),
                parseDifferences = function (dFile) {
                    dFile.forEach(function (change) {
                        if (change) {
                            parseDiffItem(change);
                        }
                    });
                },
                parseDiffItem = function (i) {
                    switch (i.kind) {
                        case 'A':
                            parseDiffItem(i.item);
                            break;
                        case 'N':
                            consoleLog('A ban has been added.');
                            ban(i.rhs);
                            break;
                        case 'D':
                            consoleLog('A ban has been deleted.');
                            pardon(i.lhs);
                            break;
                        case 'E':
                            //ignore
                            break;
                        default:
                            consoleLog('Unknown difference type!');
                    }

                };
            
            watcher.add(path + '/banned-ips.json');
            watcher.add(path + '/banned-players.json');
            watcher.on('ready', function () {
                watcher.on('change', function (path) {
                    getFile(path, function (banFile) {
                        var differences = {},
                            fileName = path.substring(path.lastIndexOf('/') + 1);
                        
                        if (fileName == 'banned-players.json') {
                            banFile.sort(sortByProperty('name'));
                            differences = diff(previousPlayers, banFile);
                            previousPlayers = banFile;
                        }
                        else {
                            banFile.sort(sortByProperty('ip'));
                            differences = diff(previousIps, banFile);
                            previousIps = banFile;
                        }
                        
                        if (differences) {
                            parseDifferences(differences);
                        }
                    });
                });
            });
            watcher.on('error', function (e) {
                consoleLog('ERROR! : ' + e);
            });

        },
        ban = function (i) {
            updateService(i, true);
        },
        pardon = function (i) {
            updateService(i, false);
        },
        updateService = function (item, banFlag) { 
            
        },
        sortByProperty = function (property) {
            return function (a, b) {
                var sortStatus = 0;
                if (a[property] < b[property]) {
                    sortStatus = -1;
                } else if (a[property] > b[property]) {
                    sortStatus = 1;
                }
                return sortStatus;
            };
        },
        consoleLog = function (message) {
            if (verbose) {
                console.log(message);
            }
        },
        verbose = true;
   
    return {
        init: init,
        watch: watch,
        verbose: verbose
    }
}();