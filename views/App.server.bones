views['App'].prototype.render = function() {
    return templates.App({
        content: this.options.content
    });
};