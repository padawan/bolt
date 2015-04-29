/*
 * PAGES: Downloads rendered pages from a Bolt server
 */
module.exports = function (grunt) {
    grunt.registerTask('pages', 'Downloads rendered pages from a Bolt server', function () {
        var request = require('request'),
            done = this.async(),
            outpath,
            outfile,
            baseurl,
            pages,
            options,
            queue = [];

        // Require config variables.
        grunt.config.requires(
            'path.tmp',
            'pages.baseurl',
            'pages.requests'
        );


        // Create empty output directory inside tmp folder.
        outpath = grunt.config('path.tmp') + '/pages';
        if (grunt.file.isDir(outpath)) {
            grunt.file.delete(outpath);
        }
        grunt.file.mkdir(outpath);

        // Request all required pages.
        pages = grunt.config('pages.requests');
        for (var dest in pages) {
            // Ignore requests with a destination that starts with "#".
            if (dest.substr(0, 1) !== '#') {
                // Set request options.
                if (typeof pages[dest] === 'object') {
                    options = pages[dest];
                } else {
                    options = {
                        url: pages[dest] !== '' ? pages[dest] : dest
                    };
                }
                options.baseUrl = options.baseUrl || grunt.config('pages.baseurl');
                options.followAllRedirects = true; // "followRedirect" doesn't seem to work with 302.
                options.jar = true;

                // Path, where to put the file. Make it always end with ".html"
                outfile = outpath + '/' + dest.replace(/^(.+)\.html$/, '$1') + '.html';

                // Build a request queue.
                queue.push({
                    opt: options,
                    out: outfile
                });
            }
        }

        getNextPage();

        function getNextPage() {
            var next = queue.shift();

            if (next) {
                grunt.log.writeln('Get page "' + next.out + '"');
                grunt.verbose.writeln(require('util').inspect(next.opt, false, 2, true));

                request(
                    next.opt,
                    function (error, response, body) {
                        if (!error && (response.statusCode < 200 || response.statusCode >= 300)) {
                            error = 'Status code: ' + response.statusCode;
                        }
                        if (error) {
                            grunt.fail.warn(error);
                            return done(false);
                        }
                        // Write response body to file.
                        grunt.file.write(next.out, body);
                        // Go on with next request.
                        getNextPage();
                    }
                );
            } else {
                done();
            }
        }
    });
};
