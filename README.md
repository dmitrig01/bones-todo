Bones todo
=============

Bones todo is a small todo-list using the bones framework. Below is a walkthrough of how it was created.

Concepts
--------

Bones is an MVC framework built on the Backbone framework and node.js. The basic concept is that it enables running Backbone on the server, using node.js and the express framework. Beyond this, Bones provides quite a few other things that need to be understood before using it.

Most is run on both the client and the server. Most code is in a `.bones` file. This is a JavaScript file, but it has this specific extension because it needs special handling depending on whether the code is running on the server and the client, and Bones does all this handling behind-the-scenes. You can always check the variable `Bones.server` to determine whether the code is running on the server or not. Additionally, code in `.server.bones` files runs exclusively on the servers. Code in these files often overrides methods in ways only applicable on the server, such as backend saving methods.

A plugin is basically an entire application, in that is the overarching structure that can contain all of the other elements (models, views, routers, servers). The simplest Bones application will have only one plugin. However, more complicated Bones applications may use multiple plugins. There will always be one "main" plugin, but that plugin can include other plugins -- for example, [bones-auth](https://github.com/developmentseed/bones-auth) is a plugin which provides authentication support for Bones. While it might not be that useful on its own, other plugins may include bones-auth in order to use its authentication functionality. Bones-auth, meanwhile, contains models, views, routers, and servers essential to providing authentication. The "todo" app only has one plugin, which is the main "todo" app.

A server can provide several things: additional routes, middleware, etc. By default, Bones has several servers: Asset, Middleware, Route, and Core. The Asset server serves static assets such as JavaScript and CSS. It also packages together all of Bones' models, views, and routers, to serve to the client. The Middleware server provides middleware that handles CSRF protection, cookie parsing, and other functionality. The Route server provides default routes for models and integrates custom routers. Core bundles these all together into one final server.

Routers reflect what is typically referred to as "controllers" in MVC architecture. However, unlike Ruby on Rails or other MVC frameworks, most Bones applications will only have a single router. The router maps paths to functions on the server, and these functions then send the content to the client. On the server, routers need to call `this.res.send` with the HTML to send to the client.

Models are very similar to the classic MVC concept of a model In Bones, models need to define their url. This will almost always be `/api/<Model name>/<Model id>`, though for creating a new model (without an id), it's `/api/<Model name>/<Model id>`. Additionally, on the server side, models need to define their saving logic. All CRUD operations go through a `sync` function. This `sync` function is often provided by a plugin, such as `backbone-stash` (which saves to .json files on the file system) or `backbone-couch`, which saves to couchdb.

Views define presentations logic. This is a prime example of logic that can run on either the client or the server -- the view can be rendered in either place, but it shouldn't care where it is rendered. Views have a `render` function which defines their rendering logic. This function will often put variables passed into `this.options` into templates. They also define `events`, which are bound to specific targets and trigger methods of the view.

Closely related to views are templates. Templates are HTML with embedded JavaScript, using the Underscore templating engine (thus templates end in `._`). JavaScript logic can be placed between `<%` and `%>` tags, and anything rendered is placed between `<%=` and `%>` tags.

Creating the app
----------------

The first thing to do is to install dependencies. We'll use [npm](http://npmjs.org/), node's package manager. For this project, the dependencies needed are `bones` (the main framework) and `backbone-stash` (the database of sorts). Run `npm install bones` and `npm install backbone-stash` to get started. To tell npm about these projects, run `npm init` and fill in the information which it asks. This will also be needed later for bones to serve assets.

The next thing is to create the index.js file. Most bones projects will have the same index.js file, which looks like this:

```javascript
#!/usr/bin/env node

var bones = require('bones');

bones.load(__dirname);

if (!module.parent) {
    bones.start();
}
```

Line 1 allows index.js to be run as `./index.js` instead of `node index.js`. Line 3 loads Bones, and line 5 tells Bones to load the application's (or specifically the plugin's) servers, models, views, and routers. Line 7 checks to make sure that this file wasn't included from another file and line 8 starts the server.

After doing that, you can start the server: run `./index.js`. It should say `Started [Server Core:3000]`. Navigate to `localhost:3000` and you should be greeted by a not-so-nice "Not Found" page.

Setting up the router
---------------------

After getting the basics, the next thing to do is set up the routers. Routers reside in `routers/`. This app (as with most Bones applications) will only have one router: `Router.bones`. The first thing in that file is:

```javascript
router = Backbone.Router.extend();
```

(Almost) every `.bones` should contain a variable named accordingly to the type of file: routers contain the variable `router`, models `model` and views `view`. The above statement effectively makes the router variable a subclass of `Backbone.Router`, which is the default router.

The next thing to do is define the routes in the router:

```javascript
router.prototype.routes = {
    '': 'page',
    '/': 'page'
};
```

This application is very simple: it only has two possible URIs people could hit (on the left of the `:`), and they both map to the same function (on the right of the `:`).

