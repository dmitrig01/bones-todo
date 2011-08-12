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

    #!/usr/bin/env node
    
    var bones = require('bones');
    
    bones.load(__dirname);
    
    if (!module.parent) {
        bones.start();
    }

Line 1 allows index.js to be run as `./index.js` instead of `node index.js`. Line 3 loads Bones, and line 5 tells Bones to load the application's (or specifically the plugin's) servers, models, views, and routers. Line 7 checks to make sure that this file wasn't included from another file and line 8 starts the server.

After doing that, you can start the server: run `./index.js`. It should say `Started [Server Core:3000]`. Navigate to `localhost:3000` and you should be greeted by a not-so-nice "Not Found" page.

Setting up the router
---------------------

After getting the basics, the next thing to do is set up the routers. Routers reside in `routers/`. This app (as with most Bones applications) will only have one router: `Router.bones`. The first thing in that file is:

    router = Backbone.Router.extend();

(Almost) every `.bones` should contain a variable named accordingly to the type of file: routers contain the variable `router`, models `model` and views `view`. The above statement effectively makes the router variable a subclass of `Backbone.Router`, which is the default router.

The next thing to do is define the routes in the router:

    router.prototype.routes = {
        '': 'page',
        '/': 'page'
    };

This application is very simple: it only has two possible URIs people could hit (on the left of the `:`), and they both map to the same function (on the right of the `:`).

The next part is somewhat complicated: the actual result of the `page` function needs to depend on whether it's run on the client or server. If it's run on the client, the contents of the page need to be injected into the `<body>`. If it's running on the server, the server needs to render a `<html>` wrapper around the page. To accomplish this, the actual function that does this is abstracted out into `router.prototype.send`. Since different applications may want to do this differently, Bones doesn't provide a default, so we'll have to implement it ourselves.

    router.prototype.send = function(view) {
        $('#page').empty().append(content);
    };

This function provides the client-side send function. Ignoring the `view.render().el` part (I'll get to that later), the rest just inserts the contents of the rendered view (passed in, as I'll demonstrate in a moment) to `#page`. The next step here is to implement the server side rendering function. This code will live in `Router.server.bones`.

    routers['Router'].prototype.send = function(content) {
        this.res.send(new views.App({
            'content': content,
        }).render());
    }

As you can see, this code doesn't actually create a new router: it overrides the `send` function of the existing router `Router`. This function also calls a view called `App` and renders it. This view contains the main `<html>`. Let's create the view which holds the main App information.

Creating the main view
----------------------

This app, as with most Bones apps, will have one main view which has the `<html>` tags and includes javascript, css, etc, as necessary. The main `App.bones` contains only one line:

    view = Backbone.View.extend();

There is no render function on the client side, as this is always rendered on the server. `App.server.bones` contains the server-side render function, which looks like this:

    views['App'].prototype.render = function() {
        return templates.App({
            content: this.options.content
        });
    };

`templates.App` is the template "App", which we'll define in a moment. We pass into that an object containing the variables for the template. Again, `<%=` is used to print a variable. `this.options.content` comes from the variable passed into the view at `routers['Router'].prototype.send`. The template will reside in `templates/`, and is called `App._`.

    <html>
    <head>
      <meta charset='UTF-8'/>
      <title>Bones Todo</title>
      <script src='/assets/bones/all.js' type='text/javascript'></script>
      <script type='text/javascript'>$(Bones.start);</script>
      <link rel="stylesheet" href="/assets/todo/style.css" type="text/css" media="screen" title="no title" charset="utf-8">
    </head>
    <body>
      <div id='page'>
        <%= content %>
      </div>
    </body>
    </html>

Wiring up the router
--------------------

Previously, we defined `'/': 'page'` as one of the routes. Because of this, Bones expects there to be a function called `page` on the route. While this will eventually show another view, for now we can insert some testing content. In `Router.bones`:

    router.prototype.page = function() {
        this.send('Testing!');
    };

Now we have a fully working Bones app! Run it with `./index.js` to try it out.

