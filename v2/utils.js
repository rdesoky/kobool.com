var Http = {
	cache:{},
	// Set from shared/config.js so the API host is environment-specific.
	cgiBase:(window.APP_CONFIG && window.APP_CONFIG.apiBase) || "/cgi-bin/",
	
	activeReq:{},
	xml2JS:function(xml){
		var js = {
			child_list:[]
		};
		Enum(xml.documentElement.attributes,function(att){
			js[att.name]=att.value;
		});
		Enum( xml.documentElement.getElementsByTagName("option"),function(n){
			var ch = {};
			js.child_list.push(ch);
			Enum(n.attributes,function(att){
				ch[att.name]=att.value;
			});
			ch.textContent=n.textContent;
		});
		return js;
	},
	createRequest:function( sURL, postData, onSuccess, onError, onTimeout ){
		var req;

		if( !postData && _D(this.activeReq[sURL]) )
		{// exiting GET request
			req = this.activeReq[sURL];
			if(_D(onSuccess)){
				req.onSuccess.push(onSuccess);
			}
			if(_D(onError)){ 
				req.onError.push(onError);
			};
			if(_D(onTimeout)){ 
				req.onTimeout.push(onTimeout);
			};
			return null;
		}
		
		//POST or new GET
		var readystateHandler= function(){ 
			if(	req.http.readyState == 4 ){
				U.cancelEvent( "hTimeout", req );

				if( req.http.status == 200 ){
					if(_D(KEvents)){
						KEvents.fire("ServerResponse",{url:sURL});
					}
					var xml = req.http.responseXML && req.http.responseXML.documentElement ? req.http.responseXML : undefined;
					for(var i=0; i<req.onSuccess.length; i++){
						var fn = req.onSuccess[i];
						if(_D(fn)){
							fn( req.http.responseText, xml );
						}
					}
				}else{
					// status 0 means the request never reached the server
					// (offline, DNS, CORS, connection refused). That is a
					// failure, not an abort, so report it: callers rely on
					// onError to clear their progress blockers.
					for( var i=0; i<req.onError.length; i++ ){
						var fn = req.onError[i];
						if(_D(fn)){
							fn();
						}
					}
				}

				delete Http.activeReq[sURL];
			}
		};
		var tmo = 30000;
		var timeout = function(){
			req.http.onreadystatechange = null;
			if(req.retry>=10){
				// Give up: report the failure so callers can clear their
				// progress blockers instead of waiting forever.
				for( var i=0; i<req.onTimeout.length; i++ ){
					var fn = req.onTimeout[i];
					if(_D(fn)){
						fn();
					}
				}
				for( i=0; i<req.onError.length; i++ ){
					fn = req.onError[i];
					if(_D(fn)){
						fn();
					}
				}
				delete Http.activeReq[sURL];
				return;
			}
			req.http.abort();
			req.http = Http.getAJAX();
			req.http.onreadystatechange = readystateHandler;
			req.retry ++;
			//if( document.title.match(/^(\d+)/) ){
			//	document.title = document.title.replace( /^\d+/, req.retry.toString() );
			//}else{
			//	document.title = req.retry.toString() + ":"+document.title;
			//}
			req.hTimeout = setTimeout( timeout, tmo );
			Http.sendRequest(sURL, postData);//resend request
		};

		req = this.activeReq[sURL] = {
			retry:0,
			http:this.getAJAX(),
			onSuccess:[onSuccess],
			onError:[onError],
			onTimeout:[onTimeout],
			abort:function(){
				this.http.abort();
				delete Http.activeReq[sURL];
			}
		};

		req.hTimeout = setTimeout(timeout, tmo);
		req.http.onreadystatechange = readystateHandler;

		return req;
	},

	sendRequest:function(sURL, postData){
		var req = Http.activeReq[sURL];
		if( !req ){
			return null;
		}
		// The API is cross-origin now, so the session id travels in a header
		// instead of relying on a same-origin cookie. _GC lives in nav.js,
		// which loads later, so read the cookie directly here.
		var sid = (document.cookie.match(/(?:^|; )sid=([^;]*)/) || [])[1];
		if( postData ){
			req.http.open( "POST", sURL, true );
			req.http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			if( sid ){
				req.http.setRequestHeader("sid", sid);
			}
			req.http.send( postData );
		}else{
			req.http.open( "GET", sURL, true );
			if( sid ){
				req.http.setRequestHeader("sid", sid);
			}
			req.http.send( null );
		}
		return req;
	},

	request:function( sURL, onSuccess, callerInfo, onError, postData ){
		var req = this.createRequest(sURL, postData, onSuccess, onError);// create or attach to existing one
		if( req ){
			this.sendRequest(sURL, postData);
		}
		return req;
	},
	refresh:function(){
		this.cache = {};
		_SC( "tx", (_GCN("tx",0) + 1 ).toString() );
		KEvents.fire("refreshData");
	},
	getCGI: function( scrpt, params , onLoad, onError ){
		var tmc = (new Date()).getTime();
		tmc -= (tmc % (15 * 60000));// 15 minutes refresh interval
		tmc += _GCN("tx",0);
		//params.lang = _GC("lang","en");//TODO: remove
		
		return this.request( 
			this.cgiBase + scrpt + "?" + PgNav.hash2Query(params,{tmc:tmc}), 
			onLoad, 
			null, 
			onError, 
			null 
		);
	},
	postUpdate:function(script, params, onLoad, onError){
		var r = this.postCGI(script, params, onLoad, onError);
		this.refresh();
		return r;
	},
	postCGI: function(scrpt, params, onLoad, onError){
		return this.post({scr:scrpt, data:params, onload:onLoad, onerror:onError});
	},
	post: function(p){

		switch(p.scr){
			case gCGI.stats:
			case 'chat_ping.pl':
			case gCGI.chat_msgs:
			case gCGI.visit:
			case gCGI.pics:
				break;
			default:
				if(typeof ga == 'function') {
					ga('send', {
						hitType: 'event',
						eventCategory: 'v2/' + PgNav.currPage,
						eventAction: 'post',
						eventLabel: p.scr
					});
				}
		}

		var pr = p.silent?undef:DU.blockPr("Contents");

		// The blocker must clear on every outcome. Leaving it up on a failed
		// or timed-out request strands the page behind a spinner forever.
		function unblock(){
			if(!p.silent){
				DU.unblockPr("Contents");
			}
		}

		var ret = this.request( 
			this.cgiBase + p.scr, 
			function(res,xml){
				unblock();
				if(p.onload){
					p.onload(res,xml);
				}
			}, 
			null, 
			function(){
				unblock();
				if(p.onerror){
					p.onerror();
				}
			}, 
			PgNav.hash2Query(p.data||{x:1})
		);
		if(p.refresh){
			this.refresh();
		}
		return ret;
	},
	get: function( sURL, onLoad, callerInfo, onError ){
		return this.request( sURL, onLoad, callerInfo, onError, null );
	},
	getAJAX: function GetAJAX()
	{
		var httpControl;

		if(window.XMLHttpRequest)
		{
			try{
				httpControl = new window.XMLHttpRequest();
			}
			catch(e){
			}
		}
		else if(window.ActiveXObject) 
		{// branch for IE/Windows ActiveX version
			try {
				httpControl = new window.ActiveXObject("Msxml2.XMLHTTP");
			}
			catch(e) 
			{
				try{
					httpControl = new ActiveXObject("Microsoft.XMLHTTP");
				}
				catch(e){
				}
			}
		}
		return httpControl;
	},

	getJSON:function( sURL, callback, dataKey )
	{
		var myScript  = document.createElement("script"); 
		myScript.type = "text/javascript"; 
		myScript.src  = sURL;
		var head = document.getElementsByTagName("head")[0] || document.documentElement;;
		var done = false;

		myScript.onload = myScript.onreadystatechange = function() {
			if(!done
				&& (  !this.readyState
					|| this.readyState === "loaded" 
					|| this.readyState === "complete"
				) 
			){
				done = true;

				if( callback ){
					var data = dataKey ? window[dataKey] : re;
					if(_D(data)){
						callback(data);
					}else{
						callback({error:"server_error"});
					}
				}

				// Handle memory leak in IE
				myScript.onload = myScript.onreadystatechange = null;
				if( head && myScript.parentNode ) {
					head.removeChild( myScript );
				}
			}
		};
		head.insertBefore( myScript, head.firstChild );
	}
};

