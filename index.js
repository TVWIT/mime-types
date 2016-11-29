var MimeTypes = (function (db) {

    var extname = require('path').extname;
    var extractTypeRegExp = /^\s*([^;\s]*)(?:;|\s|$)/;
    var textTypeRegExp = /^text\//i;
    var extensions = Object.create(null);
    var types = Object.create(null);

    /**
     * Get the default charset for a MIME type.
     *
     * @param {string} type
     * @return {boolean|string}
     */

    function charset (type) {
        if (!type || typeof type !== 'string') return false;

        // TODO: use media-typer
        var match = extractTypeRegExp.exec(type);
        var mime = match && db[match[1].toLowerCase()];

        if (mime && mime.charset) return mime.charset;

        // default text/* to utf-8
        if (match && textTypeRegExp.test(match[1])) return 'UTF-8';

        return false;
    }

    /**
     * Get the default extension for a MIME type.
     *
     * @param {string} type
     * @return {boolean|string}
     */

    function extension (type) {
        if (!type || typeof type !== 'string') return false;

        // TODO: use media-typer
        var match = extractTypeRegExp.exec(type);

        // get extensions
        var exts = match && extensions[match[1].toLowerCase()];

        if (!exts || !exts.length) return false;

        return exts[0];
    }

    /**
     * Lookup the MIME type for a file path/extension.
     *
     * @param {string} path
     * @return {boolean|string}
     */

    function lookup (path) {
        if (!path || typeof path !== 'string') return false;

        // get the extension ("ext" or ".ext" or full path)
        var extension = extname('x.' + path)
            .toLowerCase()
            .substr(1);

        if (!extension) return false;

        return types[extension] || false;
    }

    /**
     * Create a full Content-Type header given a MIME type or extension.
     *
     * @param {string} str
     * @return {boolean|string}
     */

    function contentType (str) {
        // TODO: should this even be in this module?
        if (!str || typeof str !== 'string') return false;

        var mime = str.indexOf('/') === -1 ? lookup(str) : str;

        if (!mime) return false;

        // TODO: use content-type or other module
        if (mime.indexOf('charset') === -1) {
            var charset = charset(mime);
            if (charset) mime += '; charset=' + charset.toLowerCase();
        }

        return mime;
    }

    /**
     * Populate the extensions and types maps.
     * @private
     */

    function populateMaps (extensions, types) {
        // source preference (least -> most)
        var preference = ['nginx', 'apache', undefined, 'iana'];

        Object.keys(db).forEach(function forEachMimeType (type) {
            var mime = db[type];
            var exts = mime.extensions;

            if (!exts || !exts.length) return;

            // mime -> extensions
            extensions[type] = exts;

            // extension -> mime
            for (var i = 0; i < exts.length; i++) {
                var extension = exts[i];

                if (types[extension]) {
                    var from = preference.indexOf(db[types[extension]].source);
                    var to = preference.indexOf(mime.source);

                    if (types[extension] !== 'application/octet-stream' &&
                        from > to || (from === to && types[extension].substr(0, 12) === 'application/')) {
                        // skip the remapping
                        continue;
                    }
                }

                // set the extension -> mime
                types[extension] = type;
            }
        });
    }

    var charset = charset;
    var charsets = { lookup: charset };
    var contentType = contentType;
    var extension = extension;


    // Populate the extensions/types maps
    populateMaps(extensions, types);

    return {
        lookup: lookup
    };
});

module.exports = MimeTypes;
