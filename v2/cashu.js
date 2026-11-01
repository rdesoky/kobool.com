var CPointsByCashu = {
	onload:function(){
		TopTabs.showTab("Menu.CPoints");
		TopTabs.select("CP.buy");
		this.drawUI("Contents");
	},
	drawUI:function(root){
		var cnts = CPoints.renderLayout( {root:root, title:"cpoints:cashu.page_title", page:"cashu", logo:"cashu_logo"} );
		form = _A( cnts, "form", {name:"CashuForm", method:"post", action:"https://www.cashu.com/cgi-bin/pcashu.cgi" } );

		_A( form, "div", {}, _S("cpoints:cashu.intro") );

		_HS( _A(_A(form,"p"), "span", {"class":"href"}), "cpoints:ui.eula_intro" ).onclick=function(){PgNav.open("cp_eula",{back:"cashu"});};

		var eula = CPoints.renderEulaCheckLine(form, "cashu");
		
		_A(form, "div", {"class":"parag bold"}, _S("cpoints:cashu.select_val"));

		Enum([250, 500], function(item){
			var ln = _A(_AD(form),"span",{"class":"inline hmouse"});
			var r = _A( ln, "input", {type:"radio", name:"cashu_val", checked:(item==250), value:item});
			_HS( _A( ln, "span" ), "cpoints:cashu.val_" + item );
			ln.onclick=function(){r.click();};
		});

		var submitBtn = _A(_A(form,"p"), "input", {type:"submit", value:_S("cpoints:cashu.buy")} );
		
		var lang = _GC("lang","en");

		form.onsubmit=function(e){
			if(!eula.check.checked){
				DU.addClass( eula.line, "hilight" );
				KUI.msgbox({
					msg:"cpoints:ui.eula_accept_required"
				});
				return false;
			}
			var val = _N(DU.radioVal( form.cashu_val ));
			Http.postCGI( gCGI.create_order, {
					mid:	CPoints.memInfo.id //member id
					,ln:	lang //language
					,ch:	2 //channel
					,pid:	1 //product id
					,cu:	2 //cashu currency 
					,qt:	(val/250) //quantity
					,pr:	val //price
				},
				function(t,x){
					var r = Http.xml2JS(x);
					if( _N(r.success) ){// open cashu UI
						//var frm = _C( "form",{method:"post", action:"https://www.cashu.com/cgi-bin/pcashu.cgi"} );
						var frm = document.forms["CashuForm"];

						DU.createFormInputs(frm,{
							merchant_id:"kobool",
							currency:"CSH",
							email:r.email,
							session_id:r.order_id,
							token:(val == 250) ? "aa48ddc34e74aa2027326618fb8a7399":"02d1506dec6e6539a8160da564117133",
							amount:val,
							display_text:(val == 250) ? "One Contact Point" : "Two Contact Points",
							language:lang,
							txt1:(val == 250) ? 1 : 2, // product ID
							txt2:r.ip_address,
							txt3:lang,
							txt4:"",
							txt5:"",
							test_mode:"0"
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