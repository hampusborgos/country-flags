var { createCanvas, loadImage } = require('canvas');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec

var help_message = "You must pass one argument to build-png-map. It should be target dimension in the format `200:` for width 200px, or `:200` for height 200px."
var depend_error = "You must first build pngs with given format with npm run build-pngs -- xxx";

var pngs_directory;

function get_output_directory(dimensions) {
    // Replace : with x, if two dimensions are specified
    var dim = dimensions.split(':').filter(x => x.length > 0)
    var dir = 'png' + (dim.length > 1 ? dim.join('x') : dim) + 'px'

    return dir
}

function check_arguments(callback) {
    if (process.argv.length !== 3) {
        console.log(help_message)
        process.exit(1)
    }

    var dimensions = process.argv[2]
    if (/^[0-9]*:[0-9]*$/.test(dimensions) && dimensions.length > 2) {
        pngs_directory = get_output_directory(dimensions)
        console.log("Source folder: " + pngs_directory)

        if (!fs.existsSync(pngs_directory)){
            console.log(depend_error)
            process.exit(2)
        }

        callback()
    }
    else {
        console.log(help_message)
        process.exit(1)
    }
}

function get_all_pngs(callback) {
    fs.readdir(pngs_directory, function(err, items) {
        if (err) {
            console.log("Could not list *.png files. You probably ran this command from the wrong working directory.")
            console.log(err)
            process.exit(1)
        }

        items = items.filter(path => /^[a-z\-]+\.png$/.test(path) && "all.png"!==path);
        callback(items)
    }, (error) => {})
}

function load_images(res, images, callback) {
    loadImage(path.join(pngs_directory, images[res.length])).then((image) => {
        // console.log("Loaded: ", image.src, image.width, image.height);
        res.push(image);
        if(res.length===images.length) callback(res);
        else load_images(res, images, callback);
    }).catch(e => {
        console.log("Error loading image: "+images[res.length], e);
        proces.exit(2);
    })
}

function get_country(name) {
    return /^([a-z\-]+)\.png$/.exec(name)[1];
}

check_arguments(() => {
    get_all_pngs((items) => {
        items.sort();
        load_images([], items, (images) => {
            var same_width=true;
            var w=images[0].width, h=images[0].height;
            for(var i=1;i<images.length;++i) {
                if(images[i].width!==w) {
                    same_width=false;
                    break;
                } else if(images[i].height!==h) {
                    same_width=true;
                    break;
                }
            }
            var row=Math.floor(Math.sqrt(images.length));
            var col=Math.floor((images.length+row-1)/row);
            console.log("Same with: ", same_width, "Row: ", row, "Col: ", col);

            var height, width, desc={}, css=[];
            css.push(".flags {\n\tbackground-image: url('all.png');\n\tdisplay: block;\n}\n")
            if(same_width) {
                width = (row+1) * w;
                height = 0;
            } else {
                height = (row+1) * h;
                width = 0;
            }
            for(var i=0;i<images.length;i+=row) {
                var size=0;
                for(var j=0;j<row;++j) {
                    if(j+i<images.length) size+=same_width?images[j+i].height:images[j+i].width;
                }
                if(same_width) height=Math.max(height, size);
                else width=Math.max(width, size);
            }
            console.log("Final images size: ", width, height);
            var canvas=createCanvas(width, height);
            var ctx=canvas.getContext('2d');
            for(var c=0;c<col;++c) {
                var pos=0;
                for(var r=0;r<row;++r) {
                    var i=r+c*row;
                    if(i>=images.length) break;
                    var img=images[i];
                    var x, y;
                    if(same_width) {
                        x=c*w; y=pos;
                    } else {
                        x=pos; y=c*h;
                    }
                    ctx.drawImage(img, x, y);
                    var country=get_country(items[i]);
                    desc[country]={
                        x, y, w: img.width, h: img.height
                    }
                    pos+=same_width?img.height:img.width;
                    css.push(`.flag-${country} {\n\twidth: ${img.width}px;\n\theight: ${img.height}px;\n\tbackground-position: -${x}px -${y}px;\n}\n`);
                }
            }
            var buffer=canvas.toBuffer("image/png");
            var all_name=path.join(pngs_directory, 'all.png');
            fs.writeFileSync('all.png', buffer);
            fs.writeFileSync(path.join(pngs_directory, 'all.json'), JSON.stringify(desc), { encoding: 'utf-8' });
            fs.writeFileSync(path.join(pngs_directory, 'all.css'), css.join("\n"), { encoding: 'utf-8' });

            var image_min_command = "imagemin all.png --out-dir=" + pngs_directory;
            console.log(image_min_command)
            exec(image_min_command, (error, stdout, stderr) => {
                // Always remove temp file
                fs.unlink('all.png', (error) => {})
                if (error) {
                    console.log("Failed to minimalize img: all.png");
                    process.exit(1)
                }
            })
        })
    })
})