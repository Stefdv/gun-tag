/**
 * gun-tag
 * @author  S.J.J. de Vries ( Stefdv2@hotmail.com)
 * @gitter @Stefdv
 * @purpose Add tagging capabilities to Gun
 *
 * @version 3.0.0
 * Now up to date for Gun v0.9.x.
 *
 * @dependencies
 * Gun
 * gun-synclist
 */

;(function(){
  console.log("Also thanks for using - or at least trying - gun-tag.")
  if(typeof window !== "undefined"){
    var Gun = window.Gun;
  } else {
    var Gun = require('gun/gun');
  }

  const _scope = "gun-tag/";
  const _scopes = "_scopes";

  const invalid = value => {
    if (!Gun.obj.is(value) || !value._) {
     console.warn('Only nodes can be tagged');
     return true;
   };
 };

  const validateNode = (node,tag) => {
    return Object.keys(node).reduce(function(previous, current) {
          return (node.tags && node.tags[tag] === 1);
      }, {});
  };

  const serialize = (gun,tags,method) => {
    tags = Gun.list.is(tags) ? tags : Array.prototype.slice.call(tags);
    tags.forEach( tag => gun[method](tag) )
  };

  const getScopes = (gun) => {
    return new Promise(resolve => {
      let root = gun.back(-1);
      root.get(_scope + _scopes ).once( sc => {
        delete ((sc = Gun.obj.copy(sc))||{})._;
        resolve(sc)
      })
    })

  };

  const isScope = (gun,tag) => {
    return new Promise(resolve => {
      getScopes(gun)
      .then( sc => {
        resolve(Object.keys(sc).includes(tag))
      })
      .catch(error => {
        console.log(error);
      });
    })
  };

  Gun.chain.tag = function (tag) {
    if(!tag || typeof(tag) === "number") { return this};
    if (Gun.list.is(tag) ) { return serialize(this, tag, 'tag');}

    let gun = this.back(-1);
    let nodeSoul,scopeSoul,newScope,newTag;

    return this.once(function (node) {
      if (invalid(node)) { return this;}
      nodeSoul= Gun.node.soul(node);

      // consider a tag with slash ("Books/Fantasy") a scoped
      // tag
      if(tag.includes('/')) {
        newScope = tag.split('/')[0];
        newTag   = tag.split('/')[1];
        gun.get(_scope+'TAGS').get(newScope).put({'#': newScope+'/TAGS'});
        gun.get(_scope + _scopes).get(newScope).put(1);
        gun.get(newScope+'/TAGS').get(newTag).put({'#':tag});
        gun.get(tag).get(nodeSoul).put({'#':nodeSoul});
      } else {
        gun.get(_scope+'TAGS').get(tag).put({'#':_scope + tag});
        gun.get(_scope+tag).get(nodeSoul).put({'#':nodeSoul});
      };
      this.get('tags').get(tag).put(1);
    })
  };
  /* Gun.chain.path is in the lib folder of Gun,
     but i'm not sure if it's there to stay ;) */
  Gun.chain.path = function(field, opt){
    var back = this, gun = back, tmp;
    if(typeof field === 'string'){
      tmp = field.split(opt || '.');
      if(1 === tmp.length){
        gun = back.get(field);
        return gun;
      }
      field = tmp;
    }
    if(field instanceof Array){
      if(field.length > 1){
        gun = back;
        var i = 0, l = field.length;
        for(i; i < l; i++){
          gun = gun.get(field[i]);
        }
      } else {
        gun = back.get(field[0]);
      }
      return gun;
    }
    if(!field && 0 != field){
      return back;
    }
    gun = back.get(''+field);
    return gun;
  };

  Gun.chain.untag = function (tag) {
    if(!Gun.text.is(tag)) { return this; };
    if (arguments.length !== 1 || Gun.list.is(tag)) {
      return serialize(this, arguments,'untag');
    };
    return this.once(function (node) {
      if (invalid(node)) { return this;}
      node[tag] ? this.get(tag).put(false) : this.get('tags').get(tag).put(0);
    });
  };

  Gun.chain.switchtag = function(from,to) {
    if(!Gun.text.is(from)||!Gun.text.is(to)) { return this; };
    this.untag(from);
    this.tag(to)
  };

  Gun.chain.proptag = function(tag){
    if(!Gun.text.is(tag)) { return this; };
    if (arguments.length > 1 || Gun.list.is(tag) ) {
      return serialize(this, tag,'proptag');
    };
    let gun = this.back(-1);
    return this.once(function (node) {
      if (invalid(node)) { return this;}
      let nodeSoul = Gun.node.soul(node)
      gun.get(_scope+'TAGS').get(tag).put({'#':_scope+tag});
      gun.get(_scope+tag).get(nodeSoul).put( {'#':nodeSoul} );
      this.get(tag).put(true);
    });
  };

 Gun.chain.tagged = function(tag,cb,opt) {
    let gun = this;
    cb = cb || function(){};
    opt=opt || {};

    if(arguments.length === 0) {
      return gun.get(_scope + 'TAGS'); // return all tagnames
    };

    if(!Gun.text.is(tag) &&! Gun.list.is(tag)){
      if(typeof(tag)=='function') {
        let cb = tag
        gun.get(_scope+'TAGS').listonce(data=>{
          delete ((data = Gun.obj.copy(data))||{})._;
          cb.call(gun,data)
        })
      } else {
        console.warn( 'tags must be a String or an Array of Strings!', tag);
        return gun;
      }

    };



    if(Gun.text.is(tag) && arguments.length === 1) {
      if(tag.includes('/') ) { return gun.get(tag); } // tagged as 'books/fantasy'
      return gun.get(_scope + tag);
    };

    if(typeof(tag)=='function') {
      let cb = tag
      gun.get(_scope+'TAGS').listonce(data=>{
        delete ((data = Gun.obj.copy(data))||{})._;
        cb.call(gun.data)
      })
    }

    if(Gun.text.is(tag) && arguments.length > 1) {

      gun.get(_scope + tag ).listonce( data => {
        delete ((data = Gun.obj.copy(data))||{})._;
        data.lookup ={};
        data.list = data.list.reduce((list, node) => {
          if(validateNode(node,tag)){
            data.lookup[node._soul] = list.length;
            list.push(node);
          }
          return list
        },[]);
        cb.call(gun,data)
      })
    }
  };

  Gun.chain.intersect = function(tags,cb) {
    if(!Gun.list.is(tags) || arguments.length==1) {
      console.warn("for intersects you need to provide an Array with - existing - tags AND a callback")
      return this
    }
    let matchTags = tags;
    gun.tagged(matchTags[0],data=>{
      data.list = data.list.reduce(function(result, node) {
        let cnt = 0;
        matchTags.forEach(tag => {
          if(node.tags[tag] && node.tags[tag]===1) {
            cnt++;
            if(cnt == matchTags.length) { result.push(node)}
          };
        });
        return result;
      },[]);
      cb.call(gun,data.list)
    });
  };

}());
