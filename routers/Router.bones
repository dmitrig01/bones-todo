router = Backbone.Router.extend();

router.prototype.send = function(view) {
    $('#page').empty().append(view.render().el);
};

router.prototype.routes = {
    '': 'page',
    '/': 'page',
    '/post/:post': 'post',
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

router.prototype.post = function() {
    var post = new models.Post();
    this.send(new views.Post({
        'post': post
    }));
};
