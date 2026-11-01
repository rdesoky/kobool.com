/**
 * Created by rdeso_000 on 1/4/2015.
 */
define(["jquery", "http", "utils", "dom-utils","kevents"],function($, $http, $u, $du, $kevt){

	var pgNav,
		currPage= $u.getPageID(),
		currCParams = $u.getCParams();

	function chkPage(){
		var activePage = $u.getPageID();
		var activeCParams = $u.getCParams();
		if(currCParams!=activeCParams || currPage!=activePage){
			if($("body .popup").dom()){
				require(["popup"],function(popup){
					popup.closeAll();
				});
			}
		}
		if( currPage != activePage ){
			var old = currPage;
			currPage = activePage;
			currCParams = activeCParams;
			onPgChange();
			unloadPage(old);
			$kevt.fire("chgPage",{pg:activePage,opg:old});
			return;
		}

		if( activeCParams != currCParams ){
			currCParams = activeCParams;
			pgNav.onCParamChange();
			$kevt.fire("chgPage",{pg:activePage});
		}
	}

	function onPgChange(){
		_CL("TipAnchor");
		var pageID = $u.getPageID();
		pgNav.downloadPage(
			pageID,
			"Contents",
			function(){
				//DU.removeClass("Contents", "progress_bg");
			}
		);
		//$("#Menu").removeClass("show_menu slide-in");
	}

	function unloadPage(pageID){
		require([pageID],function(pgModule){
			(pgModule.ondestroy && pgModule.ondestroy());
		},function(err){
			// no script for this page
		});
	}

	return pgNav = {
		createLink:function(p){
			var att = $u.clone(p.att);
			att["class"] = att["class"]?att["class"]+" href" : "href";
			var el = _C( (p.tg||"span"), att );
			_HS(el,p.t);
			el.onclick=function(){
				pgNav.open(p.pg, p.p, p.dp, p.replace);
			};
			return el;
		},
		init:function(){
			currPage=$u.getSParam("pg","home");
			setTimeout(function(){
				setInterval(chkPage,200);
			},2000);

			$kevt.listen("chgPage",function(info){
				$http.post({
					scr:$http.api.stats,
					silent:true,
					data:{x:1},
					onload:function(res){
						eval(res);
					}
				});
				
				ga('send', 'pageview', info.pg);

			},this);
		},
		nav2SParam:function( name, value ){
			var squery = window.location.href.split("#")[0];
			squery = $u.setParam(name, value, squery, true);
			window.location.href = squery + "#" + ( window.location.href.split("#")[1] || "" );
		},

		nav2CParam:function( name, value ){
			var cquery = "#" + ( window.location.href.split("#")[1] || "" );
			cquery = $u.setParam(name, value, cquery);
			window.location.href = cquery;
		},
		refresh:function(){
			this.onCParamChange(true);
		},
		reload:function(){
			onPgChange();

			var pageID = $u.getPageID();

			//require(["kevents"],function(evt){
			$kevt.fire("chgPage",{pg:pageID,opg:pageID});
			//});

		},
		onCParamChange:function(bRefresh){
			_CL("TipAnchor");
			var pageID = $u.getPageID();
			require([pageID],function(pgModule){
				(pgModule.onchange  && pgModule.onchange(bRefresh))
			});
			//$("#Menu").removeClass("show_menu");
		},
		downloadPage:function( pageID, container, onLoad ){
			currPage = pageID;

			var pgTitle= _S("a.pg_title." + pageID);

			$("#PageActions").html(pgTitle);
			
			document.title = _S("a.kobool") + " - " + pgTitle;

			var root = _CL(container);//_A( _CL(container), "div" );
			_CL("PgHeader");
			root.className = pageID + "_pg progress_bg";

			var pageURL = PgLinks[pageID];

			// Pages without a module (help, templates, chat, ...) still have a
			// static fragment, so fall back to an empty module instead of
			// aborting the whole load.
			var loadModule = function(callback){
				require([pageID], callback, function(){
					callback({});
				});
			};

			loadModule(function(pgModule){
				require(["str-loader","js-promise"],function(strLoader,Promise){
				$http.css.loadList(pgModule.requireCSS).then(function() {
					if (_D(pageURL)) {
						// pageURL is a static .html path, so the query string starts with "?".
						return $http.get(pageURL + "?lang=" + $u.lang() ).then(function(html){
							_H(root, html.responseText);
							// The fragment is injected after DOMContentLoaded, so the
							// declarative binder has to run on it explicitly.
							if (window.KStrings) {
								window.KStrings.bind(root);
							}
						});
					}
				}).then(function(){
					if(pgModule.requireStrings){
						return strLoader.requireArrayOfStrings(pgModule.requireStrings);
					}
				}).done(function(){
					var dataPr = pgModule.onload ? pgModule.onload(root) : null;
					$du.removeClass(root, "progress_bg");
					require(["k-template"],function(ktmpl){
						if(dataPr && Promise.is(dataPr)){
							dataPr.done(function(data){
								ktmpl.processTemplateNode(root, data);
								(pgModule.postRender && pgModule.postRender(root, data));
							});
						}else {
							ktmpl.processTemplateNode(root, {});
						}
					});
				});
				});
			});
		},
		open:function( pageID, pAdd, pRemove, bNoHistory ){
			if(pAdd === undefined){
				pAdd = {pg:pageID};
			}else{
				pAdd.pg=pageID;
			}
			this.chgParams(pAdd, pRemove, true, bNoHistory);
		},

		chgParams:function(pAdd, pRemove, bTop, bNoHistory){
			var cquery = "#" + $u.getCParams();
			if(pRemove === true){// remove all params
				cquery = "#pg="+_P("pg");
			}
			for( var p in pAdd ){
				cquery = $u.removeParam( p, cquery );
				if(_D(pAdd[p]) && (pAdd[p]!==null) && (pAdd[p]!==false && ((pAdd[p].toString()).length))){
					cquery += "&" + p + "=" + encodeURIComponent(pAdd[p]);
				}
			}
			if(pRemove !== true && pRemove!==undefined && pRemove.length){
				for( var i=0; i< pRemove.length; i++ ){
					cquery = $u.removeParam( pRemove[i], cquery );
				}
			}
			if(bNoHistory){
				window.location.replace( $u.fixParams(cquery) );
			}
			else{
				window.location.href = $u.fixParams(cquery);
			}
			if(bTop){
				setTimeout(function(){ pgNav.scrollTop(); },1);
			}
		},
		scrollTop:function(){
			document.body.scrollTop = document.documentElement.scrollTop = 0;
		},
		loadScript:function(sURL, onSuccess){
			var myScript  = document.createElement("script");
			myScript.type = "text/javascript";
			myScript.src  = sURL;
			var head = document.getElementsByTagName("head")[0] || document.documentElement;
			var done = false;

			myScript.onload = myScript.onreadystatechange = function() {
				if(!done
					&& (  !this.readyState
					|| this.readyState === "loaded"
					|| this.readyState === "complete"
					)
				){
					done = true;
					onSuccess();
				}
			};
			head.insertBefore( myScript, head.firstChild );
		}
	};
});
