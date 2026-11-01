/**
 * Created by rdeso_000 on 1/4/2015.
 */

define(function(root_el){//root_el, q1,q2,qn

	var root = typeof root_el == "string" ? document : root_el;
	var coll = [];

	Enum(arguments,function(item){
		switch( typeof item ){
			case "string":
				var myColl = root.querySelectorAll(item);
				Enum(myColl,function(el){
					coll.push(el);
				});
				break;
		}
	});

	if( arguments.length==1 && typeof root_el != "string"){
		coll.push(root_el);
	}

	return {
		all:coll,
		dom:coll[0],
		click:function(fn){
			return this.every( function(el){
				if( fn ){
					el.addEventListener("click",fn);
				}else{
					setTimeout(el.click.bind(el),10);
				}
			});
		},
		every:function(callback){
			Enum(this.all, callback);
			return this;
		},
		addClass:function(cls){
			return this.every( function(el){
				DU.addClass(el,cls);
			});
			return this;
		},
		setText:function(txt){
			return this.every( function(el){
				el.innerText = txt;
			});
		},
		setHTML:function(html){
			return this.every( function(el){
				el.innerHTML = html;
			});
		},
		bind:function(slist, fn){
			var list = slist.split(" ");
			return this.every( function(el){
				Enum(list, function(sEvent){
					el.addEventListener(sEvent,fn);
				})
			});

		}
	};
});