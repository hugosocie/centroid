//
// Images task
// ==========================================================================

var Helpers = require( './_helpers' );

module.exports = function( gulp, plugins, paths, files ) {

    Helpers.pushToWatch( files.images, [ 'images', plugins.browserSync.reload ] );

    return function(){
        gulp.src( files.images )
            .pipe( gulp.dest( paths.dist + '/img/' ) );
    };

};