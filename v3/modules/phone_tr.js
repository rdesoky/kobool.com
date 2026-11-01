/**
 * Created by rdeso_000 on 1/16/2015.
 */

define(["jquery","top-tabs", "cpoints", "kui", "http", "dom-utils"], function($, $tabs, $cpoints, $kui, $http, $du){

	var module;

	return module = {
		requireCSS:["cpoints"],
		requireStrings:["cpoints:phone_tr"],
		onload:function(root){
			if( !$kui.chkLogin({nav:true}) ){
				return;
			}
			$tabs.showTab("Menu.CPoints");
			$tabs.select("CP.buy");

			var $confirmation = $("#PurchaseConfirmation");
			var $preview = $("#VodafoneCardPreview");

			var frm = document.forms.vodafoneForm;
			frm.onsubmit = function(e){
				module.preview(this);
				return false;
			};

			$("#FinalSubmit", $preview).click(function(e){

				// post information
				var params = {
					user_number: SSN.id
					,user_name: SSN.login_id
					,buyer_name: SSN.login_id
					,value: $du.radioVal(frm.cval)
					,cnum: frm.card_num.value.trim()
					,notes: frm.notes.value
					,email: frm.email.value.trim()
				};
				$http.postCGI($http.api.points_by_phone, params, function(res){
					var r = JSN(res);
					if( _N(r.success) ){
						frm.card_num.value = "";
						$preview.hide();
						$("#ref_number", $confirmation).html(r.invoice);
						$confirmation.show();
					}else{
						$kui.msgbox({
							title:"a.error",
							msg:"errors:error." + r.error,
							onclose:function(){
								module.editForm();
								frm.card_num.focus();
							}
						});
					}
				});
			});

			$("#Edit", $preview).click(function(){
				module.editForm();
			});
			$("#MoreCards", root).click(function(){
				module.editForm();
			});
		},

		validateCard:function(frm){
			var val = frm.card_num.value;
			if( val.match(/^[0-9]+$/) ){
				if( val.length == 14 || val.length == 16 ){
					return true;
				}
			}
			return false;
		},

		preview:function( frm ){

			if(!frm.card_num.value.trim().length){
				$kui.msgbox({
					title:"a.error",
					msg:"cpoints:phone_tr.card_num_required",
					onclose:function(){
						frm.card_num.focus();
					}
				});
				return;
			}
			if(!this.validateCard(frm)){
				$kui.msgbox({
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
					$kui.msgbox({
						title:"a.error",
						msg:"cpoints:phone_tr.invalid_email",
						onclose:function(){
							frm.email.focus();
						}
					});
					return;
				}
			}else if(!SSN.id){
				$kui.msgbox({
					title:"a.error",
					msg:"cpoints:phone_tr.email_required",
					onclose:function(){
						frm.email.focus();
					}
				});
				return;
			}

			$("#VodafoneFormPanel").hide();

			var $preview = $("#VodafoneCardPreview");

			$preview.show();
			$(".vodafone_card_value", $preview).html($du.radioVal(frm.cval) + "&nbsp;LE");

			var n = frm.card_num.value;
			var printedNumber = [n.substr(0,3), n.substr(3,3), n.substr(6,3), n.substr(9,3), n.substr(12,4)].join("&nbsp;&nbsp;");
			$(".vodafone_card_number", $preview).html(printedNumber);
		},

		editForm:function(){
			$("#VodafoneFormPanel").show();
			$("#VodafoneCardPreview").hide();
			$("#PurchaseConfirmation").hide();
		}
	}
});
