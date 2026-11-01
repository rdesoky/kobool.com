var Register = {
	onsubmitS1:function(){
		if( Register.validateS1() ){
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
	onsubmitS2:function(){
		if( Register.validateS2() ){
			_HI("StepTwo");

			if( _GC("blist") ){
				_SH("BlackList");
				return false;
			}
			
			var frm = document.forms.S1RegForm;
			frm.gender.value = frm.gender_radio[1].checked ? 1:0;
			_SH("RegProcessing");
			var data = PgNav.form2Hash(frm);
			//alert(data);
			var me = this;
			Http.postUpdate( "register.pl",
				data,
				function(t,x){
					//alert(res);
					var r = Http.xml2JS(x);
					if(r.success){
						RSCR("IMem", function(){
							IMem.login( PgNav.form2Hash(frm), function(){
								me.showSuccess(frm.lname.value, frm.email.value);
							});
						});
					}else{
						KUI.msgbox( { msg:"errors.error."+r.error } );
					}
				}
			);
		}
		return false;
	},
	showSuccess:function(lname, email){
		
		PgNav.open("upd_attr", undef, true, true);
		
		var eMsg = _HS( _C("span"), "profile:register.success", function(s){
				return s.replace(/\%u\%/g, lname).replace(/\%m\%/g, email );
			});
		
		RSCR("KUI", function(){
			KUI.msgbox({
				title: "profile:register.page_title",
				msg: eMsg
			});
		});
	},
	onload:function(){
		//alert(register_str.invalid_login_name);
		if(SSN.id){
			PgNav.open("upd_attr", undef, true, true);
		}
		document.forms.S1RegForm.submt.disabled=false;
		document.forms.S1RegForm.lname.focus();
		TopTabs.select("GuestMenu.register");


		document.forms.S2RegForm.onreset=function(){
			_HI("StepTwo");
			_SH("StepOne");
			return false;
		};
	},
	
	validateS1:function(){//TODO: optimize validation code
		var frm = document.forms.S1RegForm;
		if(!frm.gender_radio[0].checked && !frm.gender_radio[1].checked){
			RSCR("KUI", function(){
				KUI.msgbox({
					title:"errors:error.title", 
					msg:"errors:error.no_gender", 
					onclose:function(){frm.gender_radio[0].focus();}
				});
			});
			return false;
		}
		
		if(!frm.lname.value.trim().length){
			RSCR("KUI", function(){
				KUI.msgbox({
					title:"a.error", 
					msg:"errors:error.no_login_name", 
					onclose:function(){
						frm.lname.focus();
					}
				});
			});
			return false;
		}

		if(! this.isValidLoginName( frm.lname.value = frm.lname.value.trim() ) ){
			Req("popup", function(){
				Popup.open("ErrorMsg", "errors:error.title", "errors:error.invalid_login_name", [{title:_S("a.ok"),focus:true,onclick:function(){frm.lname.focus();}}]);
			});
			return false;
		}
		
		if(!frm.pw.value.trim().length){
			Req("popup", function(){
				Popup.open("ErrorMsg", "errors:error.title", "errors:error.no_password", [{title:_S("a.ok"),focus:true,onclick:function(){frm.pw.focus();}}]);
			});
			return false;
		}
		if(!frm.email.value.trim().length){
			Req("popup", function(){
				Popup.open("ErrorMsg", "errors:error.title", "errors:error.no_email", [{title:_S("a.ok"),focus:true,onclick:function(){frm.email.focus();}}]);
			});
			return false;
		}
		if(!frm.email.value.isValidEmail()){
			Req("popup", function(){
				Popup.open("ErrorMsg", "errors:error.title", "errors:error.invalid_email", [{title:_S("a.ok"),focus:true,onclick:function(){frm.email.focus();}}]);
			});
			return false;
		}
		
		return true;
	},

	validateS2:function(){// verify password and email are matched
		var frm = document.forms.S2RegForm;

		if(!frm.pw.value.trim().length){
			Req("popup", function(){
				Popup.open("ErrorMsg", "errors:error.title", "errors:error.no_password", [{title:_S("a.ok"),focus:true,onclick:function(){frm.pw.focus();}}]);
			});
			return false;
		}
		if(frm.pw.value.trim()!=document.forms.S1RegForm.pw.value.trim()){
			Req("popup", function(){
				Popup.open("ErrorMsg", "errors:error.title", "errors:error.password_mismatch", [{title:_S("a.ok"),focus:true,onclick:function(){frm.pw.focus();}}]);
			});
			return false;
		}

		if(!frm.email.value.trim().length){
			Req("popup", function(){
				Popup.open("ErrorMsg", "errors:error.title", "errors:error.no_email", [{title:_S("a.ok"),focus:true,onclick:function(){frm.email.focus();}}]);
			});
			return false;
		}
		
		if(frm.email.value.trim()!=document.forms.S1RegForm.email.value.trim()){
			Req("popup", function(){
				Popup.open("ErrorMsg", "errors:error.title", "errors:error.email_mismatch", [{title:_S("a.ok"),focus:true,onclick:function(){frm.email.focus();}}]);
			});
			return false;
		}
		return true;
	},

	checkGender:function(index){
		document.forms.S1RegForm.gender_radio[index].checked=true;
		this.onChangeGender();
	},
	onChangeGender:function(){
		var g = document.forms.S1RegForm.gender_radio[0].checked ? 0:1;
		_E("idPreviewPic").setAttribute("src", U.picSRC(0,g,true) );
	},

	checkLoginName:function(){//async
		var frm = document.forms.S1RegForm;
		var sName = frm.lname.value = frm.lname.value.trim();

		if( sName.length ){
			frm.submt.disabled = true;
			if( ! this.isValidLoginName(sName) ){
				_SH("LoginNameRow");
				_H("LoginNameHelp", _S("errors:error.invalid_login_name") );
			}
			else{
				Http.getCGI( gCGI.chk_login_name, {lname:sName},
					function( res ){
						var response = JSN(res);
						if( response.user_found == "1" ){
							_SH("LoginNameRow");
							_H( "LoginNameHelp", _S("errors:error.create_member_failed") );
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
		Req("popup", function(){
			RS("profile:register",function(){
				var info = _C("div",{id:"EmailTip"});
				_A(info,"div",{"class":"note"}, _S("profile:register.tip") );
				_A(info,"div",{"class":"sidenote"}, _S("profile:register.warning") );
				Popup.open("EmailHelp","a.info", info);
			});

		});
	},

	isValidLoginName:function( sName ){
		var InvalidRegExp = /\@|\?|\/|\+|\=|\&|\*|\;|\%|\"|\'|\<|\>|هوت|ميل|بريد|ياهو|ووت|نيك|جنس|sex|www|\.net|\.org|\.com|msn|hot|makt|h0t|yah|mail|gawab/gi;

		if( sName.length > 20){
			return false;
		}

		if( sName.search(InvalidRegExp) != -1 ){
			return false;
		}

		if( sName.digitsCount() > 4 ){
			return false;
		}

		return true;
	}

};