The next part is somewhat complicated: the actual result of the `page` function needs to depend on whether it's run on the client or server. If it's run on the client, the contents of the page need to be injected into the `<body>`. If it's running on the server, the server needs to render a `<html>` wrapper around the page. To accomplish this, the actual function that does this is abstracted out into `router.prototype.send`. Since different applications may want to do this differently, Bones doesn't provide a default, so we'll have to implement it ourselves.

```javascript
router.prototype.send = function(view) {
    $('#page').empty().append(content);
};
```

This function provides the client-side send function. Ignoring the `view.render().el` part (I'll get to that later), the rest just inserts the contents of the rendered view (passed in, as I'll demonstrate in a moment) to `#page`. The next step here is to implement the server side rendering function. This code will live in `Router.server.bones`.

```javascript
routers['Router'].prototype.send = function(content) {
    this.res.send(new views.App({
        'content': content,
    }).render());
}
```

As you can see, this code doesn't actually create a new router: it overrides the `send` function of the existing router `Router`. This function also calls a view called `App` and renders it. This view contains the main `<html>`. Let's create the view which holds the main App information.

Creating the main view
----------------------

This app, as with most Bones apps, will have one main view which has the `<html>` tags and includes javascript, css, etc, as necessary. The main `App.bones` contains only one line:

```javascript
view = Backbone.View.extend();
```

There is no render function on the client side, as this is always rendered on the server. `App.server.bones` contains the server-side render function, which looks like this:

```javascript
views['App'].prototype.render = function() {
    return templates.App({
        content: this.options.content
    });
};
```

`templates.App` is the template "App", which we'll define in a moment. We pass into that an object containing the variables for the template. Again, `<%=` is used to print a variable. `this.options.content` comes from the variable passed into the view at `routers['Router'].prototype.send`. The template will reside in `templates/`, and is called `App._`.

```html
<html>
<head>
  <meta charset='UTF-8'/>
  <title>Bones Todo</title>
  <script src='/assets/bones/all.js' type='text/javascript'></script>
  <script type='text/javascript'>$(Bones.start);</script>
</head>
<body>
  <div id='page'>
    <%= content %>
  </div>
</body>
</html>
```

Wiring up the router
--------------------

Previously, we defined `'/': 'page'` as one of the routes. Because of this, Bones expects there to be a function called `page` on the route. While this will eventually show another view, for now we can insert some testing content. In `Router.bones`:

```javascript
router.prototype.page = function() {
    this.send('Testing!');
};
```

Now we have a fully working Bones app! Run it with `./index.js` to try it out.

Creating a model
----------------

The next step is to create a model. The model defines data storage. We're going to create a model called "item," which will represent an item on the todo list. The only thing models absolutely need to implement is a URL. As above, models by default have the URL `api/<Model name>/<Model id>`, or if there's no id (for example, upon creating a new item), just `api/<Model name>`. Thus, `models/Item.bones`, containing the "Item" model will look something like this:

```javascript
model = Backbone.Model.extend({
    url: function() {
        if (this.get('id')) {
            return '/api/Item/' + this.get('id');
        }
        return '/api/Item';
    }
});
```

The next step would be to write code on the server side that actually saves the model, but that depends on a Collection, so that will need to be defined next.

Creating a collection
---------------------

Collections are a special type of model, in that they don't represent a specific object, but rather a collection of objects. We'll need to create an `Items` collection for when we want to fetch multiple items. This needs also to specify a URL, and it additionally needs to specify what type of model it is a collection of. In `models/Items.bones`:

```javascript
model = Backbone.Collection.extend({
    model: models.Item,
    url: '/api/Item'
});
```

However, this by itself can't do the actual fetching of items. We need to define some server-side code to do that. This is where the `backbone-stash` library comes in handy. (Almost) every model will need to define a `.sync` method, which is a function through which all CRUD (+ list) operations pass. Luckily, `backbone-stash` defines one already, so all that's needed is to define the sync function of the collection as that. In `models/Items.server.bones`:

```javascript
models.Items.prototype.sync = require('backbone-stash')(process.cwd() + '/fixtures').sync;
```

What's actually going on here is that `require('backbone-stash')` is a function. To this function we pass the directory name in which the items will be stored -- `backbone-stash` just stores JSON files in the filesystem. The result of this function is an object, whose property `sync` is exactly what we need.

Now that this is defined, we can get back to defining the syncing logic for the individual `Item` model.

Saving a model
--------------

To start, we can implement the similar code as the collection for syncing in `models/Item.server.bones` -- however, it can't be exactly the same, as there will need to be sone special logic for creation of new Item objects:

```javascript
models.Item.prototype.sync = function(method, model, options) {
    if (method == 'create') {
        // We'll get to this in a moment...
    }
    else {
        require('backbone-stash')(process.cwd() + '/fixtures').sync(method, model, options);
    }
}
```

Here we define probably the most logic-heavy part of the whole application. The reason for this is that before creating an `Item`, we need to determine what `id` it will have. The way this is done is by looking through all the existing Items, finding the one with the highest `id`, and incrementing that by one. To do this, we use the Items collection we just created to fetch all the items, find the one with the highest id, and set the current model to that id + 1, and pass that through to backbone-stash's sync function. Put this in the `if (method == 'create') {`

