
/**
* module dependencies
*/
require('simple-errors');

var Auth = require('./auth');
var request = require('request');
var fstream = require('fstream');
var tar = require('tar');
var zlib = require('zlib');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var connect = require('connect');
var httpProxy = require('http-proxy');
var url = require('url');
var http = require('http');
var cdproxy = require('cdproxy');

var child_process = require('child_process');
var sprintf = require("sprintf-js").sprintf;
var fs = require('fs');
var archiver = require('archiver');

/**
* Kido - class for having access to all the kido platform features.
* @param opts {object}
*   - hosting {string} kidozen hosting domain (aka 'marketplace')
* @api public
*/

function Kido (options) {

    if (!(this instanceof Kido)) return new Kido(options);

    if (typeof options == 'string') {
        options = { hosting: options };
    };

    if (!options.hosting) throw new Error('hosting is required');

    this.hosting = 'https://' + options.hosting;
    this.strictSSL = options.hosting.indexOf('.kidocloud.com') === -1 && options.hosting.indexOf('.kidozen.com') === -1;
    this.appTemplate = 'https://{name}.' + options.hosting;
    this.kidoIgnore  = options.kidoIgnore || ['.kidoignore', 'kidozen.config', '.git', '.gitignore'];

     this.auth = new Auth(options.hosting, this.strictSSL);

    //  Allow users to set up an ignore-like file
    if (this.kidoIgnore.indexOf('.kidoignore') < 0) {
        this.kidoIgnore.push('.kidoignore');
    }
    if (this.kidoIgnore.indexOf('kidozen.config') < 0) {
        this.kidoIgnore.push('kidozen.config');
    }
}

// inherit from EventEmitter
util.inherits(Kido, EventEmitter)

Kido.prototype.getIdentityProviders = function (cb) {
    this.auth.getConfig(function(err, config) {
        if (err) {
            cb(Error.create('Unable to obtain identity providers list.'));
            return;
        };
        if (!config.ips || config.ips.length == 0){
            config.ips = [{ name: "Kidozen", activeEndpoint: "https://identity.kidozen.com/wrapv0.9", protocol: "wrapv0.9" }];
        }
        cb(null, config.ips);
    });
}

Kido.prototype.login = function (credentials, cb ) {
    this.auth.login(credentials, cb);
}


Kido.prototype.GET = function(credentials, path, cb) {

    var self = this;

    this.auth.getToken(credentials, function (err, kidoToken) {
        if (err) return cb(err, err.status);

        var getRequest = {
            uri: self.hosting + path,
            headers: {
                Authorization: self.auth.getAuthHeader(kidoToken)
            },
            strictSSL: self.strictSSL
        };

        request(getRequest, function ( err, res, body ) {

            if (err) return cb(err);

            var obj;
            if (body === undefined) body = null; //avoid JSON.parse error.
            try
            {
                obj = JSON.parse(body);
            }
            catch(e)
            {
                //if response was successful, then body has
                //to be json.
                if (~~(res.statusCode / 100) === 2) {
                    return cb(Error.create('Unable to parse json', body));
                }
            }

            cb(null, res.statusCode, obj || body);
        });
    });
};


/**
 * POST - makes an authenticated POST to hosting.
 * @param path {string}
 * @param body {object}
 * @api private
 */

 Kido.prototype.POST = function (credentials, path, body, cb ) {

    var self = this;

    this.auth.getToken(credentials, function (err, kidoToken) {
        if (err) return cb(err, err.status);

        var postRequest = {
            uri: self.hosting + path,
            method: 'POST',
            headers: {
                Authorization: self.auth.getAuthHeader(kidoToken)
            },
            json: body,
            strictSSL: self.strictSSL
        };

        request(postRequest, function ( err, res, body ) {

            if (err) return cb(err);

            cb(null, res.statusCode, body);
        });
    });
};

 Kido.prototype.PATCH = function (credentials, path, body, cb ) {

    var self = this;

    this.auth.getToken(credentials, function (err, kidoToken) {
        if (err) return cb(err, err.status);

        var patchRequest = {
            uri: self.hosting + path,
            method: 'PATCH',
            headers: {
                Authorization: self.auth.getAuthHeader(kidoToken)
            },
            json: body,
            strictSSL: self.strictSSL
        };

        request(patchRequest, function ( err, res, body ) {

            if (err) return cb(err);

            cb(null, res.statusCode, body);
        });
    });
};