function DefineJClass( classDef, baseClass )
{
	var classConstructor = function(){
		
		if( baseClass ){
			baseClass.apply( this, arguments );
		}

		for( var item in classDef ){// copy elements from passed classDef
			this[item] = classDef[item];
		}

		this.destruct = function(){
			var chain = [];

			for( var currConst = classConstructor; currConst ; currConst=currConst.baseClass )
			{
				if( currConst.classDef && currConst.classDef.destroy ){
					chain.push( currConst );
				}
			}

			for( var i=chain.length-1; i >=0; i -- )
			{
				var classDef = chain[i].classDef;
				if(classDef.destroy){
					classDef.destroy.apply(this);
				}
			}
		};
		this.extend = function(def){
			for( var item in def ){
				this[item] = def[item];
			}
		};
		this.getDOM = function(attr){
			return this.dom || this.render(attr);
		};
		if( this["init"] != undefined ){
			this.init.apply( this, arguments );
		}
	};

	classConstructor.classDef  = classDef;
	classConstructor.baseClass = baseClass;

	return classConstructor;
}

var CSelector = {
	init:function(arr){
		var self = this;
		Enum( arr, function(el){
			el.onclick=function(){
				self.select(this);
			};
		});
	},
	select:function(item){
		if(this.selItem){
			DU.removeClass(this.selItem,"sel");
		}
		item=_E(item);
		DU.addClass(item,"sel");
		this.selItem=item;
	}
};
CSelector = DefineJClass(CSelector);

