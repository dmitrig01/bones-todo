view = Backbone.View.extend({
    events: {
        'submit form': 'new',
        'change .checkbox': 'changeEv',
    },
    render: function() {
        var rendered = templates.Page({
            items: this.collection.models
        });
        $(this.el).empty().append(rendered);
        return this;
    },
    new: function() {
        var name = $('form input#text').val(), self = this,
            model = (new models.Item({}, { collection: this.collection })).set({'title': name, done: false});

        model.save({}, {
            success: function(data) {
                model.set({ 'id': data.id });
            }
        });
        this.collection.add(model);
        this.render();

        return false;
    },
    changeEv: function(e) {
        this.collection.models[$(e.target).parent().data('id')].set({ done: $(e.target)[0].checked }).save();
    }
});
