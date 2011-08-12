models.Item.prototype.sync = function(method, model, options) {
    var success = options.success;

    if (method == 'create') {
        // Assign an id to the new item.
        (new models['Items']).fetch({
            success: function(collection) {
                var maxId = 0;
                for (i = 0; i < collection.models.length; i++) {
                    maxId = Math.max(collection.models[i].id ? collection.models[i].id : 0, maxId);
                }
                model.set({'id': maxId + 1});

                // Send back the model, with the id.
                options.success = function() {
                    success(model);
                }

                require('backbone-stash')(process.cwd() + '/fixtures').sync(method, model, options);
            },
            error: function() {
                options.error();
            }
        });
    }
    else {
        require('backbone-stash')(process.cwd() + '/fixtures').sync(method, model, options);
    }
};