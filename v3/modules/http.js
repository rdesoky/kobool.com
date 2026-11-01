/**
 * Created by rdeso_000 on 1/4/2015.
 */

define(["jquery","kevents","dom-utils","js-promise","utils"], function($, evt, $du, CPromise, $u){

	var myHttp,
		apiBase = (window.APP_CONFIG && window.APP_CONFIG.apiBase) || "/cgi-bin/",
		activeReq={};

	return myHttp = {
		cache:{},
		api: {
			//search:			"/api/users",//"query.pl",//
			//summary:		"/api/grouping",//"grouping.pl",//
			//member:			"/api/user",//"mem_view.pl",//
			//pic:			"/kpic",//'cgi-bin/kpic.pl'
			//stats:			"/api/nav", //"cgi-bin/nav5.pl",
			//visit:			"/api/visit", //"cgi-bin/record_visit.pl",// TODO: fake implementation

			search:			apiBase + "query.pl",//
			summary:		apiBase + "grouping.pl",//
			member:			apiBase + "mem_view.pl",//
			pic:			apiBase + "kpic.pl",
			stats:			apiBase + "nav6.pl",
			visit:			apiBase + "record_visit.pl",// TODO: fake implementation

			// TODO: implement
			login:			apiBase + "login.pl",// returns XML
			mem_qa:			apiBase + "qa/member_qa.pl",
			pics:			apiBase + "plist.pl",//
			logout:			apiBase + "logout.pl",//
			ssn_ping: 		apiBase + "ssn_ping.pl",
			upd_feedback:	apiBase + "update_feedback.pl",//
			chk_lname:		apiBase + "chk_login_name.pl",//
			upd_my_attr:	apiBase + "update_profile_attr.pl",//
			upd_my_text:	apiBase + "update_profile_text.pl",//
			qlist:			apiBase + "qa/question_list.pl",
			search_ans:		apiBase + "qa/search_answers.pl",
			recent_ans_4me: apiBase + "qa/my_recent_q_answers.pl",
			my_recent_q:	apiBase + "qa/my_recent_questions.pl",
			answers4u:		apiBase + "qa/myq_member_answers.pl",
			relevant_ans:	apiBase + "qa/relevant_member_answers.pl",
			my_new_q:		apiBase + "qa/my_new_questions.pl",
			my_questions_by_member: apiBase + "qa/my_questions_by_member.pl",
			savedQueries:	apiBase + "my_queries.pl",//
			saveSearch:		apiBase + "save_query.pl",
			featured:		apiBase + "fmembers.pl",

			unregister:		apiBase + "unregister.pl",
			create_order:	apiBase + "create_order.pl",
			contact:		apiBase + "contact.pl",

			contact_m:		apiBase + "contact_m.pl",
			set_msg_dir:	apiBase + "set_msg_dir.pl",
			get_password:	apiBase + "get_password.pl",
			delete_msg: 	apiBase + "delete_msg.pl",
			chat_ping:		apiBase + "chat_ping.pl",
			chat_msgs:		apiBase + "msg_thread.pl",//

			points_by_phone: apiBase + "points_by_phone.pl",
			promote_fav_search: apiBase + "promote_fav_search.pl",
			chg_email: 		apiBase + "chg_email.pl",
			chg_pass:		apiBase + "chg_pass.pl",
			upload_pic:		apiBase + "upload_pic.pl",
			set_pic_visibility: apiBase + "set_pic_visibility.pl",
			set_top_pic: 	apiBase + "set_top_pic.pl",
			del_pic: 		apiBase + "del_pic.pl",
			match_cards_status: apiBase + "match_cards_status.pl",
			declines:		apiBase + "declines.pl",
			email_get_msg:	apiBase + "email_get_msg.pl",
			chk_login_name: apiBase + "chk_login_name.pl",
			set_main_pic: apiBase + "set_main_pic.pl",
			activate:		apiBase + "activate.pl",

			add_kobool: 		apiBase + "add2wishlist.pl",
			delete_wish: 		apiBase + "delete_wish.pl",
			promote_wish: 		apiBase + "promote_wish.pl",
			demote_wish: 		apiBase + "demote_wish.pl",
			set_wish_visibility: apiBase + "set_wish_visibility.pl",

			delete_search: apiBase + "delete_search.js.pl",
			my_cards: apiBase + "mycards.pl",
			unuse_points: apiBase + "unuse_points.pl",

			register: 			apiBase + "register.pl",


			add_bookmark: 		apiBase + "addbookmark.pl",
			delete_bookmark: 	apiBase + "delete_bookmark.pl",
			block: 				apiBase + "block.pl",
			unblock: 			apiBase + "unblock.pl",

			decline:			apiBase + "decline.pl",
			use_point:			apiBase + "use_point.pl",

			ask:				apiBase + "qa/ask.pl",
			post_answer:		apiBase + "qa/answer.pl",
			answer_later:		apiBase + "qa/postpone_answer.pl",
			remove_fav_question: apiBase + "qa/remove_my_question.pl",

			matching_time_left: apiBase + "matching_time_left.pl"

		},

		xml2JS:function(xml){
			var js = {
				child_list:[]
			};
			$.each(xml.documentElement.attributes,function(att){
				js[att.name]=att.value;
			});
			$.each( xml.documentElement.getElementsByTagName("option"),function(n){
				var ch = {};
				js.child_list.push(ch);
				$.each(n.attributes,function(att){
					ch[att.name]=att.value;
				});
				ch.textContent=n.textContent;
			});
			return js;
		},
		createRequest:function( sURL, postData, onSuccess, onError, onTimeout ){
			var req, promise = new CPromise();

			if( !postData && _D(activeReq[sURL]) )
			{// existing GET request
				req = activeReq[sURL];
				if(_D(onSuccess)){
					req.onSuccess.push(onSuccess);
				}
				if(_D(onError)){
					req.onError.push(onError);
				}
				if(_D(onTimeout)){
					req.onTimeout.push(onTimeout);
				}
				return req;
			}

			//POST or new GET
			var readystateHandler= function(){
				if(	req.http.readyState == 4 ){
					$u.cancelEvent( "hTimeout", req );

					if( req.http.status == 200 ){
						evt.fire("ServerResponse",{url:sURL});

						var fn, i, response = {
							responseText: req.http.responseText
						};

						if(req.http.responseXML && req.http.responseXML.documentElement){
							response.responseXML = req.http.responseXML;
						}

						for(i=0; i<req.onSuccess.length; i++){// find callback functions
							fn = req.onSuccess[i];
							if(_D(fn)){
								fn( response.responseText, response.responseXML );
							}
						}
						promise.fulfill(response);

					}else if( req.http.status ){// not abort
						for( i=0; i<req.onError.length; i++ ){
							fn = req.onError[i];
							if(_D(fn)){
								fn();
							}
						}
					}

					if( req.http.status ){// not abort
						delete activeReq[sURL];
					}
				}
			};
			var tmo = 30000;
			var timeout = function(){
				req.http.onreadystatechange = null;
				if(req.retry>=10){
					for( var i=0; i<req.onTimeout.length; i++ ){
						var fn = req.onTimeout[i];
						if(_D(fn)){
							fn();
						}
					}
					return;
				}
				req.http.abort();
				req.http = myHttp.getAJAX();
				req.http.onreadystatechange = readystateHandler;
				req.retry ++;
				req.hTimeout = setTimeout( timeout, tmo );
				myHttp.sendRequest(sURL, postData);//resend request
			};

			req = activeReq[sURL] = {
				retry:0,
				http:this.getAJAX(),
				onSuccess:[onSuccess],
				onError:[onError],
				onTimeout:[onTimeout],
				promise: promise,
				abort:function(){
					this.http.abort();
					delete activeReq[sURL];
				}
			};

			req.hTimeout = setTimeout(timeout, tmo);
			req.http.onreadystatechange = readystateHandler;

			return req;
		},

		sendRequest:function(sURL, postData){
			var req = activeReq[sURL];
			if( !req ){
				return null;
			}
			if( postData ){
				req.http.open( "POST", sURL, true );
				req.http.setRequestHeader("sid", _GC("sid"));
				req.http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				req.http.send( postData );
			}else{
				req.http.open( "GET", sURL, true );
				req.http.setRequestHeader("sid", _GC("sid"));
				req.http.send( null );
			}

			req.sent = true;

			return req;
		},

		request:function( sURL, onSuccess, callerInfo, onError, postData ){
			var req = this.createRequest(sURL, postData, onSuccess, onError);// create or attach to existing one
			if( !req.sent ){
				this.sendRequest(sURL, postData);
			}
			return req.promise;
		},
		refresh:function(){
			this.cache = {};
			_SC( "tx", (_GCN("tx",0) + 1 ).toString() );
			evt.fire("refreshData");
		},
		getCGI: function( scrpt, params , onLoad, onError ){
			var tmc = (new Date()).getTime();
			tmc -= (tmc % (15 * 60000));// 15 minutes refresh interval
			tmc += _GCN("tx",0);
			//params.lang = _GC("lang","en");//TODO: remove

			return this.request(
				scrpt + "?" + $u.hash2Query(params,{tmc:tmc}),
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
				case myHttp.api.stats:
				case myHttp.api.chat_ping:
				case myHttp.api.chat_msgs:
				case myHttp.api.visit:
				case myHttp.api.pics:
					break;
				default:
					ga('send', {
						hitType: 'event',
						eventCategory: $u.getPageID(),
						eventAction: 'post',
						eventLabel: p.scr.substr("/cgi-bin/".length)
					});
			}

			var pr = p.silent?undefined:$du.blockPr("Contents");
			var ret = this.request(
				p.scr,
				function(res,xml){
					$du.unblockPr("Contents");
					if(p.onload){
						p.onload(res,xml);
					}
				},
				null,
				p.error,
				$u.hash2Query(p.data||{x:1})
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
		picSRC:function(id, gender, tn){
			return this.api.pic + "?tn=" + (tn!==undefined?"1":"0") + "&id=" + id + "&g=" + gender;
		},
		pageLink:function(pgID){
			return PgLinks[pgID] || (pgID + ".html?lang=" + $u.lang());
		},
		css: {
			loadedCSS:{kui:true},
			loadedPackages:{},

			loadList:function(cssList){
				var prList = [];
				for( var i=0;(cssList!==undefined) && i<cssList.length; i++ ){
					prList.push(this.load(cssList[i]));
				}
				return CPromise.all(prList);
			},

			load:function( sID, timeout ){
				var href = CssLinks[sID];

				if(this.loadedCSS[sID]){
					return this.loadedCSS[sID];
				}

				return this.loadedCSS[sID] = new CPromise(function(onSuccess, onError) {

					var myCSS = document.createElement("link");
					myCSS.setAttribute("rel", "stylesheet");
					myCSS.setAttribute("type", "text/css");
					myCSS.setAttribute("href", href);
					var hTimeout = setTimeout(onSuccess, timeout || 4000);
					myCSS.onload = function () {
						clearTimeout(hTimeout);
						onSuccess(myCSS);
					};
					var head = document.getElementsByTagName("head")[0] || document.documentElement;
					head.appendChild(myCSS);
				});
			}
		}
	};
});