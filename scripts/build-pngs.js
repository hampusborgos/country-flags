import process  from 'process';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const help_message = "You must pass one argument to build-pngs. It should be target dimension in the format `200:` for width 200px, or `:200` for height 200px."
const svgSourceDirectory = 'svg'

// Check arguments
function get_output_directory() {
    // Replace : with x, if two dimensions are specified
    var dim = process.argv[2].split(':').filter(x => x.length > 0)
    var dir = 'png-' + (dim.length > 1 ? dim.join('x') : dim) + 'px'

    return dir
}

function get_output_dimensions() {
    return process.argv[2]
}

function check_arguments() {
    if (process.argv.length != 3) {
        console.log(help_message)
        return false;
    }

    var dimensions = process.argv[2]
    if (/^[0-9]*:[0-9]*$/.test(dimensions) && dimensions.length > 2) {
        var output_folder = get_output_directory()
        console.log("Output folder: " + output_folder)
        
        if (!fs.existsSync(output_folder)){
            fs.mkdirSync(output_folder)
        }

        return true;
    }

    console.log(help_message)

    return false;
}

function check_for_sharp() {
    // check for presence of sharp
    if (sharp) return true;

    console.log("`sharp` is not installed.")
    console.log("Please run: npm install sharp")

    return false;
}

function get_all_svgs(callback) {
    fs.readdir(svgSourceDirectory, function(err, items) {
        if (err) {
            console.log("Could not list *.svg files. You probably ran this command from the wrong working directory.")
            console.log(err)
            process.exit(1)
        }

        items = items.filter(path => /^[a-z\-]+\.svg$/.test(path))
        callback(items)
    }, (error) => {})
}

async function convert_and_compress_svg({ sourceSvgPath, svgFileName, callback }) {
  // export the SVG file to PNG file
  const outputDirectory = get_output_directory();
  const [imageFileName] = svgFileName.split('.');

  const outputImagePath = path.join(outputDirectory, `${imageFileName}.png`)

  try {
    console.log(`Exporting - ${sourceSvgPath} to ${outputImagePath}`)
    // export svg to png
    await sharp(sourceSvgPath, { limitInputPixels: false })
      .resize({ width: parseInt(get_output_dimensions()) })
      .png({ compressionLevel: 9, adaptiveFiltering: true, force: true })
      .toFile(outputImagePath);
  } catch (error) {
    console.log("Failed to convert SVG: " + sourceSvgPath)
    console.log('Error -', error)
  } finally {
    callback();
  }
}

function convert_all_files(svgs, callback) {
    var i = 0

    function do_next_file() {
        console.log("Converting [" + (i+1) + "/" + svgs.length + "] " + svgs[i])
        convert_and_compress_svg({
          sourceSvgPath: path.join(svgSourceDirectory, svgs[i]),
          svgFileName: svgs[i],
          callback: do_next_file
        })

        ++i
        if (i >= svgs.length) {
            callback()
            return
        }
    }

    do_next_file()
}

// Run the program
(() => {
  if (!check_arguments() || !check_for_sharp()) return;
  
  get_all_svgs((svgs) => convert_all_files(svgs, () => {
    console.log("All SVGs converted to PNG!")
    process.exit(0)
  }))
})();
