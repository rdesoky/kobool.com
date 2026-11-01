/**
 * Created by rdeso_000 on 1/6/2015.
 */
define(["jquery", "utils", "http","kui","js-promise","inline-edit","dom-utils"],function($, $u, $http, $kui, CPromise, $editor, DU){
	var module;

	function dom2Template(dom){
		return function(record, actions){
			if($.isArray(record)){
				var ret = [];
				$.each(record,function(item){
					ret.push(module.renderTemplate(dom,item,actions));
				});
				return ret;
			}
			return module.renderTemplate(dom, record, actions);
		}
	}
	function checkReviewMarks(txt){
		if(txt) {
			if (txt.substr(0, 3) == "|u|") {
				return "<span tip='help:tips.under_review' class='under_review'>" + (txt.length > 3 ? txt.substr(3) : _S("a.under_review")) + "</span>";
			} else if(txt.substr(0, 3) == "|r|") {
				return "<span tip='help:tips.rejected' class='rejected'>" + (txt.length > 3 ? txt.substr(3) : _S("a.under_review")) + "</span>";
			}
			return txt;
		}
		return "";
	}
	var templates = document.createDocumentFragment();
	var cache = {};
	return module = {
		render:function(info, actions){
			if(!info.data){
				return CPromise.as(null);
			}

			if(info.ordinal && $.isArray(info.data)){// set items ordinal numbers
				for(var i= 0; i<info.data.length; i ++ ){
					info.data[i].ordinal = info.ordinal+i;
				}
			}

			var cache_id;
			if(info.cache){
				cache_id = info.tid + JSON.stringify(info.data) + SSN.id;
				if(cache[cache_id]) {
					var dom = cache[cache_id];
					if (info.$root) {
						info.$root.append(dom);
					}
					return CPromise.as(dom);
				}
			}

			return this.getTemplate(info.tid, info.turl)
				.then(function(template){
					return template(info.data, actions);
				})
				.then(function(dom){
					if(info.$root){
						if(info.clear){
							info.$root.html("");
						}
						if( info.top_puller && $.isArray(info.data) && info.data.length ){
							var $top_puller = $("<div class='top_puller'></div>");
							info.$root.append($kui.topPuller(info.top_puller,info));
						}
						info.$root.append(dom);
						if( info.puller && $.isArray(info.data) && info.data.length ){
							info.$root.append($kui.dataPuller(info.puller,info));
						}
					}
					if(info.cache){
						cache[cache_id] = dom;
					}
					return info.$root || dom;
				})
		},
		loadTemplate: function( sID, url ){
			var template = templates.querySelector(".Templates " + sID);

			if( template ){
				return CPromise.timeout(1).then(function(){return template;});
			}

			if( !url ){
				url = PgLinks["templates"];
			}

			return $http.get( KStrings.addQueryParam( url, "lang", $u.lang() ) )
				.then( function(res){
					var doc = _AD( templates,{"data-turl":url}, res.responseText );
					return doc.querySelector(sID) || _C("div",{},"Template " + sID + " not found");
				} );
		},
		getTemplate:function(sid, url){
			return this.loadTemplate(sid,url).then(dom2Template);
		},
		html2Template:function(html){
			var dom = $.docFragment(html);
			return dom2Template(dom);
		},
		renderTemplate:function(dom, $d, $actions){
			var cloned;
			if(dom.nodeType == 11) {//document fragment
				cloned = dom.cloneNode(true);
				this.processTemplateNode( cloned, $d, $actions );
				return cloned;
			}else{
				var container = _C("div");
				cloned = dom.cloneNode(true);
				_A(container, cloned);
				this.processTemplateNode( container, $d, $actions );
				return container.firstChild;
			}
		},
		processTemplateNode: function( dom, $d, $actions ){
			var ret = dom;
			if(!ret){
				console.error("Processing null template node");
				return dom;
			}

			$("[data-include]",ret).each( function( node ){
				var inc_val = node.getAttribute("data-include");

				node.removeAttribute("data-include");

				module.loadTemplate(inc_val)
					.done(function(tmpl_node){
						var rnd_tmpl_node = module.renderTemplate(tmpl_node, $d, $actions);
						if(node.parentNode){
							if(rnd_tmpl_node) {
								node.parentNode.replaceChild(rnd_tmpl_node, node);
							}else{// included node not found
								node.parentNode.removeChild(node);
							}
						}else if(rnd_tmpl_node){// no parent, insert included nodes
							_A(node, rnd_tmpl_node);
						}
					});
			});

			$("[data-string]",ret).each( function( node ){
				var strID = node.getAttribute("data-string");
				_HS(node, strID);
			});

			$("[data-template]",ret).each( function( node ){
				var tmpl_code = node.getAttribute("data-template");

				node.removeAttribute("data-template");

				var tmpl = eval( "(" + tmpl_code + ")" );

				$.each( tmpl, function( val, key ){
					if ( typeof val == "string") {
						node[key] = checkReviewMarks($d[val]);
					}else{
						node[key] = val || "";
					}
				});
			});

			$("[data-js-attr]", ret).each( function( node ){
				var attr_list = node.getAttribute("data-js-attr").split(",");

				node.removeAttribute("data-js-attr");

				$.each(attr_list, function(attr){
					module.setNodeAttr( node, attr, node[attr].replaceFields($d) );// use observable style for promised values					
				});
			});

			$("[data-exists-if]",ret).each( function( node ){
				var scrpt = node.getAttribute("data-exists-if");

				node.removeAttribute("data-exists-if");

				scrpt.replaceFieldsAsync($d,$actions)
					.done( function(val){
						if( !val || val==="" || val == 0 || !eval( "(" + val +")" ) ){
							$(node).remove();
						}
					});
			});

			$("[data-on-click]", ret).each( function( node ){
				var scrpt = node.getAttribute("data-on-click");

				node.removeAttribute("data-on-click");

				scrpt.replaceFieldsAsync($d)
					.done( function(myscript){
						$(node).click(function(e){
							eval(myscript);
							e.stopPropagation();
						});
					});
			});

			$("[data-show-if]", ret).each( function( node ){
				var scrpt = node.getAttribute("data-show-if");

				node.removeAttribute("data-show-if");

				scrpt.replaceFieldsAsync($d)
					.done( function(val){
						if( !val || !eval( "(" + val +")" ) ){
							$(node).addClass("hidden");
						}
					});
			});

			var dataInit = function(node){
				var fncName = node.getAttribute("data-init");
				if(fncName){
					node.removeAttribute("data-init");
					var fnc = eval(fncName);
					if( typeof fnc == "function" ){
						fnc(node, $d, $actions);
					}
				}
			};

			if(ret.nodeType != 11) {// not a document fragment
				dataInit(ret);// check data-init in the root node
			}
			$.each( ret.querySelectorAll("[data-init]"), dataInit);

			return ret;
		},

		setNodeAttr:function(node, attr, val){
			if ( CPromise.is(val) ) {
				node[attr] = ".";
				return val.then(function(v){
					node[attr] = v;
				});
			}else{
				node[attr] = checkReviewMarks(val);

				return CPromise.as( val );
			}
		}
	};	
});
