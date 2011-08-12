models['Items'].prototype.fetch = function(callbacks) {
    var list = require('backbone-stash')(process.cwd() + '/fixtures').stash.list(),
        model_list = [];
    for (i in list) {
        if (i.match(/^api\.Item/)) {
            model_list.push(new models.Item(list[i]));
        }
    }
    this.reset(model_list);
    callbacks.success(this, model_list);
};