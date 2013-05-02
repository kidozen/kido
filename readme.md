kido - Kidozen Platform command line tool

#Installation
You must have node.js installed. (>=0.8.14)

	npm install -g kido

#Usage


	$ kido

	Usage: kido [options] [command]

	Commands:

		hosting <domain>       saves the hosting configuration
		app-list [hosting]     list all the apps in the hosting
		app-create <name> [hosting] creates an app with <name> in the [hosting]
		app-deploy [name] [hosting] deploy current folder to the [name] app in [hosting]
		app-run [name] [hosting] runs files on local folder and redirects calls to backend services

	Options:

	-h, --help     output usage information
	-V, --version  output the version number

#Commands

##hosting
Use `kido hosting <domain>` for storing your management credentials in your profile.

Example:


	$ kido hosting mycompany.kidozen.com
	username: myuser@kidozen.com
	password: ************

Once you have configured your hosting in your profile, it will be stored as the default hosting, and there's no need to run this command again.


##app-list
Gets the list of applications in your marketplace.

NOTE: this command will only work after successfully calling `kido hosting`.

Example:


	$ kido app-list
	- myapp1
	- myapp2

##app-create
Creates a new application and provisions the necessary backend services.

Example:


	$kido app-create mynewapp

After successfully creating the app in the marketplace, it will prompt to see whether you want to save this config so you don't have to type the app name and hosting again (valid for the folder where the command is executed).

##app-deploy
Deploys a new version of an HTML5 web application into the Kidozen hosting platform.

If you saved the config when you created the app, then there's no need to specify the app name and hosting.

Example:


	$ kido app-deploy

##app-run
This command will start a webserver in `localhost:3000` that will serve the files in the current folder, and will proxy the calls to backend services to the app that was configured. This command is very usefull for developing HTML5 web applications locally without having to deploy the app all the time.

Example:


	$ kido app-run
	
	you can now open http://localhost:3000 in your browser
	backend calls are being directed to https://mynewapp.mycompany.kidozen.com

At this point, you can open your browser in `http://localhost:3000` and start testing your app locally.

The command will stay running until you interrupt it's execution (ctrl + c).

#Bugs & Support
Feel free to submit any issues or feature requests in the issues tab of the github.com repository.

#License (FreeBSD)

Copyright (c) 2013, Kidozen

All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met: 

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer. 
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution. 

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those
of the authors and should not be interpreted as representing official policies, 
either expressed or implied, of the FreeBSD Project.