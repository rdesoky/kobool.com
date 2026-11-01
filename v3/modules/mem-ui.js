/**
 * Created by rdeso_000 on 1/4/2015.
 */
define(["http","k-template","kevents","page-nav","utils","dom-utils","jquery"],function(http,tmpl,kevents,pgNav,$u,$du,$){
	var module;
	return module = {
		refreshHeader:function(force){
			if( SSN.id==_N(_GC("id")) && !force ){//check actual login or logout
				this.renderBox();
			}else{
				if(_N(_GC("id"))){
					//reload session info
					this.login(
						{auto:1},
						undefined,
						function(){//onerror: session timeout
							module.logout();
						}
					);
				}else{
					// No session cookie: render the guest menu right away. The
					// logout round-trip used to be the only thing that revealed
					// the menu, so an unreachable API (offline, CORS, or mixed
					// content on an https host) left both menus hidden.
					this.renderLogin();
				}
			}
		},

		renderLogin:function(){
			if( SSN && SSN.id ){
				return this.renderBox();
			}
			_SH("GuestMenu");
			_HI("MemberMenu,MemberSubmenu");

			$("#MemberBox").html("&nbsp;");

			return _E("MemberBox");//no login form in header
		},

		renderBox:function(){
			var headerBox = _CL("MemberBox");

			if( ! SSN.id ){
				_SH("GuestMenu");
				_HI("MemberMenu,MemberSubmenu");

				tmpl.loadTemplate( "#GuestBox" )
					.done(function(el){
						el = _A(headerBox, tmpl.renderTemplate( el ) );
					});
				return headerBox;
			}

			var inf = SSN;

			_SH("MemberMenu,MemberSubmenu");
			_HI("GuestMenu");


			inf.login_name = SSN.login_id;
			inf.inactive = _N(inf.activated) ? "" : "inactive";

			var lout, inact;
			var tmpl_id = "#UserBox";

			if(inf.mate){
				inf.matched = "matched";
				inf.mate_gender = _N(inf.gender)?0:1;
				tmpl_id = "#MatchedBox";
				$("#Menu_Kobool").show();
			}else{
				$("#Menu_Kobool").hide();
			}

			tmpl.loadTemplate( tmpl_id )
				.done(function(el){
					el = _A(headerBox, tmpl.renderTemplate( el, inf ) );
				});

			return headerBox;
		},

		logout:function(){
			// Clear the local session and show the guest UI no matter what the
			// server says. The request can fail (offline, CORS, mixed content),
			// and the header must not stay stuck on the member menu.
			function endSession(){
				kevents.fire("onlogout",{id: _GC("id") });
				$.each( ["id","sid","myinfo","hspg","qls"], function(v){
					$u.delCookie(v);
				});
				SSN.reset();
				module.renderLogin();
			}

			return http.post({
				refresh:1,
				scr:http.api.logout,
				onload:endSession,
				onerror:endSession
			});
		},

		login:function(params, onSuccess, onError){
			http.postUpdate( http.api.login,
				params,
				function( txt, xml ){
					var res = SSN.sync( http.xml2JS(xml) );
					if( res.error ){
						if( onError ){
							onError(res);
						}
					}
					else{
						_SH( "Menu.Profile,Menu.Mailbox,Menu.QA" );
						_SC( "sid", SSN.sid );
						_SC( "id", SSN.id );
						ga('set', 'userId', SSN.id); // Set the user ID using signed-in user_id.
						
						_SC( "myinfo", "gender=" + SSN.gender + "&active=" + SSN.activated + "&mate=" + SSN.mate + "&mtid=" + SSN.mtid );

						kevents.fire("onlogin");

						if( onSuccess ){
							onSuccess( res );
						}
					}
				}
			);
		},
		loginSubmit:function(){
			var aForm = document.forms.login;
			var chk = $.each(["lname","pw"], function(item){
				if(!aForm[item].value.trim().length){
					require(["kui"],function(kui){
						kui.msgbox({
							msg:"login.missing_" + item,
							onclose:function(){
								aForm[item].focus();
							}
						});
					});
					return false;
				}
				return true;
			});

			if(chk!==true){
				return false;
			}

			this.login({
					lname: aForm.lname.value,
					pw:aForm.pw.value
				},
				function(res){// success
					aForm.reset();
					pgNav.open(_P("target",_N(SSN.mate)?"chat":"my"),undefined,true);
					pgNav.reload();
				},
				function(res){//error
					require(["kui"],function(kui){
						kui.msgbox({
							title:"a.error",
							msg:"errors:error." + res.error,
							onclose:function(){
								aForm.lname.focus();
							}
						});
					});
				}

			);
			return false;
		}
	}
});
