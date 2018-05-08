//
// Clean task
// ==========================================================================

var Data = require( './_data' ),
    Helpers = require( './_helpers' );

module.exports = function( gulp, plugins, paths ) {

    Helpers.pushToClean( paths.dist );

    return function(){
        plugins.del( Data.clean );
    };

};