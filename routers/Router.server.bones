routers['Router'].prototype.send = function(view) {
    this.res.send(new views.App({
        content: view.render().el.html(),
    }).render());
}
