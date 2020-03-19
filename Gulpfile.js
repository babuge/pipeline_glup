const { series, dest, src} = require('gulp');
const fs = require("fs");
const del = require('gulp-clean');
const jshint = require('gulp-jshint');
const csslint = require('gulp-csslint');
const mapstream = require("map-stream");

function clean() {
    return src('reporter/**/*', {read: false})
    .pipe(del({force: true}));
}

var myReporter = mapstream(function (file, cb) {
    if (!file.jshint.success) {
        let errString = [];
        file.jshint.results.forEach(function (err) {
            /*
                err.error.line 错误所在的行号
                err.error.col  错误所在的列号
                err.error.message/err.reason 错误信息
            */
            if (err && err.error) {
                let error = err.error;
                errString.push(`${file.path}: line ${error.line}, col ${error.character}, code ${error.evidence.trim()}, ${error.reason}`);
            }
        });
        if(errString.length){
            fs.createWriteStream('./reporter/jshintLog').write(errString.join('\n'),function(){
                cb(null, file);
                return false;
            });
        }else{
            cb(null, file);
        }
    }
});

function jshintCS(){
    return src(['./src/**/*.js','!./src/bower_components/**/*'])
    .pipe(jshint())
    .pipe(myReporter)
}

function csslintCS(cb){
    src(['./src/**/*.css','!./src/bower_components/**/*'])
    .pipe(csslint())
    .pipe(csslint.formatter(function(result, path){
        let errString = []
        if(result.messages.length){
            result.messages.forEach(function(error){
                errString.push(` ${path}: line ${error.line}, col ${error.col}, code ${error.evidence.trim()}, ${error.message}`);
            })
            fs.createWriteStream('./reporter/csslintLog').write(errString.join('\n'),function(){
                cb();
                return false;
            });
        }else{
            cb();
        }
    }))
}

function output(cb) {
    cb();
}

async function asyncAwaitTask() {
    const version  = fs.readFileSync('package.json');
    await Promise.resolve('12');
}

function publish(cb){
    cb();
}

if (process.env.NODE_ENV === 'production') {
    exports.default = series(clean, checkstyle);
} else {
    exports.default = series(
        clean,
        jshintCS,
        csslintCS,
        output,
        asyncAwaitTask,
        publish
    );// 顺序执行
}
