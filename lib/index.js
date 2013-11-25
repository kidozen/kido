/**
 * module dependencies
 */
require('simple-errors');

var request      = require('request');
var fstream      = require('fstream');
var tar          = require('tar');
var zlib         = require('zlib');
var connect      = require('connect');
var http         = require('http');
var httpProxy    = require('http-proxy');
var cdproxy      = require('cdproxy');
var url          = require('url');
var EventEmitter = require('events').EventEmitter;
var util         = require('util');

/**
 * Kido - class for having access to all the kido platform features.
 * @param opts {object}
 *   - hosting {string} kidozen hosting domain (aka 'marketplace')
 *   - user    {string} kidozen management user
 *   - pass    {string} kidozen management user's password.
 * @api public
 */

function Kido ( opts ) {
    //safe guard from var kido = Kido();
    if (!(this instanceof Kido)) return new Kido(opts);
    //validate options
    if (!opts)         throw new Error('opts is required');
    if (!opts.hosting) throw new Error('opts.hosting is required');
    if (!opts.user)    throw new Error('opts.user is required');
    if (!opts.pass)    throw new Error('opts.pass is required');
    //inherit from EventEmitter
    EventEmitter.call(this);
    //properties
    this.hosting     = 'https://' + opts.hosting;
    this.appTemplate = 'https://{name}.' + opts.hosting;
    this.user        = opts.user;
    this.pass        = opts.pass;
    this.kidoIgnore = opts.kidoIgnore || ['.kidoignore', 'kidozen.config', '.git', '.gitignore'];
    this.strictSSL   = opts.hosting.indexOf('.kidocloud.com') === -1;

    //allow users to set up an ignore-like file
    if (this.kidoIgnore.indexOf('.kidoignore') < 0) {
        this.kidoIgnore.push('.kidoignore');
    }
    if (this.kidoIgnore.indexOf('kidozen.config') < 0) {
        this.kidoIgnore.push('kidozen.config');
    }
}
//inherit from EventEmitter
util.inherits(Kido, EventEmitter);

/**
 * getAuthConfig - looks for the hosting's auth config.
 * @return {object}
 * @api private
 */

Kido.prototype.getAuthConfig = function ( cb ) {

    var self = this;

    if (self._authConfig) return cb(null, self._authConfig);

    var url = self.hosting + "/publicapi/auth/config";
    request( { uri: url, strictSSL: self.strictSSL } , function ( err, res, body ) {

        if (err || res.statusCode !== 200) {
            console.log(err);
            var r = Error.create('unable to retrieve auth config', err || body);
            return cb(r);
        }

        var config;
        try
        {
            config = JSON.parse(body);
        }
        catch(e)
        {
            return cb(Error.create('invalid auth config', e));
        }

        //cache the config. it's very unlikely to change.
        self._authConfig = config;

        cb(null, config);
    });
};


/**
 * login - will try to authenticate in kidozen's management IP.
 * @return {string} assertion.
 * @api private
 */

Kido.prototype.login = function ( cb ) {

    var self = this;

    self.getAuthConfig(function ( err, config ) {

        if (err) return cb(err);

        //prepare POST request
        var postRequest = {
                uri: config.ipEndpoint,
                method: "POST",
                form: {
                    wrap_name : self.user,
                    wrap_password : self.pass,
                    wrap_scope : config.authServiceScope
                },
                strictSSL: self.strictSSL
            };

        request.post(postRequest, function ( err, res, body ) {

            if (err) {
                return cb(Error.create('unable to reach identity provider', err));
            }

            if (res.statusCode !== 200) {
                return cb(Error.create('unable to login', body));
            }

            var assertion = /<Assertion(.*)<\/Assertion>/.exec(body)[0];

            if (!assertion) {
                return cb(Error.create('invalid token', body));
            }

            cb(null, assertion);
        });
    });
};

/**
 * getToken - gets a token for kidozen management scope.
 * @api private
 */

Kido.prototype.getToken = function ( cb ) {

    var self = this;

    if (self._token) return cb(null, self._token);

    self.login(function ( err, assertion ) {

        if ( err ) return cb(err);

        self.getAuthConfig(function ( err, config ) {

            if ( err ) return cb(err);

            var postRequest = {
                    uri : config.authServiceEndpoint,
                    method : "POST",
                    form : {
                        wrap_assertion : assertion,
                        wrap_scope : "http://management.kidozen.com/",
                        wrap_assertion_format : "SAML"
                    },
                    strictSSL: self.strictSSL
                };

            request(postRequest, function ( err, res, body ) {

                if (err || res.statusCode !== 200) {
                    return cb(Error.create('unable to login', err || body));
                }

                var token;

                try
                {
                    token = JSON.parse(body);
                }
                catch(e)
                {
                    return cb(Error.create('invalid kido token', body));
                }

                if (!token.rawToken) {
                    return cb("you don't have access to this hosting");
                }

                self._token = 'WRAP access_token="' + token.rawToken + '"';
                cb(null, self._token);
            });
        });
    });
};


