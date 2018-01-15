var process = require('process')
var exec = require('child_process').exec
var fs = require('fs')

var help_message = "You must pass one argument to build-pngs. It should be dimension of the resultant image in the format 200: for width 200px, or :200 for height 200px."
var svg_directory = 'svg/'

// Check arguments
function get_output_directory() {
    return 'png' + process.argv[2].replace(':', '') + 'px'
}

function get_output_dimensions() {
    return process.argv[2]
}

function check_arguments(callback) {
    if (process.argv.length != 3) {
        console.log(help_message)
        process.exit(1)
    }

    var dimensions = process.argv[2]
    if (/^[0-9]*:[0-9]*$/.test(dimensions) && dimensions.length > 2) {
        console.log("Output folder: " + get_output_directory())
        callback()
    }
    else {
        console.log(help_message)
        process.exit(1)
    }
}

function check_for_svgexport(callback) {
    // Check for presence of imagemin-cli and svgexport
    console.log("Checking if `svgexport` is available...")
    exec('svgexport', function(error, stdout, stderr) {
        if (stdout.indexOf("Error")) {
            callback()
        }
        else {
            console.log("`svgexport` is not installed.")
            console.log("Please run: npm install -g svgexport")
            process.exit(1)
        }
    })
}

function check_for_imagemin(callback) {
    // Check for presence of imagemin-cli and svgexport
    console.log("Checking if `imagemin-cli` is available...")
    exec("imagemin --version", function(error, stdout, stderr) {
        if (!error) {
            callback()
        }
        else {
            console.log("`imagemin-cli` is not installed.")
            console.log("Please run: npm install -g imagemin-cli")
            process.exit(1)
        }
    })
}

function get_all_svgs(callback) {
    fs.readdir(svg_directory, function(err, items) {
        if (err) {
            console.log("Could not list *.svg files. You probably ran this command from the wrong working directory.")
            console.log(err)
            process.exit(1)
        }

        items = items.filter(path => /^[a-z\-]+\.svg$/.test(path))
        callback(items)
    }, (error) => {})
}

function convert_and_compress_svg(path_to_svg, callback) {
    var path_to_tmp_png = path_to_svg.substring(0, path_to_svg.length - 4) + '.png'
    exec("svgexport " + path_to_svg + " " + path_to_tmp_png + " pad " + get_output_dimensions(), (error, stdout, stderr) => {
        if (error) {
            console.log("Failed to convert SVG: " + path_to_svg)
            process.exit(1)
        }

        exec("imagemin " + path_to_tmp_png + " --out-dir=" + get_output_directory(), (error, stdout, stderr) => {
            // Always remove temp file
            fs.unlink(path_to_tmp_png, (error) => {})

            if (error) {
                console.log("Failed to convert SVG: " + path_to_svg)
                process.exit(1)
            }

            callback()
        })
    })
}

function convert_all_files(svgs, callback) {
    var i = 0

    function do_next_file() {
        console.log("Converting [" + (i+1) + "/" + svgs.length + "] " + svgs[i])
        convert_and_compress_svg(svg_directory + svgs[i], do_next_file)

        ++i
        if (i >= svgs.length) {
            callback()
            return
        }

        do_next_file()
    }

    do_next_file()
}

// Run the program
check_arguments(() =>
    check_for_imagemin(() =>
    check_for_svgexport(() =>
    get_all_svgs((svgs) => convert_all_files(svgs, () => {
        console.log("All SVGs converted to PNG!")
        process.exit(0)
    })
))))
