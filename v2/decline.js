var Decline={
	onload:function(){
		TopTabs.showTab("Menu.CPoints");
		TopTabs.select("HdrDecline");

		if( !KUI.chkLogin({nav:true}) ){
			return;
		}

		if( !SSN.mate ){
			PgNav.open("home",undef,undef,true);
		}
		
		var mate_name = "<b>" + SSN.mlogin + "</b>";
		_HS( _A( "Contents","div",{"class":"pg_header title"} ), "contact:decline.title" );

		var root = _A("Contents", "div", {"class":"pg_body"} );

		_A( root, "div", {"class":"text_view"}, _S("contact:decline.intro").replace(/\%m\%/g, mate_name) );

		var frm	= _A(root, "form", {"class":"form_frame", id:"DeclineForm"}, KUI.getProgress() );

		_A(root, "div", {"class":"parag text_view"}, _S("contact:decline.note").replace("ref1", "class='href' onclick=\"PgNav.open('chat');\"").replace(/\%m\%/g, mate_name) );
		_A(root, "div", {"class":"parag text_view"}, _S("contact:decline.warning").replace("ref1", "class='href' onclick=\"PgNav.open('acc_suspend');\"").replace(/\%m\%/g, mate_name) );

		Http.getCGI(gCGI.match_cards_status,{}, function(t,x){
			_H("Debug",t);	
			var r = Http.xml2JS(x);
			Decline.populateForm( _CL(frm), r );
		});
	},
	
	populateForm:function(frm, pstatus){
		_A( frm, "div", {"class":"form_title"}, _S("contact:decline.form_title") );

		var ftbl = _AT( frm, {border:0}, [{style:"width:30%", "class":"vtop"},{"class":"vtop", style:"width:70%"}], 3);
	
		_HS( ftbl.rows[0][0], "contact:decline.password" );
		_HS( ftbl.rows[1][0], "contact:decline.msg_title" );

		_A(ftbl.rows[0][1],"input",{type:"password", name:"pw"});

		var lst = _C("div",{"class":"box"});
		var txt_area = _C("textarea",{name:"msg", style:"display:none"});

		var points_status = _C("div",{"class":"hilight light_txt"});
		var gotoReport = function(){
			PgNav.open("cp_report");
		};
		var setStatusText=function(pd){
			if(pd==0){// written unchecked
				if( _N(pstatus.need_card) ){
					_H( points_status, _S("contact:decline.need_point") );
					_A( _AD(points_status), "span",{"class":"button"}, _S("contact:decline.use_point")).onclick=gotoReport;
				}else if( _N(pstatus.mate_needs_card) ){
					_H( points_status, _S("contact:decline.mate_need_point") );
					_A( _AD(points_status), "span",{"class":"button"}, _S("contact:decline.use_point4mate")).onclick=gotoReport;
				}
				if( !_N(pstatus.need_card) ){
					if( _N(pstatus.refundable) ){
						_H( ftbl.rows[2][0], _S("contact:decline.usable_points") );
					}else{
						_H( ftbl.rows[2][0], _S("contact:decline.used_points") );
					}
				}
			}else{//written checked
				if( _N(pstatus.refundable) ){
					_H( ftbl.rows[2][0], _S("contact:decline.lose_points") );
				}else{
					_H( ftbl.rows[2][0], _S("contact:decline.used_points") );
				}
			}
		};
		
		var sel = _A( ftbl.rows[1][0], "div" );
		U.extend(sel, CSelector.classDef);

		frm.onsubmit=function(){
			var rtm;
			
			if(!this.pw.value.trim().length){
				KUI.msgbox({
					title:"a.error",
					msg:"contact:decline.no_password",
					onclose:function(){
						frm.pw.focus();
					}
				});
				return false;
			}

			var paid = ( frm.pd && frm.pd.checked ) ? 1:0;
			var par = { 	
				pw:frm.pw.value.trim(), 
				pd:paid, 
				msg: paid ? frm.msg.value.trim() : ( sel.selItem?sel.selItem.innerHTML : "" ) 
			};
			var msg_error = (par.msg.length > 10) ? null : ( (par.msg.length == 0) ? "contact:decline.no_msg" : "contact:decline.msg_too_short");
			if( msg_error ){
				KUI.msgbox({
					msg:msg_error,
					onclose:function(){
						if(rtm && rtm.checked){
							frm.msg.focus();
						}
					}
				});
				return false;
			}
			var msg = _C("div",{"class":"text_view"});
			
			_HS( _A(msg,"p"), "contact:decline.confirm" );
			_A(msg,"div",{"class":"box padding"}, par.msg );

			KUI.confirm(
				msg, 
				function(){
					Http.postUpdate( "decline.pl", par, function(t,x){
						var r=Http.xml2JS(x);
						if( _N(r.success) ){
							IMem.refreshHeader( true );
							KUI.msgbox({
								msg:"contact:decline.done", 
								onclose:function(){
									PgNav.open("declines",undef,true,true);
								}
							});
						}else{
							KUI.msgbox({msg:"errors:error." + r.error});
						}
					});
				}, 
				"contact:decline.title"
			);
			return false;
		};

		_A( ftbl.rows[1][0], points_status );

		_A(ftbl.rows[1][1], lst);
		_A(ftbl.rows[1][1], txt_area);

		_A(ftbl.rows[2][1],"input",{type:"submit", value:_S("contact:decline.submit_title")});

		if( !_N(pstatus.need_card) && !_N(pstatus.mate_needs_card) ){// can write
			
			var chk_frm = _A( sel, (new CCheckFrame()).getDOM() );
			rtm = _A( chk_frm, "input", {type:"checkbox", name:"pd", checked: !_N(pstatus.refundable) } );

			_A( chk_frm, _TXT( _S("contact:decline.written_msg") ) );

			var onChangeWritten=function(){
				if(rtm.checked){
					_SH( txt_area );
					_HI(lst);
					txt_area.focus();
				}else{
					_SH(lst);
					_HI(txt_area);
				}
				setStatusText(rtm.checked);

			};

			rtm.onclick=onChangeWritten;
			onChangeWritten();
			frm.pw.focus();
		}else{
			setStatusText(0);
		}
		
		RS( "str:decline_msgs", function(){
			Enum( _E("str:decline_msgs").childNodes, function( el ){
				if(_D(el.innerHTML) && el.innerHTML.length){
					_A(lst, "li", {"class":"href"}, el.innerHTML).onclick=function(e){
						sel.select(this);
					};
				}
			});
		});


	}
};