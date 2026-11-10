/*
 * Register the boot hook with addEventListener instead of assigning
 * window.onload, so it cannot replace a handler another script installed.
 */
(function () {
	var boot = function(){
		Req("init",
			function(){
				PgNav.init();
				WindowEvents.init();
				ToolTip.init();
				AppMain();
			}
		);
	};
	if (window.addEventListener) {
		window.addEventListener("load", boot, false);
	} else if (window.attachEvent) {
		window.attachEvent("onload", boot);
	} else {
		window.onload = boot;
	}
})();

/*
 * DOM0 properties (document.body.onmouseover = ...) are single-owner: assigning
 * one silently replaces any handler another script installed. The browser's
 * element picker and other in-page tooling attach their own listeners at
 * document start, so v2 must register through addEventListener instead of
 * claiming the body's global handlers.
 */
var WindowEvents = {
	listen:function(el, name, handler){
		if(el.addEventListener){
			el.addEventListener(name, handler, false);
		}else if(el.attachEvent){
			el.attachEvent("on" + name, handler);
		}else{
			el["on" + name] = handler;
		}
	},
	init:function(){
		WindowEvents.listen(document.body, "mouseup", function(e){
			KEvents.fire( "mouseUp", {
					target:_D(e)?e.target : event.srcElement,
					e:_D(e)?e:event
				}
			);
		});
		WindowEvents.listen(document.body, "mousedown", function(e){
			KEvents.fire( "mouseDown", {
					target:_D(e)?e.target : event.srcElement,
					e:_D(e)?e:event
				}
			);
		});
		WindowEvents.listen(document.body, "mouseover", function(e){
			KEvents.fire( "mouseMotion", {
					target:_D(e)?e.target : event.srcElement,
					e:_D(e)?e:event
				}
			);
		});
		WindowEvents.listen(window, "resize", function(){
			KEvents.fire("resizeWindow", {
				h:document.documentElement.clientHeight,
				w:document.documentElement.clientWidth
			});
		});
		WindowEvents.listen(window, "scroll", function(){
			KEvents.fire("scrollWindow", {
				x:window.pageXOffset,
				y:window.pageYOffset,
				w:window.innerWidth,
				h:window.innerHeight
			});
		});
		window.setInterval(
			function(){
				KEvents.fire("SecondTic");
			},
			1000
		);
		KEvents.fire("resizeWindow", {
			h:document.documentElement.clientHeight,
			w:document.documentElement.clientWidth
		});
	}
}

var KEvents = {
	events:{},
	fire:function(eID, info	, target){
		setTimeout( function(){
				Enum( KEvents.events[eID],
					function(item){
						if(!_D(target) || (target==item.target) ){
							item.handler.call(item.listener||window, info);
						}
					} 
				);
			}, 
			1
		);
	},
	listen:function(eID, handler, listener, target){
		if(!_D(this.events[eID])){
			this.events[eID]=[];
		}
		this.events[eID].push({
				"handler":handler,
				"listener":listener,
				"target":target
			}
		);
	},
	removeListener:function(eID, listener){
		for(var i=0,len=this.events[eID].length;i<len;i++){
			var item = this.events[eID][i];
			if(item.listener===listener){
				KEvents.events[eID].splice(i,1);
				if(!KEvents.events[eID].length){
					delete KEvents.events[eID];
				}
				break;
			}
		}
	}
};

