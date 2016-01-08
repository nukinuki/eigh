// Include gulp
var gulp = require('gulp'); 

// Include Our Plugins
var sass = require('gulp-sass');
//var concat = require('gulp-concat');
//var uglify = require('gulp-uglify');
//var rename = require('gulp-rename');
var coffee = require('gulp-coffee');
var gutil = require('gulp-util');

var output = '../public/';

// Compile Our Sass
gulp.task('sass', function() {
    return gulp.src('scss/*.scss')
        .pipe(sass())
        .pipe(gulp.dest(output + 'css'));
});

gulp.task('coffee', function() {
    return gulp.src('**/*.coffee')
        .pipe(coffee({bare: true}))
        .pipe(gulp.dest(output+'js'))
        .on('error', gutil.log);
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('**/*.coffee', ['coffee']);
    gulp.watch('scss/*.scss', ['sass']);
});

// Default Task
gulp.task('default', ['coffee', 'sass', 'watch']);