var fs      = require('fs'),
    path    = require('path'),
    kido    = require('../lib/index'),
    request = require('request'),
    assert  = require('assert'),
    nock    = require('nock'),
    hosting = 'contoso.local.kidozen.com', //process.env.KIDOCLI_TESTS_HOSTING,
    user    = 'contoso@kidozen.com', //process.env.KIDOCLI_TESTS_USER,
    pass    = 'pass'; //process.env.KIDOCLI_TESTS_PASS;

describe("kido", function () {

    describe("Invalid options", function () {

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
    });

    describe("Valid options", function () {

        var ipTokenResponse = '<t:RequestSecurityTokenResponse xmlns:t="http://schemas.xmlsoap.org/ws/2005/02/trust"><t:Lifetime><wsu:Created xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">2014-01-30T20:02:12.845Z</wsu:Created><wsu:Expires xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">2014-01-30T21:02:12.845Z</wsu:Expires></t:Lifetime><wsp:AppliesTo xmlns:wsp="http://schemas.xmlsoap.org/ws/2004/09/policy"><EndpointReference xmlns="http://www.w3.org/2005/08/addressing"><Address>https://authservicescope/</Address></EndpointReference></wsp:AppliesTo><t:RequestedSecurityToken><Assertion ID="_7ae46a84-f60a-4bbc-b65b-986dc55ae4f6" IssueInstant="2014-01-30T20:02:12.970Z" Version="2.0" xmlns="urn:oasis:names:tc:SAML:2.0:assertion"><Issuer>https://identity.kidozen.com/</Issuer><ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:SignedInfo><ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" /><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" /><ds:Reference URI="#_7ae46a84-f60a-4bbc-b65b-986dc55ae4f6"><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" /><ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" /></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" /><ds:DigestValue>Ffc5svQsDfSSYZMz7nx0ZkelzHfc6MlWC8MKcNgkCPQ=</ds:DigestValue></ds:Reference></ds:SignedInfo><ds:SignatureValue>GfV/IdOUd4bQoYt1O2vJBkYipaylBrQwcUHoReDIIcKYLecLdLAVmrqJQQ=</ds:SignatureValue><KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><X509Data><X509Certificate>MIICDzCCAXygAwIBAgIQVWXAvbbQyI5BcFe0ssmeKTAJBgUrDgMCHQUAMB8xHTAbBgNVBAMTFGlkZW50aXR5LmtpZG96ZW4uY29tMB4XDTEyMDcwNTE4NTEzNFoXDTM5MTIzMTIzNTk1OVowHzEdMBsGA1UEAxMUaWRlbnRpdHkua2lkb3plbi5jb20wgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGBAJ1GPvzmIZ5OO5by9Qn2fsSuLIJWHfewRzgxcZ6SykzmjD4H1aGOtjUg5EFgQ/HWxa16oJ+afWa0dyeXAiLl5gas71FzgzeODL1STIuyLXFVLQvIJX/HTQU+qcMBlwsscdvVaJSYQsI3OC8Ny5GZvt1Jj2G9TzMTg2hLk5OfO1zxAgMBAAGjVDBSMFAGA1UdAQRJMEeAEDSvlNc0zNIzPd7NykB3GAWhITAfMR0wGwYDVQQDExRpZGVudGl0eS5raWRvemVuLmNvbYIQVWXAvbbQyI5BcFe0ssmeKTAJBgUrDgMCHQUAA4GBAIMmDNzL+Kl5omgxKRTgNWMSZAaMLgAo2GVnZyQ26mc3v+sNHRUJYJzdYOpU6l/P2d9YnijDz7VKfOQzsPu5lHK5s0NiKPaSb07wJBWCNe3iwuUNZg2xg/szhiNSWdq93vKJG1mmeiJSuMlMafJVqxC6K5atypwNNBKbpJEj4w5+</X509Certificate></X509Data></KeyInfo></ds:Signature><Subject><SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer" /></Subject><Conditions NotBefore="2014-01-30T20:02:12.845Z" NotOnOrAfter="2014-01-30T21:02:12.845Z"><AudienceRestriction><Audience>https://authServiceScope</Audience></AudienceRestriction></Conditions><AttributeStatement><Attribute Name="http://schemas.kidozen.com/domain"><AttributeValue>kidozen.com</AttributeValue></Attribute><Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"><AttributeValue>Contoso Admin</AttributeValue></Attribute><Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"><AttributeValue>contoso@kidozen.com</AttributeValue></Attribute></AttributeStatement></Assertion></t:RequestedSecurityToken><t:RequestedAttachedReference><SecurityTokenReference d3p1:TokenType="http://docs.oasis-open.org/wss/oasis-wss-saml-token-profile-1.1#SAMLV2.0" xmlns:d3p1="http://docs.oasis-open.org/wss/oasis-wss-wssecurity-secext-1.1.xsd" xmlns="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><KeyIdentifier ValueType="http://docs.oasis-open.org/wss/oasis-wss-saml-token-profile-1.1#SAMLID">_7ae46a84-f60a-4bbc-b65b-986dc55ae4f6</KeyIdentifier></SecurityTokenReference></t:RequestedAttachedReference><t:RequestedUnattachedReference><SecurityTokenReference d3p1:TokenType="http://docs.oasis-open.org/wss/oasis-wss-saml-token-profile-1.1#SAMLV2.0" xmlns:d3p1="http://docs.oasis-open.org/wss/oasis-wss-wssecurity-secext-1.1.xsd" xmlns="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><KeyIdentifier ValueType="http://docs.oasis-open.org/wss/oasis-wss-saml-token-profile-1.1#SAMLID">_7ae46a84-f60a-4bbc-b65b-986dc55ae4f6</KeyIdentifier></SecurityTokenReference></t:RequestedUnattachedReference><t:TokenType>urn:oasis:names:tc:SAML:2.0:assertion</t:TokenType><t:RequestType>http://schemas.xmlsoap.org/ws/2005/02/trust/Issue</t:RequestType><t:KeyType>http://schemas.xmlsoap.org/ws/2005/05/identity/NoProofKey</t:KeyType></t:RequestSecurityTokenResponse>';
        var ipToken = '<Assertion ID="_7ae46a84-f60a-4bbc-b65b-986dc55ae4f6" IssueInstant="2014-01-30T20:02:12.970Z" Version="2.0" xmlns="urn:oasis:names:tc:SAML:2.0:assertion"><Issuer>https://identity.kidozen.com/</Issuer><ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:SignedInfo><ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" /><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" /><ds:Reference URI="#_7ae46a84-f60a-4bbc-b65b-986dc55ae4f6"><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" /><ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" /></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" /><ds:DigestValue>Ffc5svQsDfSSYZMz7nx0ZkelzHfc6MlWC8MKcNgkCPQ=</ds:DigestValue></ds:Reference></ds:SignedInfo><ds:SignatureValue>GfV/IdOUd4bQoYt1O2vJBkYipaylBrQwcUHoReDIIcKYLecLdLAVmrqJQQ=</ds:SignatureValue><KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><X509Data><X509Certificate>MIICDzCCAXygAwIBAgIQVWXAvbbQyI5BcFe0ssmeKTAJBgUrDgMCHQUAMB8xHTAbBgNVBAMTFGlkZW50aXR5LmtpZG96ZW4uY29tMB4XDTEyMDcwNTE4NTEzNFoXDTM5MTIzMTIzNTk1OVowHzEdMBsGA1UEAxMUaWRlbnRpdHkua2lkb3plbi5jb20wgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGBAJ1GPvzmIZ5OO5by9Qn2fsSuLIJWHfewRzgxcZ6SykzmjD4H1aGOtjUg5EFgQ/HWxa16oJ+afWa0dyeXAiLl5gas71FzgzeODL1STIuyLXFVLQvIJX/HTQU+qcMBlwsscdvVaJSYQsI3OC8Ny5GZvt1Jj2G9TzMTg2hLk5OfO1zxAgMBAAGjVDBSMFAGA1UdAQRJMEeAEDSvlNc0zNIzPd7NykB3GAWhITAfMR0wGwYDVQQDExRpZGVudGl0eS5raWRvemVuLmNvbYIQVWXAvbbQyI5BcFe0ssmeKTAJBgUrDgMCHQUAA4GBAIMmDNzL+Kl5omgxKRTgNWMSZAaMLgAo2GVnZyQ26mc3v+sNHRUJYJzdYOpU6l/P2d9YnijDz7VKfOQzsPu5lHK5s0NiKPaSb07wJBWCNe3iwuUNZg2xg/szhiNSWdq93vKJG1mmeiJSuMlMafJVqxC6K5atypwNNBKbpJEj4w5+</X509Certificate></X509Data></KeyInfo></ds:Signature><Subject><SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer" /></Subject><Conditions NotBefore="2014-01-30T20:02:12.845Z" NotOnOrAfter="2014-01-30T21:02:12.845Z"><AudienceRestriction><Audience>https://authServiceScope</Audience></AudienceRestriction></Conditions><AttributeStatement><Attribute Name="http://schemas.kidozen.com/domain"><AttributeValue>kidozen.com</AttributeValue></Attribute><Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"><AttributeValue>Contoso Admin</AttributeValue></Attribute><Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"><AttributeValue>contoso@kidozen.com</AttributeValue></Attribute></AttributeStatement></Assertion>';
        var rstTemplate = '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"><s:Header><a:Action s:mustUnderstand="1">http://docs.oasis-open.org/ws-sx/ws-trust/200512/RST/Issue</a:Action><a:To s:mustUnderstand="1">[To]</a:To><o:Security s:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><o:UsernameToken u:Id="uuid-6a13a244-dac6-42c1-84c5-cbb345b0c4c4-1"><o:Username>[Username]</o:Username><o:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">[Password]</o:Password></o:UsernameToken></o:Security></s:Header><s:Body><trust:RequestSecurityToken xmlns:trust="http://docs.oasis-open.org/ws-sx/ws-trust/200512"><wsp:AppliesTo xmlns:wsp="http://schemas.xmlsoap.org/ws/2004/09/policy"><a:EndpointReference><a:Address>[ApplyTo]</a:Address></a:EndpointReference></wsp:AppliesTo><trust:KeyType>http://docs.oasis-open.org/ws-sx/ws-trust/200512/Bearer</trust:KeyType><trust:RequestType>http://docs.oasis-open.org/ws-sx/ws-trust/200512/Issue</trust:RequestType><trust:TokenType>urn:oasis:names:tc:SAML:2.0:assertion</trust:TokenType></trust:RequestSecurityToken></s:Body></s:Envelope>';
        var kidoTokenResponse = '{"rawToken": "http%3a%2f%2fschemas.kidozen.com%2fdomain=kidozen.com&http%3a%2f%2fschemas.kidozen.com%2fusersource=Admins+(Kidozen)&http%3a%2f%2fschemas.xmlsoap.org%2fws%2f2005%2f05%2fidentity%2fclaims%2femailaddress=contoso%40kidozen.com&http%3a%2f%2fschemas.xmlsoap.org%2fws%2f2005%2f05%2fidentity%2fclaims%2fname=Contoso+Admin&http%3a%2f%2fschemas.kidozen.com%2frole=Application+Center+Admin&http%3a%2f%2fschemas.kidozen.com%2faction=allow+all+*&http%3a%2f%2fschemas.microsoft.com%2faccesscontrolservice%2f2010%2f07%2fclaims%2fidentityprovider=https%3a%2f%2fidentity.kidozen.com%2f&Audience=http%3a%2f%2fcontoso.local.kidozen.com%2f&ExpiresOn=1391117498&Issuer=https%3a%2f%2fkido-contoso.accesscontrol.windows.net%2f&HMACSHA256=nosignature", "expirationTime":"2014-01-30T21:31:33.557Z"}';
        var kidoToken = "http%3a%2f%2fschemas.kidozen.com%2fdomain=kidozen.com&http%3a%2f%2fschemas.kidozen.com%2fusersource=Admins+(Kidozen)&http%3a%2f%2fschemas.xmlsoap.org%2fws%2f2005%2f05%2fidentity%2fclaims%2femailaddress=contoso%40kidozen.com&http%3a%2f%2fschemas.xmlsoap.org%2fws%2f2005%2f05%2fidentity%2fclaims%2fname=Contoso+Admin&http%3a%2f%2fschemas.kidozen.com%2frole=Application+Center+Admin&http%3a%2f%2fschemas.kidozen.com%2faction=allow+all+*&http%3a%2f%2fschemas.microsoft.com%2faccesscontrolservice%2f2010%2f07%2fclaims%2fidentityprovider=https%3a%2f%2fidentity.kidozen.com%2f&Audience=http%3a%2f%2fcontoso.local.kidozen.com%2f&ExpiresOn=1391117498&Issuer=https%3a%2f%2fkido-contoso.accesscontrol.windows.net%2f&HMACSHA256=nosignature";

        describe("Constructor", function() {
            
            it("Should return a kido instance using hosting", function () {
                
                var api = kido('somevalidhosting.com');

                assert.ok(api);
                assert.ok(api.hosting);
                assert.equal('https://somevalidhosting.com', api.hosting);
            });

            it("Should not use strictSSL if hosting is kidocloud", function () {
                
                var api = kido('something.kidocloud.com');

                assert.ok(api);
                assert.ok(api.hosting);
                assert.ok(!api.strictSSL);
            });

            it("Should take ignore list of files and add .kidoignore and kidozen.config", function () {
                
                var api = kido({
                    hosting: 'somehosting',
                    kidoIgnore: ['.foo']
                });

                assert.ok(api);
                assert.ok(api.hosting);
                assert.equal(3, api.kidoIgnore.length);
                assert.equal('.foo', api.kidoIgnore[0]);
                assert.equal('.kidoignore', api.kidoIgnore[1]);
                assert.equal('kidozen.config', api.kidoIgnore[2]);
            });
        })

        describe("Auth", function () {

            it("Should get identity providers list", function(done) {

                var hosting = 'sometenant.kidocloud.com'
                var config = {
                    ips: [{ 
                        name: "Kidozen",
                        activeEndpoint: "https://identity.kidozen.com/wrapv0.9",
                        protocol: "wrapv0.9"
                    }]
                }

                var configNock = nock('https://' + hosting)
                    .get('/publicapi/auth/config')
                    .reply(200, config);

                var api = kido(hosting);

                api.getIdentityProviders(function(err, ips) {
                    assert.ifError(err);
                    assert.equal(1, ips.length);
                    assert.equal(config.ips[0].name, ips[0].name)
                    assert.equal(config.ips[0].activeEndpoint, ips[0].activeEndpoint);

                    configNock.done();
                    done();
                })
            });

            it("Should login using WRAPv0.9 provider", function(done) {

                var domain = 'something.kidocloud.com'
                var hosting = 'https://' + domain;

                var credentials = {
                    username: 'someuser@kidozen.com',
                    password: 'somepassword',
                    ip: { 
                        name: "Kidozen",
                        activeEndpoint: "https://identity.kidozen.com/wrapv0.9",
                        protocol: "wrapv0.9"
                    }
                }

                var config = {
                    authServiceScope: "https://authServiceScope"
                }

                var configNock = nock(hosting)
                    .get('/publicapi/auth/config')
                    .reply(200, config);

                var loginNock = nock("https://identity.kidozen.com/")
                    .post('/wrapv0.9', {
                        wrap_name: credentials.username,
                        wrap_password: credentials.password,
                        wrap_scope: config.authServiceScope
                    })
                    .reply(200, ipTokenResponse);

                var api = kido(domain);

                api.login(credentials, function(err, ips) {
                    assert.ifError(err);
                    configNock.done();
                    loginNock.done();
                    done();
                })
            });

            it("Should login using WS-TRUST provider", function(done) {

                var domain = 'something.kidocloud.com'
                var hosting = 'https://' + domain;

                var credentials = {
                    username: 'someuser@kidozen.com',
                    password: 'somepassword',
                    ip: { 
                        name: "ADFS",
                        activeEndpoint: "https://adfs.com/wstrust",
                        protocol: "ws-trust"
                    }
                }

                var config = {
                    authServiceScope: "https://authServiceScope"
                }

                var rst = rstTemplate.replace("[To]", credentials.ip.activeEndpoint)
                                    .replace("[Username]", credentials.username) 
                                    .replace("[Password]", credentials.password)
                                    .replace("[ApplyTo]", config.authServiceScope);

                var configNock = nock(hosting)
                    .get('/publicapi/auth/config')
                    .reply(200, config);

                var loginNock = nock("https://adfs.com/")
                    .post('/wstrust', rst)
                    .reply(200, ipTokenResponse);

                var api = kido('something.kidocloud.com');

                api.login(credentials, function(err, ips) {
                    assert.ifError(err);
                    configNock.done();
                    loginNock.done();
                    done();
                });
            }); 

            it("Should perform WS-Trust SAML token exchange with WRAP SWT Kidozen Token and authenticated GET", function(done) {

                var domain = 'something.kidocloud.com'
                var hosting = 'https://' + domain;

                var credentials = {
                    username: 'someuser@kidozen.com',
                    password: 'somepassword',
                    ip: { 
                        name: "ADFS",
                        activeEndpoint: "https://adfs.com/wstrust",
                        protocol: "ws-trust"
                    }
                }

                var config = {
                    authServiceEndpoint: hosting + "/auth/v1/WRAPV0.9",
                    authServiceScope: "https://authServiceScope"
                }

                var rst = rstTemplate.replace("[To]", credentials.ip.activeEndpoint)
                                    .replace("[Username]", credentials.username) 
                                    .replace("[Password]", credentials.password)
                                    .replace("[ApplyTo]", config.authServiceScope);

                var configNock = nock(hosting)
                    .get('/publicapi/auth/config')
                    .reply(200, config);

                var loginNock = nock("https://adfs.com/")
                    .post('/wstrust', rst)
                    .reply(200, ipTokenResponse);

                var authServiceNock = nock(hosting)
                    .post("/auth/v1/WRAPV0.9", {
                        wrap_assertion : ipToken,
                        wrap_scope : 'http://' + domain + '/',
                        wrap_assertion_format : "SAML"
                    })
                    .reply(200, kidoTokenResponse);

                var getNock = nock(hosting)
                    .get("/test")
                    .matchHeader('Authorization', 'WRAP access_token="' + kidoToken + '"')
                    .reply(200, {});


                var api = kido(domain);

                api.GET(credentials, '/test', function(err, statusCode) {
                    assert.ifError(err);
                    assert.equal(200, statusCode);

                    configNock.done();
                    loginNock.done();
                    authServiceNock.done();
                    getNock.done();
                    done();
                });

            })
        });


        // describe("kido.apps", function () {
        //     this.timeout(20 * 1000);
        //     it("should return list of apps", function ( done ) {
        //         api.apps(function ( err, apps ) {
        //             assert.ok(!err);
        //             assert.ok(apps);
        //             assert.ok(Array.isArray(apps));
        //             done();
        //         });
        //     });

        //     it("should get application details", function ( done ) {
        //         this.timeout(10000);
        //         api.apps(function ( err, apps ) {

        //             assert.ok(!err, err);
        //             assert.ok(apps.length > 0, 'there must be at least one app');

        //             var name = apps[0].name;
        //             assert.ok(name);

        //             api.app(name, function ( err, app ) {
        //                 assert.ok(!err);
        //                 assert.ok(app);
        //                 assert.equal(name, app.name);
        //                 done();
        //             });
        //         });
        //     });

        //     it("should return null when app does not exist", function ( done ) {
        //         this.timeout(20 * 1000);
        //         api.app('non-existing-app', function ( err, app ) {
        //             assert.ok(!err);
        //             assert.ok(!app);
        //             done();
        //         });
        //     });

        //     it("should create an app and then delete it", function ( done ) {
        //         this.timeout(20 * 1000);
        //         //random app name.
        //         var appname = 'app' + Math.random().toString(36).substring(9);

        //         api.createApp(appname, function ( err ) {

        //             assert.ok(!err);
        //             api.app(appname, function ( err, app ) {

        //                 assert.ok(!err);
        //                 assert.ok(app);
        //                 assert.equal(appname, app.name);

        //                 api.deleteApp(app._id, function ( err ) {
        //                     assert.ok(!err);
        //                     done();
        //                 });
        //             });
        //         });
        //     });

        //     it("should deploy an app, and ignore kidoIgnore files", function ( done ) {
        //         this.timeout(200 * 1000);
        //         // random app name.
        //         var appname = 'app' + Math.random().toString(36).substring(9);

        //         api.createApp(appname, function ( err ) {
        //             assert.ok(!err);

        //             setTimeout(function () {
        //                 var folder = path.join(__dirname, './app');

        //                 // make sure the .foo file is skipped
        //                 var skipped = false;
        //                 api.on('skipped', function (item) {
        //                     skipped = item === '.foo';
        //                 });

        //                 api.deployApp(appname, folder, function ( err ) {

                            
        //                     assert.ok(skipped, 'file was not ignored');
        //                     assert.ok(!err);

        //                     done();
        //                 });
        //             }, 5000);
        //         });
        //     });

        //     it("should run emulator for an app", function ( done ) {
        //         this.timeout(20 * 1000);
        //         //random app name.
        //         var appname = 'app' + Math.random().toString(36).substring(9);

        //         api.createApp(appname, function ( err ) {
        //             assert.ok(!err);

        //             setTimeout(function () {
        //                 var folder = path.join(__dirname, './app');
        //                 api.emulate(appname, folder, function ( err ) {
        //                     assert.ok(!err);
        //                     //test local files.
        //                     request('http://localhost:3000', function ( err, res, body ) {
        //                         assert.ok(!err);
        //                         assert.equal(200, res.statusCode);
        //                         assert.ok(body.indexOf('Hello') > -1);
        //                         //test remote services.
        //                         request('http://localhost:3000/storage/local', function ( err, res, body ) {
        //                             assert.ok(!err);
        //                             assert.equal(200, res.statusCode);
        //                             assert.equal('[]', body);
        //                             done();
        //                         });
        //                     });
        //                 });
        //             }, 4000);
        //         });
        //     });
        // });
    });

});