function Req( pID, callback ){
	
	if( Scripts.loadedPackages[pID] == 2 ){
		callback();
		return;
	}

	if( !_D(Req.listeners) ){
		Req.listeners={};
	}
	if(_D(window["DU"])){
		DU.blockPr("Contents");
	}
	if(_D(Req.listeners[pID])){
		Req.listeners[pID].push(callback);
		return;
	}else{
		Req.listeners[pID] = [callback];
	}
	
	var myCallback = function(){
		DU.unblockPr("Contents");
		var listeners = Req.listeners[pID];
		for( var i=0; i<listeners.length;i++ ){
			listeners[i].call();
		}
		delete Req.listeners[pID];
	};
	KCSS.loadPackage(pID);
	if( _D(Packages[pID].str) ){
		RAS( Packages[pID].str, function(){ Scripts.loadPackage( pID, myCallback ); } );
	}else{
		Scripts.loadPackage( pID, myCallback );
	}
};
function RAS( arr, callback ){
	var i=0;
	var trigger=function(){
		if(i==arr.length){
			callback();
		}else{
			RS( arr[i++], trigger );
		}
	};
	trigger();
};
function RS( path, callback ){
	//sample: RS("qa:ui",function(){_H(state,_S("qa:ui.message"))});
	// String bundles are compiled to JSON at build time and owned by
	// shared/strings.js, which replaces the old get_str.php round trip.
	var aPath = path.split(":");
	var src = aPath.length > 1 ? aPath[0] : "str";

	window.KStrings.loadBundle( src ).then(function(){
		if (callback) {
			callback();
		}
	});
	return true;
}

var _S=function(strID, defVal){
	if(-1==strID.indexOf(":")){
		strID = "str:" + strID;
	}
	return window.KStrings.getString(strID, defVal);
};
var _HS = function(el, strID, onload){
	el = _E(el);
	if( (typeof strID != "string") || !strID.length ){
		return _A(el,strID);;
	}
	var strBase = strID.substring(0, strID.indexOf(".") );
	if( -1 == strBase.indexOf(":") ){
		strBase = "str:" + strBase;
	}

	_H(el,"&nbsp;");
	RS( strBase, function(){
		if(onload){
			_H( el, onload(_S(strID)) );
		}else{
			_H( el, _S(strID) );
		}
	});

	return el;
};

/*
 * Stylesheet loader.
 *
 * Named KCSS, not CSS: a top-level `var CSS` replaces window.CSS, the native
 * namespace that exposes CSS.escape()/CSS.supports(). Tooling that generates
 * selectors (devtools element pickers, browser integrations) calls
 * CSS.escape() in the page, so shadowing it makes every selection fail.
 */
var KCSS = {//TODO: support callback
	loadedCSS:{},
	loadedPackages:{},

	loadPackage: function( sID ){
		if(this.loadedPackages[sID] || Packages[sID] == undefined ){
			return undef;
		}
		this.loadedPackages[sID] = 1;
		var aList = Packages[sID].css;
		if(aList==undefined){
			return false;
		}
		for( var i=0,len=aList.length; i<len; i++ ){
			this.load(aList[i]);
		}
		return true;
	},

	load:function( sID ){
		if(this.loadedCSS[sID]){
			return;
		}
		this.loadedCSS[sID]=1;
		var myCSS=document.createElement("link");
		myCSS.setAttribute("rel", "stylesheet");
		myCSS.setAttribute("type", "text/css");
		myCSS.setAttribute("href", CssLinks[sID]);
		myCSS.onload=function(){
			window.title = "css("+sID+")";
		};
		var head = document.getElementsByTagName("head")[0] || document.documentElement;
		head.insertBefore( myCSS, head.firstChild );
	}
};
var RSCR = function(scrID, callback, opt){
	//if(window[scrID]){
	if( Scripts.loadedScripts[scrID] && Scripts.loadedScripts[scrID].status==2 ){
		callback();
		return;
	}
	if(!(opt&&opt.silent)){
		DU.blockPr("Contents");
	}
	Scripts.load(scrID,function(){
		DU.unblockPr("Contents");;
		callback();
	});
};
var Scripts = {
	loadedScripts:{},
	loadedPackages:{},

	load:function( sID, callback ){
		if(this.loadedScripts[sID]){// in progress
			if(this.loadedScripts[sID].status==2){
				window.setTimeout( callback, 1 );
			}else{//TODO: push callback to listenersList
				this.loadedScripts[sID].listeners.push(callback);
			}
			return;
		}
		this.loadedScripts[sID]={status:1, listeners:[callback]};

		var myScript  = document.createElement("script"); 
		myScript.type = "text/javascript"; 
		myScript.src  = JSLinks[sID];
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
				Scripts.loadedScripts[sID].status=2;
				Enum( Scripts.loadedScripts[sID].listeners, function(listenerCallback){
					if(listenerCallback){
						listenerCallback();
					}
				});
				Scripts.loadedScripts[sID].listeners.length = 0;

				// Handle memory leak in IE
				myScript.onload = myScript.onreadystatechange = null;
				if( head && myScript.parentNode ) {
					head.removeChild( myScript );
				}
			}
		};
		head.insertBefore( myScript, head.firstChild );
	},
	
	loadPackage: function( sID, callback ){
		if( (this.loadedPackages[sID] == 2) || Packages[sID] == undefined ){
			//window.setTimeout( callback, 1 );
			callback();
			return;
		}
		this.loadedPackages[sID] = 1;
		var self = this;
		var aScripts = Packages[sID].scripts;
		if(aScripts==undefined){
			setTimeout(callback,1);
			return;
		}
		var nScript=0;
		var loadScript = function(){
			if(nScript<aScripts.length){
				self.load( aScripts[nScript], loadScript );
				nScript ++;
			}else{
				self.loadedPackages[sID] = 2;
				callback();
			}
		};
		loadScript();
	}
};

