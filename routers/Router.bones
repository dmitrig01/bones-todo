router = Backbone.Router.extend();

router.prototype.send = function(view) {
    $('#page').empty().append(view.render().el);
};

router.prototype.routes = {
    '': 'page',
    '/': 'page',
};

router.prototype.page = function() {
    var items = new models.Items(), self = this;
    items.fetch({
        success: function(collection, resp) {
            self.send(new views.Page({
                'collection': collection
            }));
        }
    });
};
