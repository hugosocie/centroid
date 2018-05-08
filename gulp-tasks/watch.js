//
// Watch task
// ==========================================================================

var Data    = require( './_data' ),
    Helpers = require( './_helpers' ),
    Config  = require( '../config' );

module.exports = function( gulp, plugins, paths, files ) {

    Helpers.pushToWatch( files.html, plugins.browserSync.reload );

    return function(){

        plugins.browserSync.init({
            port: Config.port,
            open: Config.openBrowser,
            server: {
                baseDir: "./"
            }
        });

        for( var w = 0; w < Data.watch.length; w++ ) {
            var tsk = Data.watch[ w ];
            gulp.watch( tsk.path, tsk.script );
        }

    };

};