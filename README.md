# gun-tag

### Intro

GUN Tag is a plugin for Gun(^0.8.x) using `Gun.chain`. 

If you need to organize your data with tags/labels this might be useful. gun-tag enables you to tag and untag nodes to custom tags/labels.

It will give you the following;
* tag nodes 
* untag nodes
* scopetag nodes
* proptag nodes
* find intersects (multiple tags)
* filter nodes

[What you could do with gu-tag](./Polymer_Gun_electron-starter-Google-Chrome-7-7-2017-21_28_32.gif)

### Setup

##### Prerequisites
You need Gun ^0.7.x
```
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

##API
Six methods are exposed for your gun instance;
* `.tag`
* `.proptag`
* `.untag`
* `.tagged`
* `.intersect`
* `.tagfilter`

## gun.get('stefdv').tag('programmer')
You can pass .tag multiple names to index a node under. When called, it will try to read out your current context, index it under each tag, and then place each tag under a master list of every tag ever used. 
@tag can be ~~a list ('one','two/','three',...)~~ an Array (['one','Numbers/two','three']) or a single String ('one')

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
The same as `'tag` but when you put a '/' in your tagname the tag will be 'scoped'. 
##### Say what?
Suppose you want to tag your Books and Movies. And you want to categorize them in themes also ( 'Fantasy','Comedy',etc), oh and tag them to the author.
```
  gun.get('IT')
    .put({title:'IT',discription:'Some scary stuff about a clown'})
    .tag(['Books/Horror','Books/Fantasy',Movies/Horror','Movies/'Fantasy'Authors/King','Fantasy/Book','Horror/Movie']);

```

Now there are several options to retrieve your data...
First of all we can get a list of our 'Book' themes
```
    gun.tagged('Books/TAGS',cb)  
    // gives you {Fantasy:{'#':'Books/Fantasy'},Horror:{'#':'Books/Horror'}}
    <!-- basicly the same as -->
    gun.get('Books/TAGS').val(Gun.log)

```

To get all Fantasy books

```
 gun.tagged('Books/Fantasy',cb)  
 // will return all - full - nodes that are tagged to 'Books/Fantasy'
 // The nodes will also include a 'taglist' prop {Books/Fantasy:1,Books/Horror:1}
```

#### Usefull ?
Well yeah... You could create a selector 'Choose Book theme' and let the user select a theme. Upon selection you present all books belonging to that theme. 

### gun.get().untag('Name')
The same 'rules' as tagging but now the nodes get 'untagged'.
> nodes that are untagged will only be filtered out when you use `gun.tagged()`
> Using the normal Gun API `gun.get('tagname') will NOT leave out untagged 
> nodes.  

### gun.get().proptag('name')
A special kind of tag. With 'proptag' the provided tag wil be set as a direct property on the node. This can be usefull if you want to quickly check if a node 'is' or 'has'  something.
```
 gun.get('Stefdv').put({name:'Stefdv'}).proptag('likesGun')
 gun.get('Stefdv').val(cb) // {name:Stefdv,likesGun:true}
```

A proptag can be untagged like any other tag.
```
  gun.get('Stefdv').untag('likesGun'); 
```

### gun.tagged()
When no arguments are provided you get the full tag list
```
gun.tagged().val(cb)
```

### gun.tagged(,cb)
Provide a tagname and a callback to get all valid members of that tag. The callback. The returned nodes are full objects including an extra property 'taglist' that will hold all the tags this node is (still) tagged to.
```
 gun.tagged('gunDb',tagmember => console.log(tagmember) )

 gun.tagged('Books/TAGS',list=>console.log(list)
```

> Please note that with 'scopedtags' like gun.tag('Books/Fantasy') you can get a list of all subtags under that scope with scope +'/TAGS' ( tags is uppercase)

```
 gun.tagged('Books/Fantasy',cb) // all fantasy books
```

### gun.intersect([tag1,tag2,...],cb)
An intersect is a list with nodes that are tagged to ALL provided tags
get all Fantasy books, written by (Stephen) King , published in 1988
```
 gun.intersect(['Books/Fantasy',Authors/King,Published:1988],cb)
```

### Credits
Thanks to Mark Nadal for writing Gun and for helping out whenever i need.
