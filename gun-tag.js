/**
 * gun-tag
 * @author  S.J.J. de Vries ( Stefdv2@hotmail.com)
 * @gitter @Stefdv
 * @purpose Add tagging capabilities to Gun
 * 
 * @version 2.0.0
 * Now up to date for Gun v0.9.x.
 * 
 * @dependencies
 * Gun
 * gun-synclist
 */
;(function(){
  if(typeof window !== "undefined"){
    var Gun = window.Gun;
  } else {
    var Gun = require('gun/gun');
  }
  Gun.chain.synclist || require('gun-synclist/gun-synclist');

  const _scopes = '__scopes';
  let _scope = 'gun-tag/';

  const invalid = value => {
     if (!Gun.obj.is(value) || !value._) {
      console.warn('Only nodes can be tagged');
      return true;
    };
  };

  const serialize = (gun,tags,method) => {
    tags = Gun.list.is(tags) ? tags : Array.prototype.slice.call(tags);
    tags.forEach( tag => gun[method](tag) )
  };

  const isScope = (gun,tag) => {
    return new Promise(resolve => {
      gun.getScopes().then( sc => { 
        resolve(Object.keys(sc).includes(tag))
      })
    })
  };
 
  const validateNode = (node,tag) => {
    return Object.keys(node).reduce(function(previous, current) {
          return (node.tags && node.tags[tag] === 1);
      }, {});
  };

  const getScope = () => {
    return _scope.split('/')[0]
  };

  const getScopes = (gun) => {
    return new Promise(resolve => {
      let root = gun.back(-1);
      root.get( getScope() + '/__scopes' ).once( sc => { 
        delete ((sc = Gun.obj.copy(sc))||{})._;
        resolve(sc)
      })
    })
  };

  Gun.chain.tag = function (tag) {
    if(!tag) { return this};
    let gun = this.back(-1);
    let nodeSoul,scopeSoul,newScope,newTag;
    if (Gun.list.is(tag) ) { return serialize(this, tag, 'tag');}

    return this.once(function (node) { 
      if (invalid(node)) { return this;}
      nodeSoul= Gun.node.soul(node);

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
    });
  };

  Gun.chain.untag = function (tag) {
    if(!Gun.text.is(tag)) { return this; };
    if (arguments.length !== 1 || Gun.list.is(tag)) {
      return serialize(this, arguments,'untag');
    };
    return this.once(function (node) {
      if (invalid(node)) {  return this; };
      node[tag] ? this.get(tag).put(false) : this.get('tags').get(tag).put(0);
    });
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

  Gun.chain.tagged = function(tag,cb) {
    let gun = this;
    cb = cb || function(){};

    if(arguments.length === 0) { return gun.get(_scope + 'TAGS'); };

    if(Gun.text.is(tag) && arguments.length === 1) {
      if(tag.includes('/') ) { return gun.get(tag); }
      if(isScope(gun,tag) ) { return gun.get(tag + '/TAGS'); }
      return gun.get(_scope + tag); 
    };

    if(Gun.list.is(tag) && arguments.length === 1) {
      console.warn(
        `Intersect can only be applied with a callbackb.\nPlease try...\n"gun.tagged(${Gun.text.ify(tag)}, cb)"
        `);
      return gun;
    };

    if(Gun.list.is(tag) && arguments.length > 1) {
      let matchTags = tag;
      gun.tagged(matchTags[0],list=>{
        list = list.reduce(function(result, node) {
          let count = 0;
          matchTags.forEach(_tag => {
            if(node.tags[_tag] && node.tags[_tag] === 1) {
              count++;
              if(count == matchTags.length) { result.push(node) }
            };
          }); 
          return result;
        }, []);
        cb.call(gun,list)
      });
    };

    if(!Gun.text.is(tag) && !Gun.list.is(tag)) { 
      console.warn( 'tag needs to be a String or an Array!'); 
      return gun;
    };

    if(tag.includes('/TAGS')) {
      gun.get(tag).once( data => {
        cb.call(gun,data)
      })
    } 
    else if(tag.includes('/') ) {
      gun.get(tag).listonce(data => {
        data.list = data.list.reduce(function(result, node) {
          if(validateNode(node,tag)){ result.push(node);}
          return result;
        }, []);
        cb.call(gun,data.list);
      })
    }
    else { 
      isScope(gun,tag).then( _isScope => {
        if(_isScope) { 
          gun.get(tag + '/TAGS').once(data => {
            delete ((data = Gun.obj.copy(data))||{})._;
              cb.call(gun,data)
          })
        } else {
          gun.get(_scope + tag ).listonce( data => {
            data.list = data.list.reduce(function(result, node) {
              if(validateNode(node,tag)){ result.push(node);}
              return result;
            }, []);
            cb.call(gun,data.list)
          });
        };
      });
    }
  };
}());