var SSN = {
	id:0,
	reset:function(){
		for( var key in this ){
			if( typeof this[key] == "string" || typeof this[key] == "number")
			delete this[key];
		}
		this.id=0;
	},
	sync:function(res){
		var me = this;
		Enum(["id", "gender", "activated", "mate", "mtid", "main_pic","mate_pic","black_list","questions", "wishers","visitors", "declines" ], function(key){
			_D(res[key]) ? (me[key] = _N(res[key])) : delete me[key];
		});
		Enum(["sid", "login_id", "mlogin", "error"], function(key){
			_D(res[key]) ? (me[key] = res[key]) : delete me[key];
		});
		return res;
	}
};
var undef;
var Defined=_D=function(v){
	return(typeof(v)!="undefined");
};

var ToolTip = {
	activeTip:null,
	init:function(){
		KEvents.listen( "mouseMotion", this.handleMouseOver, this );
	},
	handleMouseOver:function(inf){
		var target = inf.target;
		
		if(DU.childOf(target,_E("TipAnchor"))){
			return;
		}
		var tipped = DU.findAttr(target,"tip");
		
		if(!tipped){
			tipped = DU.findMethod(target,"ontooltip");
		}
		
		if( tipped ){
			if(!_D(tipped.ttid)){
				window.ttid = _D(window.ttid) ? window.ttid + 1 : 1;
				tipped.ttid=window.ttid;
			}
			Log("TT: " + tipped.ttid);
			ToolTip.show(tipped);
		}
	},
	show:function(el){

		if(U.cancelEvent("hideEvent", ToolTip)){
			Log("cancel hideEvent tt:" + el.ttid );
		}

		if( U.cancelEvent( "delayHideEvent", ToolTip )){
			Log("cancel delayHideEvent tt:" + el.ttid );
		}

		if(this.activeTip && this.activeTip.el==el){
			return;
		}

		Log("ToolTip.show tt:" + el.ttid );

		var pos = DU.absPos(el);
		var tip = this.createFrame(pos.left, pos.top + el.offsetHeight, el);
		
		_A(_CL("TipAnchor"), tip.frame);

		if( !this.activeTip || this.activeTip.frame.style.display == "none"){// starting tips
			_HI(tip.frame);
			this.showEvent = setTimeout(function(){
					delete ToolTip.showEvent; 
					_SH( tip.frame );
					Log("done showEvent tt:" + el.ttid);
				}, 
				1000
			);
			Log("start showEvent tt:" + el.ttid);
		}

		ToolTip.activeTip = tip;

		var sTip = _EA(el,"tip");
		if( sTip ){
			_HS( tip.contents, sTip );
		}

		var delayedHide = function(){
			if( U.cancelEvent( "showEvent", ToolTip ) ){
				delete ToolTip.activeTip;
				Log("cancel showEvent tt:" + el.ttid);
				return;
			}
			if(!ToolTip.activeTip){
				return ;
			}
			Log("start hideEvent tt:" + el.ttid);
			U.cancelEvent("hideEvent", ToolTip );
			ToolTip.hideEvent = setTimeout( function(){
					Log("done hideEvent tt:" + el.ttid);
					ToolTip.hide();
				},
				500
			);
		};

		el.onmouseout =function(e){
			Log("TT onmouseout tt:" + el.ttid);
			delayedHide();
		};
		
		if( el.ontooltip ){
			_A( tip.contents, el.ontooltip() );
			tip.frame.onmouseover = function(){
				ToolTip.show(el);
			};
			tip.frame.onmouseout = el.onmouseout;
		}

		//this.chkVisible(tip);
	},
	chkVisible:function(tip){
		if(U.dir()){
			if(tip.frame.offsetLeft<0){
				//tipf.firstChild.style.left = 
				tip.frame.style.left = "0px";
			}
		}
	},
	hide:function(){
		this.hideEvent = undef;
		this.activeTip = undef;
		_CL("TipAnchor");
	},
	createFrame:function(left, top, el){
		var tipw = _N(_EA(el, "tipw", "180"));
		var fr = _C("div", {"class":"tipFrame", style:"width:"+tipw+"px"});
		//var scr_width = document.documentElement.clientWidth;
		if(U.dir()){
			left -= (_N(tipw)-el.offsetWidth);
		}else{
			//if((left+tipw)>scr_width){
			//	left=scr_width-tipw;
			//}
		}
		//if(left<0){left=0;}
		fr.style.left = left.toString() + "px";
		fr.style.top = top.toString() + "px";
		_A( fr, "div", {"class":"tipArrow"} );

		return {"el":el, 
			frame:fr, 
			contents:_A(fr,"div", {"class":"shadow tipContents", style:"min-width:"+(_N(tipw)-8).toString()+"px"})
		};
	}
};

