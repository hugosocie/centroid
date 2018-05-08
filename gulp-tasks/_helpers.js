//
// Bower task
// Import all Javascript dependencies from bower_components
// ==========================================================================

var Data = require( './_data' );

module.exports = function() {

    return {

        pushToWatch : function( path, script ) {
            Data.watch.push({
                path : path,
                script : script
            });
        },

        pushToClean : function( path ) {
            Data.clean.push( path );
        }

    };

}();