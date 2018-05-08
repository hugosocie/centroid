//
// Svg task
// ==========================================================================

var Helpers = require( './_helpers' );

module.exports = function( gulp, plugins, paths, files ) {

    Helpers.pushToWatch( files.svg, [ 'svg', plugins.browserSync.reload ] );

    return function(){
        gulp.src( files.svg )
            .pipe( gulp.dest( paths.dist + '/svg/' ) );
    };

};