/**
 *
 */

Kido.prototype.GET = function ( path, cb ) {

    var self = this;

    self.getToken(function ( err, token ) {

        if (err) return cb(err);

        var getRequest = {
            uri: self.hosting + path,
            headers: {
                Authorization: token
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
                    return cb(Error.create('unable to parse json', body));
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

 Kido.prototype.POST = function ( path, body, cb ) {

    var self = this;

    self.getToken(function ( err, token ) {

        if (err) return cb(err);

        var postRequest = {
            uri: self.hosting + path,
            method: 'POST',
            headers: {
                Authorization: token
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


/**
 * DELETE - makes an authenticated DELETE http request to the hosting
 * @param path {string}
 * @api private
 */

 Kido.prototype.DELETE = function ( path, cb ) {

    var self = this;

    self.getToken(function ( err, token ) {

        var deleteRequest = {
            uri: self.hosting + path,
            method: 'DELETE',
            headers: {
                Authorization: token
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

Kido.prototype.apps = function ( cb ) {

    var self = this;

    self.GET('/api/apps', function ( err, status, apps ) {

        if (err || status !== 200) {
            return cb(Error.create('could not get list of apps', err || body));
        }

        cb(null, apps);
    });

};


/**
 * app - get app details
 * @param name {string}
 * @api public
 */

Kido.prototype.app = function ( name, cb ) {

    var self = this;

    self.GET('/api/apps?name=' + name, function ( err, status, app ) {

        if (err || status !== 200) {
            return cb(Error.create('could not get app', err || body));
        }

        cb(null, app[0]);
    });
};

/**
 * createApp - provisions a new app
 * @param name {string}
 * @api public
 */

Kido.prototype.createApp = function ( name, cb ) {

    var self = this;

    self.POST('/api/apps', { name: name }, function ( err, status, body ) {

        if (err || status !== 201) {
            return cb(Error.create('could not create app', err || body));
        }

        cb(null);
    });
};

/**
 * deleteApp - deletes app from hosting.
 * @param name {string}
 * @api public
 */

Kido.prototype.deleteApp = function ( id, cb ) {

    var self = this;

    self.DELETE('/api/apps/' + id, function ( err ) {

        if (err) return cb(Error.create('unable to delete app', err));

        cb();
    });
};


/**
 * deployApp - deploys the content of the folder to the specified app.
 * @param name {string}
 * @param folder {string}
 * @api public
 */

Kido.prototype.deployApp = function ( name, folder, cb ) {

    var self = this;

    self.getToken(function ( err, token ) {

        var postRequest = {
            uri: self.appTemplate.replace('{name}', name) + '/meta/snapshot',
            method: 'POST',
            headers: {
                Authorization: token
            },
            strictSSL: self.strictSSL
        };

        var reader  = fstream.Reader({path: folder, type: "Directory", filter: function () {
                             var ignore = (self.kidoIgnore.indexOf(this.basename) > -1);
                             if (ignore) {
                                self.emit('skipped', this.basename);
                             }
                             return !ignore;
                           }}),
            writer  =  request.post(postRequest),
            pack    = tar.Pack(),
            gzip    = zlib.createGzip(),
            oldEmit = reader.emit;

        reader.emit = function(ev, entry){
            if(ev === "entry") entry.root = null;
            return oldEmit.apply(reader, arguments);
        };

        var res = null,
            statusCode,
            discardResponse = false;

        writer.on("response", function(resp){
            if(resp.headers.location){
                discardResponse = true;
                var location = resp.headers.location;
                return cb(Error.create('unable to deploy to hosting', location));
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
                console.log('status code: ' + statusCode);
                cb(err || res || statusCode || 'a problem occurred while uploading files.');
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

Kido.prototype.emulate = function ( name, folder, cb ) {

    var self = this,
        host = url.parse(self.appTemplate.replace('{name}', name)).host;

    self.getToken(function ( err, token ) {

        if (err) return cb(err);

        var proxy = new httpProxy.RoutingProxy(),
            buffer;
        var app = connect()
            .use(cdproxy('cdinvoker'))
            .use(function(req,res,next){
                buffer = httpProxy.buffer(req);
                next();
            })
            .use(connect["static"](folder))
            .use(function(req, res){

                req.headers.host = host;
                req.headers.Authorization = token;

                proxy.proxyRequest(req, res, {
                  target: {
                    https: true,
                    host: host,
                    port: 443
                  },
                  buffer: buffer,
                  strictSSL: self.strictSSL
                });

            });

        http.createServer(app).listen(3000);

        cb();
    });
    
};

module.exports = Kido;