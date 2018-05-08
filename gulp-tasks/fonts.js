//
// Fonts task
// ==========================================================================

var Helpers = require( './_helpers' );

module.exports = function( gulp, plugins, paths, files ) {

    Helpers.pushToWatch( files.fonts,  [ 'fonts', plugins.browserSync.reload ] );

    return function(){
        gulp.src( files.fonts )
            .pipe( gulp.dest( paths.dist + '/fonts/' ) );
    };

};