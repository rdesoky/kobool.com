var CPointByPhoneCard = {
	onload:function(){
		TopTabs.showTab("Menu.CPoints");
		TopTabs.select("CP.buy");
		this.drawUI();
		
	},
	drawUI:function(){
		var root = CPoints.renderLayout( {
			root:"Contents",
			title:"cpoints:phone_tr.page_title",
			page:"phone_tr", 
			logo:"voda_card_logo"
		} );

		_A( root,"div",{}, _S("cpoints:phone_tr.intro") );
		var frm = _A(root, "form", {"class":"form_frame"});
		var prv = _A(root, "div", {"class":"vodafone_card_preview"});
		_HI(prv);
		frm.onsubmit = function(){
			CPointByPhoneCard.preview(frm,prv);
			return false;
		};
		_A(frm, "div", {"class":"form_title"}, _S("cpoints:phone_tr.form_title") );
		var ftbl = _AT( frm, {border:0,id:"PBP"}, [{width:100, "class":"right_align"},{width:400}], 5);
		_HS( ftbl.rows[0][0], "cpoints:phone_tr.card_value" );
		_HS( ftbl.rows[1][0], "cpoints:phone_tr.card_num" );
		_HS( ftbl.rows[2][0], "cpoints:phone_tr.email" );
		_HS( ftbl.rows[3][0], "cpoints:phone_tr.notes" );

		Enum([{title:"vf25", val:25, chk:true},{title:"vf50", val:50, chk:false},{title:"vf100", val:100, chk:false}], function(item){
			var ln = _A(ftbl.rows[0][1],"div",{"class":"hmouse"});
			var r = _A( ln, "input", {type:"radio", name:"cval", value:item.val, checked:item.chk});
			_A( ln, "span", {}, _S("cpoints:phone_tr." + item.title) );
			ln.onclick=function(){r.click();};
		});
		_A(ftbl.rows[1][1],"div",{"class":"attr_title"}, _S("cpoints:phone_tr.card_num_note"));
		_A(ftbl.rows[1][1],"input",{"type":"text", name:"card_num"});

		_A(ftbl.rows[2][1],"div",{"class":"attr_title"}, _S("cpoints:phone_tr.email_note"));
		_A(ftbl.rows[2][1],"input",{"type":"text", name:"email"});
		
		_A(ftbl.rows[3][1],"textarea",{name:"notes"});

		_A(ftbl.rows[4][1],"input",{type:"submit", value:_S("cpoints:phone_tr.preview")});
		_A(ftbl.rows[4][1],"div",{"class":"attr_title"}, _S("cpoints:phone_tr.submit_note"));

		}
	,validateCard:function(frm){
		var val = frm.card_num.value;
		if( val.match(/^[0-9]+$/) ){
			if( val.length == 14 || val.length == 16){
				return true;
			}
		}
		return false;
	}
	,preview:function( frm, prv ){
		if(! CPoints.memInfo ){
			KUI.msgbox({
				title:"a.error", 
				msg:"errors:error.invalid_id", 
				onclose:function(){
					_E("TargetMemberNum").firstChild.focus();
				}
			});
			return;
		}
		if(!frm.card_num.value.trim().length){
			KUI.msgbox({
				title:"a.error", 
				msg:"cpoints:phone_tr.card_num_required", 
				onclose:function(){
					frm.card_num.focus();
				}
			});
			return;
		}
		if(!this.validateCard(frm)){
			KUI.msgbox({
				title:"a.error", 
				msg:"cpoints:phone_tr.invalid_card", 
				onclose:function(){
					frm.card_num.focus();
				}
			});
			return;
		}

		if( frm.email.value.trim().length ){
			if( !frm.email.value.isValidEmail() ){
				KUI.msgbox({
					title:"a.error", 
					msg:"cpoints:phone_tr.invalid_email", 
					onclose:function(){
						frm.email.focus();
					}
				});
				return;
			}
		}else if(!SSN.id){
			KUI.msgbox({
				title:"a.error", 
				msg:"cpoints:phone_tr.email_required", 
				onclose:function(){
					frm.email.focus();
				}
			});
			return;
		}
		_SH(_CL(prv));
		//_CL(prv).className = "vodafone_card_preview";
		
		_A( prv, "div", {"class":"parag attr_title"}, _S("cpoints:phone_tr.preview_title") );

		var card_bg = _A( _A(prv,"center") , "div", {"class":"vodafone_card"} );

		_A( card_bg, "div", {"class":"vodafone_card_value"}, DU.radioVal(frm.cval) + "&nbsp;LE" );
		var n = frm.card_num.value;
		var sp = "&nbsp;&nbsp;";
		_A( card_bg, "div", {"class":"vodafone_card_number"}, n.substr(0,3) + sp + n.substr(3,3)+ sp + n.substr(6,3) + sp + n.substr(9,3) + sp + n.substr(12,4) );
		
		var btns = _A(prv,"div",{"class":"parag"});
		_A(btns, "input", {type:"button", "class":"bold", value:_S("cpoints:phone_tr.submit")}).onclick=function(){
			// post information
			var params = {	
				user_number: CPoints.memInfo.id
				,user_name: CPoints.memInfo.login_id
				,buyer_name: SSN.id?SSN.login_id:""
				,value: DU.radioVal(frm.cval)
				,cnum: frm.card_num.value.trim()
				,notes: frm.notes.value
				,email: frm.email.value.trim()
			};
			Http.postCGI( gCGI.points_by_phone, params, function(res){
				var r = JSN(res);
				if( _N(r.success) ){
					frm.card_num.value = "";
					var box = _A( _CL(prv), "div", {"class":"vf_submit_success_response"}, _S("cpoints:phone_tr.prepaid_card_submitted") + r.invoice );
					_A( _AD(box), "input", {type:"button", "class":"parag center_align", value:_S("cpoints:phone_tr.send_more") } ).onclick=function(){
						CPointByPhoneCard.editForm(frm, prv);
					};
					_A( box, "div", {"class":"parag"}, _S("cpoints:phone_tr.prepaid_card_submitted_footer") );
				}else{
					KUI.msgbox({
						title:"a.error", 
						msg:"errors:error." + r.error, 
						onclose:function(){
							CPointByPhoneCard.editForm(frm, prv);
							frm.card_num.focus();
						}
					});
				}
			});
		};
		_A(btns, "input", {type:"button", value:_S("cpoints:phone_tr.edit")}).onclick=function(){
			CPointByPhoneCard.editForm(frm, prv);
		};
		
		_A( prv, "div", {"class":"parag attr_title"}, _S("cpoints:phone_tr.preview_footer") );

		_HI(frm);
	}
	,editForm:function( frm, prv ){
		_HI(prv);
		_SH(frm);
	}
};
