//
// Styles task
// ==========================================================================

var Helpers = require( './_helpers' ),
    Config  = require( '../config' );

module.exports = function( gulp, plugins, paths, files ) {

    var includePaths = [
        require( 'node-reset-scss' ).includePath,
        require( 'bourbon' ).includePaths
    ];
    
    Helpers.pushToWatch( files.styles, [ 'styles' ] );
    Helpers.pushToClean( paths.src + '/sass/_build' );

    return function(){
        gulp.src( paths.src + '/sass/main.scss' )
            .pipe( plugins.plumber() )
            .pipe( plugins.sassBulkImport() )
            .pipe( plugins.sass({
                includePaths: includePaths,
                outputStyle : Config.env === 'production' ? 'compressed' : 'nested'
            }).on( 'error', plugins.sass.logError ) )
            .pipe( gulp.dest( paths.dist + '/css/' ) )
            .pipe( plugins.autoprefixer() )
            .pipe( plugins.browserSync.stream() );
    };

};