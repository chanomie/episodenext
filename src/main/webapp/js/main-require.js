// Place third party dependencies in the lib folder
//
// Configure loading modules from the lib directory,
// except 'app' ones, 
requirejs.config({
  "baseUrl": 'js',
  "shim": {
    "spin" : ["jquery"],
    "jquery.spin" : ["jquery"]
  },
  "paths": {
    "jquery": "https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min",
    "domReady": 'vendor/domReady',
    'spin': 'spin.min',
    'jquery.spin': 'jquery.spin.min',
    "modernizer": 'vendor/modernizr-2.6.2.min',
    "simplemodal": 'jquery.simplemodal.1.4.4.min',
    "helper": 'helper'
  },
  "urlArgs": "bust=" + (+new Date)
});

// Load the main app module to start the app
requirejs(['main','domReady!'], function(main) {
  main.initialize();
});
// 