var Chat = {
	onload:function(){
		if( !KUI.chkLogin({nav:true}) ){
			return;
		}

		if(!SSN.mate){
			PgNav.open("my",undef,true,true);
		}

		TopTabs.select("HdrChat");

		var cnt = _CL("Contents");
		
		var side	= _AD(cnt, {id:"LeftSide", "class":"chat_side"} );
		var body	= _AD(cnt, {id:"ChatBody", "class":"chat_contents"});
		var footer	= _AD(cnt, {"class":"chat_footer"});

		_AD( side, {"class":"chat_intro_text"}, _TXT( _S("contact:contact_m.intro").replace(/\%m\%/g, SSN.mlogin).replace(/\%h.{1}\%/g,"") ) );

		_AD( body );//??

		_AD( body, {id:"ThreadView"} );

		_AD( footer, {id:"ChatTypingBox"} );
		_AD( footer, {id:"StatusView"} );

		this.getPage( this.lastPg = _N(_P("p",0)) );
	},

	renderTypingBox:function(root, info){
		var frm = _A( root, "form", {name:"ChatEditor"} );
		
		_A( frm, [
			_C("input", {type:"hidden", name:"live", value:0} ),
			//_C("input", {type:"hidden", name:"mid",  value:SSN.mate} ),
			//_C("input", {type:"hidden", name:"mtid", value:SSN.mtid} ),
			_C("input", {type:"hidden", name:"update", value:0} ),
			_C("input", {type:"hidden", name:"msid", value:0} ),
		]);

		var row = _AD( frm, {"class":"chat_form_line"} );

		var lc = _AD( row, {"class":"chat_box_col left_col"} );
		var cc = _AD( row, {"class":"chat_editor chat_box_col"});
		var rc = _AD( row, {"class":"chat_box_col"});

		var txt = _A( cc, "textarea", {name:"msg",style:"display:none"} );
		var sel = _AD( cc, {"class":"pdm_frame"} );
		var rtm;

		if( info.can_type=="1" ){
			var chk_frm = _A( lc, (new CCheckFrame()).getDOM() );
			rtm = _A( chk_frm, "input", {type:"checkbox", name:"rtm",value:"0"} );
			_A( chk_frm,_TXT( _S("contact:contact_m.written") ) );
		}

		_AD( lc, {id:"ChatPointsStatus"} );

		var sendBtn = _C("span", {"class":"button float_right"}, _S("contact:contact_m.submit") );

		RS( "options:chat", function(){
			var ndx = 1;
			Enum( _E("options:chat").childNodes, function( el ){
				if( _D(el.innerHTML) ){
					if(el.innerHTML.trim().length){
						var msg_id = ndx;
						var msg = el.innerHTML;
						var item = _AD(sel);
						_AD( item, {"class":"href"}, msg );
						item.onclick=function(e){
							Chat.select(this);
							this.insertBefore(sendBtn, this.firstChild);
							sendBtn.onclick = function(){
								frm.msid.value = msg_id;
								return frm.onsubmit();
							};
						};
					}else{
						_A(sel, "hr", {style:"margin:9px 0px"});
					}
					ndx++;
				}
			});
		});

		// right side
		var submt = _A( rc, "input", {type:"submit", style:"display:none", value: _S("contact:contact_m.submit")} );

		if( info.can_type=="1" ){
			rtm.onclick=function(e){
				if(this.checked){
					_SH([txt,submt]);
					_HI(sel);
					frm.msg.focus();
				}else{
					_HI([txt, submt]);
					_SH(sel);
				}
			};
			rtm.click();
		}

		frm.onsubmit=function(){
			frm.msg.value = frm.msg.value.trim();
			frm.live.value = Chat.live ? "1":"0";

			var pdata = PgNav.form2Hash( this );
			pdata.pd = ( frm.rtm && frm.rtm.checked ? 1 : 0 );

			if( !pdata.pd || frm.msg.value.length ){
				submt.disabled = true;
				Http.post({
					scr: "contact_m.pl",
					data: pdata,
					onload:function(t,x){
						submt.disabled = false;
						var info = Http.xml2JS(x);
						if(_N(info.success)){
							frm.msg.value = "";
							Chat.getPage( Chat.lastPg=0 );
							frm.rtm.onclick();
						}else{
							//TODO: show error
						}
					},
					silent:true
				});
			}
			return false;
		};
	},
	onchange:function(){
		this.getPage( _P("p",0) );
	},
	ping:function(){
		this.pinging = 0;
		
		if(!document.forms.ChatEditor){
			return;
		}

		Http.post({
			scr:"chat_ping.pl", 
			data:{
				id:SSN.id,
				mid:SSN.mate,
				t:(document.forms.ChatEditor.msg.value.trim().length?"1":"0")
			}, 
			silent:true,
			onload:function(t,x){
				//_H("Debug",res);
				var info = Http.xml2JS(x);
				var stView = _CL("StatusView"); 
				if( _N(info.mate_online) ){
					Chat.live = true;
					//document.forms.ChatEditor.live.value = "1";
					if(_N(info.t)){//typing
						_A( stView, "span", {"class":"online typing"}, _S("contact:contact_m.mate_typing").replace(/\%m\%/g, SSN.mlogin) );
					}else{
						_A( stView, "span", {"class":"online"}, _S("contact:contact_m.mate_online").replace(/\%m\%/g, SSN.mlogin) );
					}
					if(_N(info.new_post)){
						Chat.onchange();
					}
				}else{
					Chat.live = false;
					//document.forms.ChatEditor.live.value = "0";
					_AD( stView, {"class":"offline"}, _TXT(_S("contact:contact_m.mate_offline").replace(/\%m\%/g, SSN.mlogin) ) );
					//_AD( stView, {"class":"note"}, _S("contact:contact_m.mate_last_login").replace("%d%",info.mate_last_ping).replace("%m%",SSN.mlogin) );
				}

				Chat.pinging = setTimeout(function(){
					Chat.ping();
				}, 5000);
			}
		});
	},

	getPage:function(p){
		var root = _E("ThreadView");
		//var pr = DU.blockPr(root);
		var pr = _R( KUI.blockedEl("ThreadRoot") );
		_A( _CL(root), pr );

		Http.post({
			scr: gCGI.chat_msgs, 
			data: { "p": p, js:1 }, 
			silent:true,
			onload:function(t,x){
				_H("Debug", t);
				var r = JSN(t);
				var tBox = _E("ChatTypingBox");
				if( tBox && !tBox.firstChild ){
					Chat.renderTypingBox( tBox, r );
					Chat.showPStatus(r, _CL("ChatPointsStatus") );
					if( !Chat.pinging ){//verify single pinger
						Chat.ping();
					}
				}
				Chat.showPage( r, _AD(_CL(root), {id:"ThreadRoot"}) );
			}
		});
	},

	showPStatus:function( res, root ){
		var p = _AD(root, {"class":"parag points_monitor"});
		
		_AD( p, {"class":"bold"}, _S("contact:points.monitor") + ":" );//_S("contact:contact_m.used_cards") ) );
		
		var tbl = _AT( p, {"class":"full_width",cellpadding:2},[{"class":"box"},{"class":"bold tainted"}], 2);
		_A(tbl.rows[0][0],_TXT(SSN.login_id));
		_A(tbl.rows[0][1],_TXT(res.my_cards));
		_A(tbl.rows[1][0],_TXT(SSN.mlogin));
		_A(tbl.rows[1][1],_TXT(res.mate_cards));

		if( _N(res.my_cards)>1 ){
			_AD( root, {"class":"light_txt hilight box padding"}, SSN.login_id + " " + _S("contact:points.gift_msg") + " " + SSN.mlogin );
		}else if( _N(res.mate_cards)>1 ){
			_AD( root, {"class":"light_txt hilight box padding"}, SSN.mlogin + " " + _S("contact:points.gift_msg") + " " + SSN.login_id );
		}
		if( _N(res.my_cards) + _N(res.mate_cards) < 2){
			_A( _AD(root), "input", {"type":"button", "class":"button", value:_S("contact:points.goto_points") } ).onclick=function(){
				PgNav.open("cp_report", undef, true);
			};
		}

	},
	
	showPage:function(results, root){
		if(!_N(results.total)){
			_A(root,"h2",{},_S("contact:contact_m.no_msgs"));
			return ;
		}
		var navCallback=function(p){
			PgNav.chgParams({"p":p},undef,false,true);
		};
		_A( root, KUI.renderNav( results, navCallback, true ) );
		var owner = 0;//1:self, 2:mate
		var bubble;
		Enum(results.child_list, function(info){
			var o = (info.id_sender == SSN.id)?1:2;//1:self
			if( o != owner ){// write sender name
				bubble = _AD(root, {"class":"chat_bubble " + (o==1?"sent" : "recieved")});
				if( o==1 ){
					_A(bubble,"img",{"class":"float_left tiny_pic", src:U.picSRC(SSN.main_pic,SSN.gender,true)} );
				}else{
					U.disableSelection(
						_A(bubble,"img",{"class":"float_left tiny_pic", src:U.picSRC(SSN.mate_pic,SSN.gender?0:1,true)} )
					);
				}
			}

			
			var msg = _AD( bubble,{"class":"chat_msg_box " + (o==1?"sent" : "recieved")} );

			var tline = _AD( msg, {"class":"chat_time_line float_right"} );
			if( o != owner ){// write sender name
				_AD( msg, {"class":"chat_msg_author"}, (o==1?_S("contact:contact_m.you"):SSN.mlogin) );
				owner = o;
			}

			var tbar = _A( msg, "span", {"class":"clear_right float_right", style:"direction:ltr"} );
			_A( msg, "span",{}, "#" + info.msg_index + ": " );
			
			
			_A( tline, "span", {"class":"chat_msg_time posted_msg"}, _S("contact:contact_m.posted_on") + ":" + info.sent_on );

			var dir = info.language == "1" ? "rtl" : "ltr";
			//var algn = info.language == "1" ? "right" : "left";
			var txt = _AD( msg, {"class":"chat_msg_text"} );


			var msg = _AD( txt, {style:"direction:"+dir}, info.body.replace(/\n/g,"<br/>"));
			
			if(info.recieved_on){
				_A( tline, "span", {"class":"chat_msg_time read_msg"}, " " + _S("contact:contact_m.read_on") + ":" + info.recieved_on );
			}else{
				_A( tline, "span", {"class":"chat_msg_time unread_msg"}, " " + _S("contact:contact_m.not_read") );
				if( o==1 && !Chat.live){
					_A( tbar, "span", {"class":"icon16 icon16-delete"} ).onclick=function(){
						//delete msg
						Req("popup", function(){
							Popup.open("confirm",undef,"a.sure",[
								{
									title:_S("a.yes"),
									onclick:function(){
										Http.post({
											scr:"delete_msg.pl", 
											data: {msg:info.id, mid:SSN.mate, mtid:SSN.mtid, dir:(msg.style.direction=="rtl"?0:1)} ,
											onload: function(t,x){
												Chat.onchange();
											}
										});
									}
								},
								{
									title:_S("a.no"),
									focus:true
								}
							]);
						});
					};
				}
				if( o==1 && !_N(info.is_free) && !Chat.live){
					_A( tbar, "span", {"class":"icon16 icon16-edit"} ).onclick=function(){
						//update msg
						Req("popup", function(){
							var editor = _C("textarea",{style:"width:420px;height:120px"}, info.body);
							
							Popup.open("update_msg", _TXT(("a.update") + " #" + info.msg_index) , editor,[
								{
									title:_S("a.save"),
									onclick:function(){
										Http.post({
											scr:"contact_m.pl", 
											data:{pd:1, update:info.id, mid:SSN.mate, mtid:SSN.mtid, msg:editor.value},
											onload:function(t,x){
												Chat.onchange();
											}
										});
									}
								},
								{
									title:_S("a.cancel")
								}
							]);
							editor.focus();
						});
					};
				}
			}

			if( o==1 ){
				_A( tbar, "span", {"class":"icon16 icon16-toggle"} ).onclick=function(){
					//toggle msg
					Http.post({
						scr:"set_msg_dir.pl", 
						data:{ msg:info.id, dir:(msg.style.direction=="rtl"?0:1) },
						onload:function(){
							msg.style.direction = (msg.style.direction == "rtl") ? "ltr" : "rtl";
						}
					});
					
					//msg.style.textAlign = (msg.style.direction == "rtl") ? "right" : "left";
				};
			}
			var mate_name = "<b>" + SSN.mlogin + "</b>";
			if( !_N(info.is_free) ){
				if( o==1 && !_N(results.mate_can_read) ){
					_AD(bubble, {"class":"unreadable_msg"}, _S("contact:contact.mate_cant_read_msg").replace("ref1", "class='href' onclick=\"PgNav.open('cp_report');\"").replace(/%m%/g, mate_name) );
				}
				if( o==2 && !_N(results.can_type) ){
					_AD(bubble, {"class":"unreadable_msg"}, _S("contact:contact.you_cant_read_msg").replace("ref1", "class='href' onclick=\"PgNav.open('cp_report');\"").replace(/%m%/g, mate_name) );
				}
			}
		});
		
		_A( root, KUI.renderNav( results, navCallback, true ) );
		
		if(this.lastPg <= _N(results.page)){
			document.body.scrollTop = document.documentElement.scrollTop = 100000;
		}else{
			document.body.scrollTop = document.documentElement.scrollTop = 0;
		}
		this.lastPg = _N(results.page);
	}
};

U.extend( Chat, CSelector.classDef );
