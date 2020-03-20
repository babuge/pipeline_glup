module.exports = {
    runPublish: function(cb){
        let i=0,interval=null;
        interval = setInterval(()=>{
            console.log(i++);
            if(i > 10){
                clearInterval(interval);
                console.log('hook_task_end');
                typeof cb === 'function' && cb();
            }
        },1000)
    }
}