var Packages = {
	kmail:{
		scripts:[ "KMail", "KUI", "CDataViewer" ]
		,css:["kui","kmail"]
		,onload:"KMail.onload()"
		,onchange:"KMail.onchange()"
	},
	my:{
		scripts:[ "My", "KUI" ]
		,css:["kui"]
		,onload:"My.onload()"
		,onchange:"My.onchange()"
		,str:["str:my"]
	},
	contact:{
		scripts:[ "ContactUS", "KUI" ]
		,css:["kui"]
		,str:["str:contact"]
		,onload:"ContactUS.onload()"
	},
	declines:{
		scripts:[ "Declines", "KUI" ]
		,css:["kui","list"]
		,onload:"Declines.onload()"
		,onchange:"Declines.onchange()"
		,str:["str:declines"]
	},
	forgot:{
		scripts:[ "ForgotLogin", "KUI" ]
		,css:["kui"]
		,str:["profile:forgot"]
		,onload:"ForgotLogin.onload()"
	},
	upd_pass:{
		scripts:[ "UpdatePassword", "KUI" ]
		,css:["kui"]
		,str:["profile:upd_pass"]
		,onload:"UpdatePassword.onload()"
	},
	upd_email:{
		scripts:[ "UpdateEmail", "KUI" ]
		,css:["kui"]
		,str:["profile:upd_email"]
		,onload:"UpdateEmail.onload()"
	},
	acc_suspend:{
		scripts:[ "StopMembership", "KUI" ]
		,css:["kui"]
		,str:["profile:acc_suspend"]
		,onload:"StopMembership.onload()"
	},
	acc_activate:{
		scripts:[ "ActivateMembership", "KUI" ]
		,css:["kui"]
		,str:["profile:acc_activate"]
		,onload:"ActivateMembership.onload()"
	},
	decline:{
		scripts:[ "Decline", "KUI" ]
		,css:["kui","decline"]
		,onload:"Decline.onload()"
		,str:["contact:decline"]
	},
	cp_report:{
		scripts:[ "CPoints", "CDataViewer", "KUI", "CPointsReport" ]
		,css:["kui"]
		,onload:"CPointsReport.onload()"
		,str:["cpoints:report"]
	},
	cp_help:{
		scripts:[ "CPoints", "KUI" ]
		,css:["kui"]
		,onload:"CPointsHelp.onload()"
	},
	cp_eula:{
		scripts:[ "CPoints", "KUI" ]
		,onload:"CPointsEULA.onload()"
		,str:["cpoints:ui"]
	},
	cp_buy:{
		scripts:[ "CPoints", "KUI" ]
		,css:["kui"]
		,onload:"CPointsBuy.onload()"
	},
	phone_tr:{
		scripts:[ "CPoints", "KUI", "CPointByPhoneCard" ]
		,css:["kui","cpoints"]
		,onload:"CPointByPhoneCard.onload()"
		,str:["cpoints:phone_tr"]
	},
	upd_pics:{
		scripts:[ "UpdatePics", "KUI" ]
		,str:["pics:pics", "pics:select_matched_pics_visibility"]
		,onload:"UpdatePics.onload()"
		,css:["kui","mem"]
	},
	upd_attr:{
		scripts:[ "UpdateAttr", "KUI" ]
		,onload:"UpdateAttr.onload()"
		,css:["kui"]
	},
	upd_txt:{
		scripts:[ "UpdateText", "KUI" ]
		,onload:"UpdateText.onload()"
		,css:["kui"]
	},
	update:{
		scripts:[ "Update", "KUI" ]
		,str:["str:profile"]
		,onload:"Update.onload()"
		,onchange:"Update.onload()"
		,css:["kui"]
	},
	tip:{
		scripts:[ "ToolTip" ]
		,css:["tooltip"]
		,str:["help:tips"]
	},
	chat:{
		str:["str:chat","contact:contact_m","contact:points", "contact:contact"]
		,scripts:[ "Chat", "KUI" ]
		,css:["kui","chat"]
		,onload:"Chat.onload()"
		,onchange:"Chat.onchange()"
	},
	svd_srch:{
		scripts:[ "SavedSearch", "KUI" ]
		,onload:"SavedSearch.onload()"
		,css:["kui"]
	}
	,my_recent_questions:{
		scripts:[ "CDataViewer", "KUI", "QA", "QUI" ]
		,css:["kui","list"]
		,onload:"RecentQuestions.onload()"
		,onchange:"RecentQuestions.onchange()"
	}
	,my_recent_q_answers:{
		scripts:[ "KUI", "QA", "QUI" ]
		,css:["kui","list"]
		,onload:"RecentQAnswers.onload()"
		,onchange:"RecentQAnswers.onchange()"
	}
	,my_q_by_member:{
		scripts:[ "CDataViewer", "KUI", "QA", "QUI" ]
		,css:["kui","list"]
		,onload:"MyQByMember.onload()"
		,onchange:"MyQByMember.onchange()"
	}
	,qa:{
		scripts:[ "CDataViewer", "QA", "KUI", "QUI" ]
		,str:["qa:ui"]
		,css:["kui","list"]
		,onload:"QA.onload()"
		,onchange:"QA.onchange();"
	}
	,qa_lib:{
		scripts:[ "QUI", "CDataViewer", "Popup" ]
	}
	,smp_srch:{
		scripts:[ "KUI", "Search", "Drill", "SavedSearch" ]
		,css:["kui"]
		,onload:"Search.onload()"
	}
	,imem:{
		scripts:[ "IMem" ]
		,str:["str:filters","options:sfilters","str:filters_title"]
	}
	,cntx_menu:{
		scripts:[ "JCContextMenuBtn" ]
		,css:["cntx_menu"]
	}
	,init:{
		scripts:[ "Utils", "PgNav" ]
		,css:[]
		,onload:null
	}
	,home:{
		onload:"Home.onload()"
	}
	,register: {
		scripts:[ "Register" ]
		,str:["errors:error"]
		,css:["register"]
		,onload:"Register.onload()"
	}
	//,login: {
	//	scripts:[ "Login" ]
	//	,css:[]
	//	,onload:"Login.onload()"
	//}
	//,logout:{
	//	scripts:[ "Login" ]
	//	,onload:"Logout.onload()"
	//}
	,who: {
		scripts:[]
		,css:[]
	}
	,popup:{
		scripts:[ "Popup" ]
	}
	,list:{
		scripts:[ "List", "KUI" ]
		,str:["options:sfilters","str:filters_title","str:sort"]
		,css:["kui", "list"]
		,onload:"List.onload()"
		,onchange:"List.onload();PgNav.scrollTop();"
	}
	,mem:{
		scripts:[ "MemView", "KUI" ]
		,str:["str:filters","options:sfilters","str:filters_title","str:q", "str:m", "qa:ui"]
		,css:["kui", "mem"]
		,onload:"MemView.onload()"
		,onchange:"MemView.onchange()"
	}
	,drill:{
		scripts:[ "Drill", "KUI" ]
		,str:["str:filters","str:filters_title","options:sfilters"]
		,css:["kui"]
		,onload:"Drill.onload()"
		,onchange:"Drill.onchange()"
	}
};

