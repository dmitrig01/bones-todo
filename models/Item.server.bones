models.Item.prototype.sync = function(method, model, options) {
    var success = options.success;
    options.success = function() {
        success(model);
    }
    require('backbone-stash')(process.cwd() + '/fixtures').sync(method, model, options);
};
models.Item.augment({
    save: function(parent, attributes, options) {
        if (!this.get('id')) {
            var self = this;
            (new models['Items']).fetch({
                success: function(collection) {
                    var maxId = 0;
                    for (i = 0; i < collection.models.length; i++) {
                        maxId = Math.max(collection.models[i].id ? collection.models[i].id : 0, maxId);
                    }
                    self.set({'id': maxId + 1});
                    parent.call(self, attributes, options);
                }
            });
        }
        else {
            parent.call(this, attributes, options);
        }
    }
})