var CPointsReport = {
	onload:function(){
		if( !KUI.chkLogin({nav:true}) ){
			return;
		}

		TopTabs.showTab("Menu.CPoints");
		TopTabs.select("CP.report");
		this.render();
	},
	render:function(){
		_HS( _A(_CL("Contents"),"div",{"class":"pg_header title"}), "cpoints:report.page_title");

		var root = _A( "Contents", "div", {"class":"pg_body"} );
		
		_A( root,"ul", {id:"CPReportActions","xclass":"text_view"}, "&nbsp;" );

		_A( _A(root, "div", {id:"PointsList"}),"div",{} , _S("cpoints:report.list_title") );

		if( Http.cache.allPoints ){
			this.onDataResponse( Http.cache.allPoints.data );
		}else{
			Http.cache.allPoints = new CDataViewer({
				cgi:"mycards.pl",
				query: {ps:10},
				onDataResponse:function(res){
					CPointsReport.onDataResponse(res);
				},
				onclick:function(row, cinfo){
				},
				col:{
					id:{fld:"id"}
					,date_purchased:{fld:"date_purchased", title:_S("cpoints:report.date_purchased"), width:200
						,render:function(row){
							return _TXT(U.SQL2LocaleDate(row.date_purchased));
						}
					}
					,date_used:{fld:"date_used", title:_S("cpoints:report.date_used"), width:200
						,render:function(row){
							return row.date_used ? _TXT(U.SQL2LocaleDate(row.date_used)) : _TXT("not used");
						}
					}
					,channel:{fld:"channel", title:_S("cpoints:report.channel"), width:100
						,render:function(row){
							return _HS(_C("span"), "options:payment_channels.v"+row.channel);
						}
					}
					,price:{fld:"price", title:_S("cpoints:report.price"), width:50}
					,currency:{fld:"currency", title:_S("cpoints:report.currency"), width:100
						,render:function(row){
							return _HS(_C("span"), "options:select_currency.v"+row.currency);
						}
					}
					,user:{fld:"user", title:_S("cpoints:report.usage"), width:200
						,render:function(row){
							if(row.user){
								var tbl = DU.createTable({ 
									"class": "pusage " + (row.user==SSN.id?"pusage_self":"pusage_mate") },
									[{"class":"puser self"}, {"class":"puser mate"}]
								);
								_A(tbl.cols[0],_TXT(SSN.login_id));
								_A(tbl.cols[1],_TXT(row.mate_login));
								return tbl.table;
							}else{
								return _TXT(_S("cpoints:report.usable"));
							}
						}
					}
					,mate_login:{fld:"mate_login"}
				}
			});
		}

		Http.cache.allPoints.render();
	},

	onDataResponse:function(res){
		var root = _CL("CPReportActions");
		
		if( _N( res.total) ){
			_A( root, "li", {}, _S("cpoints:report.usable_points") + " (" + res.total_usable + ")" );
			_A( "PointsList" , Http.cache.allPoints.render() );
		}else{
			_A( _CL("PointsList"), "li", undef, _S("cpoints:report.no_points_found") );
		}
		
		var btns_bar = _A("CPReportActions", "li", {"class":"parag"});

		if( _N(res.refundable) ){
			_HS( _A( btns_bar, "span" ), "cpoints:ui.restore_points_prompt" ), 
			_HS( _A( btns_bar, "span", {"class":"button"} ), 
				"cpoints:ui.restore_points"
			).onclick=function(){
				KUI.confirm("cpoints:confirm.unuse", function(){
					Http.postUpdate("unuse_points.pl",{match_id:SSN.mtid}, 
						function(res){
							_H("Debug",res);
							CPointsReport.render();
						}
					);
				});
			};
			
			btns_bar = _A("CPReportActions", "li", {"class":"parag"});
		}else if( SSN.mate && !res.need_card){// used at lease one point none-refundable
			_A( root, "li", {}, _S("cpoints:report.used_points") );
		}
		

		var usePoint=function(){
			var user = (_N(res.need_card)?"self":"mate");
			KUI.confirm("cpoints:confirm.use_point_" + user, function(){
				Http.postUpdate("use_point.pl",{user:user=="self"?SSN.id:SSN.mate}, 
					function(res){
						_H("Debug",res);
						CPointsReport.render();
					}
				);
			});
		};

		if( _N(res.need_card) || _N(res.mate_needs_card) ){
			if(_N(res.total_usable) ){
				if(_N(res.need_card)){
					_HS( _A( btns_bar, "span" ), "cpoints:ui.use_prompt" );
					_HS( _A( btns_bar, "span", {"class":"button"} ), 
						"cpoints:ui.use"
					).onclick=usePoint;
				}else{
					_HS( _A( btns_bar, "span" ), "cpoints:ui.use4mate_prompt" );
					_HS( _A( btns_bar, "span", {"class":"button"} ), 
						"cpoints:ui.use4mate"
					).onclick=usePoint;
				}
			}else{
				_HS( _A( btns_bar, "span" ), "cpoints:ui.buy_prompt" );
				_HS( _A( btns_bar, "span", {"class":"button"} ), "cpoints:ui.buy" ).onclick=function(){
					PgNav.open("cp_buy");
				};
			}
		}else{
			_A( btns_bar, _HS( _C("span"), "cpoints:ui.not_needed" ) );
			btns_bar = _A("CPReportActions", "li", {"class":"parag"});
			_HS( _A( btns_bar, "span" ), "cpoints:ui.buy_extra_prompt" );
			_HS( _A( btns_bar, "span", {"class":"button"} ), "cpoints:ui.buy" ).onclick=function(){
				PgNav.open("cp_buy");
			};
		}
	}
};