# gun-tag

### Intro

GUN Tag is a plugin for Gun(^0.9.x) using `Gun.chain`.

If you need to organize your data with tags/labels this might be useful. gun-tag enables you to tag and untag nodes to custom tags/labels.
So for everyone who is struggling with deleting data in Gun ( You can't ) this could be a nice alternative.

It will give you the following;
* tag nodes
* untag nodes
* scopetag nodes
* proptag nodes
* find intersects (multiple tags)
* filter nodes

[What you could do with gun-tag](./Polymer_Gun_electron-starter-Google-Chrome-7-7-2017-21_28_32.gif)

### Important!
`gun-tag` alters your nodes by adding extra properties to it. ( But so does Gun )

### Setup

##### Prerequisites
You'll need Gun ^0.9.x
```
 npm install gun
 npm install gun-tag
```

### Node.js
```
var Gun = require('gun');
require('gun-tag');
```

### Browser
For the browser, it's much simpler, since your version of gun is exported as a global. Just include it as a script tag, and gun-tag takes care of the rest.
```
<!-- AFTER you load Gun -->
<script src="node_modules/gun-tag/gun-tag.js"></script>
```

## API
Several methods are exposed for your gun instance;
* `.tag`
* `.proptag`
* `.untag`
* `.switchtag`
* `.tagged` 
* `.intersect` ( aka filtering)


## gun.get('Bob').tag('programmer')
You can pass `.tag()` multiple names to index a node under. When called, it will try to read out your current context, index it under each tag, and then place each tag under a master list of every tag ever used.
A tag can be a String or an Array (['one','Numbers/two','three'])

```
gun.put({
  name: 'Bob',
  profession: 'developer'
}).tag([
  'members',
  'javascript developers',
  'gunDB developers',
  'examples'
])
```

### Additional : gun.tag('scope/name')
The same as `tag` but when you put a '/' in your tagname the tag will be 'scoped'.

#### Say what?
Suppose you want to tag your Books and Movies. And you want to categorize them in themes also ( 'Fantasy','Comedy',etc), oh and tag them to the author.
```
gun.get('IT')
   .put({title:'IT',discription:'Some scary stuff about a clown'})
   .tag([
     'Books/Horror',
     'Books/Fantasy',
     'Movies/Horror',
     'Movies/'Fantasy',
     'Authors/King',
     'Fantasy/Book',
     'Horror/Movie']);

```

Now there are several options to retrieve your data...
First of all we can get a list of our 'Book' themes
```
gun.tagged('Books', data => { console.log(data) } )  
/* data will be...
  {
    Fantasy:{'#':'Books/Fantasy'},
    Horror:{'#':'Books/Horror'}
  }

/*  basicly the same as */
gun.get('Books/TAGS').once(Gun.log)

```
Note: It is no longer required to add '/TAGS' to the scoped tags.<br>
eg: `gun.tagged('Books/TAGS')` is the same as `gun.tagged('Books')`. <br>gun-tag knows its scopes.


To get all Fantasy books

```
 gun.tagged('Books/Fantasy',cb)  
 // will return all - full - nodes that are tagged to 'Books/Fantasy'
```

#### Usefull ?
Well yeah... You could create a selector 'Choose Book theme' and let the user select a theme. Upon selection you present all books belonging to that theme.

### gun.get().untag('name')
The same 'rules' as tagging but now the nodes get 'untagged'.
> nodes that are untagged will only be filtered out when you use `gun.tagged(tag,cb)`.<br>
Using `gun.tagged(tag).once(cb)` or `gun.get('tagname').once(cb)` will NOT leave out untagged nodes.  

### gun.get().proptag('name')
A special kind of tag. With 'proptag' the provided tag wil be set as a direct property on the node. This can be usefull if you want to quickly check if a node 'is' or 'has'  something.
```
 gun.get('Bob').put({name:'Bob'}).proptag('has paid')
 gun.get('Bob').once(cb) // {name:'Bob','has paid':true}
```

A proptag can be untagged like any other tag.
```
  gun.get('Bob').untag('has paid');
  gun.get('Bob').once(cb) // {name:'Bob','has paid':false}
```
### gun.get().switchtag('from','to')
The same as doing `gun.get("Bob").untag('married')` and then `gun.get("Bob").tag('single')`
```
  gun.get('Bob').switchtag('married','single') 
```

### gun.tagged() 
When no arguments are provided you get the full tag list.<br>
`gun.tagged().once(cb)`

####Changed!!!
You can now do `gun.tagged(cb)`
```
 gun.tagged(tags=>{
   // {BOOKS:{'#':'BOOKS/TAGS'}},
   // {MOVIES:{'#':'MOVIES/TAGS'}},
   // {MEMBERS:{'#':'MEMBERS'}}
 })
```

### gun.tagged(tag, cb)
Provide a tagname and a callback to get all valid members of that tag.<br>
The returned nodes are full objects.
```
 gun.tagged('gunDb',list => console.log(list) )

```

```
 gun.tagged('Books/Fantasy',cb) // all fantasy books
```
### Deleting nodes
Ah yes... a returning question in gitter and stackoverflow.<br>
The short answer "You can't...not really", there are solutions like 'nulling' your node...<br>
At least with `gun-tag` you'll have another option.

Let's first create a regular `gun.set()`
```
let members = gun.get('members');

// assume we have an Array with member objects

allmembers.forEach( member => {
  // store the member in Gun
  let m = gun.get( Gun.text.random() ).put(member);
  // tag member
  m.tag( ['MEMBERS','MEMBERS/Paid'])
  // put member in `set`
  members.set( m) ;
});
```
Great, now instead of building a visual list from our set, we build it from our tagged members.
```
gun.tagged('MEMBERS', list => {
  // list -> create nice member list
})
```
Let's create an extra page in our app, one that shows the members that actually paid there contribution.

```
gun.tagged('MEMBERS/Paid',  list => {
  // list -> create list with members that paid
})
```
Oh.. but Bob didn't pay.
```
gun.get('Bob').untag('MEMBERS/Paid');
```
So if we would refresh our list...
>please read the section about subscribing further down.

```
gun.tagged('MEMBERS/Paid', list => {
  // list -> all members that 'paid'...not Bob!
});
```
Once a month ( or so ) we want to kick the members that didn't pay.
So we get our ( tagged ) members again and filter the list.
>We could use our set ( `gun.get('MEMBERS')` ) but using the tagged list give you some advantages...<br>
Nodes returned from `gun.tagged()` are actually tagged and have an extra '_soul' property.


```
gun.tagged('MEMBERS', list => {
  list.forEach(member=>{
    if(member.tags['MEMBERS/Paid] === 0) {
      // and there is Bob...
      gun.get(member._soul).untag('MEMBER');
    }
  })
})
```
Now Bob is no longer a member...<br>

```
gun.tagged('MEMBERS', list => {
  // list -> all members ...no more 'Bob'
})
```
>So there you have it...deleted ? No, but Bob won't show up either.

After a year we want to invite ex-members again.<br>
Luckily we still have our original `set()`
```
gun.get('MEMBERS').loadonce(list=>{
  list.forEach(member=>{
    if(member.tags['MEMBERS'] === 0) {
      // Bob !!!  -> Invite him
    }
  })
})

```
>You'll notice i use `synclist` and `loadonce` in my examples. `synclist` ( includes `loadonce`) is one of my other Gun extensions. You can read more about it [here](https://github.com/Stefdv/gun-synclist)

### intersect or filter

An intersect is a list with nodes that are tagged to ALL provided tags. This is a feature of `gun-tagged()`.<br>

We can achieve this by providing an Array to `gun.tagged()`.<br>
Get all Fantasy books, written by (Stephen) King , published in 1988.
```
 gun.tagged( ['Books/Fantasy','Authors/King','Published/1988'],cb)
```

### Subscribing - a word of advise.
Offcourse it is possible to subscribe to changes on a tag like `gun.get('Books/Lent').synclist(cb)` and you will be notified when the status of those books changes. But then you'll have to subscibe to 'Books/borrowed' also...But what if you borrowed a book from one friend and loan it to another? (despite the fact that it is not a nice thing to do ;p) You'll end up with two subscriptions on the same book.

#### my advise
Store all books in a `set()`, then subscribe to that.
```
let books = gun.get('BOOKS')
myBooks.forEach(book=>{
  books.set(book)
});
books.synclist( data=> {
  if(data.list) { // all books }
  if( data.node) { // your changed ( tagged maybe ? ) book}
})
```
Now you can go wild with tagging/untagging/retagging your books. Every change will trigger the `synclist()` callback.

### Disclaimer
gun-tag is born of necessity, and over time became really powerfull if you fully understand it's potential. That being said... tell me what you want to do and - maybe- i can advise you. I'm not much of an email reader so ping me in [gitter](https://gitter.im/amark/gun) @Stefdv

### Credits
Thanks to Mark Nadal for writing Gun and for helping out whenever i need.