var JCTabCtrl = {
	init:function( map, mType, sOnShow, onShowContext ){
		this.map = {};
		this.sOnShow = sOnShow;
		this.onShowContext = onShowContext;
		if(_D(mType) ){
			this.mType = mType;
		}else{
			this.mType = 0;//0 hover, 1 click
		}
		if(_D(map)){
			for( var item in map ){
				if(_E(item)){
					DU.addClass(item, "ctab");
					this.addTab( item, map[item] );
				}
			}
		}
	},
	addTab:function( handle, target ){
		var elTab = _E(handle);
		if(!elTab){
			return;
		}

		this.map[handle] = target.panel || target;

		var self = this;
		var handler = function(e){
			if(self.selTab == handle){// already selected
				if(target.onDblClick){
					target.onDblClick();
				}
			}else{
				self.showTab(handle);
			}
		};
		if(this.mType){
			elTab.onclick = handler;
		}else{
			elTab.onmouseover = handler;
		}
	},
	showTab:function(handle){
		this.selTab = handle;

		for( var item in this.map ){
			_HI( this.map[item] );
			DU.removeClass(item, "seltab");
		}
		
		_SH(this.map[handle]);
		DU.addClass(handle, "seltab");

		if(this.sOnShow){
			var context=this.onShowContext||window;
			context[this.sOnShow](handle);
		}
	}
};
JCTabCtrl = DefineJClass( JCTabCtrl, CSelector );

