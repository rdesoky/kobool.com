/**
 * Created by rdeso_000 on 1/16/2015.
 */
define(["jquery","utils","page-nav","top-tabs","kui","http","popup","mem-ui"],function($,$u,$pgNav,$tabs, $kui, $http, $popup, $imem){

	return {
		requireCSS:["register"],
		requireStrings:["errors:error"],
		onload:function(){
			//alert(register_str.invalid_login_name);
			if(SSN.id){
				$pgNav.open("upd_attr", undefined, true, true);
			}
			document.forms.S1RegForm.submt.disabled=true;
			$tabs.select("GuestMenu.login");
		},
		onsubmitS1:function(){
			if( this.validateS1() ){
				_HI("StepOne");
				_SH("StepTwo");
				document.forms.S2RegForm.pw.focus();
			}
			return false;
		},
		cancelS2:function(){
			_HI("StepTwo");
			_SH("StepOne");
		},
		onsubmit:function(){
			if( this.validate() ){
				_HI("StepOne");

				if( _GC("blist") ){
					_SH("BlackList");
					return false;
				}

				var frm = document.forms.S1RegForm;
				_SH("RegProcessing");
				var data = $u.form2Hash(frm);
				//alert(data);
				var me = this;
				$http.postUpdate( $http.api.register,
					data,
					function(t,x){
						//alert(res);
						var r = $http.xml2JS(x);
						if(r.success){
							$imem.login( $u.form2Hash(frm), function(){
								me.showSuccess(frm.lname.value, frm.email.value);
							});
						}else{
							$kui.msgbox( { msg:"errors.error."+r.error } );
						}
					}
				);
			}
			return false;
		},
		showSuccess:function(lname, email){

			$pgNav.open("upd_attr", {wz:1}, true, true);

			var eMsg = _HS( _C("span"), "profile:register.success", function(s){
				return s.replace(/\%u\%/g, lname).replace(/\%m\%/g, email );
			});

			setTimeout(function(){
				$kui.msgbox({
					title: "profile:register.page_title",
					msg: eMsg
				});
			},2000);
		},
		validate:function(){//TODO: optimize validation code
			var frm = document.forms.S1RegForm;
			if(frm.gender.value == -1){
				$kui.msgbox({
					title:"errors:error.title",
					msg:"errors:error.no_gender",
					onclose:function(){
						frm.gender.focus();
					}
				});
				return false;
			}

			if(!frm.lname.value.trim().length){
				$kui.msgbox({
					title:"a.error",
					msg:"errors:error.no_login_name",
					onclose:function(){
						frm.lname.focus();
					}
				});
				return false;
			}

			if(! this.isValidLoginName( frm.lname.value = frm.lname.value.trim() ) ){
				$popup.open("ErrorMsg", "errors:error.title", "errors:error.invalid_login_name", [{title:_S("a.ok"),focus:true,onclick:function(){frm.lname.focus();}}]);
				return false;
			}

			if(!frm.pw.value.trim().length){
				$popup.open("ErrorMsg", "errors:error.title", "errors:error.no_password", [{title:_S("a.ok"),focus:true,onclick:function(){frm.pw.focus();}}]);
				return false;
			}
			if(!frm.pw2.value.trim().length){
				$popup.open("ErrorMsg", "errors:error.title", "errors:error.no_password", [{title:_S("a.ok"),focus:true,onclick:function(){frm.pw2.focus();}}]);
				return false;
			}
			if(frm.pw2.value.trim()!=frm.pw.value.trim()){
				$popup.open("ErrorMsg", "errors:error.title", "errors:error.password_mismatch", [{title:_S("a.ok"),focus:true,onclick:function(){frm.pw2.focus();}}]);
				return false;
			}
			if(!frm.email.value.trim().length){
				$popup.open("ErrorMsg", "errors:error.title", "errors:error.no_email", [{title:_S("a.ok"),focus:true,onclick:function(){frm.email.focus();}}]);
				return false;
			}
			if(!frm.email.value.isValidEmail()){
				$popup.open("ErrorMsg", "errors:error.title", "errors:error.invalid_email", [{title:_S("a.ok"),focus:true,onclick:function(){frm.email.focus();}}]);
				return false;
			}

			return true;
		},

		validateS2:function(){// verify password and email are matched
			var frm = document.forms.S2RegForm;

			if(!frm.pw.value.trim().length){
				$popup.open("ErrorMsg", "errors:error.title", "errors:error.no_password", [{title:_S("a.ok"),focus:true,onclick:function(){frm.pw.focus();}}]);
				return false;
			}
			if(frm.pw.value.trim()!=document.forms.S1RegForm.pw.value.trim()){
				$popup.open("ErrorMsg", "errors:error.title", "errors:error.password_mismatch", [{title:_S("a.ok"),focus:true,onclick:function(){frm.pw.focus();}}]);
				return false;
			}

			if(!frm.email.value.trim().length){
				$popup.open("ErrorMsg", "errors:error.title", "errors:error.no_email", [{title:_S("a.ok"),focus:true,onclick:function(){frm.email.focus();}}]);
				return false;
			}

			if(frm.email.value.trim()!=document.forms.S1RegForm.email.value.trim()){
				$popup.open("ErrorMsg", "errors:error.title", "errors:error.email_mismatch", [{title:_S("a.ok"),focus:true,onclick:function(){frm.email.focus();}}]);
				return false;
			}
			return true;
		},

		checkLoginName:function(){//async
			var frm = document.forms.S1RegForm;
			var sName = frm.lname.value = frm.lname.value.trim();

			if( sName.length ){
				frm.submt.disabled = true;
				if( ! this.isValidLoginName(sName) ){
					_SH("LoginNameRow");
					_HS("LoginNameHelp", "errors:error.invalid_login_name" );
				}
				else{
					$http.getCGI($http.api.chk_login_name, {lname:sName},
						function( res ){
							var response = JSN(res);
							if( response.user_found == "1" ){
								_SH("LoginNameRow");
								_HS( "LoginNameHelp", "errors:error.create_member_failed" );
							}else{
								frm.submt.disabled = false;
								_HI("LoginNameRow");
							}
						},
						"chk_login_name"
					);
				}
			}else{
				frm.submt.disabled = false;
				_HI("LoginNameRow");
			}
		},

		showEmailHelp:function(){
			RS("profile:register",function(){
				var info = _C("div",{id:"EmailTip"});
				_A(info,"div",{"class":"note"}, _S("profile:register.tip") );
				_A(info,"div",{"class":"sidenote"}, _S("profile:register.warning") );
				$popup.open("EmailHelp","a.info", info);
			});
		},

		isValidLoginName:function( sName ){
			var InvalidRegExp = /\@|\?|\/|\+|\=|\&|\*|\;|\%|\"|\'|\<|\>|هوت|ميل|بريد|ياهو|ووت|نيك|جنس|sex|www|\.net|\.org|\.com|msn|hot|makt|h0t|yah|mail|gawab/gi;

			if( sName.length > 20 || sName.search(InvalidRegExp)!=-1 || sName.digitsCount() > 4 ){
				return false;
			}

			return true;
		}

	}
});