var gCGI ={
	chat_msgs:		"msg_thread.pl",//
	pic:			"kpic.pl",//
	search:			"query.pl",//
	summary:		"grouping.pl",//
	member:			"mem_view.pl",//
	mem_qa:			"qa/member_qa.pl",
	pics:			"plist.pl",//
	login:			"login.pl",//
	upd_feedback:	"update_feedback.pl",//
	chk_lname:		"chk_login_name.pl",//
	upd_my_attr:	"update_profile_attr.pl",//
	upd_my_text:	"update_profile_text.pl",//
	qlist:			"qa/question_list.pl",
	search_ans:		"qa/search_answers.pl",
	recent_ans_4me: "qa/my_recent_q_answers.pl",
	my_recent_q:	"qa/my_recent_questions.pl",
	answers4u:		"qa/myq_member_answers.pl",
	relevant_ans:	"qa/relevant_member_answers.pl",
	my_new_q:		"qa/my_new_questions.pl",
	my_questions_by_member: "qa/my_questions_by_member.pl",
	savedQueries:	"my_queries.pl",//
	stats:			"nav5.pl",//
	featured:		"fmembers.pl",//
	visit:			"record_visit.pl",//

	unregister:		"unregister.pl",
	create_order:	"create_order.pl",
	contact:		"contact.pl",
	create_order:	"create_order.pl",
	get_password:	"get_password.pl",
	points_by_phone:"points_by_phone.pl",
	promote_fav_search: "promote_fav_search.pl",
	chg_email: 		"chg_email.pl",
	chg_pass:		"chg_pass.pl",
	set_pic_visibility: "set_pic_visibility.pl",
	set_top_pic: 	"set_top_pic.pl",
	del_pic: 		"del_pic.pl",
	match_cards_status: "match_cards_status.pl",
	declines:		"declines.pl",
	email_get_msg:	"email_get_msg.pl",
	chk_login_name: "chk_login_name.pl",
	set_main_pic: 	"set_main_pic.pl",
	activate:		"activate.pl"
};