var Utils = U = {
	nameSpace:function(str){
		var ns=window;
		Enum(str.split("."),function(sp){
			if(! _D(ns[sp]) ){
				ns[sp] = {};
			};
			ns = ns[sp];
		});
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
			this.cLang = PgNav.getSParam("lang", PgNav.getCookie("lang","en") ); 
		};
		return this.cLang;
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
	mkQuery:function(params){
		var ret="";
		Enum(params,
			function(val,key){
				ret+=(ret.length?"&":"") + key + "=" + escape(val);
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
		DU.addClass(target,"no_select");
		target.oncontextmenu=function(){
			return false;
		};
	},
	
	setCookie:function(key, val, perm){
		document.cookie = key + "=" + escape(val) + "; path=/" + (perm?"; expires:Mon, 31 Dec 2020 23:59:59 GMT":"");
		return val;
	},

	delCookie:function(key){
		var oExpDate = new Date();  
		oExpDate.setDate(oExpDate.getDate() - 1);  
		document.cookie = escape(key) + "=; expires=" + oExpDate.toGMTString() + "; path=/";  		
	},

	picSRC:function(id, gender, tn){
		return Http.cgiBase + gCGI.pic + "?tn=" + (Defined(tn)?"1":"0") + "&id=" + id + "&g=" + gender;
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
	}
	
};

var DU = {
	onWheel:function(el, handler){
		var fn = function(e){
			e = e || window.event;
			if(!_D(e.wheelDelta)){
				e.wheelDelta =  e.detail * (-100);
			}
			handler( e );
			return false;
		};
		if( el.addEventListener ){
			el.addEventListener("DOMMouseScroll", fn, false);
		}else if(el.attachEvent){
			el.attachEvent("onmousewheel", fn );
		}
		el.onmousewheel = el.onmousewheel = fn;		
	},
	addEventListener:function(el,eventName,fn){
		if( el.addEventListener ){
			el.addEventListener(eventName,fn);
		}else if(el.attachEvent){
			el.attachEvent("on" + eventName, fn);
		}else{
			el["on"+eventName] = fn;
		}
	},
	removeEventListener:function(el,eventName,fn){
		if( el.removeEventListner ){
			el.removeEventListener(eventName,fn);
		}else if(el.detachEvent){
			el.detachEvent("on" + eventName, fn);
		}else{
			delete el["on"+eventName];
		}
	},
	applyStyles:function( el, styles ){
		for( var attr in styles ){
			el.style[attr] = styles[attr]
		}
	},
	bar: function(p){/*{val:"",max:"",color:""}*/
		var d=_C("div",{"class":"anchor"});
		_AD(d,{"class":"absolute",style:"height:22px;width:" + (_N(p.val)/(p.max/100)).toString() + "%;background:" + p.color});
		_AD(d,{"class":"absolute"},_TXT(p.val));
		return d;
	},
	onKeyPress:function(el, handler){
		var myHandler = function(e){
			if(handler(e)){
				DU.cancelBubble(e);
			}
		};
		if(el.addEventListener){
			el.addEventListener("keypress", myHandler, false);
		}else if(el.attachEvent){
			el.attachEvent("onkeypress", myHandler)
		}else{
			el.onkeypress = myHandler;
		}
		
	},
	findAttr:function(el,name){
		var curr=el;
		while(curr){
			if(_EA(curr,name)){
				return curr;
			}
			curr=curr.parentNode;
		}
		return null;
	},
	findMethod:function(el,name){
		var curr=el;
		while(curr){
			if(_D(curr[name])){
				return curr;
			}
			curr=curr.parentNode;
		}
		return null;
	},
	unblockPr:function(el){
		el=_E(el);
		if( !el ){
			el = document.body;
		}
		if(el.pr){
			_R( el.pr );
			delete el.pr;
		}
		return el;
	},
	blockPr:function(el){
		el=_E(el);
		if( !el ){
			el = document.body;
		}
		if(el.pr){
			return el.pr;
		}
		var root = el.pr = el.insertBefore( _C("div"), el.firstChild );
		var bl = _A(root, "div", {"class":"white_bg trans div_blocker"});
		var bl_br = _A(root, "div", {"class":"progress_bg div_blocker"});
		bl_br.style.width = bl.style.width = el.offsetWidth + "px";
		bl_br.style.height = bl.style.height = el.offsetHeight + "px";
		return root;
	},
	createFormInputs:function( form, inputs){
		Enum(inputs, function(val, key){
			_A(form,"input",{type:"hidden", name:key, value:val});
		});
		return form;
	},
	radioVal:function(r){
		var val;
		Enum(r, function(item){
			if(item.checked){
				val = item.value;
			}
		});
		return val;
	},
	replace:function(el, newEl){
		el = _E(el);
		newEl = _E(newEl);
		if(newEl==el){
			return el;
		}
		if( el && el.parentNode ){
			el.parentNode.replaceChild(newEl, el);
			return newEl;
		}
		return el;
	},
	cancelBubble:function(e){
		if(_D(e)){
			e.cancelBubble = true;
			if(_D(e.stopPropagation)){
				e.stopPropagation();
			}
		}else if(_D(event)){
			event.cancelBubble = true;
		}
	},
	absPos:function(el){
		var ret = {left:0,top:0};
		while(el){
			ret.left += el.offsetLeft;
			ret.top  += el.offsetTop;
			el= el.offsetParent;
		}
		return ret;
	},
	clear:function(el){
		if( ( el = _E(el) ) ){
			el.innerHTML = "";
			if( el.pr ){
				delete el.pr;
			}
		}
		return el;
	},
	setAttr:function( el, attr ){
		if( ( el = _E(el) ) ){
			Enum( attr, function(val,key){
					switch(key){
					case "checked":
						el.checked = val;
						break;
					default:
						if(val==null){
							el.removeAttribute( key );
						}else{
							el.setAttribute( key, val );
						}
					}
				}
			);
		}
		return el;
	},

	create:function( sTag, attrs, contents ){
		sTag = sTag || "div";
		var el = document.createElement( sTag );
		this.setAttr(el, attrs);
		if(_D(contents)){
			if( (typeof contents==="string") || (typeof contents==="number") ){
				el.innerHTML = contents;
			}else{
				this.append( el, contents );
			}
		}
		return el;
	},

	append: function( el, child, attrs, contents, bClear ){
		el = _E(el);
		if(U.isArray(child)){
			var ret=[];
			Enum(child, function(item){
				ret.push( DU.append(el,item) );
			});
			return ret;
		}
		if(!el){
			return undef;
		}
		
		if(!child){
			return undef;
		}

		if(typeof child==="string"){
			child = this.create(child, attrs, contents);
		}else{
			this.setAttr(child, attrs);
			if(_D(contents)){
				if( (typeof contents==="string") || (typeof contents==="number") ){
					child.innerHTML = contents;
				}else{
					child.appendChild(contents);
				}
			}
		}
		if(bClear===true){//clear
			el.innerHTML = "";
		}
		return el.appendChild( child );
	},
	
	detach:function(el, parent){
		el = _E(el);
		if(!el){
			return null;
		}
		if(_D(parent)){
			if(el.parentNode!==parent){
				return child;
			}
		}else{
			parent = el.parentNode;
		}
		if(parent){
			parent.removeChild(el);
		}
		return el;
	},
	appendTable: function( el, tableAttr, colAttr, rows_count){
		el = _E(el);
		if( !el ){
			return null;
		}
		var layout = this.createTable(tableAttr, colAttr, rows_count);
		el.appendChild( layout.table );
		return layout;
	},

	createTable: function( tableAttr, colAttr, rows_count, rows_attr ){
		var ret = {rows:[]};
		rows_count = _D(rows_count)? rows_count : 1;
		ret.table = _C("table", tableAttr);
		ret.tbody = _A( ret.table, "tbody" );
		ret.appendRow=function(cells_attr, row_attr){
			return DU.appendTableRow(this.tbody, cells_attr||colAttr, row_attr);
		};
		for( var r=0;r<rows_count; r++ ){
			var cols = this.appendTableRow(ret.tbody, colAttr, rows_attr);
			ret.rows.push(cols);
		}
		ret.cols=ret.rows[0];
		return ret;
	},
	appendTableRow:function( tbody, colAttr, row_attr ){
		var tr = this.append( tbody, "tr", row_attr );
		var cols = [];
		for( var i=0; i<colAttr.length;i++ ){
			cols[i] = _A( tr, "td", colAttr[i] );
		}
		return cols;
	},
	setTableColWidth:function(tbl, col, width){
		Enum( tbl.firstChild.childNodes, function(row){
			row.childNodes[col].style.width = width.toString() + "px";
		});
	
	},
	hide:function( el ){
		if( el && el.constructor == String ){
			var aEl = el.split(",");
			for( var i=0; i<aEl.length; i++ ){
				this.hide(_E(aEl[i]));
			}
		}else if(el && el.constructor == Array){
			for( var i=0; i<el.length; i++ ){
				this.hide(el[i]);
			}
		}else if(el&&el.style){
			el.style.display="none";
		}
	},
	show:function(el){
		if( el && el.constructor == String ){
			var aEl = el.split(",");
			for( var i=0; i<aEl.length; i++ ){
				this.show(_E(aEl[i]));
			}
		}else if(el && el.constructor == Array){
			for( var i=0; i<el.length; i++ ){
				this.show(el[i]);
			}
		}else if(el){
			el.style.display="";
		}
	},
	showHide:function(el){
		el = _E(el);
		if(el.style.display == "none"){
			el.style.display = "";
		}else{
			el.style.display = "none";
		}
	},
	addClass:function(el, cName){
		el = _E(el);
		if( !el || !_D(cName) ){
			return false;
		}

		var classes = el.className.optimizeSpaces();
		if(!classes.length){
			el.className = cName;
			return true;
		}

		var arr = classes.split(" ");
		
		if(!U.arrFind(arr,cName)){
			arr.push(cName);
			el.className = arr.join( " " );
			return true;
		}
		return false;
	},
	removeClass:function(el, cName){
		el = _E(el);
		if(!el){
			return false;
		}
		var arr = el.className.optimizeSpaces().split(" ");

		for( var i = 0; i < arr.length; i++ ){
			if( arr[i] == cName ){
				arr.splice(i, 1);// remove array item
				el.className = arr.join(" ");
				return true;
			}
		}
		return false;
	},
	findClass:function(el,cName){
		el = _E(el);
		if(!el){
			return false;
		}
		return U.arrFind(el.className.split(" "), cName);
	},
	toggleClass:function(el,cName){
		if( this.findClass(el,cName) ){
			this.removeClass(el,cName);
		}else{
			this.addClass(el,cName);
		}
	},
	childOf:function( oChild, oParent ){
		if(!oChild || !oParent)
			return false;
		if( oChild == oParent)
			return true;
		try{
			var pn = oChild.parentNode;
			while( pn ){
				if(pn == oParent )
					return true;

				pn = pn.parentNode;
			}
		}
		catch (e){
		}
		return false;
	}
};


/* global utils */
	Date.prototype.sql = function( sqlDate ){
		var arr = sqlDate.split(/\:|\-| /g);
		this.setUTCFullYear( _N(arr[0]) );
		this.setUTCMonth	( _N(arr[1]) - 1 );
		this.setUTCDate	( _N(arr[2]) );
		this.setUTCHours	( _N(arr[3]) );
		this.setUTCMinutes ( _N(arr[4]) );
		this.setSeconds ( _N(arr[5]) );
		return this;
	};

	String.prototype.isNumber = function(){
		return ( this.search(/^\d+$/)!= -1 );
	};

	String.prototype.isValidEmail = function(){
		return ( this.match(/^\w+[\+\.\w-]*@([\w-]+\.)*\w+[\w-]*\.([a-z]{2,4}|\d+)$/i) );
	};

	String.prototype.digitsCount = function(){
		var match = this.match(/[\d]/g);
		return ( match ? match.length : 0 );
	};

	String.prototype.trim = function(){
		return this.replace(/(^\s*)|(\s*$)/g, "");
	};

	String.prototype.optimizeSpaces = function(){
		return this.trim().replace(/\s+/g," ");
	};

	String.prototype.repeat = function(n){
		return new Array(n+1).join(this);
	};

	String.prototype.toArray = function(n){
		return this.split("");
	};
	

	var _E = function(sID){
		if( sID && sID.constructor == String ){
			return document.getElementById(sID);
		}
		return sID;
	};
	var _SA = function(){DU.setAttr.apply(DU,arguments);};
	var _CL = function(){DU.clear.apply(DU,arguments);};
	var _EA = function(el, attr, def){
		var val=undef;
		if( ( el = _E(el) ) ){
			val = _D(el.getAttribute)?el.getAttribute(attr):null;
		}
		if(!_D(val)||val==null){
			val = def;
		}
		return val;
	};
	var _FixEvent=function(e){
		return e || window.event;
	};

	var _N=function(s){
		return (!_D(s)||isNaN(s)||s==null)?0:parseInt(s,10);
	};
	
	var int = _N;

	var JSN = function(t){
		return( _D(window.JSON) ? JSON.parse(t) : eval( "(" + t + ")" ) );
		//return( eval( "(" + t + ")" ) );
	};
	var _TXT = function(s){ return document.createTextNode(s); };
	var _HREF= function(s){ return _C("span",{"class":"href"},s);};
	var _C = function(){ return DU.create.apply(DU,arguments); };
	var _CL = function(){ return DU.clear.apply(DU,arguments); };
	var _A = function(){ return DU.append.apply(DU,arguments); };
	var _AD = function(el,attr,contents){ return DU.append(el,"div",attr,contents); };
	var _AT = function(){ return DU.appendTable.apply(DU,arguments); };
	var _CT = function(){ return DU.createTable.apply(DU,arguments); };
	var _P = function(pname,defval){return PgNav.getParam(pname,defval);};
	var _PN = function(pname,defval){return _N(PgNav.getParam(pname,defval));};
	var _R = function(child,parent){return DU.detach.apply(DU, arguments);};
	var _T = function(){return (new Date()).getTime();};
	var _H = function(el,html){if((el=_E(el))&&_D(html)){el.innerHTML=html;}return el;};
	var _SH = function(){DU.show.apply(DU,arguments);};
	var _HI = function(){DU.hide.apply(DU,arguments);};
	var Enum = function( coll, callback ){
		if(!_D(coll)){
			return undef;
		}
		//if( U.isArray(coll) ){//array
		if( _D(coll.length) ){
			for(var i=0,len=coll.length;i<len; i++){
				if( false === callback(coll[i], i) ){
					return i;
				}
			}
		}else{
			for(var key in coll){
				if( false === callback(coll[key],key) ){
					return key;
				}
			}
		}

		return true;
	};
	var _HSEP = function(root){//add horizontal separator
		if(root.firstChild){
			_A(root,_TXT(" | ") );
		}
	};
	
	var _ST = function(sid){
		document.title = _S(sid);
	};
	var _STT = function(txt){
		document.title = txt;
	};

var Log=function(text){
	return;
	if( ! _E("LogWnd") ){
		_A( document.body, 
			"div", 
			{
				id:"LogWnd", 
				style:"z-index:100000;position:fixed;padding-top:10px;top:0px;left:0px;width:160px;height:200px;overflow:auto;background-color:#FFFFCC"
			}
		);
		_A("LogWnd", "a", {href:"#", style:"position:absolute;top:0px;left:4px"}, "close").onclick=function(){
			_R( "LogWnd" );
			return false;
		};
	}
	_E("LogWnd").insertBefore(  _C("div",{style:"font-size:8pt"}, text), _E("LogWnd").firstChild );
};