/**
 * DELETE - makes an authenticated DELETE http request to the hosting
 * @param path {string}
 * @api private
 */

 Kido.prototype.DELETE = function (credentials, path, cb ) {

    var self = this;

    this.auth.getToken(credentials, function (err, kidoToken) {
        if (err) return cb(err, err.status);

        var deleteRequest = {
            uri: self.hosting + path,
            method: 'DELETE',
            headers: {
                Authorization: self.auth.getAuthHeader(kidoToken)
            },
            strictSSL: self.strictSSL
        };

        request(deleteRequest, function ( err, res ) {

            if (err || res.statusCode !== 200) cb(err || res.statusCode);

            cb();
        });
    });
};

/**
 * apps - gets the list of apps.
 * @api public
 */

 Kido.prototype.apps = function (credentials, cb) {

    var self = this;

    self.GET(credentials, '/api/apps', function ( err, status, apps ) {

        if (status == 403) {
            return cb("You don't have permissions to perform this action.");
        };

        if (err || status !== 200) {
            return cb(Error.create('Could not get list of apps', err));
        }

        cb(null, apps);
    });

};

/**
 * createApp - provisions a new app
 * @param name {string}
 * @api public
 */

 Kido.prototype.createApp = function (credentials, name, cb ) {

    var self = this;

    self.POST(credentials, '/api/apps', { name: name }, function ( err, status, body ) {

        if (status == 403) {
            return cb("You don't have permissions to perform this action.");
        };

        if (err) {
            return cb(Error.create('could not create app', err));
        }

        if (status !== 201) {
            return cb(Error.create('could not create app - status: '+status, body));
        }

        cb(null,body);
    });
};

/**
 * createAppCategory - crates a new application category
 * @param name {string}
 * @api public
 */

 Kido.prototype.createAppCategory = function (credentials, name, cb ) {

    var self = this;

    self.POST(credentials, '/api/categories', { name: name }, function ( err, status, body ) {

        if (status == 403) {
            return cb("You don't have permissions to perform this action.");
        };

        if (err) {
            return cb(Error.create('could not create app category', err));
        }

        if (status == 200) {
            return cb(Error.create("category: '"+name+"' already exists"));
        }

        if (status !== 201) {
            return cb(Error.create('could not create app category - status: '+status, body));
        }

        cb(null,body);
    });
};



/**
 * updateApp - update app details
 * @param name {string}
 * @api public
 */

 Kido.prototype.updateApp = function (credentials, appId, appDetailsJson, cb ) {

    var self = this;

    self.PATCH(credentials, '/api/apps/'+appId, appDetailsJson, function ( err, status, body ) {

        if (status == 403) {
            return cb("You don't have permissions to perform this action.");
        };

        if (err) {
            return cb(Error.create('could not update app', err));
        }

        if (status !== 200) {
            return cb(Error.create('could not update app - status: '+status, body));
        }

        cb(null);
    });
};

/**
 * deleteApp - deletes app from hosting.
 * @param name {string}
 * @api public
 */

 Kido.prototype.deleteApp = function (credentials, id, cb ) {

    var self = this;

    self.DELETE(credentials, '/api/apps/' + id, function ( err ) {

        if (status == 403) {
            return cb("You don't have permissions to perform this action.");
        };

        if (err) return cb(Error.create('Unable to delete app', err));

        cb();
    });
};


