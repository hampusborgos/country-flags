country-flags
=============

You can view all the flags here: http://hjnilsson.github.io/country-flags/

This repository contains renders of all the worlds flags in SVG and PNG format.

The source files were taken from Wikipedia and are not under copyright
protection since flags are effectively in public domain (there may be other
restrictions on how the flag can be used though).

The flags are named by their 2-letter ISO-3166 country code, except for the
constituent countries of Great Britain which have 6-letter codes "GB-ENG" etc).
Also included is the flag of Kosovo named `Kosovo.svg`. Kosovo does not yet have a ISO country code.

Also included is a JSON file that maps the ISO country code to the name of the
country.

You can also install this as a NPM module:

    npm install --save svg-country-flags

Arbitrary Width
===============

If you would like the flags in a different width than 100px, 250px or 1000px,
you can run the node script 'build-pngs', you must first install the modules `svgexport` and `imagemin-cli`:

    npm install -g svgexport imagemin-cli
    npm run build-pngs -- 1000:

Replace `1000:` with whatever width you want (note the `:`), or type `:200` to get
PNGs with a height of 200px.

Arbitrary Width Manually
========================

If you cannot run the node script above, you can do the same steps manually.

Use a combination of `svgexport` and `imagemin-cli` from NPM to get that.
`imagemin` is very important because `svgexport` produces uncompressed PNGs which are several MB each.

Run the following commands in the `svg/` directory to get PNGs of a desired width:

    for file in *.svg; do svgexport $file "`basename $file svg`png" pad 1000: ; done
    imagemin *.png --out-dir=../compressed-pngs/
    rm *.png

The resultant files will be in the `compressed-pngs` folder. As before, `1000:` is the dimensions to export.
