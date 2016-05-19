country-flags
=============

You can view all the flags here: http://hjnilsson.github.io/country-flags/

This repository contains renders of all the worlds flags in SVG and PNG format.

The source files were taken from Wikipedia and are not under copyright
protection since flags are effectively in public domain (there may be other
restrictions on how the flag can be used though).

The flags are named by their 2-letter ISO country code.

Also included is a JSON file that maps the ISO country code to the name of the
country.

Arbitrary Width
===============

If you would like the flags in a different width than 250px, you can easily
use a combination of `svgexport` and `imagemin-cli` from NPM to get that.

Run the following commands in the `svg/` directory to get PNGs of a desired width:

    npm install -g svgexport imagemin-cli
    for file in *.svg; do svgexport $file "`basename $file svg`png" pad 1000: ; done
    imagemin *.png ../compressed-pngs/
    rm *.png

Replace `1000:` with whatever width you want (note the `:`), or type `:200` to get
PNGs with a height of 200px.
