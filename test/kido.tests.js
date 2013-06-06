var fs      = require('fs'),
    path    = require('path'),
    kido    = require('../lib/index'),
    request = require('request'),
    assert  = require('assert'),
    hosting = process.env.KIDOCLI_TESTS_HOSTING;
    user    = process.env.KIDOCLI_TESTS_USER;
    pass    = process.env.KIDOCLI_TESTS_PASS;

describe("kido", function () {

    describe("invalid options", function () {

        it("should throw if no opts", function ( done ) {

            try
            {
                kido();
                done('did not throw');
            }
            catch(e)
            {
                done();
            }
        });

        it("should throw if no opts.hosting", function ( done ) {

            try
            {
                kido({});
                done('did not throw');
            }
            catch(e)
            {
                done();
            }
        });

        it("should throw if no opts.user", function ( done ) {

            try
            {
                kido({ hosting: hosting });
                done('did not throw');
            }
            catch(e)
            {
                assert.ok(e);
                assert.equal('opts.user is required', e.message);
                done();
            }
        });
        it("should throw if no opts.pass", function ( done ) {

            try
            {
                kido({ hosting: hosting, user: user });
                done('did not throw');
            }
            catch(e)
            {
                assert.ok(e);
                assert.equal('opts.pass is required', e.message);
                done();
            }
        });

    });

    describe("valid options", function () {

        var config = {
                hosting: hosting,
                user: user,
                pass: pass
            },
            api = kido(config);

        before(function ( done ) {
            this.timeout(5000);
            api.getToken(done);
        });

        it("should return a kido instance", function () {

            var api = kido(config);
            assert.ok(api);
            assert.ok(api.hosting);
            assert.equal(user, api.user);
            assert.equal(pass, api.pass);
        });

        describe("kido.getToken", function () {

            it("should get a valid token", function ( done ) {

                api.getToken(function ( err, token ) {

                    assert.ok(!err);
                    assert.ok(token);
                    done();
                });
            });
        });

        describe("kido.apps", function () {

            it("should return list of apps", function ( done ) {

                api.apps(function ( err, apps ) {

                    assert.ok(!err);
                    assert.ok(apps);
                    assert.ok(Array.isArray(apps));
                    done();
                });
            });

            it("should get application details", function ( done ) {

                this.timeout(10000);

                api.apps(function ( err, apps ) {

                    assert.ok(!err, err);
                    assert.ok(apps.length > 0, 'there must be at least one app');

                    var name = apps[0].name;
                    assert.ok(name);

                    api.app(name, function ( err, app ) {

                        assert.ok(!err);
                        assert.ok(app);
                        assert.equal(name, app.name);
                        done();
                    });
                });
            });

            it("should return null when app does not exist", function ( done ) {

                api.app('non-existing-app', function ( err, app ) {

                    assert.ok(!err);
                    assert.ok(!app);
                    done();
                });
            });

            it("should create an app and then delete it", function ( done ) {

                this.timeout(20 * 1000);

                //random app name.
                var appname = 'app' + Math.random().toString(36).substring(9);

                api.createApp(appname, function ( err ) {

                    assert.ok(!err);

                    api.app(appname, function ( err, app ) {

                        assert.ok(!err);
                        assert.ok(app);
                        assert.equal(appname, app.name);

                        api.deleteApp(app._id, function ( err ) {

                            assert.ok(!err);
                            done();
                        });
                    });
                });
            });

            it("should deploy an app", function ( done ) {

                this.timeout(20 * 1000);

                //random app name.
                var appname = 'app' + Math.random().toString(36).substring(9);

                api.createApp(appname, function ( err ) {

                    assert.ok(!err);

                    console.log('app ' + appname + ' created.');

                    setTimeout(function () {
                        var folder = path.join(__dirname, './app');
                        api.deployApp(appname, folder, function ( err ) {

                            console.log(err);
                            assert.ok(!err);

                            done();
                        });
                    }, 4000);
                });
            });

            it("should run emulator for an app", function ( done ) {

                this.timeout(20 * 1000);

                //random app name.
                var appname = 'app' + Math.random().toString(36).substring(9);

                api.createApp(appname, function ( err ) {

                    assert.ok(!err);

                    console.log('app ' + appname + ' created.');

                    setTimeout(function () {
                        var folder = path.join(__dirname, './app');
                        api.emulate(appname, folder, function ( err ) {

                            assert.ok(!err);

                            //test local files.
                            request('http://localhost:3000', function ( err, res, body ) {

                                assert.ok(!err);
                                assert.equal(200, res.statusCode);
                                assert.ok(body.indexOf('Hello') > -1);
                                //test remote services.
                                request('http://localhost:3000/storage/local', function ( err, res, body ) {


                                    assert.ok(!err);
                                    assert.equal(200, res.statusCode);
                                    assert.equal('[]', body);
                                    done();
                                });
                            });
                        });
                    }, 4000);
                });
            });
        });
    });
});