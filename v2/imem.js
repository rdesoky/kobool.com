var IMem={
	refreshHeader:function(force){
		if( SSN.id==_N(_GC("id")) && !force ){//check actual login or logout
			_A( _CL("MemberBox"), this.renderBox() );
		}else{
			if(_N(_GC("id"))){
				//reload session info
				this.login(
					{auto:1},
					undef,
					function(){//onerror: session timeout
						IMem.logout();
					}
				); 
			}else{
				this.logout();
			}
		}
	},

	renderBox:function(){
		if( ! SSN.id ){
			return null;
		}
		var root=_C( "div", {"class":"member_box"} );
		var inf = SSN;
		if(inf.error){
			_A(root,"span",{"class":"href"},inf.error).onclick=function(){
				IMem.logout();
			};
		}else{
			_SH("MemberBox,MemberMenu,MemberSubmenu");
			_HI("GuestMenu");
			
			RS( "str:m", function(){

				var stats = _CL("StatsMenu");//_A(root, "div", {id:"StatsMenu"});

				if( SSN.questions ){
					_HSEP(stats);
					_A( stats, "a", {href:"#pg=mem&mem=" + SSN.id + "&mtab=TNewQ"} , U.brackets( SSN.questions, _S("m.questions") ) );
				}
				if( SSN.visitors ){
					_HSEP(stats);
					_A( stats, "a", {href:"#pg=list&ls=vtr&ob=rv"} , U.brackets( SSN.visitors, _S("m.visitors") ) );
				}
				if( SSN.wishers ){
					_HSEP(stats);
					_A( stats, "a", {href:"#pg=list&ls=wsr&ob=ra", tip:"help:tips.wishers"} , U.brackets( SSN.wishers, _S("m.wishers") ) );
				}
				if( SSN.declines ){
					_HSEP(stats);
					_A( stats, "a", {id:"Stats.Declines", href:"#pg=declines"} , U.brackets( SSN.declines, _S("m.declines") ) );
				}

			});
			var msg = _AD(root,{"class":"login_msg"});
			var t = _AT(root,{cellspacing:0, cellpadding:0, border:0},[{},{},{},{}]);
			var img = _A(_A(t.cols[0],"div",{"class":"pic50frame"}),"img",{id:"ProfilePic",src:U.picSRC(inf.main_pic,_N(inf.gender),true) } )
			img.onclick=function(){
				PgNav.open("mem",{mem:false},true);
			};
			var lout, inact;
			if(inf.mate){
				_A( t.cols[1],"span",{"class":"ani_heart"} );
				var matePic= _A( _A(t.cols[2],"div",{"class":"pic50frame"}),"img",{src:U.picSRC(inf.mate_pic,_N(inf.gender)?0:1,true) });
				U.disableSelection(matePic);
				var mateTooltip = function(){return KUI.memTooltip(inf.mate);};
				var mateClick = function(){ PgNav.open( "mem", {mem:inf.mate}, true ); };
				matePic.onclick=mateClick;
				matePic.ontooltip=mateTooltip;
				var mm = _AT( msg,{"class":"welcome_table"},
					[
						undef,
						{"class":"href bold tahoma"},
						undef,
						{"class":"href bold tahoma"},
						undef,
						undef,
						{"class":"button",id:"HdrChat"},
						{"class":"button",id:"HdrDecline",tip:"help:tips.decline"},
						{"class":"vtop"},
						{"class":"button"}
					]
				);

				_H( mm.cols[0], _S("a.welcome") + " " );
				_H( mm.cols[1], SSN.login_id ).onclick=function(){PgNav.open("mem",{mem:false});};
				_A( mm.cols[2], _TXT(","));
				var mateName = _H( mm.cols[3], inf.mlogin );
				mateName.onclick=mateClick;
				mateName.ontooltip=mateTooltip;
				_A( mm.cols[4], _TXT(" "));
				_H( mm.cols[5], _S("a.matched_msg") );
				
				_H( mm.cols[6], _S("mate_menu.contact") ).onclick=function(){
					PgNav.open( "chat", undef, true );
					return false;
				};
				_H( mm.cols[7], _S("mate_menu.decline") ).onclick=function(){
					PgNav.open("decline",undef,true);
					return false;
				};
				inact = mm.cols[8];
				lout = mm.cols[9]
			}else{
				msg = _AT( msg,{"class":"welcome_table"},[{},{},{},{"class":"button"}] );
				_A( msg.cols[0], "span", {}, _S("a.welcome") + " " );
				_A( msg.cols[1], "span", {"class":"href bold tahoma"}, SSN.login_id ).onclick=function(){PgNav.open("mem",{mem:false});};
				inact = msg.cols[2];
				lout = msg.cols[3];
			}

			if(!_N(inf.activated)){
				DU.addClass(inact,"button white_bg");
				_H(inact, _S("a.inactive") );
				inact.onclick=function(){
					PgNav.open("acc_activate",{},true);
				};
			}

			_H( lout, "&nbsp;" + _S("a.logout") + "&nbsp;"  );
			lout.onclick=function(){
				IMem.logout();
				PgNav.open("home");
				return false;
			};
		}

		return root;
	},

	logout:function(){
		Http.post({
			refresh:1,
			scr:"logout.pl",
			onload:function(){
				KEvents.fire("onlogout",{id: _GC("id") });
				Enum( ["id","sid","myinfo","hspg","qls"], function(v){
					U.delCookie(v);
				});
				SSN.reset();
				_HI("MemberBox,MemberMenu,MemberSubmenu");
				_SH("GuestMenu");
			}
		});
	},
	
	login:function(params, onSuccess, onError){
		Http.postUpdate( gCGI.login,  
			params,
			function( txt, xml ){
				_H("Debug", txt );
				var res = SSN.sync( Http.xml2JS(xml) );
				if( res.error ){
					if( onError ){
						onError(res);
					}
				}
				else{
					_SH("Menu.Profile,Menu.Mailbox,Menu.QA");
					_SC( "sid", SSN.sid );
					_SC( "id", SSN.id );
					ga('set', 'userId', SSN.id); // Set the user ID using signed-in user_id.
					_SC( "myinfo", "gender=" + SSN.gender + "&active=" + SSN.activated + "&mate=" + SSN.mate + "&mtid=" + SSN.mtid );
					KEvents.fire("onlogin");

					if( onSuccess ){
						onSuccess( res );
					}
				}
			}
		);
	},
	loginSubmit:function(){
		var aForm = document.forms.login;
		var chk = Enum(["lname","pw"], function(item){
				if(!aForm[item].value.trim().length){
					RSCR("KUI",function(){
						KUI.msgbox({msg:"login.missing_" + item,onclose:function(){
							aForm[item].focus();
						}});
					});
					return false;
				}
				return true;
		});
		
		if(chk!==true){
			return false;
		}
		
		this.login(
			{	lname: aForm.lname.value, 
				pw:aForm.pw.value 
			},
			function(res){// success
				aForm.reset();
				//PgNav.open(_P("target",_N(SSN.mate)?"chat":"my"),undef,true);
				//PgNav.reload();
			},
			function(res){//error
				RSCR("KUI",function(){
					KUI.msgbox({title:"a.error", msg:"errors:error." + res.error,onclose:function(){
						aForm.lname.focus();
					}});
				});
			} 

		);
		return false;
	}	
};