/**
 * deployApp - deploys the content of the folder to the specified app.
 * @param name {string}
 * @param folder {string}
 * @api public
 */

 Kido.prototype.deployApp = function (credentials, name, folder, cb ) {

    var self = this;

    this.auth.getToken(credentials, name, function (err, kidoToken) {

        var postRequest = {
            uri: self.appTemplate.replace('{name}', name) + '/meta/snapshot',
            method: 'POST',
            headers: {
                Authorization: self.auth.getAuthHeader(kidoToken)
            },
            strictSSL: self.strictSSL
        };

        var reader  = fstream.Reader({
            path: folder, 
            type: "Directory", 
            filter: function (entry) {
                var ignore = (self.kidoIgnore.indexOf(this.basename) > -1);

                if (ignore) {
                    self.emit('skipped', this.basename);
                }

                // Make sure readable directories have execute permission
                if (entry.props.type === "Directory") {
                    entry.props.mode |= (entry.props.mode >>> 2) & 0111;
                }

                return !ignore;
            }
        });

        var writer  = request.post(postRequest);
        var pack    = tar.Pack();
        var gzip    = zlib.createGzip();
        var oldEmit = reader.emit;

        reader.emit = function(ev, entry) {
            if (ev === "entry") {
                entry.root = null;

            }

            return oldEmit.apply(reader, arguments);
        };

        var res = null;
        var statusCode;
        var discardResponse = false;

        writer.on("response", function(resp){
            if(resp.headers.location){
                discardResponse = true;
                var location = resp.headers.location;
                return cb(Error.create('Unable to deploy to hosting', location));
            } else {
                statusCode = resp.statusCode;
                resp.on("data", function ( chunk ) {
                    if (res) res += chunk;
                    else res = chunk;
                });
            }
        });

        var uploadFlow = reader.pipe(pack)
        .pipe(gzip)
        .pipe(writer);

        uploadFlow.on('error', cb);
        
        uploadFlow.on('end', function ( err ) {

            if (discardResponse) return;
            if (statusCode && statusCode === 200 || statusCode === 201) {
                cb(null, res);
            } else {
                cb(err || res || statusCode || 'A problem occurred while uploading files.');
            }
        });
    });
};



/**
 * emulate - emulates the backend services by redirecting the calls to an app
 * in the kidozen platform. Local files will be returned if found.
 * @param name {string}
 * @param folder {string} local folder to emulate.
 * @api public
 */

 Kido.prototype.emulate = function (credentials, name, folder, port, cb) {

    var self = this,
    host = self.appTemplate.replace('{name}', name);

    this.auth.getToken(credentials, name, function (err, kidoToken) {

        if (err) {
            cb(err);
            return;
        }

        var proxy = new httpProxy.RoutingProxy(),
        buffer;
        
        var app = connect()
        .use(cdproxy('cdinvoker'))
        .use(function (req, res, next) {
            buffer = httpProxy.buffer(req);
            next();
        })
        .use(connect['static'](folder))
        .use(function(req, res) {

            req.headers.host = url.parse(host).host;
            req.headers.Authorization = self.auth.getAuthHeader(kidoToken);

            proxy.proxyRequest(req, res, {
                target: {
                    https: true,
                    host: url.parse(host).host,
                    port: 443,
                    rejectUnauthorized: self.strictSSL
                },
                buffer: buffer
            });

        });

        http.createServer(app).listen(port);

        cb();
    });

};

/**
 * proguardMapping - finds dSym file for an application and sends it to kidozen for later child_processing.
 * @param name {string} ios application name
 * @api public
 */

 Kido.prototype.proguardMapping = function (credentials, mapppingPath, packageName , appVersion, appVersionName,  appname, cb ) {
        var self = this;

        this.auth.getToken(credentials, appname, function (err, kidoToken) {
            if (err) return cb(err, err.status);
            var fileNameToUpload = packageName + '_' +  appVersion + '_' + appVersionName ;
            zipAppFile(mapppingPath, fileNameToUpload, function(err, result) {
                if (err) return cb(err);
                result.kidoapp = appname;
                result.appurl = self.appTemplate.replace('{name}', appname);
                result.platform = 'android';
                uploadZipFile(result, kidoToken,cb);
            });
        });
};

