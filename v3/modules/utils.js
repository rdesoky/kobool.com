/**
 * Created by rdeso_000 on 1/4/2015.
 */

define(["jquery"],function($){
	var $u,
		paramList = "ls,sum,g,ag,ms,ch,c,st,ci,o,ht,wt,jb,nc,la,rc,ed,sm,re,ds,dt,sh,fc,dst,po,ob,m,bl,spr,max,p,ps,pc,tn,noc,to,mu".split(",");

	return $u = {
		collectionItem:function(collection, sID){// finds child in nested objects using ["parent.child1.child2"] access method
			var ret = collection[sID];

			if (ret === undefined && sID.match(/\./)) {
				var path = sID.split(".");

				for (var i = 0, len = path.length, ret = collection;
					 ( ret !== undefined && i < len );
					 i++
				) {
					ret = ret[path[i]];
				}
			}
			return ret;
		},
		isText:function(v){//TODO:unused: checks for none empty string
			return ( typeof( v ) == "string" && v.trim().length > 0 )
		},
		copyObject:function(obj){
			return this.extend( new Object(), obj );
		},
		equalObjects:function(obj1, obj2, ignoreList){
			var ret=true;
			if( !_D(obj1) || !_D(obj2) ){
				return false;
			}
			Enum(obj1, function(val,key){
				if(!_D(ignoreList) || !ignoreList[key]){
					if(val!=obj2[key]){
						ret=false;
					}
				}
			});
			return ret;
		},
		clone:function(obj, add, rem){
			var ret=this.copyObject(obj);
			Enum(add,function(v,k){
				ret[k]=v;
			});
			Enum(rem,function(k){
				delete ret[k];
			});
			return ret;
		},
		extend:function( obj, def){
			for( var item in def ){
				obj[item] = def[item];
			}
			return obj;
		},
		isArray:function(obj){
			return( obj && obj.constructor==Array );
		},
		lang:function(){
			if(! this.cLang ){
				this.cLang = this.getSParam("lang", _GC("lang","en") );
			}
			return this.cLang;
		},
		getSParam:function(name, defVal){
			var url = window.location.href.split("#")[0];
			return this.getParam(name, defVal, url);
		},
		dir:function(){
			if(!_D(this.direction)){
				this.direction = (_GC("lang") == "ar") ? 1 : 0;
			}
			return this.direction;
		},
		cancelEvent:function(handle, context){
			context = context || window;
			if(_D(context[handle])){
				clearTimeout(context[handle]);
				delete context[handle];
				return true;
			}
			return false;
		},
		brackets:function(el, title, attr){
			var ret;
			if( ! _D(attr) && ( typeof el=="string" || typeof el=="number" ) && typeof title === "string" ){
				return _TXT( title + "(" + el + ")" );
			}
			ret = _C("span", attr);
			if( _D(title) ){
				_A( ret, typeof title==="string" ? _TXT(title) : title );
			}
			_A( ret,_TXT(" (") );
			_A( ret, typeof el==="string" ? _TXT(el) : el);
			_A( ret,_TXT(")") );
			return ret;
		},
		daysSince:function(sDate){
			var d = (new Date()).sql(sDate);
			var now = new Date();
			return Math.floor( (now-d) / (1000*60*60*24) );
		},
		mkQuery:function(params){//TODO:unused: converts object to URL query string format
			var ret="";
			Enum(params,
				function(val,key){
					ret+=(ret.length?"&":"") + key + "=" + encodeURIComponent(val);
				}
			);
			return ret;
		},
		arrFind:function(arr, s){
			if(!arr){
				return false;
			}
			for( var a in arr ){
				if( arr[a] == s ){
					return true;
				}
			}
			return false;
		},
		disableSelection:function(target)
		{
			_SA(target,{unselectable:"on"});
			target.style.userSelect = target.style.MozUserSelect = "none";
			target.ondragstart = target.onselectstart = function(){return false;};
			require(["dom-utils"],function($du){
				$du.addClass(target,"no_select");
			});
			target.oncontextmenu=function(){
				return false;
			};
		},

		setCookie:function(key, val, perm){
			document.cookie = key + "=" + encodeURIComponent(val) + "; path=/" + (perm?"; expires:Mon, 31 Dec 2020 23:59:59 GMT":"");
			return val;
		},

		delCookie:function(key){
			var oExpDate = new Date();
			oExpDate.setDate(oExpDate.getDate() - 1);
			document.cookie = encodeURIComponent(key) + "=; expires=" + oExpDate.toGMTString() + "; path=/";
		},

		SQL2LocaleDate:function( SQLDateStr )
		{
			if(!SQLDateStr)
				return "";
			var myDate = new Date();
			myDate.sql(SQLDateStr);
			return myDate.toLocaleDateString();
		},
		smaller:function(x,y){
			return x<y?x:y;
		},
		larger:function(x,y){
			return x>y?x:y;
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
		form2Query:function(form){//TODO: not used
			var ret="",dlm="";
			Enum(form, function(item){
				if( item.name.length ){
					ret += dlm + item.name + "=" + encodeURIComponent(item.value);
					dlm = "&";
				}
			});
			return ret;
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

		setParam:function( name, value, url, server ){
			var re = this.paramRegExp(name);
			if( url==undefined ){
				url=document.location.href;
			}
			if( re.exec(url) ){
				url = url.replace(re, RegExp.lastMatch.replace(RegExp.$1, value));
			}else{
				if(server){
					url += ((url.indexOf("?")==-1)?"?":"&" ) + name + "=" + encodeURIComponent(value);
				}
				else{
					url += ((url.indexOf("#")==-1)?"#":"&" ) + name + "=" + encodeURIComponent(value);
				}
			}
			return url;
		},

		paramsFound:function(plist){
			var found=false;
			Enum(plist,function(val){
				if( pgNav.getParam(val) != null){
					found=true;
					return false;
				}
				return;
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
		form2Hash:function(form){//TODO: move to utils
			var ret={};
			Enum(form, function(item){
				if( item.name.length ){
					ret[item.name] = item.value;
				}
			});
			return ret;
		},
		paramsHash:function(upd){//TODO: move to utils
			var ret = $u.query2Hash(this.getCParams()+"&"+this.getSParams(), upd );
			return ret;
		},
		searchParams:function(upd){//TODO: move to utils
			var p = this.paramsHash(upd);
			var ret = {};
			Enum( paramList, function(k){
				if(_D(p[k])){
					ret[k]=p[k];
				}
			});
			return ret;
		},
		removeParam:function(name, url){//TODO: move to utils
			var re = new RegExp( "[&#\?; ]+(" + name + "=[^&#\?;]*)", "i");
			if(url == undefined){
				url = document.location.href;
			}

			if( re.exec(url) ){
				url = url.replace(re, RegExp.lastMatch.replace(RegExp.$1, ""));
			}
			return url;
		},

		getPageID:function(){
			return this.getCParam("pg", "home");
		},
		fixParams:function( href ){
			return href.replace(/\&+/g, "&").replace(/\&$/, "").replace("#&","#");
		}
	}
});

