const { series, src} = require('gulp');
const fs = require("fs");
const del = require('gulp-clean');
const jshint = require('gulp-jshint');
const csslint = require('gulp-csslint');
const mapstream = require("map-stream");
const htmlhint = require("gulp-htmlhint");

const {runPublish} = require("./hook_flow/hook_config.js");

const gulpFlow = {
    reporter: './reporter/reporterLog'
};

let reporterStream = [];

const jsReporter = mapstream(function (file, cb) {
    if (!file.jshint.success) {
        file.jshint.results.forEach(function (err) {
            if (err && err.error) {
                let error = err.error;
                reporterStream.push({
                    parent: 'js',
                    file: file.path,
                    line: error.line,
                    col: error.character,
                    evidence: error.evidence.trim(),
                    message: error.reason.trim()
                });
            }
        });
        cb(null, file);
    }
});

const cssReporter = function(result, path, cb){
    if(result.messages.length){
        result.messages.forEach(function(error){
            reporterStream.push({
                parent: 'css',
                file: path,
                line: error.line,
                col: error.col,
                evidence: error.evidence.trim(),
                message: error.message
            });
        })
        cb();
    }else{
        cb();
    }
}

const htmlReporter = function(result, cb){
    if(result.length){
        result.forEach(function(item){
            reporterStream.push({
                parent: 'html',
                file: item.file,
                line: item.error.line,
                col: item.error.col,
                evidence: item.error.evidence.trim(),
                message: item.error.message.trim()
            });
        })
        cb();
    }else{
        cb();
    }
}

function clean() {
    reporterStream = [];
    return src('reporter/**/*', {read: false})
    .pipe(del({force: true}));
}
function jshintCS(){
    return src(['./src/**/*.js','!./src/bower_components/**/*'])
    .pipe(jshint())
    .pipe(jsReporter)
}
function csslintCS(cb){
    src(['./src/**/*.css','!./src/bower_components/**/*'])
    .pipe(csslint())
    .pipe(csslint.formatter(function(result, path){
        cssReporter(result, path, cb);
    }))
}
function htmlHintCS(cb){
    return src(["./src/**/*.html", "!./bower_components/**/*.html"])
    .pipe(htmlhint())
    .pipe(htmlhint.reporter(function(file, result){
        htmlReporter(result, cb);
    }))
}

function output(cb) {
    if(reporterStream.length){
        let list = reporterStream.map(function(item){
            return `${item.parent} ${item.file}: line ${item.line}, col ${item.col}, code ${item.evidence}, ${item.message}`;
        })
        fs.createWriteStream(gulpFlow.reporter).write(list.join('\n'),function(){
            cb();
            return false;
        });
    }
}

function publish(cb){
    if(reporterStream.length){
        cb();
        console.error(`${new Date()}: ------构建失败---------`);
    }else{
        console.info(`${new Date()}: ------构建成功---------`);
        runPublish(cb);
    }
}

const allCS = series(jshintCS,csslintCS,htmlHintCS,output);

if (process.env.NODE_ENV === 'production') {
    exports.default = series(clean, allCS);
} else {
    exports.default = series(
        clean,
        allCS,
        publish
    );// 顺序执行
}
