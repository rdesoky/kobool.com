
var PgNav = {
	currURL: "loading",
	currPage: "",
	currCParams: "",
	SParamList:"ls,sum,g,ag,ms,ch,c,st,ci,o,ht,wt,jb,nc,la,rc,ed,sm,re,ds,dt,sh,fc,dst,po,ob,m,bl,spr,max,p,ps,pc,tn,noc,to,mu",
	
	createLink:function(p){
		var att = U.clone(p.att);
		att["class"] = att["class"]?att["class"]+" href" : "href";
		var el = _C( (p.tg||"span"), att );
		_HS(el,p.t);
		el.onclick=function(){
			PgNav.open(p.pg, p.p, p.dp, p.replace);
		};
		return el;
	},
	init:function(){
		this.currPage=this.getSParam("pg","splash");
		this.currCParams=this.getCParams();

		// Render the landing page now. It used to appear only as a side effect
		// of the session refresh callback, so an unreachable API left the page
		// empty behind a spinner.
		this.onPgChange();

		setInterval(
			function(){
				PgNav.chkPage();
			},
			200
		);
	},
	
	chkPage:function(){
		var activePage = this.getPageID();
		var activeCParams = this.getCParams();
		if( this.currPage != activePage ){
			var old = this.currPage;
			this.currPage = activePage;
			this.currCParams = activeCParams;
			this.onPgChange();
			this.unloadPage(old);
			KEvents.fire("chgPage",{pg:activePage,opg:old});
			return undef;
		}
		if( activeCParams != this.currCParams ){
			this.currCParams = activeCParams;
			this.onCParamChange();
			KEvents.fire("chgParams",{pg:activePage});
		}
		return undef;
	},

	paramRegExp:function(name){
		return new RegExp( "[&#\?; ]+" + name + "=([^&#\?;]*)", "i");
	},

	getParam:function(name, defVal, url){
		var r = null;
		if( url == undefined ){
			url = document.location.href;
		}
		var re = this.paramRegExp(name);
		
		if( re.exec(url) ){
			r = decodeURIComponent(RegExp.$1);
			if( typeof defVal == "number" ){
				r = _N(r);
			}
		}else if( _D(defVal) ){
			r = defVal;
		}
		return r;
	},
	paramsFound:function(plist){
		var found=false;
		Enum(plist,function(val){
			if( PgNav.getParam(val) != null){
				found=true;
				return false;
			}
			return undef;
		});
		return found;
	},
	getCookie:function(name, defVal){
		return this.getParam(name, defVal, "#" + document.cookie);
	},

	getCParam:function(name, defVal){
		var url = "#" + this.getCParams();
		return this.getParam(name, defVal, url);
	},

	getCParams:function(){
		return (window.location.href.split("#")[1]||"");
	},
	getSParams:function(){
		return window.location.search.split("#")[0].substr(1);
	},
	form2Hash:function(form){
		var ret={};
		Enum(form, function(item){
			if( item.name.length ){
				ret[item.name] = item.value;
			}
		});
		return ret;
	},
	form2Query:function(form){
		var ret="",dlm="";
		Enum(form, function(item){
			if( item.name.length ){
				ret += dlm + item.name + "=" + encodeURIComponent(item.value);
				dlm = "&";
			}
		});
		return ret;
	},
	hash2Query:function(hash, upd){
		var ret="",dlm="";
		if(!_D(upd)){
			upd = {};
		}
		Enum(hash, function(val,key){
			if(upd[key]!==false){
				ret += dlm + key + "=" + encodeURIComponent(val);
				dlm = "&";
			}
		});
		Enum(upd, function(val, key){
			if( val !== false ){
				ret += dlm + key + "=" + encodeURIComponent(val);
				dlm = "&";
			}
		});
		return ret;
	},
	paramsHash:function(upd){
		var ret = this.query2Hash(this.getCParams()+"&"+this.getSParams(), upd );
		return ret;
	},
	searchParams:function(upd){
		var p = this.paramsHash(upd);
		var ret = {};
		Enum( this.SParamList.split(","), function(k){
			if(_D(p[k])){
				ret[k]=p[k];
			}
		});
		return ret;
	},
	query2Hash:function(sQuery, upd){
		var ret = {};
		Enum(sQuery.split("&"), function(aParams){
			var aParam = aParams.split("=");
			if(aParam.length>1){
				ret[aParam[0]]=decodeURIComponent(aParam[1]);
			}
		});
		Enum(upd, function(val, key){
			if( val === false ){
				delete ret[key];
			}else{
				ret[key]=val;
			}
		});
		return ret;
	},
	getSParam:function(name, defVal){
		var url = window.location.href.split("#")[0];
		return this.getParam(name, defVal, url);
	},
	nav2SParam:function( name, value ){
		var squery = window.location.href.split("#")[0];
		squery = this.setParam(name, value, squery, true);
		window.location.href = squery + "#" + ( window.location.href.split("#")[1] || "" );
	},

	nav2CParam:function( name, value ){
		var cquery = "#" + ( window.location.href.split("#")[1] || "" );
		cquery = this.setParam(name, value, cquery);
		window.location.href = cquery;
	},
	removeParam:function(name, url, server){
		var re = new RegExp( "[&#\?; ]+(" + name + "=[^&#\?;]*)", "i");
		if(url == undefined){
			url = document.location.href;
		}
		
		if( re.exec(url) ){
			url = url.replace(re, RegExp.lastMatch.replace(RegExp.$1, ""));
		}
		return url;
	},
	setParam:function( name, value, url, server ){
		var re = this.paramRegExp(name);
		if( url==undefined ){
			url=document.location.href;
		}
		if( re.exec(url) ){
			url = url.replace(re, RegExp.lastMatch.replace(RegExp.$1, value));
		}else{
			if(server){
				url += ((url.indexOf("?")==-1)?"?":"&" ) + name + "=" + escape(value);
			}
			else{
				url += ((url.indexOf("#")==-1)?"#":"&" ) + name + "=" + escape(value);
			}
		}
		return url;
	},
	
	getPageID:function(){
		return this.getCParam("pg", "home");
	},
	
	onPgChange:function(){
		_CL("TipAnchor");
		var pageID = this.getPageID();
		this.downloadPage( 
			pageID, 
			"Contents", 
			function(){
				//DU.removeClass("Contents", "progress_bg");
			} 
		);
	},
	reload:function(){
		this.onPgChange();
		var pageID = this.getPageID();
		KEvents.fire("chgPage",{pg:pageID,opg:pageID});
	},
	onCParamChange:function(){
		_CL("TipAnchor");
		var pageID = this.getPageID();
		if( Packages[pageID] && Packages[pageID].onchange ){
			eval(Packages[pageID].onchange);
		}
	},
	unloadPage:function(pageID){
		if( Packages[pageID] && Packages[pageID].ondestroy ){
			eval(Packages[pageID].ondestroy);
		}
	},
	downloadPage:function( pageID, container, onLoad ){
		document.title = _S("a.kobool") + " - " + _S("a.pg_title." + pageID);
		var root = _CL(container);//_A( _CL(container), "div" );
		_CL("PgHeader");
		root.className = pageID + "_pg progress_bg";
		//load page css classes
		CSS.loadPackage(pageID);
		
		var pageURL = PgLinks[pageID] || ( _D(Packages[pageID] ) ? undef : PgLinks["404"] );

		var loadScripts = function(){//load page java scripts
			Scripts.loadPackage(
				pageID, 
				function(){
					DU.removeClass(root, "progress_bg");
					if( Packages[pageID] && Packages[pageID].onload ){
						setTimeout( Packages[pageID].onload, 1 );
					}
					if(onLoad){
						onLoad();
					}
				}
			);
		};

		var loadStrings = function(){
			if( _D( Packages[pageID] ) && _D( Packages[pageID].str ) ){
				RAS( Packages[pageID].str, loadScripts );
			}else{
				loadScripts();
			}
		};

		if( _D(pageURL) ){
			// pageURL is a static .html path, so the query string starts with "?".
			Http.get( pageURL + "?lang=" + U.lang(),
				function(html){
					_H(root, html);
					// The fragment is injected after DOMContentLoaded, so the
					// declarative binder has to run on it explicitly.
					window.KStrings.bind(root);
					loadStrings();
				},
				null,
				function(){
					// A missing fragment must not leave the page spinning.
					DU.removeClass(root, "progress_bg");
				}
			);
		}else{
			loadStrings();
		}
	},
	open:function( pageID, pAdd, pRemove, bNoHistory ){
		if(!Defined(pAdd)){
			pAdd = {pg:pageID};
		}else{
			pAdd.pg=pageID;
		}
		this.chgParams(pAdd, pRemove, true, bNoHistory);
	},

	chgParams:function(pAdd, pRemove, bTop, bNoHistory){
		var cquery = "#" + this.getCParams();
		if(pRemove === true){// remove all params
			cquery = "#pg="+_P("pg");
		}
		for( var p in pAdd ){
			cquery = this.removeParam( p, cquery );
			if(_D(pAdd[p]) && (pAdd[p]!==null) && (pAdd[p]!==false && ((pAdd[p].toString()).length))){
				cquery += "&" + p + "=" + encodeURIComponent(pAdd[p]);
			}
		}
		if(pRemove !== true && Defined(pRemove) && pRemove.length){
			for( var i=0; i< pRemove.length; i++ ){
				cquery = this.removeParam( pRemove[i], cquery );
			}
		}
		if(bNoHistory){
			window.location.replace( this.fixParams(cquery) );
		}
		else{
			window.location.href = this.fixParams(cquery);
		}
		if(bTop){
			setTimeout(function(){ PgNav.scrollTop(); },1);
		}
	},
	
	fixParams:function( href ){
		return href.replace(/\&+/g, "&").replace(/\&$/, "").replace("#&","#");
	},
	scrollTop:function(){
		document.body.scrollTop = document.documentElement.scrollTop = 0;
	}
};
//shortcuts
	var _GC = function(){return PgNav.getCookie.apply(PgNav,arguments);};
	var _GCN = function(){return parseInt(PgNav.getCookie.apply(PgNav,arguments),10);};
	var _SC = function(){return U.setCookie.apply(U,arguments);};
