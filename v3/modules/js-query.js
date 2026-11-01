/**
 * Created by Ramy on 8/27/2014.
 */
(function(){
    var $ = function(q, root){
		if($.is(q)){
			return q;
		}
        root = root || document;

		if($.is(root)){
            root = root.dom() || document;
        }
        var ret = [];

		if(typeof q === "string"){
            var tagMatch = /\<([A-z]+).*\>/;
            var isHTML = tagMatch.exec(q);
            if(isHTML){
				utils.each(utils.parseHTML(q),function(node){
					ret.push(node);
				});
            }else {
                var nodes = root.querySelectorAll(q);
                for(var i=0;i <nodes.length; i++){
                    ret.push(nodes[i]);
                }
            }
        }else{
            $.each(arguments,function(e){
                //TODO: check if Node or Fragment
                if(e!=undefined){
                	ret.push(e);
                }
            });

        }

        return addFn(ret);
    };

    var fn = {
        trigger:function(event_id, options){
            var eventClass = $.eventClass(event_id),
                event = document.createEvent(eventClass);

            event.initEvent(event_id,true,true);

            $.each(options,function(val, attr){
                event[attr] = val;
            });

            this.each(function(el){
                event.target = el;
                el.dispatchEvent(event);
            });
        },
		focus:function(){
			var dom = this.dom();
			if(dom){
				try {
					dom.focus();
				}catch(e){
					console.error("Couldn't set focus");
				}
			}
			return this;
		},
        hasClass:function(className){
        	if(!this.length){
        		return false;
        	}
            var not_found = false, classList=className.trim().split(" ");
            $.each(this,function(el){
                var elClasses =el.className.trim().split(" ");
                $.each(classList, function(cls){
                    if( elClasses.indexOf(cls) == -1 ){
                        not_found = true;
                    }
                });
            });
            return !not_found;
        },
        toggleClass:function(c){
            if(this.hasClass(c)){
                this.removeClass(c);
            }else{
                this.addClass(c);
            }
            return this;
        },
        dom:function(){
            return this[0];
        },
		parent:function(){
			var dom = this.dom();
			return $( dom ? dom.parentNode : null );
		},
        html:function(shtml){
            if(shtml===undefined){
                var ret = "";
                $.each(this,function(el){
                    ret += el.innerHTML;
                });
                return ret;
            }
            $.each(this,function(el){
                el.innerHTML = shtml;
            });
            return this;
        },
        text:function(txt){
            if(txt===undefined){
                var ret = "";
                $.each(this,function(el){
                    ret += (el.tagName.toLowerCase() == "input") ? el.value : (el.innerText || el.innerHTML);
                });
                return ret;
            }else if(typeof txt !== "string"){
				txt = JSON.stringify(txt);
			}
            $.each(this,function(el){
                switch(el.tagName.toLowerCase()){
                    case "input":
                        el.value = txt;
                        break;
                    default:
                        el.innerHTML = txt;
                }
            });
            return this;
        },
        ready:function(cb){
            $.each(this,function(el){
                if(el == document){
                    if(document.readyState === "complete"){
                        setTimeout(cb,1);
                        return this;
                    }else{
                        $(window).ready(cb);
                    }
                }else{
                    $(el).listen("load",cb);
                }
            });
            return this;
        },
        listen:function(id, cb){
            $.each(this,function(el){
                if(el.addEventListener){
                    el.addEventListener(id, cb)
                }else{
                    el["on" + id] = function(evt){
                        cb(evt || $.copyExtended(window.event,{
                            target:window.event.srcElement,
                            stopPropagation:function(){
                                window.event.cancelBubble=true;
                            }
                        }));
                    }
                }
            });
            return this;
        },
		unbind:function(event_id, cb){
			$.each(this,function(el) {
				if(el.removeEventListener){
					el.removeEventListener(event_id, cb);
				}
			});
			return this;
		},
        on:function(id, cb){
            return this.listen(id,cb);
        },
        bind:function(id,cb){
			var evtList = id.split(" "), self = this;
			$.each(evtList, function(evt){
				self.listen(evt,cb);
			});
			return this;
        },
        click:function(cb){
            if(cb===undefined){
                $.each(this,function(el){
                    if(el.click){
                        el.click();
                    }
                    else {
                        try {
                            el.dispatchEvent(new Event("click"));
                        }catch(e){
                            if(el.onclick){
                                el.onclick();
                            }
                        }
                    }
                });
                return this;
            }
            return this.listen("click", cb);
        },
        show:function(){
            return this.css("display","");
        },
        hide:function(){
            return this.css("display","none");
        },
        css:function(s,val){
            $.each(this,function(el){
                if($.isString(s)) {
                    el.style[s] = val || "";
                }else{
                    for(var k in s){
                        el.style[k] = s[k];
                    }
                }
            });
            return this;
        },
		append:function(e){
			var self = this;
			if($.is(e) && this.dom()){
				e.each(function(el){
					self.dom().appendChild(el);
				});
			}else if($.isArray(e) && this.dom()){
				$.each(e,function(el){
					self.append(el);
				});
			}else if(typeof e === "string"){
				$.each(this,function(el){
					el.appendChild(utils.docFragment(e));
				});
            }else if(this.dom()){// appending single DOM element
				this.dom().appendChild(e);
			}
			return this;
		},
		appendTo:function(q, root){
			var $cnt = $(q,root);
			$cnt.appendChild(this);
			return this;
		},
        prepend:function(e){//TODO: implement prepending HTML
            if($.is(e)){
                e = e.dom();
            }
            $.each(this,function(el){
                el.insertBefore(e, el.firstChild);
            });
            return this;
        },
        attr:function(n,val){
            var ret = (val===undefined) ? [] : null;
            $.each(this,function(el){
                if(val==="" || val===null){
                    el.removeAttribute(n);
                }
                else if(ret){
                    ret.push(el.getAttribute(n));
                }
                else {
                    el.setAttribute(n, val);
                }
            });
            if( ret && ret.length == 1 /*&& ret[0]*/ ){
                return ret[0];
            }
            return ret || this;
        },
        removeAttr:function(n){
            return this.attr(n, null);
        },
        addClass:function(c){
            $.each(this,function(el){
                el.className = el.className.trim().length ? $.addArrayItem( el.className.trim().split(" "), c).join(" ") : c;
            });
            return this;
        },
        removeClass:function(c){
            if(typeof c !== "string"){
                return this;
            }
            var delist = c.trim().split(" ");
            $.each(this,function(el){
                if(!el.className.trim().length){
                    return;
                }
                var list = el.className.trim().split(" ");
                $.each(delist,function(dc){
                    var found = list.indexOf(dc);
                    if(found!=-1){
                        list.splice(found,1);
                        el.className = list.join(" ");
                    }
                });
            });
            return this;
        },
		remove:function(){
            $.each(this,function(el){
				if(el.parentNode){
					el.parentNode.removeChild(el);
				}
			});
			return this;
		},
        each:function(cb){
            $.each(this, cb);
            return this;
        },
		offset:function( root ){
			if(this.dom() && this.dom() !== window ){
				var rect = this.dom().getBoundingClientRect();
				if(root){
					var rootRect = $(root).offset();
					rect.top -= rootRect.top;
					rect.left -= rootRect.left;
				}
				return rect;
			}
			// return window client rect
			return {top:0,left:0, height:window.innerHeight, width:window.innerWidth};
		},
		inViewPort:function( root ){// check that first element is shown in view port

			if(!this.dom() || !$(document.body).contains(this)){
				return false;
			}

			var rect = this.offset( root );
			var rootRect = $(root).offset();

			// true if intersects with root rect
			if( rect.height && (rect.top > rootRect.top) && ( rect.top < rootRect.top + rootRect.height ) ){
				return true;
			}

		},
		insertBefore:function(target){
			var $parent = $(target).parent();

			if($parent.dom()){
				$parent.dom().insertBefore(this.dom(),$(target).dom());
			}

			return this;
		},
		addBefore:function(newItem){
			var $parent = this.parent();

			if($parent.dom()){
				$parent.dom().insertBefore($(newItem).dom(), this.dom());
			}

			return this;
		},
		addAfter:function(newItem){
			var $parent = this.parent();

			if($parent.dom()){
				$parent.dom().insertBefore($(newItem).dom(),this.dom().nextSibling);
			}

			return this;
		},
		contains:function(child){
			if($.is(child)){
				child = child.dom();
			}
			var found = false;
			for(var i=0;i<this.length;i++){
				if(utils.contains(this[i],child)){
					return true;
				}
			}
			return found;
		}
    };
    var utils = {
		isNodeList:function(obj){
			try{
				return (obj.constructor == NodeList) || ( obj.length && obj.item(0) );
			}catch(e){
			}
			return false;
		},
        eventClass:function(event_type){
            switch(event_type){
                case "afterprint"||"beforeprint"||"bounce"||"change"||"DOMContentLoaded"||"finish"||"haschange"||"input"||"offline"||"online"||"onpage"||"orientationchange"||"readystatechange"||"reset"||"start"||"submit":
                    return "Event";
                case "drag"||"dragend"||"dragenter"||"dragleave"||"dragover"||"dragstart":
                    return "DragEvent";
                case "message":
                    return "MessageEvent";
                case "mousewheel":
                    return "MouseWheelEvent";
                case "touchcancel"||"touchend"||"touchmove"||"touchstart":
                    return "TouchEvent";
                case "transitionstart"||"transitionend":
                    return "TransitionEvent";
                case "click"||"dblclick"||"mouseup"||"mousedown"||"mousemove"||"mouseover"||"mouseenter"||"mouseleave"||"mouseout"||"contextmenu":
                    return "MouseEvent";
                case "scroll"||"abort"||"activate"||"beforeactivate"||"beforedeactivate"||"deactivate"||"error"||"load"||"resize"||"select"||"unload":
                    return "UIEvent";
                case "blur"||"focus"||"focusin"||"focusout":
                    return "FocusEvent";
                case "keydown"||"keyup"||"keypress":
                    return "KeyboardEvent";
            }
            return "Event";
        },
		empty:function(){
			return $();
		},
		contains:function(parent, child){
			var p = child.parentElement;
			while(p){
				if(p==parent){
					return true;
				}
				p = p.parentElement;
			}
			return false;
		},
        parseHTML:function(html){
			var ret = [], fr = this.docFragment(html);
			this.each(fr.childNodes,function(el){
				ret.push(el);
			});
			return ret;
        },

		docFragment:function(html){
			var d = document.createElement("div"),
				ret = document.createDocumentFragment(),
				nodeList = [];

			d.innerHTML = html;
			this.each(d.childNodes, function(node){
				nodeList.push(node);
			});
			this.each(nodeList, function(node){
				ret.appendChild(node);
			});

			return ret;
		},
        isString:function(o){
            return typeof o == "string";
        },
        isArray:function(o){
            return (o && o.constructor === Array);
        },
        addArrayItem:function(arr,item){
            if(arr.indexOf(item)==-1){
                arr.push(item)
            }
            return arr;
        },
        each:function(obj,cb){
            if( typeof obj === "undefined"){
                return true;
            }
            var i,k;
            var coll = {};
            if(utils.isArray(obj) || obj.constructor === HTMLCollection){
                for(i= 0,n=obj.length;i<n;i++){
                    coll[i] = obj[i];
                }
            }else if( this.isNodeList(obj) ) {
                for(i= 0, n=obj.length;i<n;i++){
                    coll[i] = obj.item(i);
                }
            }else{
                for(k in obj){
                    if((obj.hasOwnProperty === undefined) || obj.hasOwnProperty(k)) {
                        coll[k] = obj[k];
                    }
                }
            }
            for(k in coll) {
                if( cb(coll[k], k, obj) === false ){
                    return false;// interrupted loop
                }
            }
            return true;
        },
        copyExtended:function(obj,extend){
            var ret={};
            for(var k in obj){
                ret[k] = obj[k];
	}
	for(var k in extend){
		ret[k] = extend[k];
	}
	return ret;
},
        is:function(o){
            return (o instanceof Array) && o.dom === fn.dom;
        },
        clone:function(o,extend,remove){
            var ret = JSON.parse(JSON.stringify(o));
            if(extend!==undefined){
                for(var k in extend){
                    if((extend.hasOwnProperty === undefined) || extend.hasOwnProperty(k)){
                        ret[k] = extend[k];
                    }
                }
            }
            if(remove){
                for(var k in extend){
                    if(extend.hasOwnProperty(k)){
                        ret[k] = extend[k];
                    }
                }
            }
            return ret;
        }
    };
    var addFn = function(el){
        for(var f in fn){
            el[f] = fn[f];
        }
        return el;
    };

    for(var f in utils){
        $[f] = utils[f];
    }

    if(typeof define === "function" && define.amd){
        define(function(){
            return $;
        });
    }else{
        window.$ = $;
    }

})();