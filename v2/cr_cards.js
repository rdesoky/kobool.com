var CrCards = {
	onload:function(){
		TopTabs.showTab("Menu.CPoints");
		TopTabs.select("CP.buy");
		this.drawUI("Contents");
	},
	drawUI:function(root){
		var cnts = CPoints.renderLayout( {root:root, title:"cpoints:cr_cards.page_title", page:"cr_cards", logo:"cr_cards_logo"} );
		form = _A( cnts, "form", {name:"CCardForm",method:"post", action:"https://secure.authorize.net/gateway/transact.dll"} );

		_A( form, "div", {}, _S("cpoints:cr_cards.intro") );

		_HS( _A(_A(form,"p"), "span", {"class":"href"}), "cpoints:ui.eula_intro" ).onclick=function(){PgNav.open("cp_eula",{back:"cr_cards"});};

		var eula = CPoints.renderEulaCheckLine(form,"cr_cards");
		
		_A(form, "div", {"class":"parag bold"}, _S("cpoints:cr_cards.select_val"));

		Enum([5, 10], function(item){
			var ln = _A(_AD(form),"span",{"class":"inline hmouse"});
			var r = _A( ln, "input", {type:"radio", name:"cr_cards_val", checked:(item==5), value:item});
			_HS( _A( ln, "span" ), "cpoints:cr_cards.val_" + item );
			ln.onclick=function(){r.click();};
		});

		var submitBtn = _A(_A(form,"p"), "input", {type:"submit", value:_S("cpoints:cr_cards.buy")} );

		var lang = _GC("lang","en");

		form.onsubmit=function(e){
			if(!eula.check.checked){
				DU.addClass( eula.line, "hilight" );
				KUI.msgbox({
					msg:"cpoints:ui.eula_accept_required"
				});
				return false;
			}
			var val = _N( DU.radioVal( form.cr_cards_val ));
			Http.postCGI( gCGI.create_order, {
					mid:	CPoints.memInfo.id //member id
					,ln:	lang //language
					,ch:	7 //channel
					,pid:	1 //product id
					,cu:	1 //USD currency 
					,qt:	(val/5) //quantity
					,pr:	val //price
				},
				function(t,x){
					var r = Http.xml2JS(x);

					if( _N(r.success) ){// open Authorize.net payment form
						//var frm = _C( "form",{method:"post", action:"https://secure.authorize.net/gateway/transact.dll"} );
						var frm = document.forms["CCardForm"];

						DU.createFormInputs(frm,{
							x_invoice_num:r.order_id,
							x_cust_id:CPoints.memInfo.id,
							x_login:r.x_login,
							//x_relay_response:"TRUE",
							//x_relay_url:"http://www.kobool.com/cgi-bin/auth.net/response.pl",
							x_receipt_link_text:"Back to Kobool",
							x_receipt_link_url:"http://www.kobool.com/#pg=cp_report",
							x_email_customer:"TRUE",
							x_merchant_email:"payment@kobool.com",
							x_description:(val==5)?"1 Contact Point":"2 Contact Points",
							x_amount:val,
							x_fp_sequence:r.sequence,
							x_fp_timestamp:r.tstamp,
							x_fp_hash:r.fp,
							x_show_Form:"PAYMENT_FORM",
							x_header_html_payment_form:"",
							x_footer_html_payment_form:"",
							x_customer_ip:r.ip_address,
							x_test_request:""
						});
						
						submitBtn.disabled = true;
						frm.submit();
					}else{
						KUI.msgbox({
							title:"a.error",
							msg:"errors:error." + res.error
						});
					}
				}
			);
			return false;
		};

	}
};