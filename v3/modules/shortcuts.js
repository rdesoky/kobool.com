/**
 * Created by rdeso_000 on 1/7/2015.
 */

define(["dom-utils", "utils"], function($du, $u){
	var utils = {
		E :  function(sID){
			if( sID && sID.constructor == String ){
				return document.getElementById(sID);
			}
			return sID;
		},
		SA :  function(){$du.setAttr.apply($du,arguments);},
		EA :  function(el, attr, def){
			var val;
			if( ( el = _E(el) ) ){
				val = _D(el.getAttribute)?el.getAttribute(attr):null;
			}
			if(!_D(val)||val==null){
				val = def;
			}
			return val;
		},
		FixEvent:  function(e){
			return e || window.event;
		},
	
		N: function(s){
			return (!_D(s)||isNaN(s)||s==null) ? 0: parseInt(s,10);
		},
	
		JSN:  function(t){
			return( _D(window.JSON) ? JSON.parse(t) : eval( "(" + t + ")" ) );
			//return( eval( "(" + t + ")" ) );
		},
	
		D:  function(v){
			return(typeof(v)!="undefined");
		},
		TXT :  function(s){ return document.createTextNode(s); },
		HREF:  function(s){ return _C("span",{"class":"href"},s);},
		C:  function(){ return $du.create.apply($du,arguments); },
		CL:	function(){ return $du.clear.apply($du,arguments); },
		A:	function(){ return $du.append.apply($du,arguments); },
		AD: function(el,attr,contents){ return $du.append(el,"div",attr,contents); },
		AT: function(){ return $du.appendTable.apply($du,arguments); },
		CT: function(){ return $du.createTable.apply($du,arguments); },
		P:  function(pname,defval){return $u.getParam(pname,defval);},
		PN: function(pname,defval){return _N($u.getParam(pname,defval));},
		R:  function(child,parent){return $du.detach.apply($du, arguments);},
		T:  function(){return (new Date()).getTime();},
		H:  function(el,html){if((el=_E(el))&&_D(html)){el.innerHTML=html;}return el;},
		SH: function(){$du.show.apply($du,arguments);},
		HI: function(){$du.hide.apply($du,arguments);},
		Enum:  function( coll, callback ){
			if(!_D(coll)){
				return;
			}
			//if( U.isArray(coll) ){//array
			if( _D(coll) && _D(coll.length) ){
				for(var i=0,len=coll.length;i<len; i++){
					if( false === callback(coll[i], i) ){
						return i;
					}
				}
			}else{
				for(var key in coll){
					if( _D(coll[key]) ){
						if( false === callback(coll[key],key) ){
							return key;
						}
					}
				}
			}
	
			return true;
		},
		HSEP:  function(root){//add horizontal separator
			if(root.firstChild){
				_A(root,_TXT(" | ") );
			}
		},
	
		ST:  function(sid){
			document.title = _S(sid);
		},
		STT:  function(txt){
			document.title = txt;
		},

		GC: function(){
			return $u.getCookie.apply($u,arguments);
		},
		GCN: function(){
			return parseInt($u.getCookie.apply($u,arguments),10);
		},
		SC: function(){
			return $u.setCookie.apply($u,arguments);
		},
		JSN: function(t){
			return( _D(window.JSON) ? JSON.parse(t) : eval( "(" + t + ")" ) );
		}
	};

	for(var k in utils){
		window["_" + k] = utils[k];
	}
	window.int = utils.N;
	delete window._Enum;
	delete window._JSN;
	window.Enum = utils.Enum;
	window.JSN = utils.JSN;

	return utils;
});
