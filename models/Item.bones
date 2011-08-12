model = Backbone.Model.extend({
    url: function() {
        if (this.get('id')) {
            return '/api/Item/' + this.get('id');
        }
        return '/api/Item';
    },
});