```javascript
// Assign an id to the new item.
(new models['Items']).fetch({
    success: function(collection) {
        // Find the highest id.
        var maxId = 0;
        for (i = 0; i < collection.models.length; i++) {
            maxId = Math.max(collection.models[i].id ? collection.models[i].id : 0, maxId);
        }
        // Set the current model's id to that + 1.
        model.set({'id': maxId + 1});

        require('backbone-stash')(process.cwd() + '/fixtures').sync(method, model, options);
    },
    error: function() {
        options.error();
    }
});
```

However, we still need one more thing: the client side app needs to be told about the new ID so that if it sends any updates to the model, it knows which item to update. `options.success` will send back a response to the client, which automatically gets picked up. We'll need to call this function with the `id` -- it's good practice to only send back attributes that have been updated. Put this before the `.sync` in the above code block:

```javascript
var success = options.success;
// Send back the model, with the id.
options.success = function() {
    // Only send back items that need to be updated.
    success({id: model.get('id') });
}
```

Great! Now there's only one thing left to do: creating a view to display the items.

Creating the page view
----------------------

We'll create another view called `Page` which will contain the content of the page. It's important to separate this out from the other view because this part can get re-rendered independently of the main App view. Here's the basic code for `views/Page.bones`:

```javascript
view = Backbone.View.extend({
    render: function() {
        var rendered = templates.Page({
            items: this.collection.models
        });
        $(this.el).empty().append(rendered);
        return $(this.el).html();
    }
});
```

As you'll see in a bit, we'll pass a collection into the view, which becomes `this.collection`. `this.collection.models` is, as the name implies, a list of models in that collection. We can iterate through those in the template and put them in a `<ul>`. In `templates/Page._`:

```html
<h1>Items</h1>
<ul>
  <% for (i = 0; i < items.length; i++) { %>
  <li data-id="<%= i %>"><input type="checkbox" class="checkbox" id="checkbox-<%= i %>" <%= items[i].attributes.done ? 'checked' : '' %> /> <label for="checkbox-<%= i %>"><%= items[i].attributes.title %></label></li>
  <% } %>
  <li><form method="post" action="/api/Item"><input type="text" id="text" name="text" /><input type="submit" id="submit" value="+ Add" /></form></li>
</ul>
```

We're going to want a bit more logic in the Page view. When the state of the checkbox is changed, we want to send that to the server. In a view, you can define an `events` object, which maps an event and a selector to a callback. Add this code right below `Backbone.View.extend({`:

```javascript
events: {
    'change .checkbox': 'changeEv'
}
```

This will call the view's `changeEv` method when a `change` event is fired on `.checkbox`. That should look something like this:

```javascript
changeEv: function(e) {
    this.collection.models[$(e.target).parent().data('id')].set({ done: $(e.target)[0].checked }).save();
}
```

`$(e.target).parent().data('id')` finds the id (well really, the offset) of the model. `this.collection.models[$(e.target).parent().data('id')]` then contains the model's We set it's `done` attribute to whether or not this checkbox is checked, and then save that.

Another event that can be added is ajaxically submitting the form. Add this code to the `events` object:

```javascript
'submit form': 'new'
```

And then this as the `new` function:

```javascript
new: function() {
    // Get the name.
    var name = $('form input#text').val(),
        // Instantiate a new model object with the proper collection, and set it's title.
        model = (new models.Item({}, { collection: this.collection })).set({ 'title': name, done: false });

    // Empty the name field:
    $('form input#text').val('');

    // Save the model.
    model.save();
    // Add the model to the collection.
    this.collection.add(model);
    // Re-render this view, which re-renders the collection.
    this.render();

    // Don't send the form to the server.
    return false;
}
```

The view is now done. The very last step is to wire this back up to the router.

Wiring up the router, take 2
----------------------------

Instead of just printing "Testing!", we'll make the router actually fetch the models it needs to fetch. This code should be pretty self-explanatory. Replace the existing `router.prototype.page` (in `routers/Router.bones`) with this:

```javascript
router.prototype.page = function() {
    var self = this;
    // Fetch all the items.
    (new models.Items()).fetch({
        // When successful...
        success: function(collection, resp) {
            // Send the rendered view containing this collection.
            self.send(new views.Page({
                'collection': collection
            }).render());
        }
    });
};
```

All done! Run `./index.js` to see this code in action.

Adding assets
-------------

One final thing that we can do is add extra CSS and JavaScript files. To do this, place them in the `assets/` directory. For example, bones-todo has a style.css in this directory (https://raw.github.com/dmitrig01/bones-todo/master/assets/style.css). To the outside world, Bones shows anything in the assets folder as `/assets/<Plugin name>/<Path inside assets/>`. That way, if multiple plugins define assets with the same name, both can be included on a given page. Since our plugin is called `todo` (it's defined in package.json, which was created with `npm init` right at the beginning), we'll want to add this to the `<head>` of `views/App._`:

```html
<link rel="stylesheet" href="/assets/todo/style.css" type="text/css" media="screen" charset="utf-8">
```

After restarting your application (`./index.js`), you should see the change take effect.
