/**
 * gun-tag
 * @author  S.J.J. de Vries ( Stefdv2@hotmail.com)
 * @gitter @Stefdv
 * @purpose Add tagging capabilities to Gun
 *
 */
;(function(){
  if(typeof window !== "undefined"){
    var Gun = window.Gun;
  } else {
    var Gun = require('gun/gun');
  }
  var _scope = 'gun-tag/';
  var _scopes = '__scopes';

  // check if it's a valid node
  function invalid(value) {
    if (typeof value !== 'object' || !value._) {
      console.warn('Only nodes can be tagged');
      return true;
    }
  };
/*
 * When we receive an Array we will pass each entry one by one to the required method
 * gun  gun context
 * tags either an Array or a CSV
 * cb   method name of the function to return to
 */

function serialize(gun,tags,method) {
  tags = Array.isArray(tags) ? tags : Array.prototype.slice.call(tags);
  tags.forEach(function (tag) {
    gun[method](tag);
  });
};

/*
 * Check if soul exists
 * eg 'BOOKS/TAGS' or 'guntagger/PERSONS' or 'MOVIES/Sci-Fi'
 * returns a Promise
 */
function _checkPathExists(gun,targetSoul) {
  return new Promise( function(resolve,reject) {
    gun.back(-1).get(targetSoul)
      .val(function(list){
        list ? resolve(list) : reject(Error(list));
      })
  })
};

/*
 * get the main scope ( 'guntagger')
 */
Gun.chain.getScope = () => {
  return _scope.split('/')[0]
};

/*
 * change the main scope
 */
Gun.chain.setScope = newScope =>{
   console.info('%cThe default scope is "%s", if you change it, you will have to do that everytime your app starts!',"color:blue;",_scope);
   _scope = newScope+'/';
 }

/*
 * get the current scopes for easy reference
 * returns a Promise
 * gun.getScopes().then()
 */
Gun.chain.getScopes = function() {
 return new Promise(resolve=>{
    var r_gun = this.back(-1);
    r_gun.get(r_gun.getScope()+'/__scopes').val(sc=>{
      resolve(sc)
    })
  })
 };

/*
 * --------------- tag -------------------
 * The most basic form of tagging
 * `gun.tag('TAG1')` OR `gun.tag(['TAG1','TAG2'])`
 *
 * Scoped tag
 * gun.get('IT').tag('BOOKS/Fantasy') OR  gun.get('IT').tag(['BOOKS/Fantasy','BOOKS/Horror'])
 *
 */
Gun.chain.tag = function (tag) {
  if(!tag) { return this;};
  var g_root = this.back(-1);
  var nodeSoul,scopeSoul,newScope,newTag;
  if (Array.isArray(tag) ) { return serialize(this, tag, 'tag');}

  // if we got here we have a single 'string'
  return this.val(function (node) {
    if (invalid(node)) { return this;}
    nodeSoul= node._['#'];

    if(tag.includes('/')) {
      // eg gun.get('IT').tag('BOOKS/FANTASY')
      scopeSoul  = tag;
      newScope = scopeSoul.split('/')[0];
      newTag   = scopeSoul.split('/')[1];

      /*
       * We want gun.tagged().val(cb) to give us all exisiting tags
       * gun.get('guntagger/TAGS').get('BOOKS').get('#').put('BOOKS/TAGS')
      */

      g_root.get(_scope+'TAGS').get(newScope).put({'#': newScope+'/TAGS'});
      // register scope
      // 'gun-ui/__scopes'
      g_root.get(_scope+_scopes).get(newScope).put(1);

      /*
       * we want gun.tagged('BOOKS/TAGS') and get 'HORROR' and 'FANTASY'
       * gun.get('BOOKS/TAGS').get('FANTASY').get('#').put('BOOKS/FANTASY')
      */
      g_root.get(newScope+'/TAGS').get(newTag).put({'#':scopeSoul});

      /*
       * We want gun.tagged('BOOKS/FANTASY') and get all 'FANTASY' books
       * gun.get('BOOKS/FANTASY').get('IT').get('#').put('IT')
      */
      g_root.get(scopeSoul).get(nodeSoul).put({'#':nodeSoul});

    } else {
      g_root.get(_scope+'TAGS').get(tag).put({'#':_scope+tag});

      // register this node to the tag -> 'guntagger/books'
      g_root.get(_scope+tag).get(nodeSoul).put({'#':nodeSoul});
    };
    /*
    * finally add the tag to the nodes own 'tag' property
    * This will enable tag/untag by switching 0/1
    */
    this.get('tags').get(tag).put(1);
  });
};


/*
 * --------------- proptag -------------------
 * Instead of setting the tag on the node as a ref,
 * the tag will become a direct property on the node.
 *
 * Why?
 * It speeds-up comparing when you want to know if a node is tagged to something
 * Instead of retrieving the tags from Gun to check if the node belongs to a certain tag
 * you can see it on the node directly.
 * {name:'Stefdv', developer:1 ,...}
 *
 * Usage:
 * gun.get('Stefdv').proptag('Developers')`
 * gun.get('Stefdv').proptag(['Developers','lovesGun'])`
 *
 * You can still tag/untag like with a normal tag.
 */


Gun.chain.proptag = function(tag){
  if(!tag) { return this;}
  if (arguments.length > 1 || Array.isArray(tag)) {
    return serialize(this, tag,'proptag');
  };
  var g_root = this.back(-1);

  //if we got here we have a single 'string'
  return this.val(function (node) {
    if (invalid(node)) { return this;}
    else {
      //gun.get('guntagger/TAGS').get('Developers').put({'#':'guntagger/Developers'})
      g_root.get(_scope+'TAGS').get(tag).put({'#':_scope+tag});

      //gun.get('guntagger/Developers').get('Stefdv').put({'#':'Stefdv'})
      g_root.get(_scope+tag).get(node._['#']).put({'#':node._['#']});

      //gun.get('developer').put(1);
      this.get(tag).put(true);
    }
  });
};
/* --------------- untag -------------------
 *  gun.untag('TAG1','TAG2') -> serialize()
 *  gun.untag(['TAG1','TAG2']) -> serializeArray()
 * --------------- untag -------------------
 * There is only one 'untag' !
 *
 * from normal tag
 *   gun.get('Stefdv').untag('Human')
 *
 * from scopetag
 *    gun.get('IT').untag(['BOOKS/Fantasy','MOVIES/Fantasy']);
 *
 * from proptag
 *   gun.get('Stefdv').untag('Developers');
 *
 */
Gun.chain.untag = function (tag) {
  if (arguments.length !== 1 || Array.isArray(tag)) {
    return serialize(this, arguments,'untag');
  };
  return this.val(function (node) {
    if (invalid(node)) {  return this; };

    if(node[tag]){// proptag
      this.get(tag).put(false);
    } else{
      this.get('tags').get(tag).put(0);
    }

  });
};

/*
 * --------------- tagged -------------------
 *  gun.tagged().val(cb) -> get all tags
 *  gun.tagged('TAG1',eachCb,endCb)          ->  get all - valid nodes from 'TAG1' including
 *                                               property 'taglist' that hos the actual tags
 *  gun.tagged('books/fantasy',eachCb,endCb) -> get all fantasy books
 *
 *  gun.tagged('TAG').val(cb)  just gives you a list with souls
*/

  ;(function(){
    /*
     * tagged should just do that...give me the tags.
     * so scoped tags are just 'Books/Fantasy', 'Movies/Comedy'
     */
    Gun.chain.tagged = function(tag,eachCb,endCb) {
         // gun.tagged().val(cb)
          if(arguments.length === 0) { return this.get(_scope + 'TAGS');};

          // gun.tagged(eachCb,endCb)  OR gun.tagged({},eachCb,endCb)
          if(!tag || typeof tag !== 'string') { return this; };

          // gun.tagged('developers').val(cb)
          if(arguments.length ===1) {
            if(typeof tag == 'string'){
               if(tag.includes('/')) {  return this.back(-1).get(tag); }
               else { return this.back(-1).get(_scope+tag); };
            } else {return this;}
          };

          // gun.tagged('books/fantasy',eachCb,endCb)
          if(arguments.length > 1){
            var gun = this;
            var __scope = null;
            var __tag=null;
            var __scoped = false;
            var each = typeof arguments[1] == 'function' ? arguments[1] : function(node){};
            var end =  typeof arguments[2] == 'function' ? arguments[2] : false;

           // eg. gun.tagged('developers',eachCb,endCb)

              if(!tag.includes('/')){
               __scoped=false;
               __scope=null;
               __tag=null;

               tagMapEnd(gun.get(_scope+tag), each,end,tag); //'guntagger/Persons'
              };
              // scoped eg gun.tagged('BOOKS/fantasy',eachCb,endCb)
              if(tag.includes('/')){
                if( tag.split('/')[1]=='TAGS'){ this.tagged(tag).val(each) }
                else { tagMapEnd(gun.get(tag), each,end,tag); }
              }
          }
      };



    /*
     * Helper
     * Almost the same as 'valMapEnd' but this will add the
     * actual tags to the returned nodes as 'taglist'.
     */

    function tagMapEnd(gun, cb, end,tag) {
      var n = function () {},
      count = 0,
      souls = [],
      orgSoul = gun._.soul,
      cb = cb || n,
      end = end || n;

      gun.val(function (list) {
        var args = Array.prototype.slice.call(arguments);
        if(!list){ end.apply(this, args);}

        Gun.node.is(list, function (n, soul) {
          count += 1;
          souls.push(soul);
        });

        souls.forEach( soul => {
          gun.back(-1).get(soul).val(function(tagmember,key){
            if(tagmember){
              tagmember = Gun.obj.copy(tagmember); // due to 'leak' bug https://github.com/amark/gun/issues/322
              let g_tm = this;
              let a_tags = [];
              g_tm.get('tags').val( tags => {
                if(tag && tagmember[tag]){ //proptag
                  a_tags.push(tag);
                }
                // only get valid tags
                if(typeof tags =='object') {
                  Object.keys(tags).forEach(tag => { if(tags[tag] == 1){ a_tags.push(tag) } });
                } else { console.warn ('"%s" is not tagged ',key)};
                tagmember.taglist = a_tags;
                returnCb(g_tm,arguments,key)
              });
            }
            });
          });
          function returnCb(g_tm,args,soul){
            count -= 1;
            // orgSoul will be scope/tag or 'guntagger/tag'
            if(args[0].taglist.includes(orgSoul) || args[0].taglist.includes(orgSoul.split('/')[1]) ||  args[0][orgSoul]==true || arguments[0][orgSoul.split('/')[1]]==true ){
              cb.apply(g_tm, args);
            };
            if (!count) {
              end(souls, args);
            };
          };

      });
      return gun;
    };
  }());

  /*
   * -------  intersect -----------------
   * get all nodes that share exactly the same tags
   *   gun.íntersect(['programmer','photographer'],eachCb,endCb)
   *
   * Intersect should load all nodes that are tagged to all provided tags.
   * So we only need to process one of the provided tags and check each node's taglist
   * to see if it also has the other(s) ;p
   *
   * TODO: what to return if one of the provided tags does not exists ??
   *   gun.intersect(['NoneExistingTag','existingTag'],eachCb,endCb)
   */

  Gun.chain.intersect=function(tags,eachCb,endCb){
    var gun = this;
    if(!Array.isArray(tags)){
      console.warn('intersect needs an array with at least two existing tags');
      return this;
    }

    if(arguments.length > 1){
      var gun = this;
      var count = 0;
      var each = typeof arguments[1] == 'function' ? arguments[1] : function(node){};
      var end =  typeof arguments[2] == 'function' ? arguments[2] : false;
      // we only have to look at one tag because the node has to have them all anyway
      gun.tagged(tags[0],function(node){
        if(!node){
          console.warn('"%s" is a non-exisitng tag!',tags[0])
        }
        count=0;
        for (var t in tags) {
          if(node && node.taglist && node.taglist.includes(tags[t])){
            count++;
            if(count == tags.length){break;}
          }
        }
        if(count == tags.length){
          each(node)
        }

      })
    }
  };

  /*
   * ----------- tagfilter -----------------
   *   gun.tagfilter('BOOKS',"title,author",'IT',cb)  -> will only return nodes that has 'it' in title or author
   *
   *  @tag      {String}  The tag/collection you want to filter on  eg. 'Books'
   *  @filterBy {String}  A comma seperated string with the properties you want to filter on
   *  @query    {String}  A string with the value your looking for
   *  @cb       {function} callback
   * NOTE: tagfilter returns every node that has the query in it, so 'IT' will return
   * 'IT', but  also 'digit'
   */
  Gun.chain.tagfilter=function(tag,filterBy,query,cb){
  if(filterBy){
    var gun = this;
    var nodes = []
    var filters = filterBy.split(',');
    var unique = {}
    var wildcard = "*"

    function fn_filter(node,tags){

      if(query==wildcard){
        nodes.push(node)
      } else {
        filters.forEach(function(fby){

          // make sure we have no doubles !
          // if(node.title && node.title.includes(['it','king']))
          if(node[fby] && node[fby].toLowerCase().includes([query.toLowerCase()]) ){
            if(!unique[node._['#']]){
              nodes.push(node);
              unique[node._['#']] = true;
            };
          };
        });
      };
    };
    function fn_end(){
      cb(nodes)
    };
      gun.tagged(tag,fn_filter,fn_end)
    };
  };

}());