/**
 * iOSSymbols - finds dSym file for an application and sends it to kidozen for later child_processing.
 * @param name {string} ios application name
 * @api public
 */

 Kido.prototype.iOSSymbols = function (credentials, dSYMFullPath,  appname, cb ) {
        var self = this;

        this.auth.getToken(credentials, appname, function (err, kidoToken) {
            if (err) return cb(err, err.status);
            getSymbolsFileAndGuid(dSYMFullPath, function(err,result) {
                if (err) return cb(err);
                result.forEach(function(entry) {
                    console.info('uploading symbols for ' + entry.arch + '...');
                    zipAppFile(dSYMFullPath, entry.uuid, function(err, result) {
                        if (err) return cb(err);
                        result.kidoapp = appname;
                        result.appurl = self.appTemplate.replace('{name}', appname);
                        result.platform = 'ios';
                        uploadZipFile(result, kidoToken,cb);
                    });
                });
            });
        });
};

function zipAppFile(srcDirectory, name, cb) {
    var zipfile = name + '.zip';
    if (!fs.existsSync(srcDirectory)) {
        return cb('File does not exits');
    }

    var output = fs.createWriteStream( getUserHome() + '/' + zipfile);
    var zipArchive = archiver('zip');

    zipArchive.on('error', function(err) {
        throw cb(err);
    });
    zipArchive.on('end', function() {
        //console.log('zipArchive.end');
    });
    output.on('close', function() {
        cb(null, 
        {
            zipFile :  zipfile, 
            fileSize : zipArchive.pointer()
        });
    });

    zipArchive.pipe(output);

    if (!fs.lstatSync(srcDirectory).isDirectory()) {
        return cb('You should upload a directory.');
    };


    zipArchive.bulk([
        { src: [ '**/*' ], cwd: srcDirectory, expand: true }
    ]);

    zipArchive.finalize();
};

function getSymbolsFileAndGuid(dSYMFullPath, cb) {
    var dwfd_cmd = sprintf("dwarfdump -u %1$s", dSYMFullPath);
    child_process.exec(dwfd_cmd, function(e, r, outErr) {
        if (e || outErr) return cb(new Error("Could not execute dwarfdump.", {stdout: r, stderr:outErr }));
        if (r.indexOf('unsupported') > -1 ) cb(Error.create('dwarfdump: unsupported file type'));

        var getUUIDregex = new RegExp('([A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12} \((.*)\))', 'gmi');
        var matchesArray;
        var uuidsWithPlatforms = [];
        while ((matchesArray = getUUIDregex.exec(r)) !== null) {
            var splitmsg = matchesArray[0].split(' ');
            uuidsWithPlatforms.push(
                { 
                    uuid: splitmsg[0].replace(/-/g,'').toLowerCase(), 
                    arch:splitmsg[1].replace(/\(/g,'').replace(/\)/g,'')
                });
        }
        cb(null, uuidsWithPlatforms);
    });
};

function cleanupfiles(path) {
    fs.unlinkSync(path);
};

function uploadZipFile(options, kidoToken, cb) {
    var url =  options.appurl + '/api/v3/logging/crash/' + options.platform + '/symbols/' + options.zipFile;
    
    var postOptions = {
            uri: url,
            headers: {
                Authorization    : 'WRAP access_token="' + kidoToken + '"',
                'Content-Type'   : 'application/octet-stream',
                'Content-Length' : options.fileSize
            },
    };
    var localFilePath = getUserHome() + '/' + options.zipFile;
    
    var post = fs.createReadStream( localFilePath ).pipe (request.post(postOptions));
    post.on("response", function(resp) { 
        cleanupfiles(localFilePath);
        if (resp.statusCode === 201) {
            cb(null, options);
        } else {
            cb('A problem occurred while uploading files. (Status Code: ' + resp.statusCode + ')');
        }
    });
    post.on('error', function(err) {
        cb(err);
    });
}

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

module.exports = Kido;